# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Generate Prisma client + build Next.js
pnpm start        # Production server
pnpm lint         # ESLint
pnpm seed         # Seed database via Prisma
```

No test suite is currently configured.

After schema changes, regenerate the Prisma client:
```bash
pnpm prisma generate
pnpm prisma migrate dev --name <migration-name>
```

## Architecture

Full-stack Next.js 16 e-commerce app (App Router) for a Brazilian home goods/textiles retailer. All code lives under `src/`.

**Stack:**
- Framework: Next.js 16 with React Compiler enabled
- Styling: Tailwind CSS v4
- Database: PostgreSQL (Neon) via Prisma 5 — generated client at `src/generated/prisma`
- Auth: JWT in httpOnly cookie (`Suntecshed_token`, 7-day expiry, Argon2 passwords) — see `src/lib/auth.ts`
- File storage: Vercel Blob
- Payments: Asaas
- Shipping: Frenet + Melhor Envio
- WhatsApp: WAHA API
- AI: DeepSeek API
- Email: Nodemailer

**Path alias:** `@/*` → `./src/*`

## Key structural patterns

**Route protection** — `src/middleware.ts` redirects unauthenticated requests for `/minha-conta` and `/admin` to `/entrar`.

**Auth context** — `src/providers/` has separate providers for Auth, Cart, Favorites, Tracking, and React Query. All are composed in `src/app/layout.tsx`.

**API routes** live under `src/app/api/`:
- Public: `auth/`, `products/`, `categories/`, `brands/`, `reviews/`, `banners/`, `favorites/`, `orders/`, `tracking/`
- Admin (requires `ADMIN` role): `admin/` — covers products, categories, orders, clients, coupons, banners, blog, email/WhatsApp campaigns, dashboard reports, integrations, stock, training videos

**Admin role check** is done in `src/lib/admin-auth.ts`. All admin API routes call this before handling requests.

**Database schema** (`prisma/schema.prisma`, ~877 lines) key models: User (roles: ADMIN/CLIENT), Product (variants, images, categories, brands), Order (items, coupons, payment), Category (hierarchical), Coupon (percentage/fixed/free-shipping), Review, Favorite, AbandonedCart, Banner, Blog, Newsletter, Campaign (Email + WhatsApp), IntegrationSettings, Analytics (page views, product clicks).

**Admin UI** — `src/app/admin/` pages backed by hooks in `src/hooks/` that use TanStack Query for data fetching.

**UI components** — `src/components/ui/` wraps Radix UI primitives. Lucide React for icons, Framer Motion for animations, Zod for validation.

## Environment variables

All secrets are in `.env` (not committed). Required vars include: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, Asaas keys, Melhor Envio/Frenet keys, WAHA API config, DeepSeek API key, Nodemailer config, Vercel Blob token.
