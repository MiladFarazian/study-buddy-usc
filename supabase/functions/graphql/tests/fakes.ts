/**
 * In-memory doubles for the gateway's two backing services.
 *
 * The fakes count round trips, which is what the batching assertions actually
 * measure: "does asking for 20 tutors and all their reviewers issue 3 queries
 * or 400?"
 */

import type {
  DataSource,
  SelectOptions,
  TableName,
} from "../sources/postgrest.ts";
import type { PayoutSource } from "../sources/stripe.ts";
import type {
  ProfileRow,
  ReviewRow,
  SessionRow,
  TutorRow,
} from "../sources/types.ts";
import type { PayoutAccountRow } from "../sources/types.ts";

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

export class FakeDataSource implements DataSource {
  #tables: Partial<Record<TableName, Row[]>>;
  /** Every round trip, in order — useful when a count alone isn't diagnostic. */
  readonly calls: { table: TableName; column?: string; keys?: unknown[] }[] = [];

  constructor(tables: Partial<Record<TableName, Row[]>>) {
    this.#tables = tables;
  }

  get queryCount(): number {
    return this.calls.length;
  }

  selectIn<T>(
    table: TableName,
    column: string,
    values: readonly (string | number)[],
    options: SelectOptions = {},
  ): Promise<T[]> {
    if (values.length === 0) return Promise.resolve([]);
    this.calls.push({ table, column, keys: [...values] });

    const wanted = new Set(values);
    const rows = (this.#tables[table] ?? [])
      .filter((row) => wanted.has(row[column]));

    return Promise.resolve(this.#applyOptions(rows, options) as T[]);
  }

  select<T>(table: TableName, options: SelectOptions = {}): Promise<T[]> {
    this.calls.push({ table });
    return Promise.resolve(
      this.#applyOptions([...(this.#tables[table] ?? [])], options) as T[],
    );
  }

  #applyOptions(rows: Row[], options: SelectOptions): Row[] {
    let result = rows;

    for (const [key, value] of Object.entries(options.eq ?? {})) {
      result = result.filter((row) => row[key] === value);
    }

    if (options.orderBy) {
      const { column, ascending = true } = options.orderBy;
      result = [...result].sort((a, b) => {
        if (a[column] === b[column]) return 0;
        const less = a[column] < b[column] ? -1 : 1;
        return ascending ? less : -less;
      });
    }

    if (options.limit !== undefined) result = result.slice(0, options.limit);
    return result;
  }
}

export class FakePayoutSource implements PayoutSource {
  #accounts: Map<string, PayoutAccountRow>;
  #requests = 0;

  constructor(accounts: PayoutAccountRow[] = []) {
    this.#accounts = new Map(accounts.map((account) => [account.id, account]));
  }

  get requestCount(): number {
    return this.#requests;
  }

  fetchAccounts(
    accountIds: readonly string[],
  ): Promise<(PayoutAccountRow | null)[]> {
    // Stripe has no batch endpoint, so a "batch" of N ids is N requests.
    this.#requests += accountIds.length;
    return Promise.resolve(
      accountIds.map((id) => this.#accounts.get(id) ?? null),
    );
  }
}

/* ---- fixture builders --------------------------------------------------- */

export function makeProfile(
  id: string,
  overrides: Partial<ProfileRow> = {},
): ProfileRow {
  return {
    id,
    first_name: `First${id}`,
    last_name: `Last${id}`,
    avatar_url: null,
    major: "Computer Science",
    graduation_year: "2026",
    bio: null,
    student_bio: null,
    tutor_bio: `Bio for ${id}`,
    role: "tutor",
    approved_tutor: true,
    average_rating: 4.5,
    hourly_rate: 40,
    available_in_person: true,
    available_online: true,
    tutor_courses_subjects: ["CSCI-201"],
    student_courses: null,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeTutor(
  profileId: string,
  overrides: Partial<TutorRow> = {},
): TutorRow {
  return {
    id: `tutor-${profileId}`,
    profile_id: profileId,
    first_name: `First${profileId}`,
    last_name: `Last${profileId}`,
    bio: `Bio for ${profileId}`,
    hourly_rate: 40,
    average_rating: 4.5,
    subjects: ["CSCI-201"],
    max_weekly_sessions: 10,
    profile_visibility: "public",
    approved_tutor: true,
    stripe_connect_id: null,
    stripe_connect_onboarding_complete: false,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeReview(
  id: string,
  tutorId: string,
  reviewerId: string,
  overrides: Partial<ReviewRow> = {},
): ReviewRow {
  return {
    id,
    tutor_id: tutorId,
    reviewer_id: reviewerId,
    rating: 5,
    comment: "Great session",
    created_at: "2025-02-01T00:00:00Z",
    ...overrides,
  };
}

export function makeSession(
  id: string,
  tutorId: string,
  studentId: string,
  overrides: Partial<SessionRow> = {},
): SessionRow {
  return {
    id,
    tutor_id: tutorId,
    student_id: studentId,
    course_id: "CSCI-201",
    start_time: "2025-03-01T18:00:00Z",
    end_time: "2025-03-01T19:00:00Z",
    status: "scheduled",
    payment_status: "paid",
    session_type: "virtual",
    location: null,
    notes: null,
    zoom_join_url: null,
    completion_date: null,
    created_at: "2025-02-20T00:00:00Z",
    ...overrides,
  };
}
