/**
 * End-to-end execution against the real schema and resolvers.
 *
 * `loaders_test.ts` proves the loaders batch when called directly. These tests
 * prove the resolvers actually go through them — the failure mode being a
 * resolver that quietly queries the data source itself and reintroduces the
 * N+1 the loaders exist to prevent.
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { execute, parse, specifiedRules, validate } from "graphql";
import { typeDefs } from "../schema.ts";
import { resolvers } from "../resolvers.ts";
import { makeExecutableSchema } from "../executable.ts";
import { createTestContext } from "../context.ts";
import { complexityLimit, depthLimit, noIntrospection } from "../security.ts";
import {
  FakeDataSource,
  FakePayoutSource,
  makeProfile,
  makeReview,
  makeTutor,
} from "./fakes.ts";

const schema = makeExecutableSchema(typeDefs, resolvers);

/** 20 tutors, 5 reviews each, every review by one of 10 distinct students. */
function buildDirectory(tutorCount = 20, reviewsPerTutor = 5) {
  const tutorIds = Array.from({ length: tutorCount }, (_, i) => `tutor-${i}`);
  const studentIds = Array.from({ length: 10 }, (_, i) => `student-${i}`);

  const profiles = [
    ...tutorIds.map((id) => makeProfile(id)),
    ...studentIds.map((id) =>
      makeProfile(id, { approved_tutor: false, role: "student" })
    ),
  ];

  const reviews = tutorIds.flatMap((tutorId, t) =>
    Array.from({ length: reviewsPerTutor }, (_, r) =>
      makeReview(
        `review-${t}-${r}`,
        tutorId,
        studentIds[(t + r) % studentIds.length],
      ))
  );

  return new FakeDataSource({
    profiles,
    tutors: tutorIds.map((id) => makeTutor(id)),
    reviews,
  });
}

async function run(
  query: string,
  db: FakeDataSource,
  viewer: { id: string; email: string | null } | null = null,
  payouts = new FakePayoutSource(),
) {
  const context = createTestContext(db, payouts, viewer);
  const document = parse(query);

  const errors = validate(schema, document, [
    ...specifiedRules,
    depthLimit(),
    complexityLimit(),
  ]);
  assertEquals(errors.map((e) => e.message), [], "query failed validation");

  const result = await execute({ schema, document, contextValue: context });
  assertEquals(
    result.errors?.map((e) => e.message) ?? [],
    [],
    "execution reported errors",
  );
  return result;
}

Deno.test("a nested list query stays at a constant number of queries", async () => {
  const db = buildDirectory(20, 5);

  const result = await run(
    `{
      tutors(first: 20) {
        totalCount
        nodes {
          id
          displayName
          reviews(first: 5) {
            rating
            reviewer { id displayName }
          }
        }
      }
    }`,
    db,
  );

  // Unbatched this is 1 (tutors) + 20 (reviews) + 100 (reviewers) = 121.
  // Batched: profiles, tutors, reviews, reviewer-profiles = 4.
  assertEquals(
    db.queryCount,
    4,
    `expected 4 round trips, got ${db.queryCount}: ${
      JSON.stringify(db.calls.map((c) => `${c.table}.${c.column ?? "*"}`))
    }`,
  );

  // deno-lint-ignore no-explicit-any
  const page = result.data?.tutors as any;
  assertEquals(page.totalCount, 20);
  assertEquals(page.nodes.length, 20);
  assertEquals(page.nodes[0].reviews.length, 5);
  assert(page.nodes[0].reviews[0].reviewer.displayName.length > 0);
});

Deno.test("query count does not grow with result size", async () => {
  // Sized to stay inside the complexity budget: 60 x (1 + 1 + 3x2) = 480.
  const query = `{
    tutors(first: 60) {
      nodes { id reviews(first: 3) { reviewer { id } } }
    }
  }`;

  const small = buildDirectory(5, 5);
  const large = buildDirectory(60, 5);

  await run(query, small);
  await run(query, large);

  // 12x the rows, same number of round trips. That is the whole point.
  assertEquals(small.queryCount, large.queryCount);
  assertEquals(large.queryCount, 4);
});

Deno.test("the tutors list primes profiles so nested profile reads are free", async () => {
  const db = buildDirectory(10, 0);

  await run(
    `{ tutors(first: 10) { nodes { id profile { displayName major } } } }`,
    db,
  );

  // profiles + tutors only: the nested profile field is served from the cache
  // the list resolver primed.
  assertEquals(db.queryCount, 2);
});

Deno.test("filters narrow the result set", async () => {
  const db = new FakeDataSource({
    profiles: [
      makeProfile("t1", { first_name: "Ada", major: "Mathematics" }),
      makeProfile("t2", { first_name: "Grace", major: "Computer Science" }),
      makeProfile("t3", { approved_tutor: false }),
    ],
    tutors: [
      makeTutor("t1", { first_name: "Ada", hourly_rate: 30, average_rating: 4.9 }),
      makeTutor("t2", { first_name: "Grace", hourly_rate: 80, average_rating: 4.1 }),
      makeTutor("t3"),
    ],
  });

  const result = await run(
    `{ tutors(filter: { maxHourlyRate: 50 }) { totalCount nodes { displayName } } }`,
    db,
  );

  // deno-lint-ignore no-explicit-any
  const page = result.data?.tutors as any;
  assertEquals(page.totalCount, 1);
  assertEquals(page.nodes[0].displayName, "Ada Lastt1");
});

Deno.test("private tutors are excluded from the directory", async () => {
  const db = new FakeDataSource({
    profiles: [makeProfile("t1"), makeProfile("t2")],
    tutors: [
      makeTutor("t1"),
      makeTutor("t2", { profile_visibility: "private" }),
    ],
  });

  const result = await run(`{ tutors { totalCount } }`, db);
  // deno-lint-ignore no-explicit-any
  assertEquals((result.data?.tutors as any).totalCount, 1);
});

Deno.test("payoutAccount is null for a viewer who is not that tutor", async () => {
  const db = new FakeDataSource({
    profiles: [makeProfile("t1")],
    tutors: [makeTutor("t1", { stripe_connect_id: "acct_123" })],
  });
  const payouts = new FakePayoutSource([{
    id: "acct_123",
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    requirements_due: [],
  }]);

  const query = `{ tutor(id: "t1") { payoutAccount { payoutsEnabled } } }`;

  const anonymous = await run(query, db, null, payouts);
  // deno-lint-ignore no-explicit-any
  assertEquals((anonymous.data?.tutor as any).payoutAccount, null);
  assertEquals(payouts.requestCount, 0, "Stripe must not be called at all");

  const otherUser = await run(
    query,
    db,
    { id: "someone-else", email: null },
    payouts,
  );
  // deno-lint-ignore no-explicit-any
  assertEquals((otherUser.data?.tutor as any).payoutAccount, null);
  assertEquals(payouts.requestCount, 0);

  const owner = await run(query, db, { id: "t1", email: "t1@usc.edu" }, payouts);
  // deno-lint-ignore no-explicit-any
  assertEquals((owner.data?.tutor as any).payoutAccount.payoutsEnabled, true);
  assertEquals(payouts.requestCount, 1);
});

Deno.test("reviewStats aggregates without a second query", async () => {
  const db = new FakeDataSource({
    profiles: [makeProfile("t1"), makeProfile("s1", { approved_tutor: false })],
    tutors: [makeTutor("t1")],
    reviews: [
      makeReview("r1", "t1", "s1", { rating: 5 }),
      makeReview("r2", "t1", "s1", { rating: 4 }),
      makeReview("r3", "t1", "s1", { rating: 3 }),
    ],
  });

  const result = await run(
    `{ tutor(id: "t1") { reviewStats { count average } reviews(first: 3) { rating } } }`,
    db,
  );

  // deno-lint-ignore no-explicit-any
  const tutor = result.data?.tutor as any;
  assertEquals(tutor.reviewStats, { count: 3, average: 4 });
  // tutors lookup + reviews lookup; reviewStats and reviews share one load.
  assertEquals(db.queryCount, 2);
});

/* ---- guard rails -------------------------------------------------------- */

Deno.test("over-deep queries are rejected during validation", () => {
  const document = parse(`{
    tutors { nodes { reviews { reviewer {
      id
    } } } }
  }`);
  // tutors > nodes > reviews > reviewer is four levels of nesting.
  assertEquals(validate(schema, document, [depthLimit(3)]).length, 1);
  assertEquals(validate(schema, document, [depthLimit(4)]).length, 0);
});

Deno.test("depth hidden inside a fragment is still counted", () => {
  const document = parse(`
    { tutors { nodes { ...deep } } }
    fragment deep on Tutor { reviews { reviewer { id } } }
  `);
  // Same four levels as the inline query above, so the same limit must reject
  // it — the fragment body counts from the depth of its spread.
  assertEquals(validate(schema, document, [depthLimit(3)]).length, 1,
    "a fragment must not be a way to hide depth");
  assertEquals(validate(schema, document, [depthLimit(4)]).length, 0);
});

Deno.test("wide fan-out is rejected on cost even when it is shallow", () => {
  const expensive = parse(
    `{ tutors(first: 100) { nodes { reviews(first: 100) { reviewer { id } } } } }`,
  );
  assertEquals(validate(schema, expensive, [complexityLimit(1000)]).length, 1);

  const reasonable = parse(
    `{ tutors(first: 20) { nodes { reviews(first: 5) { reviewer { id } } } } }`,
  );
  assertEquals(validate(schema, reasonable, [complexityLimit(1000)]).length, 0);
});

Deno.test("introspection is blocked when the rule is enabled", () => {
  const document = parse(`{ __schema { types { name } } }`);
  assertEquals(validate(schema, document, [noIntrospection]).length, 1);
  assertEquals(validate(schema, document, []).length, 0);
});

Deno.test("every resolver maps onto a declared schema field", () => {
  // makeExecutableSchema throws on a mismatch, so building it is the assertion.
  const built = makeExecutableSchema(typeDefs, resolvers);
  assert(built.getQueryType() !== undefined);
});
