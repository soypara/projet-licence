-- ============================================================
-- Phase 8 - delai de paiement, nom du client, annulation automatique
-- A executer dans Supabase > SQL Editor, APRES phase7_paiements.sql.
-- Ne supprime rien (sauf l'ancienne version de la fonction pay_reservation,
-- remplacee par une version avec la devise).
-- ============================================================

-- 1. Nouvelles colonnes sur les reservations
alter table reservations add column if not exists full_name text;
alter table reservations add column if not exists pay_deadline date;
alter table reservations add column if not exists cancel_reason text;
alter table reservations add column if not exists paid_currency text;
alter table reservations add column if not exists paid_display_amount numeric;

-- 2. Devise payee par le client (ce qu'il a vu a l'ecran) dans l'historique
alter table reservation_payments add column if not exists display_currency text;
alter table reservation_payments add column if not exists display_amount numeric;

-- 3. Annulation automatique : reservation non payee apres sa date limite.
-- Appelee par le backend a chaque lecture des reservations (pas besoin de cron).
create or replace function expire_unpaid_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update reservations
     set status = 'cancelled',
         cancel_reason = 'unpaid_deadline'
   where status = 'pending'
     and payment_status = 'unpaid'
     and pay_deadline is not null
     and pay_deadline < (now() at time zone 'Indian/Antananarivo')::date;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function expire_unpaid_reservations() from public;
grant execute on function expire_unpaid_reservations() to authenticated;

-- 4. Paiement : meme fonction qu'avant + devise et montant vus par le client
drop function if exists pay_reservation(text, boolean, text, text, text, text);

create or replace function pay_reservation(
  p_reservation_id text,
  p_ok boolean,
  p_brand text,
  p_last4 text,
  p_reference text,
  p_reason text,
  p_currency text,
  p_display_amount numeric
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
    reference, card_brand, card_last4, failure_reason,
    display_currency, display_amount
  ) values (
    p_reservation_id, auth.uid(), amount,
    case when p_ok then 'paid' else 'failed' end,
    p_reference, p_brand, p_last4,
    case when p_ok then null else p_reason end,
    p_currency, p_display_amount
  );

  if p_ok then
    update reservations
       set payment_status = 'paid',
           paid_at = now(),
           deposit_mga = amount,
           paid_currency = p_currency,
           paid_display_amount = p_display_amount,
           status = 'confirmed'
     where id = r.id
     returning * into r;
  end if;

  return r;
end;
$$;

revoke all on function pay_reservation(text, boolean, text, text, text, text, text, numeric) from public;
grant execute on function pay_reservation(text, boolean, text, text, text, text, text, numeric) to authenticated;
