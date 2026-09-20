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
  m text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_slug), '') is null then
    raise exception 'invalid_business_identity';
  end if;

  insert into public.businesses(
    name,slug,business_type,mode,plan,status,owner_email,locale,timezone,currency
  ) values (
    trim(p_name),trim(p_slug),p_business_type,p_mode,coalesce(nullif(trim(p_plan),''),'Starter'),
    'Trial',nullif(trim(p_owner_email),''),coalesce(p_locale,'fa-IR'),coalesce(p_timezone,'Asia/Tehran'),coalesce(p_currency,'IRR')
  )
  returning * into b;

  foreach m in array array[
    'customers','appointments','catalog','staff','invoicing','payments','cashier',
    'ledger','inventory','reports','online_booking','notifications'
  ] loop
    insert into public.business_modules(
      business_id,module_id,state,enabled_at
    ) values (
      b.id,m,
      case when m in ('invoicing','ledger','inventory') then 'disabled' else 'enabled' end,
      case when m in ('invoicing','ledger','inventory') then null else now() end
    );
  end loop;

  insert into public.business_payment_methods(business_id,method,title,enabled,is_default)
  values
    (b.id,'card_terminal','کارتخوان',true,true),
    (b.id,'cash','نقدی',true,false),
    (b.id,'transfer','انتقال',true,false);

  insert into public.business_branding(business_id,theme_key,radius_scale)
  values (b.id,'elegant','comfortable');

  insert into public.business_working_hours(business_id,weekday,enabled,open_time,close_time)
  values
    (b.id,0,true,'09:00','21:00'),(b.id,1,true,'09:00','21:00'),(b.id,2,true,'09:00','21:00'),
    (b.id,3,true,'09:00','21:00'),(b.id,4,true,'09:00','21:00'),(b.id,5,true,'10:00','18:00'),
    (b.id,6,false,null,null);

  return b;
exception
  when unique_violation then
    raise exception 'business_slug_exists';
end;
$$;

revoke all on function public.create_business_workspace(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.create_business_workspace(text,text,text,text,text,text,text,text,text) to authenticated;


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
