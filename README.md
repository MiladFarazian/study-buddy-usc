# StudyBuddy

A tutoring marketplace for USC students. Students find tutors by course, book and pay for sessions, and meet over Zoom. Tutors set availability, get paid through Stripe Connect, and build a profile from reviews. Admins moderate the whole thing.

Built by a five-person student team; I was CTO and lead engineer.

## What is in here

- **Frontend:** React 18 + TypeScript + Vite, Tailwind, shadcn/ui.
- **Backend:** Supabase (Postgres, Auth, Storage) with 39 Deno Edge Functions and 86 SQL migrations.
- **Payments:** Stripe Connect onboarding for tutors, checkout for students, webhook-driven booking state.
- **Scheduling:** tutor availability, booking, reschedule and cancel flows, Zoom meeting creation per session.
- **USC integration:** a course importer (`fetch-usc-courses`) so tutors and students match on real course codes.
- **Roles:** tutor, student, and admin, with reviews, badges, messaging, notifications, and referrals.

## How it was built, honestly

The first version was a hand-coded NestJS + Prisma + Next.js monorepo. After a month we scrapped it and rebuilt on Supabase using Lovable for the UI scaffolding, then hand-directed the parts that mattered: the data model, payments, scheduling, and the edge functions. That tradeoff bought a student team a working product in a semester. If you ask me about the build process in an interview, that is the answer you will get.

## Running it

```bash
npm install
# create .env with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and the Stripe publishable key
npm run dev
```

Edge functions live in `supabase/functions/`, migrations in `supabase/migrations/`.

## Platform branch: `feat/gateway-sso-a11y`

A later, hand-directed engineering pass on top of the product, kept on its own branch:

- **GraphQL gateway** (`supabase/functions/graphql/`): one typed graph over Postgres and Stripe Connect with per-request DataLoader batching and depth and complexity limits. A representative nested query went from 121 database round trips to 4, and the query count stays at 4 whether the result has 5 tutors or 60. 22 gateway tests. The gateway forwards the caller's JWT and holds no service-role key, so row-level security still applies.
- **OAuth 2.0 + PKCE and SAML 2.0 SSO** (`src/lib/auth/`, `supabase/functions/sso-admin/`): moved auth off the implicit flow; 40 tests including the RFC 7636 test vector.
- **Accessibility:** all 7 public routes went from failing axe-core to passing, checked in Playwright.

## Status

Built and functional. Development on this repo wound down in late 2025.
