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
