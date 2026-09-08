/**
 * DataLoader wiring for the gateway.
 *
 * Three rules hold everywhere in this file, and breaking any one of them causes
 * bugs that are painful to trace:
 *
 *  1. **Loaders are created per request** (see `createLoaders`, called from
 *     `createContext`). A module-level loader would cache one user's rows and
 *     serve them to the next request — a cross-tenant data leak, not just a
 *     stale read.
 *  2. **A batch function returns exactly one entry per key, in key order.**
 *     `WHERE id IN (...)` returns rows in whatever order Postgres likes and
 *     silently omits misses, so every batch function below re-indexes the rows
 *     into a Map and maps back over `keys`. Returning the raw rows would shift
 *     results onto the wrong keys.
 *  3. **A miss is `null` (or `[]` for list loaders), never a dropped element.**
 *     Array length must equal key length or DataLoader rejects the batch.
 */

import DataLoader from "dataloader";
import type { DataSource } from "./sources/postgrest.ts";
import type { PayoutSource } from "./sources/stripe.ts";
import type {
  BadgeRow,
  PayoutAccountRow,
  ProfileRow,
  ReviewRow,
  SessionRow,
  TutorCourseRow,
  TutorRow,
} from "./sources/types.ts";

/** Postgres plans `IN` lists poorly past a few hundred entries. */
const MAX_BATCH_SIZE = 100;

/** Indexes rows by key for a one-row-per-key loader. */
function indexBy<T>(rows: readonly T[], key: (row: T) => string): Map<string, T> {
  const index = new Map<string, T>();
  for (const row of rows) index.set(key(row), row);
  return index;
}

/** Indexes rows by key for a many-rows-per-key loader. */
function groupBy<T>(
  rows: readonly T[],
  key: (row: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const bucket = groups.get(k);
    if (bucket) bucket.push(row);
    else groups.set(k, [row]);
  }
  return groups;
}

/**
 * Composite key for loaders that take arguments alongside an id (e.g. "the
 * upcoming sessions for tutor X"). DataLoader compares keys by identity, so an
 * object key needs an explicit `cacheKeyFn` or every lookup misses the cache.
 */
export interface SessionsKey {
  userId: string;
  role: "tutor" | "student";
  status?: string;
}

const sessionsCacheKey = (key: SessionsKey) =>
  `${key.role}:${key.userId}:${key.status ?? "*"}`;

export interface Loaders {
  profileById: DataLoader<string, ProfileRow | null>;
  tutorByProfileId: DataLoader<string, TutorRow | null>;
  reviewsByTutorId: DataLoader<string, ReviewRow[]>;
  coursesByTutorId: DataLoader<string, TutorCourseRow[]>;
  badgesByTutorId: DataLoader<string, BadgeRow[]>;
  sessionsByUser: DataLoader<SessionsKey, SessionRow[], string>;
  payoutAccountById: DataLoader<string, PayoutAccountRow | null>;
}

export function createLoaders(
  db: DataSource,
  payouts: PayoutSource,
): Loaders {
  /* ---- one row per key -------------------------------------------------- */

  const profileById = new DataLoader<string, ProfileRow | null>(
    async (ids) => {
      const rows = await db.selectIn<ProfileRow>("profiles", "id", ids);
      const byId = indexBy(rows, (row) => row.id);
      // Map over `ids`, not `rows`: preserves order and yields null for ids the
      // caller may not read under RLS.
      return ids.map((id) => byId.get(id) ?? null);
    },
    { maxBatchSize: MAX_BATCH_SIZE },
  );

  const tutorByProfileId = new DataLoader<string, TutorRow | null>(
    async (profileIds) => {
      const rows = await db.selectIn<TutorRow>(
        "tutors",
        "profile_id",
        profileIds,
      );
      const byProfileId = indexBy(rows, (row) => row.profile_id);
      return profileIds.map((id) => byProfileId.get(id) ?? null);
    },
    { maxBatchSize: MAX_BATCH_SIZE },
  );

  /* ---- many rows per key ------------------------------------------------ */

  const reviewsByTutorId = new DataLoader<string, ReviewRow[]>(
    async (tutorIds) => {
      const rows = await db.selectIn<ReviewRow>(
        "reviews",
        "tutor_id",
        tutorIds,
        { orderBy: { column: "created_at", ascending: false } },
      );
      const grouped = groupBy(rows, (row) => row.tutor_id);
      return tutorIds.map((id) => grouped.get(id) ?? []);
    },
    { maxBatchSize: MAX_BATCH_SIZE },
  );

  const coursesByTutorId = new DataLoader<string, TutorCourseRow[]>(
    async (tutorIds) => {
      const rows = await db.selectIn<TutorCourseRow>(
        "tutor_courses",
        "tutor_id",
        tutorIds,
        { orderBy: { column: "course_number" } },
      );
      const grouped = groupBy(rows, (row) => row.tutor_id);
      return tutorIds.map((id) => grouped.get(id) ?? []);
    },
    { maxBatchSize: MAX_BATCH_SIZE },
  );

  const badgesByTutorId = new DataLoader<string, BadgeRow[]>(
    async (tutorIds) => {
      const rows = await db.selectIn<BadgeRow>(
        "tutor_badges",
        "tutor_id",
        tutorIds,
        { eq: { is_active: true }, orderBy: { column: "earned_date", ascending: false } },
      );
      const grouped = groupBy(rows, (row) => row.tutor_id);
      return tutorIds.map((id) => grouped.get(id) ?? []);
    },
    { maxBatchSize: MAX_BATCH_SIZE },
  );

  /* ---- composite key ----------------------------------------------------- */

  /**
   * Sessions are read by tutor id or student id, optionally filtered by status.
   * Keys that differ in role or status cannot share a round trip, so the batch
   * is partitioned into compatible groups first — each group becomes one `IN`
   * query rather than one query per key.
   */
  const sessionsByUser = new DataLoader<SessionsKey, SessionRow[], string>(
    async (keys) => {
      const groups = new Map<string, SessionsKey[]>();
      for (const key of keys) {
        const groupId = `${key.role}:${key.status ?? "*"}`;
        const bucket = groups.get(groupId);
        if (bucket) bucket.push(key);
        else groups.set(groupId, [key]);
      }

      const resultsByCacheKey = new Map<string, SessionRow[]>();

      await Promise.all(
        [...groups.values()].map(async (group) => {
          const { role, status } = group[0];
          const column = role === "tutor" ? "tutor_id" : "student_id";
          const userIds = [...new Set(group.map((key) => key.userId))];

          const rows = await db.selectIn<SessionRow>(
            "sessions",
            column,
            userIds,
            {
              eq: status ? { status } : undefined,
              orderBy: { column: "start_time", ascending: false },
            },
          );

          const grouped = groupBy(rows, (row) =>
            role === "tutor" ? row.tutor_id : row.student_id);

          for (const key of group) {
            resultsByCacheKey.set(
              sessionsCacheKey(key),
              grouped.get(key.userId) ?? [],
            );
          }
        }),
      );

      return keys.map((key) =>
        resultsByCacheKey.get(sessionsCacheKey(key)) ?? []);
    },
    { maxBatchSize: MAX_BATCH_SIZE, cacheKeyFn: sessionsCacheKey },
  );

  /* ---- second service ---------------------------------------------------- */

  const payoutAccountById = new DataLoader<string, PayoutAccountRow | null>(
    async (accountIds) => await payouts.fetchAccounts(accountIds),
    { maxBatchSize: 25 },
  );

  return {
    profileById,
    tutorByProfileId,
    reviewsByTutorId,
    coursesByTutorId,
    badgesByTutorId,
    sessionsByUser,
    payoutAccountById,
  };
}

/**
 * Seeds the per-request cache with rows already in hand.
 *
 * The list resolver selects full tutor rows; without priming, asking for
 * `tutors { profile { ... } }` would re-fetch every profile the list query
 * already implied. Priming turns that batch into zero round trips.
 */
export function primeProfiles(
  loaders: Loaders,
  profiles: readonly ProfileRow[],
): void {
  for (const profile of profiles) {
    loaders.profileById.prime(profile.id, profile);
  }
}

export function primeTutors(
  loaders: Loaders,
  tutors: readonly TutorRow[],
): void {
  for (const tutor of tutors) {
    loaders.tutorByProfileId.prime(tutor.profile_id, tutor);
  }
}
