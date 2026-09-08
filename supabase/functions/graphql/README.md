# GraphQL gateway

One typed endpoint over the tutoring database (Postgres, via PostgREST) and
Stripe Connect, with DataLoader batching so nested queries do not fan out into
N+1 round trips.

```
POST /functions/v1/graphql
{ "query": "...", "variables": { ... } }
```

## Why a gateway

A tutor profile screen needs the tutor, their profile row, their courses, their
badges, their reviews, and the name of every reviewer. Over REST that is a
waterfall the client orchestrates by hand, and the review authors are a classic
N+1: one request per reviewer.

The same screen here is one request. The gateway resolves the graph server-side
and batches every hop.

## Layout

| File | Role |
|---|---|
| `index.ts` | HTTP entry: CORS, parse, validate, execute |
| `schema.ts` | SDL |
| `resolvers.ts` | Field resolvers — all entity hops go through loaders |
| `loaders.ts` | DataLoader definitions **(the interesting part)** |
| `context.ts` | Per-request context: viewer, sources, loaders |
| `executable.ts` | Minimal SDL + resolver-map binder |
| `security.ts` | Depth limit, complexity limit, introspection gate |
| `sources/postgrest.ts` | Batched Postgres reads (`WHERE col IN (...)`) |
| `sources/stripe.ts` | Stripe Connect, concurrency-capped |
| `tests/` | Deno tests |

## The three DataLoader rules

Breaking any of these produces bugs that are hard to trace, so they are stated
in `loaders.ts` and enforced by tests.

**1. Loaders are per-request.** `createLoaders` is called from `createContext`,
once per HTTP request. A loader at module scope is a cache that outlives the
request: it would serve one user's rows to the next caller. That is a
cross-tenant data leak, not a stale read. Test: *"loaders are per-request:
separate contexts share no cache"*.

**2. A batch function returns one entry per key, in key order.** `WHERE id IN
(...)` returns rows in whatever order Postgres chooses and silently omits rows
that do not exist or that RLS hides. Every batch function re-indexes into a Map
and maps back over `keys`. Returning raw rows shifts results onto the wrong
keys — the kind of bug that shows one student another's session. Tests:
*"results are returned in key order"*, *"a missing key yields null without
shifting its neighbours"*.

**3. A miss is `null`, or `[]` for list loaders — never a dropped element.**
DataLoader rejects a batch whose result length differs from its key length.

## Measured effect

From `tests/schema_test.ts`, executing against the real schema:

```graphql
{ tutors(first: 20) {
    nodes { id displayName
            reviews(first: 5) { rating reviewer { id displayName } } } } }
```

| | Round trips |
|---|---|
| Unbatched | 1 + 20 + 100 = **121** |
| Batched | profiles, tutors, reviews, reviewer-profiles = **4** |

And it stays at 4 as the result set grows — the test asserts that 5 tutors and
60 tutors issue the same number of queries. Priming helps too: the list resolver
seeds the profile cache with rows it already read, so `tutors { profile { … } }`
costs two queries rather than three.

Every response carries the real numbers, so a regression is visible without
reading code:

```
x-gateway-db-queries: 4
x-gateway-stripe-requests: 0
x-gateway-duration-ms: 38
```

### Stripe is different, deliberately

Stripe has no batch "get many accounts" endpoint, so batching cannot collapse
into one round trip. DataLoader still earns its place: it de-duplicates ids
within a request and caps concurrency, so a query touching 50 tutors issues at
most 6 concurrent calls instead of 50 — and zero for ids already seen.

## Security

**Row-level security still applies.** The gateway holds no service-role key. It
builds a Supabase client per request carrying the caller's JWT, so a batched
query returns only rows that caller could have read directly. The JWT is
verified through Supabase Auth rather than decoded locally — an unverified `sub`
claim is an authorization bypass, since anyone can mint an unsigned JWT.

**Stripe is not covered by RLS**, so `Tutor.payoutAccount` checks ownership in
the resolver and returns null otherwise. The test asserts Stripe is not called
at all for a non-owner, not merely that the field is null.

**Depth limit** (8): rejects unbounded nesting. Fragments are followed, so depth
cannot be hidden inside a fragment definition.

**Complexity limit** (1000): cost is multiplicative, so a list field multiplies
everything inside it by its page size. `tutors(first: 100) { reviews(first: 100) }`
scores 10,000 and is refused even though it is only three levels deep. A
variable page size is scored at the cap rather than as 1.

**Introspection** is off unless `GRAPHQL_ALLOW_INTROSPECTION=true`.

Validation runs *before* the context is built, so an over-budget query never
opens a database client.

## Client

```ts
import { useTutorDirectory } from "@/hooks/useTutorDirectory";

const { tutors, totalCount, loading, error } = useTutorDirectory({
  filter: { department: "CSCI", availableOnline: true },
  pageSize: 20,
});
```

- `src/lib/graphql/client.ts` — fetch wrapper; attaches the access token and
  treats a 200-with-`errors` as the failure it is.
- `src/lib/graphql/operations.ts` — documents and result types.
- `src/hooks/useGraphQLQuery.ts` — generic hook; aborts in-flight requests when
  inputs change and never sets state after unmount.

Result types are hand-written to match `schema.ts`. Keep them in step — the
gateway tests will not catch a drift on the client side.

## Running

```bash
npm run test:gateway                    # 22 Deno tests
supabase functions serve graphql        # local
supabase functions deploy graphql       # deploy
```

Environment: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (both injected by the platform),
optional `STRIPE_SECRET_KEY` (payout fields resolve to null without it), optional
`GRAPHQL_ALLOW_INTROSPECTION`.

## Adding a field

1. Declare it in `schema.ts`.
2. Add a resolver in `resolvers.ts`. **If it crosses an entity boundary, it must
   go through a loader** — a resolver runs once per parent object, so a direct
   query there is an N+1 by construction.
3. If it needs a new access path, add a loader in `loaders.ts` following the
   three rules above.
4. Add a query-count assertion. `executable.ts` throws at boot if a resolver
   names a field the schema does not declare, so a rename fails fast.
