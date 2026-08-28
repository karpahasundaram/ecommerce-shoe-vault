-- =============================================================================
-- shoe-vault — Supabase schema
-- Run this ENTIRE file in the Supabase Dashboard → SQL Editor (New query → paste → Run).
-- Safe to re-run: it uses "if not exists" / "drop policy if exists" throughout.
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum
      ('pending', 'paid', 'failed', 'cancelled', 'shipped', 'delivered');
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- Categories -----------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- Products -----------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  price       numeric(10,2) not null check (price >= 0),
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Product images -----------------------------------------------------------
create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url        text not null,
  alt        text,
  position   int  not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- Product variants (one row per size) ------------------------------------------
create table if not exists public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  size           text not null,                       -- e.g. 'UK 8'
  stock_quantity int  not null default 0 check (stock_quantity >= 0),
  sku            text,
  created_at     timestamptz not null default now(),
  unique (product_id, size)
);

-- Profiles (1:1 with auth.users) --------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  phone      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Saved shipping addresses -------------------------------------------------
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text,
  full_name   text not null,
  phone       text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  postal_code text not null,
  country     text not null default 'India',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Persistent cart --------------------------------------------------------------
create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity   int  not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

-- Orders -------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_no           bigint generated always as identity,
  user_id            uuid not null references auth.users(id) on delete restrict,
  status             public.order_status not null default 'pending',
  subtotal           numeric(10,2) not null,
  shipping_fee       numeric(10,2) not null default 0,
  total              numeric(10,2) not null,
  currency           text not null default 'INR',
  email              text not null,
  shipping_address   jsonb not null,
  razorpay_order_id  text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Order line items (immutable snapshots) -------------------------------------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid,
  variant_id   uuid,
  product_name text not null,
  size         text not null,
  unit_price   numeric(10,2) not null,
  quantity     int not null check (quantity > 0),
  image_url    text
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_products_category      on public.products(category_id);
create index if not exists idx_products_featured       on public.products(is_featured) where is_active;
create index if not exists idx_product_images_product  on public.product_images(product_id);
create index if not exists idx_product_variants_product on public.product_variants(product_id);
create index if not exists idx_cart_items_user         on public.cart_items(user_id);
create index if not exists idx_addresses_user          on public.addresses(user_id);
create index if not exists idx_orders_user             on public.orders(user_id);
create index if not exists idx_order_items_order        on public.order_items(order_id);

-- -----------------------------------------------------------------------------
-- Functions & triggers
-- -----------------------------------------------------------------------------

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- Auto-create a profile row for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Is the current user an admin? (used by RLS policies)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Create an order (pending) from the caller's cart.
-- Validates stock & recomputes every amount server-side. Does NOT decrement
-- stock or clear the cart — that happens only after payment is verified.
create or replace function public.create_order_from_cart(
  p_address_id uuid,
  p_email      text
)
returns table (order_id uuid, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_addr      public.addresses%rowtype;
  v_subtotal  numeric(10,2);
  v_shipping  numeric(10,2);
  v_total     numeric(10,2);
  v_order_id  uuid;
  r           record;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_addr
  from public.addresses
  where id = p_address_id and user_id = v_uid;

  if not found then
    raise exception 'Address not found';
  end if;

  -- Validate stock for every cart line
  for r in
    select ci.quantity, pv.stock_quantity, pv.size, p.name, p.price
    from public.cart_items ci
    join public.product_variants pv on pv.id = ci.variant_id
    join public.products p on p.id = pv.product_id
    where ci.user_id = v_uid
    for update of pv
  loop
    if r.quantity > r.stock_quantity then
      raise exception 'Insufficient stock for % (size %)', r.name, r.size;
    end if;
  end loop;

  select coalesce(sum(p.price * ci.quantity), 0) into v_subtotal
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  join public.products p on p.id = pv.product_id
  where ci.user_id = v_uid;

  if v_subtotal <= 0 then
    raise exception 'Cart is empty';
  end if;

  v_shipping := case when v_subtotal >= 2999 then 0 else 99 end;
  v_total    := v_subtotal + v_shipping;

  insert into public.orders (user_id, status, subtotal, shipping_fee, total, email, shipping_address)
  values (
    v_uid, 'pending', v_subtotal, v_shipping, v_total, p_email,
    jsonb_build_object(
      'full_name',   v_addr.full_name,
      'phone',       v_addr.phone,
      'line1',       v_addr.line1,
      'line2',       v_addr.line2,
      'city',        v_addr.city,
      'state',       v_addr.state,
      'postal_code', v_addr.postal_code,
      'country',     v_addr.country
    )
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, variant_id, product_name, size, unit_price, quantity, image_url)
  select
    v_order_id,
    p.id,
    pv.id,
    p.name,
    pv.size,
    p.price,
    ci.quantity,
    (select url from public.product_images pi
      where pi.product_id = p.id
      order by pi.is_primary desc, pi.position asc
      limit 1)
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  join public.products p on p.id = pv.product_id
  where ci.user_id = v_uid;

  return query select v_order_id, v_total;
end;
$$;

-- Mark an order paid: decrement stock, clear that user's cart. Idempotent.
-- Called server-side with the service-role key (verify route + webhook).
create or replace function public.mark_order_paid(
  p_order_id   uuid,
  p_payment_id text,
  p_signature  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status <> 'pending' then
    return;  -- already processed
  end if;

  update public.product_variants pv
  set stock_quantity = greatest(pv.stock_quantity - oi.quantity, 0)
  from public.order_items oi
  where oi.order_id = p_order_id and oi.variant_id = pv.id;

  delete from public.cart_items where user_id = v_order.user_id;

  update public.orders
  set status = 'paid',
      razorpay_payment_id = p_payment_id,
      razorpay_signature  = p_signature
  where id = p_order_id;
end;
$$;

grant execute on function public.create_order_from_cart(uuid, text) to authenticated;
grant execute on function public.mark_order_paid(uuid, text, text)  to service_role;
grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.profiles         enable row level security;
alter table public.addresses        enable row level security;
alter table public.cart_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- Catalog: readable by everyone, writable only by admins ----------------------
drop policy if exists "categories_read"  on public.categories;
create policy "categories_read" on public.categories
  for select using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select using (is_active or public.is_admin());
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "product_images_read" on public.product_images;
create policy "product_images_read" on public.product_images
  for select using (true);
drop policy if exists "product_images_admin_write" on public.product_images;
create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "product_variants_read" on public.product_variants;
create policy "product_variants_read" on public.product_variants
  for select using (true);
drop policy if exists "product_variants_admin_write" on public.product_variants;
create policy "product_variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- Profiles ---------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Addresses: full CRUD for the owner ----------------------------------------
drop policy if exists "addresses_owner_all" on public.addresses;
create policy "addresses_owner_all" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cart: full CRUD for the owner -------------------------------------------------
drop policy if exists "cart_items_owner_all" on public.cart_items;
create policy "cart_items_owner_all" on public.cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Orders: readable by owner or admin; writes go through SECURITY DEFINER fns --
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- -----------------------------------------------------------------------------
-- Storage bucket for product images
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- =============================================================================
-- Done. Next: run `npm run seed` locally to upload images + insert 6 products,
-- then promote your user to admin:
--   update public.profiles set is_admin = true where id = '<your-auth-user-id>';
-- =============================================================================
