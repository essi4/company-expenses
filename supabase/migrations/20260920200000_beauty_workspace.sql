create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  business_type text not null,
  mode text not null,
  plan text not null default 'Starter',
  status text not null default 'Trial',
  owner_email text,
  phone text,
  address text,
  online_booking boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  price bigint not null default 0,
  duration_minutes integer not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.business_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.business_appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.business_customers(id) on delete set null,
  service_id uuid references public.business_services(id) on delete set null,
  staff_id uuid references public.business_staff(id) on delete set null,
  starts_at timestamptz not null,
  status text not null default 'reserved',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.business_customers(id) on delete set null,
  service_id uuid references public.business_services(id) on delete set null,
  appointment_id uuid references public.business_appointments(id) on delete set null,
  amount bigint not null default 0,
  method text not null default 'card',
  status text not null default 'paid',
  paid_at timestamptz not null default now()
);

create index if not exists business_customers_business_idx on public.business_customers(business_id);
create index if not exists business_services_business_idx on public.business_services(business_id);
create index if not exists business_staff_business_idx on public.business_staff(business_id);
create index if not exists business_appointments_business_start_idx on public.business_appointments(business_id, starts_at);
create index if not exists business_payments_business_paid_idx on public.business_payments(business_id, paid_at);

alter table public.businesses enable row level security;
alter table public.business_customers enable row level security;
alter table public.business_services enable row level security;
alter table public.business_staff enable row level security;
alter table public.business_appointments enable row level security;
alter table public.business_payments enable row level security;

insert into public.businesses (name, slug, business_type, mode, plan, status, owner_email, phone, address)
values ('پازل','puzzle-barber','Beauty','Men','Professional','Active','puzzle@easy.local','۰۷۱۳۲۲۲۲۲۲۲','شیراز، خیابان نمونه')
on conflict (slug) do update set name=excluded.name, status='Active', business_type=excluded.business_type, mode=excluded.mode, plan=excluded.plan;

create or replace function public.is_authenticated()
returns boolean language sql stable as $$ select auth.uid() is not null $$;

drop policy if exists businesses_auth on public.businesses;
create policy businesses_auth on public.businesses for all using (public.is_authenticated()) with check (public.is_authenticated());

drop policy if exists business_customers_auth on public.business_customers;
create policy business_customers_auth on public.business_customers for all using (public.is_authenticated()) with check (public.is_authenticated());

drop policy if exists business_services_auth on public.business_services;
create policy business_services_auth on public.business_services for all using (public.is_authenticated()) with check (public.is_authenticated());

drop policy if exists business_staff_auth on public.business_staff;
create policy business_staff_auth on public.business_staff for all using (public.is_authenticated()) with check (public.is_authenticated());

drop policy if exists business_appointments_auth on public.business_appointments;
create policy business_appointments_auth on public.business_appointments for all using (public.is_authenticated()) with check (public.is_authenticated());

drop policy if exists business_payments_auth on public.business_payments;
create policy business_payments_auth on public.business_payments for all using (public.is_authenticated()) with check (public.is_authenticated());

-- Demo operational data for the active puzzle barber workspace.
do $$
declare
  b uuid;
  c1 uuid; c2 uuid; c3 uuid;
  s1 uuid; s2 uuid; s3 uuid;
  w1 uuid; w2 uuid;
begin
  select id into b from public.businesses where slug = 'puzzle-barber' limit 1;

  if b is null then
    raise exception 'puzzle-barber business seed is missing';
  end if;

  select id into c1 from public.business_customers where business_id=b and phone='۰۹۱۲۱۲۳۴۵۶۷' limit 1;
  if c1 is null then
    insert into public.business_customers(business_id,name,phone) values (b,'امیر رضایی','۰۹۱۲۱۲۳۴۵۶۷') returning id into c1;
  end if;
  select id into c2 from public.business_customers where business_id=b and phone='۰۹۳۵۱۲۳۴۵۶۷' limit 1;
  if c2 is null then
    insert into public.business_customers(business_id,name,phone) values (b,'محمد احمدی','۰۹۳۵۱۲۳۴۵۶۷') returning id into c2;
  end if;
  select id into c3 from public.business_customers where business_id=b and phone='۰۹۱۷۱۲۳۴۵۶۷' limit 1;
  if c3 is null then
    insert into public.business_customers(business_id,name,phone) values (b,'علی کریمی','۰۹۱۷۱۲۳۴۵۶۷') returning id into c3;
  end if;

  select id into s1 from public.business_services where business_id=b and name='اصلاح مو' limit 1;
  if s1 is null then
    insert into public.business_services(business_id,name,price,duration_minutes) values (b,'اصلاح مو',280000,30) returning id into s1;
  end if;
  select id into s2 from public.business_services where business_id=b and name='اصلاح و ریش' limit 1;
  if s2 is null then
    insert into public.business_services(business_id,name,price,duration_minutes) values (b,'اصلاح و ریش',420000,45) returning id into s2;
  end if;
  select id into s3 from public.business_services where business_id=b and name='پاکسازی پوست' limit 1;
  if s3 is null then
    insert into public.business_services(business_id,name,price,duration_minutes) values (b,'پاکسازی پوست',650000,60) returning id into s3;
  end if;

  select id into w1 from public.business_staff where business_id=b and name='اسماعیل' limit 1;
  if w1 is null then
    insert into public.business_staff(business_id,name,role) values (b,'اسماعیل','آرایشگر ارشد') returning id into w1;
  end if;
  select id into w2 from public.business_staff where business_id=b and name='رضا' limit 1;
  if w2 is null then
    insert into public.business_staff(business_id,name,role) values (b,'رضا','آرایشگر') returning id into w2;
  end if;

  if not exists (select 1 from public.business_appointments where business_id=b and customer_id=c1 and service_id=s1) then
    insert into public.business_appointments(business_id,customer_id,service_id,staff_id,starts_at,status)
    values (b,c1,s1,w1,date_trunc('day',now()) + interval '17 hours','reserved');
  end if;

  if not exists (select 1 from public.business_appointments where business_id=b and customer_id=c2 and service_id=s2) then
    insert into public.business_appointments(business_id,customer_id,service_id,staff_id,starts_at,status)
    values (b,c2,s2,w2,date_trunc('day',now()) + interval '18 hours 30 minutes','reserved');
  end if;

  if not exists (select 1 from public.business_payments where business_id=b and customer_id=c1 and amount=280000) then
    insert into public.business_payments(business_id,customer_id,service_id,amount,method)
    values (b,c1,s1,280000,'card_terminal');
  end if;

  if not exists (select 1 from public.business_payments where business_id=b and customer_id=c3 and amount=420000) then
    insert into public.business_payments(business_id,customer_id,service_id,amount,method)
    values (b,c3,s2,420000,'cash');
  end if;
end $$;


create table if not exists public.business_invoices (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 customer_id uuid references public.business_customers(id) on delete set null,
 appointment_id uuid references public.business_appointments(id) on delete set null,
 invoice_number text not null,
 subtotal bigint not null default 0,
 discount_amount bigint not null default 0,
 total_amount bigint not null default 0,
 status text not null default 'issued',
 issued_at timestamptz not null default now(),
 due_at timestamptz,
 notes text,
 unique(business_id, invoice_number)
);
create table if not exists public.business_invoice_items (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid not null references public.business_invoices(id) on delete cascade,
 service_id uuid references public.business_services(id) on delete set null,
 description text not null,
 quantity integer not null default 1 check(quantity > 0),
 unit_price bigint not null default 0 check(unit_price >= 0),
 discount_amount bigint not null default 0 check(discount_amount >= 0),
 line_total bigint not null default 0 check(line_total >= 0)
);
alter table public.business_invoices enable row level security;
alter table public.business_invoice_items enable row level security;
drop policy if exists business_invoices_auth on public.business_invoices;
create policy business_invoices_auth on public.business_invoices for all using (public.is_authenticated()) with check (public.is_authenticated());
drop policy if exists business_invoice_items_auth on public.business_invoice_items;
create policy business_invoice_items_auth on public.business_invoice_items for all using (public.is_authenticated()) with check (public.is_authenticated());


alter table public.business_payments add column if not exists invoice_id uuid references public.business_invoices(id) on delete set null;
alter table public.business_invoices add column if not exists paid_amount bigint not null default 0 check (paid_amount >= 0);
create index if not exists business_payments_invoice_idx on public.business_payments(invoice_id);


-- EASY Business Management: persistent workspace configuration.
alter table public.businesses add column if not exists legal_name text;
alter table public.businesses add column if not exists email text;
alter table public.businesses add column if not exists website text;
alter table public.businesses add column if not exists country text not null default 'IR';
alter table public.businesses add column if not exists locale text not null default 'fa-IR';
alter table public.businesses add column if not exists timezone text not null default 'Asia/Tehran';
alter table public.businesses add column if not exists currency text not null default 'IRR';
alter table public.businesses add column if not exists postal_code text;
alter table public.businesses add column if not exists tax_id text;
alter table public.businesses add column if not exists logo_url text;
alter table public.businesses add column if not exists settings jsonb not null default '{}';

create table if not exists public.business_modules (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 module_id text not null,
 state text not null default 'enabled' check (state in ('enabled','disabled','locked')),
 config jsonb not null default '{}',
 enabled_at timestamptz,
 updated_at timestamptz not null default now(),
 unique(business_id,module_id)
);
create index if not exists business_modules_business_idx on public.business_modules(business_id);

create table if not exists public.business_payment_methods (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 method text not null,
 title text,
 enabled boolean not null default true,
 is_default boolean not null default false,
 provider text,
 config jsonb not null default '{}',
 updated_at timestamptz not null default now(),
 unique(business_id,method)
);
create index if not exists business_payment_methods_business_idx on public.business_payment_methods(business_id);

create table if not exists public.business_working_hours (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 weekday smallint not null check (weekday between 0 and 6),
 enabled boolean not null default true,
 open_time time,
 close_time time,
 break_start time,
 break_end time,
 unique(business_id,weekday)
);

create table if not exists public.business_branding (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 theme_key text not null default 'elegant',
 primary_color text,
 secondary_color text,
 radius_scale text not null default 'comfortable',
 logo_url text,
 settings jsonb not null default '{}',
 updated_at timestamptz not null default now()
);

alter table public.business_modules enable row level security;
alter table public.business_payment_methods enable row level security;
alter table public.business_working_hours enable row level security;
alter table public.business_branding enable row level security;

drop policy if exists business_modules_auth on public.business_modules;
create policy business_modules_auth on public.business_modules for all using (public.is_authenticated()) with check (public.is_authenticated());
drop policy if exists business_payment_methods_auth on public.business_payment_methods;
create policy business_payment_methods_auth on public.business_payment_methods for all using (public.is_authenticated()) with check (public.is_authenticated());
drop policy if exists business_working_hours_auth on public.business_working_hours;
create policy business_working_hours_auth on public.business_working_hours for all using (public.is_authenticated()) with check (public.is_authenticated());
drop policy if exists business_branding_auth on public.business_branding;
create policy business_branding_auth on public.business_branding for all using (public.is_authenticated()) with check (public.is_authenticated());

create index if not exists businesses_category_status_idx on public.businesses(business_type,status);
create index if not exists businesses_owner_idx on public.businesses(owner_email);


-- EASY Business scale foundations: locations, financial policies and document numbering.
create table if not exists public.business_locations (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null,
 code text not null,
 phone text,
 address text,
 timezone text not null default 'Asia/Tehran',
 locale text not null default 'fa-IR',
 currency text not null default 'IRR',
 active boolean not null default true,
 is_default boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(business_id,code)
);
create index if not exists business_locations_business_idx on public.business_locations(business_id);

alter table public.businesses add column if not exists default_location_id uuid;
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname='businesses_default_location_fk'
  ) then
    alter table public.businesses
      add constraint businesses_default_location_fk
      foreign key(default_location_id) references public.business_locations(id) on delete set null;
  end if;
end $$;

create table if not exists public.business_financial_settings (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 invoice_enabled boolean not null default true,
 invoice_optional boolean not null default true,
 auto_issue_invoice boolean not null default false,
 allow_receipt_without_invoice boolean not null default true,
 allow_partial_payment boolean not null default true,
 allow_mixed_payment boolean not null default true,
 default_payment_method text not null default 'card_terminal',
 tax_enabled boolean not null default false,
 tax_rate numeric(8,4) not null default 0,
 price_includes_tax boolean not null default true,
 updated_at timestamptz not null default now()
);

create table if not exists public.business_document_sequences (
 business_id uuid not null references public.businesses(id) on delete cascade,
 document_type text not null,
 prefix text not null default '',
 next_number bigint not null default 1 check(next_number > 0),
 updated_at timestamptz not null default now(),
 primary key(business_id,document_type)
);

create table if not exists public.business_audit_events (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 actor_id uuid,
 action text not null,
 entity_type text,
 entity_id uuid,
 request_id text,
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create index if not exists business_audit_events_lookup_idx on public.business_audit_events(business_id,created_at desc);

alter table public.business_locations enable row level security;
alter table public.business_financial_settings enable row level security;
alter table public.business_document_sequences enable row level security;
alter table public.business_audit_events enable row level security;

drop policy if exists business_locations_auth on public.business_locations;
create policy business_locations_auth on public.business_locations for all using (public.is_authenticated()) with check (public.is_authenticated());
drop policy if exists business_financial_settings_auth on public.business_financial_settings;
create policy business_financial_settings_auth on public.business_financial_settings for all using (public.is_authenticated()) with check (public.is_authenticated());
drop policy if exists business_document_sequences_auth on public.business_document_sequences;
create policy business_document_sequences_auth on public.business_document_sequences for all using (public.is_authenticated()) with check (public.is_authenticated());
drop policy if exists business_audit_events_auth on public.business_audit_events;
create policy business_audit_events_auth on public.business_audit_events for all using (public.is_authenticated()) with check (public.is_authenticated());

alter table public.business_services add column if not exists location_id uuid references public.business_locations(id) on delete set null;
alter table public.business_staff add column if not exists location_id uuid references public.business_locations(id) on delete set null;
alter table public.business_appointments add column if not exists location_id uuid references public.business_locations(id) on delete set null;
alter table public.business_payments add column if not exists location_id uuid references public.business_locations(id) on delete set null;
alter table public.business_invoices add column if not exists location_id uuid references public.business_locations(id) on delete set null;

create index if not exists business_services_location_idx on public.business_services(location_id);
create index if not exists business_staff_location_idx on public.business_staff(location_id);
create index if not exists business_appointments_location_idx on public.business_appointments(location_id,starts_at);
create index if not exists business_payments_location_idx on public.business_payments(location_id,paid_at);
create index if not exists business_invoices_location_idx on public.business_invoices(location_id,issued_at);

create or replace function public.next_business_document_number(
  p_business_id uuid,
  p_document_type text default 'invoice'
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  seq public.business_document_sequences;
  generated text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  insert into public.business_document_sequences(business_id,document_type,prefix,next_number)
  values (p_business_id,p_document_type,'',1)
  on conflict (business_id,document_type) do nothing;

  select * into seq
  from public.business_document_sequences
  where business_id=p_business_id and document_type=p_document_type
  for update;

  generated := seq.prefix || lpad(seq.next_number::text,8,'0');
  update public.business_document_sequences
  set next_number=next_number+1, updated_at=now()
  where business_id=p_business_id and document_type=p_document_type;

  return generated;
end;
$$;

revoke all on function public.next_business_document_number(uuid,text) from public;
grant execute on function public.next_business_document_number(uuid,text) to authenticated;


-- EASY identity-to-business membership boundary.
create table if not exists public.business_memberships (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role_key text not null default 'staff',
 status text not null default 'active' check (status in ('active','invited','suspended')),
 invited_at timestamptz,
 joined_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(business_id,user_id)
);
create index if not exists business_memberships_user_idx on public.business_memberships(user_id,status);
create index if not exists business_memberships_business_idx on public.business_memberships(business_id,status);

alter table public.business_memberships enable row level security;
drop policy if exists business_memberships_self on public.business_memberships;
create policy business_memberships_self on public.business_memberships
for select to authenticated
using ((select auth.uid()) = user_id);

alter table public.business_payments add column if not exists idempotency_key text;
create unique index if not exists business_payments_idempotency_idx
on public.business_payments(idempotency_key)
where idempotency_key is not null;

create or replace function public.record_business_invoice_payment(
  p_business_id uuid,
  p_invoice_id uuid,
  p_payments jsonb,
  p_idempotency_key text
)
returns table(invoice_id uuid, paid_amount bigint, due_amount bigint, status text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  inv public.business_invoices;
  customer uuid;
  requested bigint := 0;
  already_paid boolean := false;
  item jsonb;
  method text;
  part_amount bigint;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_payments is null or jsonb_typeof(p_payments) <> 'array' or jsonb_array_length(p_payments) = 0 then
    raise exception 'invalid_payment_split';
  end if;

  select * into inv
  from public.business_invoices
  where id=p_invoice_id and business_id=p_business_id
  for update;

  if not found then raise exception 'invoice_not_found'; end if;
  customer := inv.customer_id;
  if customer is null then raise exception 'invoice_customer_missing'; end if;

  if p_idempotency_key is not null then
    select exists(select 1 from public.business_payments where idempotency_key=p_idempotency_key) into already_paid;
    if already_paid then
      return query select inv.id,inv.paid_amount,greatest(0,inv.total_amount-inv.paid_amount),inv.status;
      return;
    end if;
  end if;

  for item in select * from jsonb_array_elements(p_payments) loop
    method := item->>'method';
    part_amount := greatest(0, coalesce((item->>'amount')::bigint,0));
    if method not in ('card_terminal','cash','transfer') then raise exception 'invalid_payment_method'; end if;
    requested := requested + part_amount;
  end loop;

  if requested <= 0 or requested > greatest(0,inv.total_amount-inv.paid_amount) then
    raise exception 'invalid_payment_amount';
  end if;

  for item in select * from jsonb_array_elements(p_payments) loop
    method := item->>'method';
    part_amount := greatest(0, coalesce((item->>'amount')::bigint,0));
    if part_amount > 0 then
      insert into public.business_payments(
        business_id,customer_id,appointment_id,amount,method,status,idempotency_key
      )
      values (
        p_business_id,customer,null,part_amount,method,'paid',
        case when p_idempotency_key is null then null else p_idempotency_key || ':' || method end
      );
    end if;
  end loop;

  update public.business_invoices
  set paid_amount = paid_amount + requested,
      status = case when paid_amount + requested >= total_amount then 'paid' else 'partially_paid' end
  where id=inv.id;

  select * into inv from public.business_invoices where id=inv.id;
  return query select inv.id,inv.paid_amount,greatest(0,inv.total_amount-inv.paid_amount),inv.status;
exception
  when unique_violation then
    select * into inv from public.business_invoices where id=p_invoice_id and business_id=p_business_id;
    return query select inv.id,inv.paid_amount,greatest(0,inv.total_amount-inv.paid_amount),inv.status;
end;
$$;

revoke all on function public.record_business_invoice_payment(uuid,uuid,jsonb,text) from public;
grant execute on function public.record_business_invoice_payment(uuid,uuid,jsonb,text) to authenticated;


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
    name,slug,business_type,mode,plan,status,owner_email,locale,timezone,currency
  ) values (
    trim(p_name),trim(p_slug),p_business_type,p_mode,coalesce(nullif(trim(p_plan),''),'Starter'),
    'Trial',nullif(trim(p_owner_email),''),coalesce(p_locale,'fa-IR'),coalesce(p_timezone,'Asia/Tehran'),coalesce(p_currency,'IRR')
  )
  returning * into b;

  insert into public.business_memberships(business_id,user_id,role_key,status,joined_at)
  values (b.id,auth.uid(),'business_owner','active',now());

  insert into public.business_locations(
    business_id,name,code,timezone,locale,currency,active,is_default
  ) values (
    b.id,'شعبه اصلی','MAIN',b.timezone,b.locale,b.currency,true,true
  ) returning id into location_id;

  update public.businesses set default_location_id=location_id where id=b.id;

  foreach m in array ARRAY[
    'customers','appointments','catalog','staff','invoicing','payments',
    'cashier','ledger','inventory','reports','online_booking','notifications'
  ] loop
    insert into public.business_modules(business_id,module_id,state,enabled_at)
    values (
      b.id,m,
      case
        when m = 'inventory' then 'disabled'
        else 'enabled'
      end,
      case when m = 'inventory' then null else now() end
    );
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
  ) values (
    b.id,true,true,false,true,true,true,'card_terminal',false,0,true
  );

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


-- EASY financial document layer: receipts represent settlement evidence even when no invoice exists.
create table if not exists public.business_receipts (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 customer_id uuid references public.business_customers(id) on delete set null,
 invoice_id uuid references public.business_invoices(id) on delete set null,
 receipt_number text not null,
 payment_group_key text not null unique,
 amount bigint not null check(amount > 0),
 currency text not null default 'IRR',
 issued_at timestamptz not null default now(),
 metadata jsonb not null default '{}',
 unique(business_id,receipt_number)
);
create index if not exists business_receipts_business_issued_idx
on public.business_receipts(business_id,issued_at desc);

alter table public.business_payments add column if not exists payment_group_key text;
create index if not exists business_payments_group_idx on public.business_payments(payment_group_key);

alter table public.business_receipts enable row level security;
drop policy if exists business_receipts_auth on public.business_receipts;
create policy business_receipts_auth on public.business_receipts
for all using (public.is_authenticated()) with check (public.is_authenticated());

create or replace function public.next_business_receipt_number(
  p_business_id uuid
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  seq public.business_document_sequences;
  generated text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  insert into public.business_document_sequences(business_id,document_type,prefix,next_number)
  values (p_business_id,'receipt','R-',1)
  on conflict (business_id,document_type) do nothing;

  select * into seq
  from public.business_document_sequences
  where business_id=p_business_id and document_type='receipt'
  for update;

  generated := seq.prefix || lpad(seq.next_number::text,8,'0');

  update public.business_document_sequences
  set next_number=next_number+1, updated_at=now()
  where business_id=p_business_id and document_type='receipt';

  return generated;
end;
$$;

revoke all on function public.next_business_receipt_number(uuid) from public;
grant execute on function public.next_business_receipt_number(uuid) to authenticated;

create or replace function public.create_business_invoice(
  p_business_id uuid,
  p_customer_id uuid,
  p_location_id uuid,
  p_appointment_id uuid,
  p_items jsonb,
  p_discount bigint default 0,
  p_notes text default null
)
returns table(invoice_id uuid, invoice_number text, subtotal bigint, discount_amount bigint, total_amount bigint)
language plpgsql
security invoker
set search_path = public
as $$
declare
  row_item jsonb;
  inv_id uuid;
  number text;
  subtotal_value bigint := 0;
  discount_value bigint := greatest(0,coalesce(p_discount,0));
  total_value bigint;
  qty integer;
  price bigint;
  line_total bigint;
  svc uuid;
  descr text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then
    raise exception 'invalid_invoice_items';
  end if;

  for row_item in select * from jsonb_array_elements(p_items) loop
    qty := greatest(1,coalesce((row_item->>'quantity')::integer,1));
    price := greatest(0,coalesce((row_item->>'unit_price')::bigint,0));
    line_total := qty * price;
    subtotal_value := subtotal_value + line_total;
  end loop;

  discount_value := least(discount_value,subtotal_value);
  total_value := subtotal_value-discount_value;
  if total_value <= 0 then raise exception 'invalid_invoice_total'; end if;

  number := public.next_business_document_number(p_business_id,'invoice');

  insert into public.business_invoices(
    business_id,customer_id,appointment_id,location_id,invoice_number,
    subtotal,discount_amount,total_amount,paid_amount,status,notes
  )
  values (
    p_business_id,p_customer_id,p_appointment_id,p_location_id,number,
    subtotal_value,discount_value,total_value,0,'issued',p_notes
  )
  returning id into inv_id;

  for row_item in select * from jsonb_array_elements(p_items) loop
    qty := greatest(1,coalesce((row_item->>'quantity')::integer,1));
    price := greatest(0,coalesce((row_item->>'unit_price')::bigint,0));
    svc := nullif(row_item->>'service_id','')::uuid;
    descr := coalesce(nullif(row_item->>'description',''),'خدمت');
    insert into public.business_invoice_items(
      invoice_id,service_id,description,quantity,unit_price,discount_amount,line_total
    )
    values (
      inv_id,svc,descr,qty,price,0,qty*price
    );
  end loop;

  return query select inv_id,number,subtotal_value,discount_value,total_value;
end;
$$;

revoke all on function public.create_business_invoice(uuid,uuid,uuid,uuid,jsonb,bigint,text) from public;
grant execute on function public.create_business_invoice(uuid,uuid,uuid,uuid,jsonb,bigint,text) to authenticated;

create or replace function public.record_business_quick_payment(
  p_business_id uuid,
  p_customer_id uuid,
  p_service_id uuid,
  p_appointment_id uuid,
  p_location_id uuid,
  p_amount bigint,
  p_method text,
  p_currency text default 'IRR',
  p_reference text default null,
  p_idempotency_key text default null
)
returns table(payment_id uuid, receipt_id uuid, receipt_number text, amount bigint, method text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  payment_id_value uuid;
  receipt_id_value uuid;
  receipt_number_value text;
  group_key text := coalesce(p_idempotency_key,gen_random_uuid()::text);
  already boolean;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_amount <= 0 then raise exception 'invalid_payment_amount'; end if;
  if p_method not in ('card_terminal','cash','transfer') then raise exception 'invalid_payment_method'; end if;

  select exists(select 1 from public.business_receipts where payment_group_key=group_key)
  into already;
  if already then
    select r.id,r.receipt_number into receipt_id_value,receipt_number_value
    from public.business_receipts r where r.payment_group_key=group_key;
    select p.id into payment_id_value
    from public.business_payments p where p.payment_group_key=group_key limit 1;
    return query select payment_id_value,receipt_id_value,receipt_number_value,p_amount,p_method;
    return;
  end if;

  insert into public.business_payments(
    business_id,customer_id,service_id,appointment_id,location_id,amount,method,status,idempotency_key,payment_group_key
  )
  values (
    p_business_id,p_customer_id,p_service_id,p_appointment_id,p_location_id,p_amount,p_method,'paid',
    p_idempotency_key,group_key
  )
  returning id into payment_id_value;

  receipt_number_value := public.next_business_receipt_number(p_business_id);
  insert into public.business_receipts(
    business_id,customer_id,receipt_number,payment_group_key,amount,currency,metadata
  )
  values (
    p_business_id,p_customer_id,receipt_number_value,group_key,p_amount,coalesce(p_currency,'IRR'),
    jsonb_build_object('payment_id',payment_id_value,'reference',p_reference)
  )
  returning id into receipt_id_value;

  return query select payment_id_value,receipt_id_value,receipt_number_value,p_amount,p_method;
end;
$$;

revoke all on function public.record_business_quick_payment(uuid,uuid,uuid,uuid,uuid,bigint,text,text,text,text) from public;
grant execute on function public.record_business_quick_payment(uuid,uuid,uuid,uuid,uuid,bigint,text,text,text,text) to authenticated;
