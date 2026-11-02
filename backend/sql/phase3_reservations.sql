-- ============================================================
-- Phase 3 — réservations de circuits + infos circuit
-- A exécuter dans Supabase > SQL Editor, en une fois.
-- Ne supprime rien : crée la table si elle manque, sinon ajoute
-- seulement les colonnes manquantes.
-- Prérequis : la fonction is_admin() existe déjà (voir comments_policies.sql).
-- ============================================================

-- 1. Infos circuit : durée et sens du parcours
alter table circuits add column if not exists duration_days int;
alter table circuits add column if not exists direction text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'circuits_direction_check') then
    alter table circuits add constraint circuits_direction_check
      check (direction is null or direction in ('north_south', 'south_north', 'loop'));
  end if;
end $$;

-- 2. Table des réservations
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  circuit_id uuid not null references circuits(id) on delete restrict,
  start_date date not null,
  travelers int not null default 1,
  phone text,
  note text,
  total_mga numeric(14,0) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Si la table existait déjà avec d'autres colonnes, on complète :
alter table reservations add column if not exists user_id uuid default auth.uid();
alter table reservations add column if not exists circuit_id uuid references circuits(id) on delete restrict;
alter table reservations add column if not exists start_date date;
alter table reservations add column if not exists travelers int default 1;
alter table reservations add column if not exists phone text;
alter table reservations add column if not exists note text;
alter table reservations add column if not exists total_mga numeric(14,0) default 0;
alter table reservations add column if not exists status text default 'pending';
alter table reservations add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reservations_status_check') then
    alter table reservations add constraint reservations_status_check
      check (status in ('pending', 'confirmed', 'rejected', 'cancelled'));
  end if;
end $$;

-- 3. Sécurité (RLS)
alter table reservations enable row level security;

drop policy if exists "Users read own reservations" on reservations;
create policy "Users read own reservations" on reservations
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Users create own reservations" on reservations;
create policy "Users create own reservations" on reservations
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Admins manage reservations" on reservations;
create policy "Admins manage reservations" on reservations
  for all to authenticated using (is_admin()) with check (is_admin());
