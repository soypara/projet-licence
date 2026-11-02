-- ============================================================
-- Phase 9 - solde de l'agence (carte fictive) et planning
-- A executer dans Supabase > SQL Editor, APRES phase7 et phase8.
-- Ne supprime rien : ajoute seulement deux fonctions.
-- Prerequis : la fonction get_my_role() existe deja (utilisee par le site).
-- ============================================================

-- Vrai si la personne connectee est le "super admin" (affiche "Admin" sur le site)
create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(get_my_role()::text = 'super_admin', false);
$$;

revoke all on function is_super_admin() from public;
grant execute on function is_super_admin() to authenticated;

-- Solde de l'agence = somme des acomptes payes (non remboursables)
-- + la liste des 500 derniers paiements. Reserve au super admin.
create or replace function agency_ledger()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not is_super_admin() then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'balance_mga',
      (select coalesce(sum(amount_mga), 0)
         from reservation_payments where status = 'paid'),
    'count',
      (select count(*) from reservation_payments where status = 'paid'),
    'entries',
      coalesce((
        select jsonb_agg(x.e order by x.created desc)
        from (
          select
            p.created_at as created,
            jsonb_build_object(
              'id', p.id,
              'created_at', p.created_at,
              'reference', p.reference,
              'amount_mga', p.amount_mga,
              'display_currency', p.display_currency,
              'display_amount', p.display_amount,
              'card_brand', p.card_brand,
              'card_last4', p.card_last4,
              'full_name', r.full_name,
              'circuit_title', c.title,
              'start_date', r.start_date,
              'reservation_status', r.status
            ) as e
          from reservation_payments p
          left join reservations r on r.id::text = p.reservation_id
          left join circuits c on c.id = r.circuit_id
          where p.status = 'paid'
          order by p.created_at desc
          limit 500
        ) x
      ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function agency_ledger() from public;
grant execute on function agency_ledger() to authenticated;
