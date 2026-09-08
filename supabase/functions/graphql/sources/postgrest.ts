/**
 * The gateway's Postgres-backed data source.
 *
 * Every read goes through `selectIn` / `select`, which exist for one reason: to
 * give DataLoader a primitive that turns N single-row lookups into one
 * `WHERE col IN (...)` round trip. Resolvers never talk to Supabase directly —
 * if they did, the batching would be trivially bypassed.
 *
 * The client is built per request with the caller's JWT so row-level security
 * stays in force. The gateway does not hold a service-role key; a batched query
 * is still a query the user was allowed to make.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  BadgeRow,
  ProfileRow,
  ReviewRow,
  SessionRow,
  TutorCourseRow,
  TutorRow,
} from "./types.ts";

/** Columns the gateway is willing to expose, per table. */
export const COLUMNS = {
  profiles:
    "id,first_name,last_name,avatar_url,major,graduation_year,bio,student_bio,tutor_bio,role,approved_tutor,average_rating,hourly_rate,available_in_person,available_online,tutor_courses_subjects,student_courses,created_at",
  tutors:
    "id,profile_id,first_name,last_name,bio,hourly_rate,average_rating,subjects,max_weekly_sessions,profile_visibility,approved_tutor,stripe_connect_id,stripe_connect_onboarding_complete,created_at",
  sessions:
    "id,tutor_id,student_id,course_id,start_time,end_time,status,payment_status,session_type,location,notes,zoom_join_url,completion_date,created_at",
  reviews: "id,tutor_id,reviewer_id,rating,comment,created_at",
  tutor_courses: "id,tutor_id,course_number,course_title,department,instructor",
  tutor_badges: "id,tutor_id,badge_type,earned_date,is_active",
} as const;

export type TableName = keyof typeof COLUMNS;

export interface SelectOptions {
  /** Restrict to rows matching every entry (equality only). */
  eq?: Record<string, string | number | boolean | null>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

/**
 * The surface resolvers and loaders depend on. Tests swap in a fake that counts
 * calls, which is how the batching assertions in `tests/loaders_test.ts` work.
 */
export interface DataSource {
  /** One round trip for many keys: `select ... where <column> in (<values>)`. */
  selectIn<T>(
    table: TableName,
    column: string,
    values: readonly (string | number)[],
    options?: SelectOptions,
  ): Promise<T[]>;

  select<T>(table: TableName, options?: SelectOptions): Promise<T[]>;

  /** Number of round trips issued so far — surfaced as a debug response header. */
  readonly queryCount: number;
}

export class PostgrestSource implements DataSource {
  #client: SupabaseClient;
  #queries = 0;

  constructor(client: SupabaseClient) {
    this.#client = client;
  }

  static forRequest(
    supabaseUrl: string,
    anonKey: string,
    accessToken: string | null,
  ): PostgrestSource {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
      },
    });
    return new PostgrestSource(client);
  }

  get queryCount(): number {
    return this.#queries;
  }

  async selectIn<T>(
    table: TableName,
    column: string,
    values: readonly (string | number)[],
    options: SelectOptions = {},
  ): Promise<T[]> {
    if (values.length === 0) return [];
    this.#queries++;

    let query = this.#client
      .from(table)
      .select(COLUMNS[table])
      .in(column, values as (string | number)[]);

    query = this.#applyOptions(query, options);

    const { data, error } = await query;
    if (error) {
      throw new Error(`[${table}.${column} IN] ${error.message}`);
    }
    return (data ?? []) as T[];
  }

  async select<T>(table: TableName, options: SelectOptions = {}): Promise<T[]> {
    this.#queries++;

    let query = this.#client.from(table).select(COLUMNS[table]);
    query = this.#applyOptions(query, options);

    const { data, error } = await query;
    if (error) {
      throw new Error(`[${table}] ${error.message}`);
    }
    return (data ?? []) as T[];
  }

  // deno-lint-ignore no-explicit-any
  #applyOptions(query: any, options: SelectOptions) {
    for (const [key, value] of Object.entries(options.eq ?? {})) {
      query = value === null ? query.is(key, null) : query.eq(key, value);
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    return query;
  }
}

export type {
  BadgeRow,
  ProfileRow,
  ReviewRow,
  SessionRow,
  TutorCourseRow,
  TutorRow,
};
