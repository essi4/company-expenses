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
