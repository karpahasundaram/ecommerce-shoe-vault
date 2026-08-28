# shoe-vault — Setup Guide

Everything you need to do to get this store running locally and deployed.
Follow the sections in order. Estimated time: ~30 minutes.

- **Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + Storage) · Razorpay · Resend · Tailwind CSS v4
- **Deploy target:** Vercel

---

## 0. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 or newer (24 recommended) | `node -v` |
| npm | 10+ | ships with Node |
| A Supabase account | — | https://supabase.com (free tier is fine) |
| A Razorpay account | — | https://razorpay.com (Indian business/PAN needed for live mode; test mode works immediately) |
| A Resend account | — | https://resend.com (free tier is fine) |

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Create your Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Name it `shoe-vault`, pick a strong database password (save it somewhere), choose a region close to your customers (e.g. **Mumbai / ap-south-1**).
3. Wait ~2 minutes for it to provision.

### 2a. Run the database schema

1. In the project, open **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy the **entire** file, paste it in, and click **Run**.
3. You should see `Success. No rows returned`. This creates every table, index, function, trigger, all Row Level Security policies, **and** the `product-images` storage bucket.

The full script is also reproduced at the end of this file (see [Appendix A](#appendix-a-full-sql-schema)).

### 2b. Get your Supabase keys

Open **Project Settings** (gear icon):

| Value | Where | Env var |
|---|---|---|
| Project URL | Settings → **Data API** → Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` public key | Settings → **API Keys** → `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` secret key | Settings → **API Keys** → `service_role` (click *Reveal*) | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The `service_role` key bypasses all security rules. Keep it server-side only. Never expose it in the browser or commit it.

### 2c. Auth settings (recommended for local testing)

- **Authentication → Sign In / Providers → Email**: make sure **Email** is enabled.
- To skip the confirmation email while developing, turn **Confirm email** *off*. You can turn it back on for production.
- **Authentication → URL Configuration**:
  - **Site URL**: `http://localhost:3000` (change to your Vercel URL in production)
  - **Redirect URLs**: add `http://localhost:3000/**` (and later `https://your-app.vercel.app/**`)

---

## 3. Create your Razorpay account & keys

1. Sign up at https://dashboard.razorpay.com.
2. Keep the dashboard in **Test Mode** (toggle, top-left) for now.
3. **Settings → API Keys → Generate Test Key**. Copy:
   - **Key Id** → `NEXT_PUBLIC_RAZORPAY_KEY_ID` **and** `RAZORPAY_KEY_ID` (same value). Starts with `rzp_test_`.
   - **Key Secret** → `RAZORPAY_KEY_SECRET`. This is a **separate ~24-character string with NO `rzp_` prefix**, shown **only once** in a popup right after you generate the key.

   > ⚠️ Do **not** put the Key Id in `RAZORPAY_KEY_SECRET` — they are different values. If you closed the popup without copying the secret, click **Regenerate Test Key** to get a fresh Id + Secret pair (the old pair stops working). A wrong secret shows up as a "payment error" at checkout (Razorpay returns `401 Authentication failed`).
4. **Settings → Webhooks → Add New Webhook**:
   - **Webhook URL** (local testing): you need a public tunnel to `localhost`. Options:
     - Deploy to Vercel first and use `https://your-app.vercel.app/api/webhooks/razorpay`, **or**
     - run `npx localtunnel --port 3000` / use `ngrok http 3000` and point the webhook at `https://<tunnel>/api/webhooks/razorpay`.
   - **Active events**: check `payment.captured` and `payment.failed`.
   - **Secret**: type any strong random string → this is your `RAZORPAY_WEBHOOK_SECRET`.
   - Save.

> The webhook is a **backup** confirmation path. The primary confirmation happens in the browser via `/api/checkout/verify`, so payments still work end-to-end without a webhook during local testing — you just won't get the server-side safety net.

---

## 4. Create your Resend account & key

1. Sign up at https://resend.com.
2. **API Keys → Create API Key** → copy it → `RESEND_API_KEY`.
3. Sender address → `EMAIL_FROM`:
   - Quick start: use `shoe-vault <onboarding@resend.dev>` (works immediately, only delivers to the email you signed up with).
   - Production: **Domains → Add Domain**, add the DNS records Resend gives you, then use `shoe-vault <orders@yourdomain.com>`.

---

## 5. Create `.env.local`

Copy the template and fill in everything from steps 2–4:

```bash
cp .env.example .env.local
```

```dotenv
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co   # step 2b
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...                      # step 2b
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...                          # step 2b (secret)

# --- Razorpay ---
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx                    # step 3 (Key Id)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx                                # step 3 (same Key Id)
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx                         # step 3 (Key Secret)
RAZORPAY_WEBHOOK_SECRET=your-random-string                       # step 3 (Webhook secret)

# --- Resend ---
RESEND_API_KEY=re_xxxxxxxx                                       # step 4
EMAIL_FROM=shoe-vault <onboarding@resend.dev>                    # step 4

# --- App ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000                       # no trailing slash
```

---

## 6. Seed the catalog

This uploads the 6 sample images in [`images/`](images/) to Supabase Storage and inserts
3 Sneakers + 3 Running Shoes, each with **UK 6–12** size variants and stock.

```bash
npm run seed
```

Re-running it is safe (it upserts by product slug).

---

## 7. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

### 7a. Make yourself an admin

1. In the app, **Sign up** with your email + password (`/signup`).
2. In Supabase → **SQL Editor**, find your user id:
   ```sql
   select id, email from auth.users;
   ```
3. Promote yourself:
   ```sql
   update public.profiles set is_admin = true where id = '<your-auth-user-id>';
   ```
4. Reload the app — an **Admin** link now appears in the account menu (`/admin`).

---

## 8. Test the full purchase flow (Razorpay test mode)

1. Log in, open a product, pick a size, **Add to cart**.
2. Go to **Cart → Proceed to checkout**.
3. Add a shipping address, then **Pay with Razorpay**.
4. In the Razorpay test popup use:
   - **Card:** `4111 1111 1111 1111`, any future expiry, any CVV, any name. OTP: `1234` (or any).
   - or **UPI:** `success@razorpay`
5. You should land on **Order confirmed**, receive a confirmation email (check the Resend dashboard → Emails), and see the order under **Account → Orders**.
6. Back-office checks:
   - `select status, total, razorpay_payment_id from public.orders order by created_at desc limit 1;` → `status = paid`.
   - The purchased size's `stock_quantity` in `product_variants` has decreased.
   - Your `cart_items` are cleared.

**Negative test:** if signature verification fails, the order is marked `failed` and stock is **not** touched.

---

## 9. Managing products after launch

Everything is done from **`/admin`** (no SQL required):

- **Add a product:** `/admin → New product`. Fill in name (slug auto-fills), category, price (₹), description, active/featured toggles, and stock per UK size (leave a size blank to not offer it). Save.
- **Add images:** after saving you're taken to the edit screen. Use the **Images** panel to upload one or more photos (max 5 MB each), set the **Primary** image, or delete images. Uploads go to the `product-images` Storage bucket.
- **Edit / hide / delete:** open any product from the `/admin` table. Un-checking **Active** hides it from the store without deleting it.
- **Replace the sample images with real ones:** open each seeded product in `/admin`, delete the sample image, upload your real photos.

Prefer SQL? You can also edit rows directly in Supabase → **Table Editor** (`products`, `product_variants`, `product_images`).

---

## 10. Deploy to Vercel

1. Push this repo to GitHub (already at `github.com/karpahasundaram/ecommerce-shoe-vault` if the build handoff completed).
2. https://vercel.com/new → **Import** the repo. Framework preset: **Next.js** (auto-detected). No build-command changes needed.
3. **Environment Variables** — add every variable from your `.env.local`, with one change:
   - `NEXT_PUBLIC_SITE_URL=https://<your-project>.vercel.app` (your real domain, no trailing slash)
4. **Deploy.**
5. After the first deploy:
   - **Supabase → Authentication → URL Configuration:** set **Site URL** to your Vercel URL and add `https://<your-project>.vercel.app/**` to **Redirect URLs**.
   - **Razorpay → Settings → Webhooks:** edit the webhook URL to `https://<your-project>.vercel.app/api/webhooks/razorpay`.
6. Redeploy if you changed env vars after the first build.

---

## 11. Switching Razorpay from Test to Live

Do this only once your Razorpay account is **activated** (KYC / business details approved).

1. Razorpay Dashboard → switch the toggle to **Live Mode**.
2. **Settings → API Keys → Generate Live Key.** Copy the live Key Id and Key Secret.
3. **Settings → Webhooks** (Live Mode) → create the webhook again against your production URL (`.../api/webhooks/razorpay`), events `payment.captured` + `payment.failed`, with a fresh secret.
4. In **Vercel → Project → Settings → Environment Variables**, update:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` → `rzp_live_...`
   - `RAZORPAY_KEY_ID` → `rzp_live_...`
   - `RAZORPAY_KEY_SECRET` → live secret
   - `RAZORPAY_WEBHOOK_SECRET` → live webhook secret
5. **Redeploy.** Do a small real transaction to confirm, then refund it from the Razorpay dashboard.

Keep your **test** keys in a separate Vercel *Preview*/local environment so you can keep testing safely.

---

## Environment variables reference

| Variable | Public? | Source | Used for |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Settings → Data API | All DB/Auth/Storage calls |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase → Settings → API Keys | Browser + server Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | Supabase → Settings → API Keys | Payment verification, webhook, admin image writes |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | yes | Razorpay → API Keys | Opening Razorpay Checkout in the browser |
| `RAZORPAY_KEY_ID` | **no** | Razorpay → API Keys | Creating Razorpay orders server-side |
| `RAZORPAY_KEY_SECRET` | **no** | Razorpay → API Keys | Signing / verifying payment signatures |
| `RAZORPAY_WEBHOOK_SECRET` | **no** | Razorpay → Webhooks | Verifying webhook authenticity |
| `RESEND_API_KEY` | **no** | Resend → API Keys | Sending order confirmation emails |
| `EMAIL_FROM` | **no** | Resend (verified sender) | "From" address on emails |
| `NEXT_PUBLIC_SITE_URL` | yes | You | Absolute URLs in emails + auth redirects |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing environment variable: …` on `npm run dev`/`build` | That var is absent from `.env.local`. Add it. |
| Sign-up "check your email" but no email arrives | Turn off **Confirm email** in Supabase Auth for testing, or check spam. |
| Deployed store is **empty** — no products, `/category/*` returns 404 | `supabase/schema.sql` was never run on the project the deployment points at. Run it (step 2a), then `npm run seed`. Server logs show `PGRST205 Could not find the table …`. |
| Images don't render | Confirm the `product-images` bucket exists and is **public** (schema.sql creates it). `next.config.ts` already allows `*.supabase.co`. If a URL opens fine directly but not on the page, it's a browser cache — hard-refresh (`Cmd/Ctrl+Shift+R`) or use a private window. |
| "Admins only" on `/admin` | You didn't run the `update ... set is_admin = true` step, or you're logged in as a different user. |
| **"Payment error" at checkout** / Razorpay `401 Authentication failed` in the logs | `RAZORPAY_KEY_SECRET` is wrong — usually the **Key Id was pasted into it**. The secret has no `rzp_` prefix and is shown only once; regenerate the key if you lost it. Set the matching Id + Secret in `.env.local` **and** on Vercel, then redeploy. |
| Checkout says "Checkout function is missing" | `supabase/schema.sql` was only partially applied — re-run the whole file (it is idempotent). |
| Confirmation / invite email links point to **`http://localhost:3000`** (or `otp_expired`) | `NEXT_PUBLIC_SITE_URL` on Vercel is still `http://localhost:3000`, and/or Supabase → Authentication → **URL Configuration → Site URL** is still localhost. Set both to `https://<your-app>.vercel.app`, add `https://<your-app>.vercel.app/**` to **Redirect URLs**, redeploy, then request a fresh email. |
| Payment succeeds but order stays `pending` | The browser didn't reach `/api/checkout/verify` (closed tab too fast). The webhook will reconcile it if configured; otherwise it stays pending. |
| `npm run seed` fails with "Missing …" | `.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. |
| Seed fails on upload | Run `supabase/schema.sql` first so the bucket + policies exist. |
| `.env.example` keeps disappearing locally | A dotenv / secret-scanning editor extension or security tool on your machine deletes files matching `.env*`. It is only a template (no secrets). Restore with `git checkout .env.example`, and avoid `git add -A` while it is missing. |

---

## Appendix A: full SQL schema

The authoritative copy is [`supabase/schema.sql`](supabase/schema.sql) — it and the block
below are identical. Paste it into the Supabase SQL Editor and run it. Idempotent (safe to re-run).

```sql
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
do $
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum
      ('pending', 'paid', 'failed', 'cancelled', 'shipped', 'delivered');
  end if;
end
$;

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
as $
begin
  new.updated_at = now();
  return new;
end;
$;

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
as $
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$;

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
as $
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$;

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
as $
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
$;

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
as $
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
$;

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
```
