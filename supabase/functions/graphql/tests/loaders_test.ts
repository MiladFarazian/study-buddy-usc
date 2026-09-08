/**
 * The DataLoader contract, tested at the seam where it actually breaks.
 *
 * Every assertion here is about round trips or ordering, because those are the
 * two ways batching goes wrong: it silently stops batching, or it batches and
 * hands rows back against the wrong keys.
 */

import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createLoaders, primeProfiles } from "../loaders.ts";
import {
  FakeDataSource,
  FakePayoutSource,
  makeProfile,
  makeReview,
  makeSession,
} from "./fakes.ts";

const payouts = () => new FakePayoutSource();

Deno.test("concurrent loads for distinct keys collapse into one query", async () => {
  const db = new FakeDataSource({
    profiles: ["a", "b", "c", "d"].map((id) => makeProfile(id)),
  });
  const loaders = createLoaders(db, payouts());

  const results = await Promise.all([
    loaders.profileById.load("a"),
    loaders.profileById.load("b"),
    loaders.profileById.load("c"),
    loaders.profileById.load("d"),
  ]);

  assertEquals(db.queryCount, 1, "four loads must batch into one round trip");
  assertEquals(results.map((profile) => profile?.id), ["a", "b", "c", "d"]);
});

Deno.test("results are returned in key order, not database order", async () => {
  // The fake returns rows in insertion order; asking in reverse proves the
  // batch function re-indexes rather than passing rows straight through.
  const db = new FakeDataSource({
    profiles: ["a", "b", "c"].map((id) => makeProfile(id)),
  });
  const loaders = createLoaders(db, payouts());

  const results = await Promise.all([
    loaders.profileById.load("c"),
    loaders.profileById.load("a"),
    loaders.profileById.load("b"),
  ]);

  assertEquals(results.map((profile) => profile?.id), ["c", "a", "b"]);
});

Deno.test("a missing key yields null without shifting its neighbours", async () => {
  const db = new FakeDataSource({
    profiles: [makeProfile("a"), makeProfile("c")],
  });
  const loaders = createLoaders(db, payouts());

  const [first, second, third] = await Promise.all([
    loaders.profileById.load("a"),
    loaders.profileById.load("missing"),
    loaders.profileById.load("c"),
  ]);

  assertEquals(first?.id, "a");
  assertEquals(second, null, "an unreadable or absent row must be null");
  assertEquals(third?.id, "c", "the miss must not shift later keys");
});

Deno.test("repeated loads of the same key hit the per-request cache", async () => {
  const db = new FakeDataSource({ profiles: [makeProfile("a")] });
  const loaders = createLoaders(db, payouts());

  await loaders.profileById.load("a");
  await loaders.profileById.load("a");
  await loaders.profileById.load("a");

  assertEquals(db.queryCount, 1, "the same key must not be refetched");
});

Deno.test("loaders are per-request: separate contexts share no cache", async () => {
  const db = new FakeDataSource({ profiles: [makeProfile("a")] });

  const first = createLoaders(db, payouts());
  const second = createLoaders(db, payouts());

  await first.profileById.load("a");
  await second.profileById.load("a");

  // Two requests, two queries. If this ever reads 1, a loader has escaped to
  // module scope and one user's rows are being served to another.
  assertEquals(db.queryCount, 2);
});

Deno.test("list loaders return an empty array for keys with no rows", async () => {
  const db = new FakeDataSource({
    reviews: [makeReview("r1", "tutor-a", "student-1")],
  });
  const loaders = createLoaders(db, payouts());

  const [withReviews, without] = await Promise.all([
    loaders.reviewsByTutorId.load("tutor-a"),
    loaders.reviewsByTutorId.load("tutor-b"),
  ]);

  assertEquals(db.queryCount, 1);
  assertEquals(withReviews.length, 1);
  assertEquals(without, [], "no rows must be [] — never undefined or a hole");
});

Deno.test("priming the cache removes the follow-up query entirely", async () => {
  const profiles = ["a", "b"].map((id) => makeProfile(id));
  const db = new FakeDataSource({ profiles });
  const loaders = createLoaders(db, payouts());

  primeProfiles(loaders, profiles);
  const loaded = await Promise.all([
    loaders.profileById.load("a"),
    loaders.profileById.load("b"),
  ]);

  assertEquals(db.queryCount, 0, "primed rows must not be refetched");
  assertStrictEquals(loaded[0], profiles[0]);
});

Deno.test("composite keys partition into one query per compatible group", async () => {
  const db = new FakeDataSource({
    sessions: [
      makeSession("s1", "tutor-a", "student-1", { status: "scheduled" }),
      makeSession("s2", "tutor-b", "student-1", { status: "completed" }),
      makeSession("s3", "tutor-a", "student-2", { status: "scheduled" }),
    ],
  });
  const loaders = createLoaders(db, payouts());

  const [tutorA, tutorB, student1] = await Promise.all([
    loaders.sessionsByUser.load({ userId: "tutor-a", role: "tutor", status: "scheduled" }),
    loaders.sessionsByUser.load({ userId: "tutor-b", role: "tutor", status: "scheduled" }),
    loaders.sessionsByUser.load({ userId: "student-1", role: "student" }),
  ]);

  // Two tutor+scheduled keys share a query; the student key needs its own.
  assertEquals(db.queryCount, 2);
  assertEquals(tutorA.length, 2, "s1 and s3 are both scheduled for tutor-a");
  assertEquals(tutorB.length, 0, "tutor-b's only session is completed");
  assertEquals(student1.length, 2, "student-1 is on s1 and s2, unfiltered");
});

Deno.test("composite cache keys compare by value, not object identity", async () => {
  const db = new FakeDataSource({
    sessions: [makeSession("s1", "tutor-a", "student-1")],
  });
  const loaders = createLoaders(db, payouts());

  await loaders.sessionsByUser.load({ userId: "tutor-a", role: "tutor" });
  // A structurally identical but distinct object: without cacheKeyFn this is a
  // cache miss and a second query.
  await loaders.sessionsByUser.load({ userId: "tutor-a", role: "tutor" });

  assertEquals(db.queryCount, 1);
});

Deno.test("batches split at maxBatchSize instead of building one huge IN list", async () => {
  const ids = Array.from({ length: 250 }, (_, index) => `p${index}`);
  const db = new FakeDataSource({ profiles: ids.map((id) => makeProfile(id)) });
  const loaders = createLoaders(db, payouts());

  const results = await Promise.all(ids.map((id) => loaders.profileById.load(id)));

  assertEquals(db.queryCount, 3, "250 keys at maxBatchSize 100 is 3 queries");
  assertEquals(results.every((profile, index) => profile?.id === ids[index]), true);
});
