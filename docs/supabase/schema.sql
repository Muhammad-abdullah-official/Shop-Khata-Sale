-- =============================================================
--  Shop Manager — Supabase schema
--  Run this once in: Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- ---------- ENUMS ----------
create type app_role       as enum ('owner', 'staff', 'customer');
create type payment_method as enum ('manual_transfer', 'cod', 'udhaar', 'card_gateway');
create type payment_status as enum ('pending', 'paid', 'partial', 'udhaar', 'refunded');
create type order_status   as enum ('pending', 'confirmed', 'delivered', 'cancelled');
create type order_type     as enum ('online', 'counter');
create type ledger_type    as enum ('debit', 'credit');

-- ---------- PROFILES (1:1 with auth.users) ----------
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null default '',
  email      text not null default '',
  phone      text not null default '',
  address    text not null default '',
  role       app_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- Role helpers. SECURITY DEFINER + fixed search_path avoids RLS recursion.
create or replace function public.auth_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() = 'owner', false)
$$;

create or replace function public.is_staff_or_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('owner', 'staff'), false)
$$;

-- ---------- CORE TABLES ----------
create table public.vendors (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact_person  text not null default '',
  phone           text not null default '',
  address         text not null default '',
  total_purchased numeric(12,2) not null default 0,
  total_paid      numeric(12,2) not null default 0,
  balance         numeric(12,2) generated always as (total_purchased - total_paid) stored,
  created_at      timestamptz not null default now()
);

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null default 'Other',
  cost_price    numeric(12,2) not null default 0,
  sale_price    numeric(12,2) not null default 0,
  stock_qty     numeric(12,2) not null default 0,
  reorder_level numeric(12,2) not null default 0,
  unit          text not null default 'pcs',
  min_order     numeric(12,2) not null default 1,
  max_order     numeric(12,2) not null default 10,
  step          numeric(12,2) not null default 1,
  image_url     text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Customers may exist WITHOUT a login (walk-in). When a customer registers,
-- customers.id is set to their auth.uid() so udhaar/orders stay linked.
create table public.customers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  phone          text not null default '',
  address        text not null default '',
  joined_date    date not null default current_date,
  udhaar_balance numeric(12,2) not null default 0,
  total_orders   integer not null default 0,
  created_at     timestamptz not null default now()
);

-- Employees may exist without a login too; id = auth.uid() when they have one.
create table public.employees (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phone           text not null default '',
  monthly_salary  numeric(12,2) not null default 0,
  paid_this_month numeric(12,2) not null default 0,
  join_date       date not null default current_date,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Human-readable order codes: ORD-1043, ORD-1044, ...
create sequence public.order_seq start 1043;

create table public.orders (
  id               text primary key default ('ORD-' || nextval('public.order_seq')),
  customer_id      uuid references public.customers(id) on delete set null,
  customer_name    text not null,
  type             order_type not null default 'online',
  date             date not null default current_date,
  total            numeric(12,2) not null default 0,
  payment_method   payment_method not null,
  payment_status   payment_status not null default 'pending',
  order_status     order_status not null default 'pending',
  delivery_address text not null default '',
  payment_proof_url text,
  cancel_requested boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     text not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  qty          numeric(12,2) not null,
  sale_price   numeric(12,2) not null,
  subtotal     numeric(12,2) not null
);

create table public.ledger (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references public.customers(id) on delete cascade,
  customer_name text not null,
  type          ledger_type not null,
  amount        numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  date          date not null default current_date,
  note          text not null default '',
  created_at    timestamptz not null default now()
);

create table public.activity (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid,
  actor_name text not null,
  actor_role app_role not null,
  action     text not null,
  detail     text not null default '',
  icon       text not null default 'clock',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null default '',
  icon       text not null default 'bell',
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index on public.orders (customer_id);
create index on public.orders (order_status);
create index on public.orders (date desc);
create index on public.order_items (order_id);
create index on public.ledger (customer_id);
create index on public.products (is_published);
create index on public.activity (actor_id);
create index on public.activity (created_at desc);

-- ---------- NEW USER → profile (+ customer row) ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role app_role := coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'customer');
begin
  insert into public.profiles (id, name, email, phone, address, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address', ''),
    v_role
  );

  -- keep customers.id == auth.uid() so udhaar/orders link up
  if v_role = 'customer' then
    insert into public.customers (id, name, phone, address)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', ''),
      coalesce(new.raw_user_meta_data ->> 'phone', ''),
      coalesce(new.raw_user_meta_data ->> 'address', '')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =============================================================
--  ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles      enable row level security;
alter table public.vendors       enable row level security;
alter table public.products      enable row level security;
alter table public.customers     enable row level security;
alter table public.employees     enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.ledger        enable row level security;
alter table public.activity      enable row level security;
alter table public.notifications enable row level security;

-- profiles: read own; staff/owner read all; update own
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_staff_or_owner());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_owner());

-- products: everyone can read published; owner manages
create policy products_select on public.products for select
  using (is_published or public.is_staff_or_owner());
create policy products_write on public.products for all
  using (public.is_owner()) with check (public.is_owner());

-- vendors / employees: owner only
create policy vendors_all on public.vendors for all
  using (public.is_owner()) with check (public.is_owner());
create policy employees_all on public.employees for all
  using (public.is_owner()) with check (public.is_owner());

-- customers: staff/owner see all; a customer sees only their own row
create policy customers_select on public.customers for select
  using (public.is_staff_or_owner() or id = auth.uid());
create policy customers_write on public.customers for all
  using (public.is_owner()) with check (public.is_owner());

-- orders: staff/owner all; customer only their own
create policy orders_select on public.orders for select
  using (public.is_staff_or_owner() or customer_id = auth.uid());
create policy orders_insert on public.orders for insert
  with check (public.is_staff_or_owner() or customer_id = auth.uid());
create policy orders_update on public.orders for update
  using (public.is_staff_or_owner() or customer_id = auth.uid());
create policy orders_delete on public.orders for delete
  using (public.is_owner());

-- order_items: visible if the parent order is visible
create policy order_items_select on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (public.is_staff_or_owner() or o.customer_id = auth.uid())
  ));
create policy order_items_insert on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id and (public.is_staff_or_owner() or o.customer_id = auth.uid())
  ));

-- ledger: staff/owner all; customer reads own
create policy ledger_select on public.ledger for select
  using (public.is_staff_or_owner() or customer_id = auth.uid());
create policy ledger_write on public.ledger for all
  using (public.is_staff_or_owner()) with check (public.is_staff_or_owner());

-- activity: staff/owner read; any authenticated user can write their own line
create policy activity_select on public.activity for select
  using (public.is_staff_or_owner());
create policy activity_insert on public.activity for insert
  with check (auth.uid() is not null);

-- notifications: staff/owner read + update; anyone authenticated can create
create policy notifications_select on public.notifications for select
  using (public.is_staff_or_owner());
create policy notifications_update on public.notifications for update
  using (public.is_staff_or_owner());
create policy notifications_insert on public.notifications for insert
  with check (auth.uid() is not null);
create policy notifications_delete on public.notifications for delete
  using (public.is_staff_or_owner());

-- =============================================================
--  ATOMIC HELPERS (RPC)
--  Increments must happen in the DB, not by read-modify-write in JS,
--  otherwise two concurrent actions can lose an update.
-- =============================================================
create or replace function public.adjust_stock(p_id uuid, p_delta numeric)
returns void language sql security invoker as $$
  update public.products set stock_qty = stock_qty + p_delta where id = p_id;
$$;

create or replace function public.adjust_customer_udhaar(
  c_id uuid, p_delta numeric, p_orders_delta integer default 0
) returns void language sql security invoker as $$
  update public.customers
     set udhaar_balance = greatest(0, udhaar_balance + p_delta),
         total_orders   = total_orders + p_orders_delta
   where id = c_id;
$$;

create or replace function public.adjust_vendor(
  v_id uuid, purchased_delta numeric default 0, paid_delta numeric default 0
) returns void language sql security invoker as $$
  update public.vendors
     set total_purchased = total_purchased + purchased_delta,
         total_paid      = total_paid + paid_delta
   where id = v_id;
$$;

create or replace function public.pay_employee_salary(e_id uuid, amount numeric)
returns void language sql security invoker as $$
  update public.employees
     set paid_this_month = least(monthly_salary, paid_this_month + amount)
   where id = e_id;
$$;

-- =============================================================
--  STORAGE (free tier: 1 GB)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- product images: public read, owner writes
create policy product_images_read on storage.objects for select
  using (bucket_id = 'product-images');
create policy product_images_write on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_owner());
create policy product_images_delete on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_owner());

-- payment proofs: any authenticated user uploads; staff/owner read
create policy payment_proofs_insert on storage.objects for insert
  with check (bucket_id = 'payment-proofs' and auth.uid() is not null);
create policy payment_proofs_read on storage.objects for select
  using (bucket_id = 'payment-proofs' and public.is_staff_or_owner());

-- =============================================================
--  REALTIME (free tier: 200 connections, 2M messages/month)
-- =============================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
