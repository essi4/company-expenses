begin;

-- EASY Business Access 2.0
alter table public.businesses add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
create index if not exists businesses_owner_user_idx on public.businesses(owner_user_id);

create table if not exists public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',
  status text not null default 'active' check (status in ('active','invited','suspended','removed')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(business_id,user_id)
);

create index if not exists business_memberships_user_idx on public.business_memberships(user_id,status);
create index if not exists business_memberships_business_idx on public.business_memberships(business_id,status);

alter table public.business_memberships enable row level security;

create schema if not exists private;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin', false);
$$;

create or replace function private.has_business_access(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      private.is_super_admin()
      or exists (
        select 1
        from public.business_memberships bm
        where bm.business_id = p_business_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
      )
    );
$$;

create or replace function private.has_business_write(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      private.is_super_admin()
      or exists (
        select 1
        from public.business_memberships bm
        where bm.business_id = p_business_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
          and bm.role in ('owner','admin','manager')
      )
    );
$$;

revoke all on function private.is_super_admin() from public;
revoke all on function private.has_business_access(uuid) from public;
revoke all on function private.has_business_write(uuid) from public;
grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.has_business_access(uuid) to authenticated;
grant execute on function private.has_business_write(uuid) to authenticated;

drop policy if exists business_memberships_select on public.business_memberships;
create policy business_memberships_select on public.business_memberships
for select to authenticated
using (
  private.is_super_admin()
  or user_id = auth.uid()
  or private.has_business_access(business_id)
);

drop policy if exists business_memberships_insert on public.business_memberships;
create policy business_memberships_insert on public.business_memberships
for insert to authenticated
with check (
  private.is_super_admin()
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_user_id = auth.uid()
    )
  )
  or private.has_business_write(business_id)
);

drop policy if exists business_memberships_update on public.business_memberships;
create policy business_memberships_update on public.business_memberships
for update to authenticated
using (private.is_super_admin() or private.has_business_write(business_id))
with check (private.is_super_admin() or private.has_business_write(business_id));

drop policy if exists business_memberships_delete on public.business_memberships;
create policy business_memberships_delete on public.business_memberships
for delete to authenticated
using (private.is_super_admin() or private.has_business_write(business_id));

-- Business root access
drop policy if exists businesses_auth on public.businesses;
create policy businesses_select on public.businesses
for select to authenticated
using (private.has_business_access(id));

create policy businesses_insert on public.businesses
for insert to authenticated
with check (private.is_super_admin() or (select auth.uid()) = owner_user_id);

create policy businesses_update on public.businesses
for update to authenticated
using (private.has_business_write(id))
with check (private.has_business_write(id));

create policy businesses_delete on public.businesses
for delete to authenticated
using (private.is_super_admin() or ((select auth.uid()) = owner_user_id));

-- Common business-owned tables.
drop policy if exists business_customers_auth on public.business_customers;
create policy business_customers_select on public.business_customers for select to authenticated using (private.has_business_access(business_id));
create policy business_customers_insert on public.business_customers for insert to authenticated with check (private.has_business_write(business_id));
create policy business_customers_update on public.business_customers for update to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));
create policy business_customers_delete on public.business_customers for delete to authenticated using (private.has_business_write(business_id));

drop policy if exists business_services_auth on public.business_services;
create policy business_services_select on public.business_services for select to authenticated using (private.has_business_access(business_id));
create policy business_services_insert on public.business_services for insert to authenticated with check (private.has_business_write(business_id));
create policy business_services_update on public.business_services for update to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));
create policy business_services_delete on public.business_services for delete to authenticated using (private.has_business_write(business_id));

drop policy if exists business_staff_auth on public.business_staff;
create policy business_staff_select on public.business_staff for select to authenticated using (private.has_business_access(business_id));
create policy business_staff_insert on public.business_staff for insert to authenticated with check (private.has_business_write(business_id));
create policy business_staff_update on public.business_staff for update to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));
create policy business_staff_delete on public.business_staff for delete to authenticated using (private.has_business_write(business_id));

drop policy if exists business_appointments_auth on public.business_appointments;
create policy business_appointments_select on public.business_appointments for select to authenticated using (private.has_business_access(business_id));
create policy business_appointments_insert on public.business_appointments for insert to authenticated with check (private.has_business_write(business_id));
create policy business_appointments_update on public.business_appointments for update to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));
create policy business_appointments_delete on public.business_appointments for delete to authenticated using (private.has_business_write(business_id));

drop policy if exists business_payments_auth on public.business_payments;
create policy business_payments_select on public.business_payments for select to authenticated using (private.has_business_access(business_id));
create policy business_payments_insert on public.business_payments for insert to authenticated with check (private.has_business_write(business_id));
create policy business_payments_update on public.business_payments for update to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));
create policy business_payments_delete on public.business_payments for delete to authenticated using (private.has_business_write(business_id));

drop policy if exists business_invoices_auth on public.business_invoices;
create policy business_invoices_select on public.business_invoices for select to authenticated using (private.has_business_access(business_id));
create policy business_invoices_insert on public.business_invoices for insert to authenticated with check (private.has_business_write(business_id));
create policy business_invoices_update on public.business_invoices for update to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));
create policy business_invoices_delete on public.business_invoices for delete to authenticated using (private.has_business_write(business_id));

drop policy if exists business_invoice_items_auth on public.business_invoice_items;
create policy business_invoice_items_select on public.business_invoice_items
for select to authenticated
using (exists (select 1 from public.business_invoices bi where bi.id = invoice_id and private.has_business_access(bi.business_id)));
create policy business_invoice_items_insert on public.business_invoice_items
for insert to authenticated
with check (exists (select 1 from public.business_invoices bi where bi.id = invoice_id and private.has_business_write(bi.business_id)));
create policy business_invoice_items_update on public.business_invoice_items
for update to authenticated
using (exists (select 1 from public.business_invoices bi where bi.id = invoice_id and private.has_business_write(bi.business_id)))
with check (exists (select 1 from public.business_invoices bi where bi.id = invoice_id and private.has_business_write(bi.business_id)));
create policy business_invoice_items_delete on public.business_invoice_items
for delete to authenticated
using (exists (select 1 from public.business_invoices bi where bi.id = invoice_id and private.has_business_write(bi.business_id)));

-- Configuration tables.
drop policy if exists business_modules_auth on public.business_modules;
create policy business_modules_select on public.business_modules for select to authenticated using (private.has_business_access(business_id));
create policy business_modules_write on public.business_modules for all to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));

drop policy if exists business_payment_methods_auth on public.business_payment_methods;
create policy business_payment_methods_select on public.business_payment_methods for select to authenticated using (private.has_business_access(business_id));
create policy business_payment_methods_write on public.business_payment_methods for all to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));

drop policy if exists business_working_hours_auth on public.business_working_hours;
create policy business_working_hours_select on public.business_working_hours for select to authenticated using (private.has_business_access(business_id));
create policy business_working_hours_write on public.business_working_hours for all to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));

drop policy if exists business_branding_auth on public.business_branding;
create policy business_branding_select on public.business_branding for select to authenticated using (private.has_business_access(business_id));
create policy business_branding_write on public.business_branding for all to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));

drop policy if exists business_locations_auth on public.business_locations;
create policy business_locations_select on public.business_locations for select to authenticated using (private.has_business_access(business_id));
create policy business_locations_write on public.business_locations for all to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));

drop policy if exists business_financial_settings_auth on public.business_financial_settings;
create policy business_financial_settings_select on public.business_financial_settings for select to authenticated using (private.has_business_access(business_id));
create policy business_financial_settings_write on public.business_financial_settings for all to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));

drop policy if exists business_document_sequences_auth on public.business_document_sequences;
create policy business_document_sequences_select on public.business_document_sequences for select to authenticated using (private.has_business_write(business_id));
create policy business_document_sequences_write on public.business_document_sequences for all to authenticated using (private.has_business_write(business_id)) with check (private.has_business_write(business_id));

drop policy if exists business_audit_events_auth on public.business_audit_events;
create policy business_audit_events_select on public.business_audit_events for select to authenticated using (private.is_super_admin() or private.has_business_access(business_id));
create policy business_audit_events_insert on public.business_audit_events for insert to authenticated with check (private.is_super_admin() or private.has_business_access(business_id));

drop policy if exists businesses_auth on public.businesses;

-- Atomically assign the creating user as owner.
create or replace function public.create_business_workspace(
  p_name text,
  p_slug text,
  p_business_type text,
  p_mode text,
  p_plan text,
  p_owner_email text,
  p_locale text default 'fa-IR',
  p_timezone text default 'Asia/Tehran',
  p_currency text default 'IRR'
)
returns public.businesses
language plpgsql
security invoker
set search_path = public
as $$
declare
  b public.businesses;
  location_id uuid;
  m text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_slug), '') is null then raise exception 'invalid_business_identity'; end if;

  insert into public.businesses(
    name,slug,business_type,mode,plan,status,owner_email,owner_user_id,locale,timezone,currency
  ) values (
    trim(p_name),trim(p_slug),p_business_type,p_mode,coalesce(nullif(trim(p_plan),''),'Starter'),
    'Trial',nullif(trim(p_owner_email),''),auth.uid(),coalesce(p_locale,'fa-IR'),coalesce(p_timezone,'Asia/Tehran'),coalesce(p_currency,'IRR')
  )
  returning * into b;

  insert into public.business_memberships(business_id,user_id,role,status)
  values (b.id,auth.uid(),'owner','active');

  insert into public.business_locations(business_id,name,code,timezone,locale,currency,active,is_default)
  values (b.id,'شعبه اصلی','MAIN',b.timezone,b.locale,b.currency,true,true)
  returning id into location_id;

  update public.businesses set default_location_id=location_id where id=b.id;

  foreach m in array ARRAY[
    'customers','appointments','catalog','staff','invoicing','payments','cashier',
    'ledger','inventory','reports','online_booking','notifications'
  ] loop
    insert into public.business_modules(business_id,module_id,state,enabled_at)
    values (b.id,m,case when m='inventory' then 'disabled' else 'enabled' end,case when m='inventory' then null else now() end);
  end loop;

  insert into public.business_payment_methods(business_id,method,title,enabled,is_default)
  values
    (b.id,'card_terminal','کارتخوان',true,true),
    (b.id,'cash','نقدی',true,false),
    (b.id,'transfer','انتقال',true,false);

  insert into public.business_financial_settings(
    business_id,invoice_enabled,invoice_optional,auto_issue_invoice,
    allow_receipt_without_invoice,allow_partial_payment,allow_mixed_payment,
    default_payment_method,tax_enabled,tax_rate,price_includes_tax
  ) values (b.id,true,true,false,true,true,true,'card_terminal',false,0,true);

  insert into public.business_document_sequences(business_id,document_type,prefix,next_number)
  values (b.id,'invoice','',1);

  insert into public.business_branding(business_id,theme_key,radius_scale)
  values (b.id,'elegant','comfortable');

  insert into public.business_working_hours(business_id,weekday,enabled,open_time,close_time)
  values
    (b.id,0,true,'09:00','21:00'),(b.id,1,true,'09:00','21:00'),(b.id,2,true,'09:00','21:00'),
    (b.id,3,true,'09:00','21:00'),(b.id,4,true,'09:00','21:00'),(b.id,5,true,'10:00','18:00'),
    (b.id,6,false,null,null);

  return b;
exception
  when unique_violation then raise exception 'business_slug_exists';
end;
$$;

revoke all on function public.create_business_workspace(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.create_business_workspace(text,text,text,text,text,text,text,text,text) to authenticated;

commit;
