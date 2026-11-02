-- ============================================================
-- Phase 1 — migrations à exécuter dans Supabase SQL Editor
-- Ne recrée aucune des 12 tables existantes, ne supprime rien.
-- Exécute ce fichier de haut en bas, en une fois.
-- ============================================================

-- 1. Table de jonction Circuit <-> TouristPlace
--    (la relation "contient" du diagramme n'était portée par aucune
--    des 12 tables ; ceci est la réalisation technique de cette relation,
--    pas une nouvelle classe UML)
create table if not exists circuit_places (
  circuit_id uuid not null references circuits(id) on delete cascade,
  tourist_place_id uuid not null references tourist_places(id) on delete restrict,
  primary key (circuit_id, tourist_place_id)
);

-- 2. Table de jonction Circuit <-> Hotel
create table if not exists circuit_hotels (
  circuit_id uuid not null references circuits(id) on delete cascade,
  hotel_id uuid not null references hotels(id) on delete restrict,
  primary key (circuit_id, hotel_id)
);

-- 3. Colonnes manquantes sur media pour la relation polymorphe
--    (nécessaires pour savoir à quoi un média est rattaché)
alter table media add column if not exists entity_type text;
alter table media add column if not exists entity_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_entity_type_check'
  ) then
    alter table media add constraint media_entity_type_check
      check (entity_type in ('circuit', 'tourist_place', 'hotel'));
  end if;
end $$;

-- 4. Activer le RLS sur les deux nouvelles tables
alter table circuit_places enable row level security;
alter table circuit_hotels enable row level security;

-- 5. Policies de lecture publique — le feed doit être consultable
--    sans authentification, y compris ces relations.
--    PostgreSQL ne supporte pas "CREATE POLICY IF NOT EXISTS", donc on
--    vérifie manuellement (utile car "circuits" a déjà sa policy).
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('circuits', 'Public can read circuits'),
      ('tourist_places', 'Public can read tourist_places'),
      ('hotels', 'Public can read hotels'),
      ('media', 'Public can read media'),
      ('circuit_places', 'Public can read circuit_places'),
      ('circuit_hotels', 'Public can read circuit_hotels'),
      ('languages', 'Public can read languages'),
      ('content_translations', 'Public can read content_translations')
    ) as x(tablename, policyname)
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t.tablename and policyname = t.policyname
    ) then
      execute format(
        'create policy %I on %I for select using (true);',
        t.policyname, t.tablename
      );
    end if;
  end loop;
end $$;

-- 6. Les policies d'écriture du prototype sans authentification sont ajoutées
--    dans phase1b_migrations.sql. Elles sont volontairement temporaires et
--    devront être remplacées par des policies basées sur auth.uid() en Phase 2.

-- Vérification finale (optionnelle) :
-- select tablename, policyname from pg_policies where schemaname = 'public';
