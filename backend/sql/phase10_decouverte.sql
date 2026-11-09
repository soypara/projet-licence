-- ============================================================
-- Phase 10 - recherche intelligente : categories et saisons des lieux
-- A executer dans Supabase > SQL Editor, en une fois.
-- Ne supprime rien : ajoute deux colonnes aux lieux touristiques.
-- ============================================================

-- tags : categories / activites du lieu (ex. {beach,calm,family})
alter table tourist_places add column if not exists tags text[] not null default '{}';

-- best_months : mois recommandes pour visiter (1 = janvier ... 12 = decembre)
alter table tourist_places add column if not exists best_months integer[] not null default '{}';
