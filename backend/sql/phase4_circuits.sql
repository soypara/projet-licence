-- ============================================================
-- Phase 4 — circuits multi-étapes, textes multilingues, tarifs par tranche
-- A exécuter dans Supabase > SQL Editor, en une fois (après phase3).
-- Autonome : crée aussi les tables de liaison si elles manquent
-- (c'est ce qui causait "circuit introuvable" dans Gérer).
-- Ne supprime rien, peut être relancé sans risque.
-- ============================================================

-- 1. Tables de liaison circuit <-> lieux / hôtels
create table if not exists circuit_places (
  circuit_id uuid not null references circuits(id) on delete cascade,
  tourist_place_id uuid not null references tourist_places(id) on delete restrict,
  primary key (circuit_id, tourist_place_id)
);

create table if not exists circuit_hotels (
  circuit_id uuid not null references circuits(id) on delete cascade,
  hotel_id uuid not null references hotels(id) on delete restrict,
  primary key (circuit_id, hotel_id)
);

-- Ordre des étapes (départ = plus petite position)
alter table circuit_places add column if not exists position int not null default 0;

-- 2. Photos : à quoi un média est rattaché
alter table media add column if not exists entity_type text;
alter table media add column if not exists entity_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'media_entity_type_check') then
    alter table media add constraint media_entity_type_check
      check (entity_type in ('circuit', 'tourist_place', 'hotel'));
  end if;
end $$;

-- 3. Textes par langue : {"fr": "...", "en": "...", "mg": "..."}
alter table circuits add column if not exists title_i18n jsonb;
alter table circuits add column if not exists description_i18n jsonb;

-- 4. Tarifs par personne selon la taille du groupe (Ariary) :
-- {"1-2": 0, "3-4": 0, "5-10": 0, "11-20": 0, "21+": 0}
alter table circuits add column if not exists price_tiers jsonb;

-- 5. Sécurité (RLS)
alter table circuit_places enable row level security;
alter table circuit_hotels enable row level security;

-- Lecture publique
drop policy if exists "Public can read circuit_places" on circuit_places;
create policy "Public can read circuit_places" on circuit_places
  for select using (true);

drop policy if exists "Public can read circuit_hotels" on circuit_hotels;
create policy "Public can read circuit_hotels" on circuit_hotels
  for select using (true);

do $$
declare
  t text;
begin
  foreach t in array array['circuits', 'tourist_places', 'hotels', 'media']
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and cmd = 'SELECT'
        and qual = 'true'
    ) then
      execute format(
        'create policy %I on %I for select using (true);',
        'Public can read ' || t, t
      );
    end if;
  end loop;
end $$;

-- Écriture réservée aux admins
drop policy if exists "Admins manage circuit_places" on circuit_places;
create policy "Admins manage circuit_places" on circuit_places
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admins manage circuit_hotels" on circuit_hotels;
create policy "Admins manage circuit_hotels" on circuit_hotels
  for all to authenticated using (is_admin()) with check (is_admin());
