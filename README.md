# shoe-vault

A clean, minimal e-commerce store for sneakers and running shoes.
White + red theme, mobile-first, fully responsive.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4**
- **Supabase** — Postgres, Auth, Storage
- **Razorpay** — payments (test + live)
- **Resend** — order confirmation emails
- **Vercel** — deployment

## Features

- Landing page — hero, value props, category showcase, featured products
- Browse all products or by category (Sneakers / Running Shoes) with price + size filters and sorting
- Product detail — image gallery, UK 6–12 size selector with per-size stock, quantity, add to cart
- Persistent cart (saved to the user's account)
- Email + password auth via Supabase; protected routes via `src/proxy.ts`
- Checkout with saved addresses → Razorpay → server-side signature verification → confirmation email
- Order history and order detail pages
- Admin area (`/admin`, gated by `profiles.is_admin`) — create/edit/delete products, manage size stock, upload product images
- Row Level Security on every table

## Getting started

See **[SETUP.md](SETUP.md)** for the full walkthrough (Supabase project, SQL schema, Razorpay,
Resend, env vars, seeding, deployment, going live).

Quick version:

```bash
npm install
cp .env.example .env.local     # then fill in real values — see SETUP.md
# run supabase/schema.sql in the Supabase SQL editor
npm run seed                   # uploads sample images + inserts 6 products
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed categories, products and size variants |

## Project layout

```
src/
  app/            Routes (App Router) + API route handlers under app/api
  actions/        Server Actions (cart, addresses, profile, admin)
  components/     UI + feature components
  lib/            supabase clients, queries, auth helpers, razorpay, email, validation
  proxy.ts        Session refresh + route guards (Next 16's renamed middleware)
supabase/
  schema.sql      Tables, indexes, functions, triggers, RLS, storage policies
scripts/
  seed.mjs        Catalog seeder
images/           Sample product images used by the seeder
```

## Payment flow

1. `POST /api/checkout/create-order` — `create_order_from_cart()` builds a `pending` order and
   recomputes every amount in the database; a Razorpay order is created for that total.
2. Razorpay Checkout opens in the browser.
3. `POST /api/checkout/verify` — verifies `HMAC_SHA256(order_id|payment_id, key_secret)`, then
   `mark_order_paid()` decrements stock, clears the cart and sets `status = paid`; the
   confirmation email is sent.
4. `POST /api/webhooks/razorpay` — idempotent server-side backstop for `payment.captured` /
   `payment.failed`.
