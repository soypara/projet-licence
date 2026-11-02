-- ============================================================
-- PHASE 6 (v12) : dates de départ des circuits + initiale des avis
-- À exécuter UNE fois dans Supabase > SQL Editor. Peut être relancé sans risque.
-- Prérequis : la fonction is_admin() existe déjà.
-- ============================================================

-- ---------- 1. Départs des circuits ----------
-- Une ligne = un départ (date du 1er jour). Le dernier jour se calcule avec la
-- durée du circuit. Les départs passés restent en base (historique) mais ne
-- sont plus montrés au public.

create table if not exists public.circuit_departures (
  id uuid primary key default gen_random_uuid(),
  circuit_id uuid not null references public.circuits(id) on delete cascade,
  start_date date not null,
  created_at timestamptz not null default now(),
  unique (circuit_id, start_date)
);

create index if not exists circuit_departures_circuit_idx
  on public.circuit_departures (circuit_id, start_date);

alter table public.circuit_departures enable row level security;

grant select on public.circuit_departures to anon, authenticated;

drop policy if exists "Public can read departures" on public.circuit_departures;
create policy "Public can read departures"
on public.circuit_departures for select to anon, authenticated
using (true);

drop policy if exists "Admins can manage departures" on public.circuit_departures;
create policy "Admins can manage departures"
on public.circuit_departures for all to authenticated
using (is_admin())
with check (is_admin());

-- ---------- 2. Initiale de l'auteur sur les avis ----------
-- On ne garde que la 1re lettre (jamais le nom ni l'adresse e-mail).

alter table public.comments
  add column if not exists author_initial text;
