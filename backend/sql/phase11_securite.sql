-- ============================================================
-- Phase 11 - securite (v21)
-- A executer dans Supabase > SQL Editor, en une fois.
-- Ne supprime aucune donnee. Peut etre relance sans probleme.
-- ============================================================

-- ---------- 1. RESERVATIONS ----------
-- Un touriste ne doit pas pouvoir modifier ni supprimer une reservation
-- (sinon il pourrait se mettre "confirmee" sans payer).
-- Le paiement, lui, passe par la fonction pay_reservation (inchangee).
drop policy if exists "Users can update own reservations" on reservations;
drop policy if exists "Users can delete own reservations" on reservations;

-- Doublons (memes regles en double) : on garde une seule version
drop policy if exists "Admins can manage reservations" on reservations;
drop policy if exists "Users can create own reservations" on reservations;
drop policy if exists "Users can read own reservations" on reservations;

-- Creation : le serveur recalcule le prix, l'acompte, le statut et verifie le depart,
-- meme si quelqu'un appelle la base directement en contournant le site.
create or replace function guard_reservation_insert()
returns trigger
language plpgsql
as $$
declare
  c record;
  tier text;
  per numeric;
  tot numeric;
begin
  -- Admins et fonctions internes : aucune restriction
  if current_user not in ('authenticated', 'anon') or is_admin() then
    return new;
  end if;

  if new.travelers is null or new.travelers < 1 or new.travelers > 100 then
    raise exception 'invalid_travelers';
  end if;

  if not exists (
    select 1 from circuit_departures
     where circuit_id = new.circuit_id and start_date = new.start_date
  ) then
    raise exception 'invalid_departure';
  end if;

  select price, price_tiers into c from circuits where id = new.circuit_id;

  if not found then
    raise exception 'circuit_not_found';
  end if;

  tier := case
    when new.travelers <= 2 then '1-2'
    when new.travelers <= 4 then '3-4'
    when new.travelers <= 10 then '5-10'
    when new.travelers <= 20 then '11-20'
    else '21+'
  end;

  per := coalesce(c.price, 0);

  if c.price_tiers is not null
     and jsonb_typeof(c.price_tiers -> tier) = 'number'
     and (c.price_tiers ->> tier)::numeric >= 0 then
    per := (c.price_tiers ->> tier)::numeric;
  end if;

  tot := round(per * new.travelers);

  new.user_id := auth.uid();
  new.total_mga := tot;
  new.total := tot;
  new.date := new.start_date;
  new.deposit_mga := round(tot * 0.3);
  new.status := 'pending';
  new.payment_status := 'unpaid';
  new.paid_at := null;
  new.paid_currency := null;
  new.paid_display_amount := null;
  new.cancel_reason := null;

  -- La date limite ne peut pas depasser le depart (sinon la reservation
  -- bloquerait la place indefiniment)
  if new.pay_deadline is null or new.pay_deadline > new.start_date then
    new.pay_deadline := new.start_date;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_reservation_insert on reservations;
create trigger trg_guard_reservation_insert
  before insert on reservations
  for each row execute function guard_reservation_insert();

-- ---------- 2. AVIS ----------
-- Un avis ne se modifie pas apres coup (il a deja ete controle).
drop policy if exists "Users can update own comments" on comments;

-- ---------- 3. UTILISATEURS : pas de changement de role ----------
-- Chacun peut changer son nom, mais seul le super admin peut changer un role.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'users' and column_name = 'role'
  ) then
    create or replace function guard_user_role()
    returns trigger
    language plpgsql
    as $f$
    begin
      if current_user in ('authenticated', 'anon')
         and new.role::text is distinct from old.role::text
         and not coalesce(is_super_admin(), false) then
        raise exception 'role_change_forbidden';
      end if;

      return new;
    end;
    $f$;

    drop trigger if exists trg_guard_user_role on public.users;
    create trigger trg_guard_user_role
      before update on public.users
      for each row execute function guard_user_role();
  end if;
end $$;

-- ---------- 4. STOCKAGE DES PHOTOS ----------
-- Avant : tout utilisateur connecte pouvait envoyer des fichiers.
-- Maintenant : seulement les admins (comme dans l'application).
drop policy if exists "Authenticated users can upload media" on storage.objects;
drop policy if exists "Admins can upload media" on storage.objects;
drop policy if exists "Admins can update media files" on storage.objects;
drop policy if exists "Admins can delete media files" on storage.objects;

create policy "Admins can upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and is_admin());

create policy "Admins can update media files" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and is_admin())
  with check (bucket_id = 'media' and is_admin());

create policy "Admins can delete media files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and is_admin());

-- Verification (optionnelle) :
-- select tablename, policyname, cmd from pg_policies
--  where tablename in ('reservations','comments','users') or schemaname='storage' order by 1,2;
