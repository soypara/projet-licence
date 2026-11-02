-- ============================================================
-- Phase 7 - paiement de l'acompte (version SIMULATION)
-- A executer dans Supabase > SQL Editor, en une fois.
-- Ne supprime rien : ajoute des colonnes, une table et une fonction.
-- ============================================================

-- 1. Colonnes d'acompte sur les reservations
alter table reservations add column if not exists deposit_mga numeric(14,0);
alter table reservations add column if not exists payment_status text not null default 'unpaid';
alter table reservations add column if not exists paid_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reservations_payment_status_check') then
    alter table reservations add constraint reservations_payment_status_check
      check (payment_status in ('unpaid', 'paid'));
  end if;
end $$;

-- Anciennes reservations : acompte = 30 % du total
update reservations
   set deposit_mga = round(total_mga * 0.3)
 where deposit_mga is null;

-- 2. Historique des paiements (reussis ET refuses)
-- Jamais le numero de carte : seulement la marque et les 4 derniers chiffres.
create table if not exists reservation_payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id text not null,
  user_id uuid not null,
  amount_mga numeric(14,0) not null,
  provider text not null default 'simulation',
  status text not null check (status in ('paid', 'failed')),
  reference text,
  card_brand text,
  card_last4 text,
  failure_reason text,
  created_at timestamptz not null default now()
);

alter table reservation_payments enable row level security;

drop policy if exists "Users read own reservation payments" on reservation_payments;
create policy "Users read own reservation payments" on reservation_payments
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Admins read reservation_payments" on reservation_payments;
create policy "Admins read reservation_payments" on reservation_payments
  for select to authenticated using (is_admin());

-- Pas de policy d'ecriture : on n'ecrit que via la fonction ci-dessous.

-- 3. Enregistre un paiement. Si reussi : acompte paye + reservation confirmee.
create or replace function pay_reservation(
  p_reservation_id text,
  p_ok boolean,
  p_brand text,
  p_last4 text,
  p_reference text,
  p_reason text
)
returns reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  r reservations;
  amount numeric;
begin
  select * into r
    from reservations
   where id::text = p_reservation_id and user_id = auth.uid()
   for update;

  if not found then
    raise exception 'reservation_not_found';
  end if;

  if r.payment_status = 'paid' then
    raise exception 'already_paid';
  end if;

  if r.status in ('rejected', 'cancelled') then
    raise exception 'reservation_closed';
  end if;

  amount := coalesce(r.deposit_mga, round(r.total_mga * 0.3));

  insert into reservation_payments (
    reservation_id, user_id, amount_mga, status,
    reference, card_brand, card_last4, failure_reason
  ) values (
    p_reservation_id, auth.uid(), amount,
    case when p_ok then 'paid' else 'failed' end,
    p_reference, p_brand, p_last4,
    case when p_ok then null else p_reason end
  );

  if p_ok then
    update reservations
       set payment_status = 'paid',
           paid_at = now(),
           deposit_mga = amount,
           status = 'confirmed'
     where id = r.id
     returning * into r;
  end if;

  return r;
end;
$$;

revoke all on function pay_reservation(text, boolean, text, text, text, text) from public;
grant execute on function pay_reservation(text, boolean, text, text, text, text) to authenticated;
