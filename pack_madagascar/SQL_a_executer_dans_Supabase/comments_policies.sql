-- À exécuter dans Supabase > SQL Editor, SEULEMENT si tes policies
-- sur "comments" ne sont pas déjà identiques à celles-ci.
-- Prérequis : la fonction is_admin() doit déjà exister dans ta base.

alter table public.comments enable row level security;

drop policy if exists "Public can read approved comments"
on public.comments;

create policy "Public can read approved comments"
on public.comments
for select
to anon, authenticated
using (
  status = 'approved'
);

drop policy if exists "Users can insert comments"
on public.comments;

create policy "Users can insert comments"
on public.comments
for insert
to authenticated
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can update own comments"
on public.comments;

create policy "Users can update own comments"
on public.comments
for update
to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
);

drop policy if exists "Users can delete own comments"
on public.comments;

create policy "Users can delete own comments"
on public.comments
for delete
to authenticated
using (
  user_id = auth.uid()
);

drop policy if exists "Admins can manage comments"
on public.comments;

create policy "Admins can manage comments"
on public.comments
for all
to authenticated
using (
  is_admin()
)
with check (
  is_admin()
);

-- Contraintes d'unicité des tables de liaison (seulement si elles manquent ;
-- si Supabase répond "already exists", ne touche à rien) :
-- alter table public.circuit_places
--   add constraint circuit_places_unique unique (circuit_id, tourist_place_id);
-- alter table public.circuit_hotels
--   add constraint circuit_hotels_unique unique (circuit_id, hotel_id);
