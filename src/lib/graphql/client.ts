/**
 * Client for the GraphQL gateway (`supabase/functions/graphql`).
 *
 * One request per screen instead of a waterfall of REST calls: the gateway does
 * the fan-out and batches it. Requests carry the user's Supabase access token,
 * so the same row-level security that governs `supabase.from(...)` still
 * applies — the gateway holds no elevated key.
 */

import { supabase } from "@/integrations/supabase/client";

const GRAPHQL_ENDPOINT = `${
  import.meta.env.VITE_SUPABASE_URL ?? "https://fzcyzjruixuriqzryppz.supabase.co"
}/functions/v1/graphql`;

export interface GraphQLLocation {
  line: number;
  column: number;
}

export interface GraphQLResponseError {
  message: string;
  path?: (string | number)[];
  locations?: GraphQLLocation[];
  extensions?: Record<string, unknown>;
}

/**
 * GraphQL returns 200 with an `errors` array, so a failed query looks like a
 * successful fetch. This error type exists so callers can't accidentally treat
 * a partial response as a clean one.
 */
export class GraphQLRequestError extends Error {
  readonly errors: GraphQLResponseError[];
  readonly status: number;

  constructor(errors: GraphQLResponseError[], status: number) {
    super(errors[0]?.message ?? "GraphQL request failed");
    this.name = "GraphQLRequestError";
    this.errors = errors;
    this.status = status;
  }
}

export interface GraphQLRequestOptions {
  variables?: Record<string, unknown>;
  signal?: AbortSignal;
  /** Fail the call if any field errored, even when `data` is partly populated. */
  rejectOnPartialErrors?: boolean;
}

interface GraphQLEnvelope<T> {
  data?: T | null;
  errors?: GraphQLResponseError[];
}

export async function graphqlRequest<T>(
  query: string,
  options: GraphQLRequestOptions = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    signal: options.signal,
    headers: {
      "Content-Type": "application/json",
      // The anon key satisfies the edge-function gateway; the bearer token is
      // what actually identifies the user to Postgres.
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({ query, variables: options.variables ?? {} }),
  });

  let envelope: GraphQLEnvelope<T>;
  try {
    envelope = await response.json();
  } catch {
    throw new GraphQLRequestError(
      [{ message: `Gateway returned a non-JSON ${response.status} response.` }],
      response.status,
    );
  }

  if (envelope.errors?.length) {
    // A partial response is still useful for a list screen where one tutor's
    // payout lookup failed, so only reject when the caller asked us to or when
    // nothing came back at all.
    const fatal = options.rejectOnPartialErrors || envelope.data == null;
    if (fatal) {
      throw new GraphQLRequestError(envelope.errors, response.status);
    }
    console.warn("gateway returned partial data:", envelope.errors);
  }

  if (envelope.data == null) {
    throw new GraphQLRequestError(
      [{ message: "Gateway returned no data." }],
      response.status,
    );
  }

  return envelope.data;
}
