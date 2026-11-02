-- ============================================================
-- PHASE 5 (v11) : avis sur les CIRCUITS + statistiques du dashboard
-- À exécuter UNE fois dans Supabase > SQL Editor. Peut être relancé sans risque.
-- Prérequis : la fonction is_admin() existe déjà (phases précédentes).
-- ============================================================

-- ---------- 1. Avis (comments) rattachés aux circuits ----------

alter table public.comments
  add column if not exists circuit_id uuid
  references public.circuits(id) on delete cascade;

alter table public.comments
  add column if not exists tourist_place_id uuid
  references public.tourist_places(id) on delete cascade;

-- Un avis ne vise plus forcément un lieu
alter table public.comments alter column tourist_place_id drop not null;

create index if not exists comments_circuit_idx
  on public.comments (circuit_id);

alter table public.comments enable row level security;

drop policy if exists "Public can read approved comments" on public.comments;
create policy "Public can read approved comments"
on public.comments for select to anon, authenticated
using (status = 'approved');

drop policy if exists "Users can insert comments" on public.comments;
create policy "Users can insert comments"
on public.comments for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments"
on public.comments for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
on public.comments for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can manage comments" on public.comments;
create policy "Admins can manage comments"
on public.comments for all to authenticated
using (is_admin())
with check (is_admin());

-- ---------- 2. Visites du site ----------
-- Une ligne par page vue : identifiant anonyme du visiteur (gardé dans son
-- navigateur), compte s'il est connecté, page, et "source" sur la 1re page
-- d'une session ('direct' = lien tapé / favori, 'referral' = venu d'ailleurs).

create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  user_id uuid,
  path text not null,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_idx on public.site_visits (created_at);
create index if not exists site_visits_visitor_idx on public.site_visits (visitor_id);
create index if not exists site_visits_user_idx on public.site_visits (user_id);

alter table public.site_visits enable row level security;

grant insert on public.site_visits to anon, authenticated;

drop policy if exists "Anyone can log a visit" on public.site_visits;
create policy "Anyone can log a visit"
on public.site_visits for insert to anon, authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "Admins can read visits" on public.site_visits;
create policy "Admins can read visits"
on public.site_visits for select to authenticated
using (is_admin());

-- ---------- 3. Statistiques du dashboard ----------
-- Fonction réservée aux admins (lit aussi auth.users pour compter les comptes).

create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uuid_re constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  result jsonb;
begin
  if not is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'accounts',          (select count(*) from auth.users),
    'places',            (select count(*) from tourist_places),
    'circuits',          (select count(*) from circuits),
    'comments_total',    (select count(*) from comments),
    'comments_pending',  (select count(*) from comments where status = 'pending'),

    'page_views',        (select count(*) from site_visits),
    'visitors',          (select count(distinct visitor_id) from site_visits),
    'visitors_logged',   (select count(distinct visitor_id) from site_visits
                          where user_id is not null),
    'sessions_direct',   (select count(*) from site_visits where source = 'direct'),
    'sessions_referral', (select count(*) from site_visits where source = 'referral'),
    'reservers',         (select count(distinct user_id) from reservations),

    'reservations', jsonb_build_object(
      'total',     (select count(*) from reservations),
      'pending',   (select count(*) from reservations where status = 'pending'),
      'confirmed', (select count(*) from reservations where status = 'confirmed'),
      'rejected',  (select count(*) from reservations where status = 'rejected'),
      'cancelled', (select count(*) from reservations where status = 'cancelled')
    ),
    'revenue_confirmed', (select coalesce(sum(total_mga), 0) from reservations
                          where status = 'confirmed'),
    'revenue_pending',   (select coalesce(sum(total_mga), 0) from reservations
                          where status = 'pending'),
    'travelers_confirmed', (select coalesce(sum(travelers), 0) from reservations
                            where status = 'confirmed'),

    -- 7 derniers jours (visites = pages vues, visitors = visiteurs distincts)
    'daily', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'day', to_char(d.day, 'YYYY-MM-DD'),
          'visits', coalesce(v.visits, 0),
          'visitors', coalesce(v.visitors, 0)
        ) order by d.day), '[]'::jsonb)
      from generate_series(
        (current_date - 6)::timestamp, current_date::timestamp, interval '1 day'
      ) as d(day)
      left join (
        select created_at::date as day,
               count(*) as visits,
               count(distinct visitor_id) as visitors
        from site_visits
        where created_at >= current_date - 6
        group by 1
      ) v on v.day = d.day::date
    ),

    -- lieux : pages vues
    'places_stats', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
      from (
        select p.id, p.name, count(*) as views
        from site_visits sv
        join tourist_places p
          on p.id = substring(sv.path from ('^/tourist-places/(' || uuid_re || ')'))::uuid
        group by p.id, p.name
        order by views desc, p.name
        limit 10
      ) x
    ),

    -- circuits : pages vues, réservations, note moyenne
    'circuits_stats', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
      from (
        select c.id, c.title,
          (select count(*) from site_visits sv
            where sv.path = '/circuits/' || c.id::text) as views,
          (select count(*) from reservations r
            where r.circuit_id = c.id) as reservations,
          (select round(avg(cm.rating)::numeric, 1) from comments cm
            where cm.circuit_id = c.id and cm.status = 'approved') as rating,
          (select count(*) from comments cm
            where cm.circuit_id = c.id and cm.status = 'approved') as rating_count
        from circuits c
        order by views desc, reservations desc, c.title
        limit 20
      ) x
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;
