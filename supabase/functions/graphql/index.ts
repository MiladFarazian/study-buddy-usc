/**
 * GraphQL gateway — HTTP entry point.
 *
 * One endpoint over the tutoring database and Stripe Connect. It runs as a
 * Supabase Edge Function alongside the existing REST functions; the client
 * sends its Supabase access token and RLS still decides what it can read.
 *
 *   POST /functions/v1/graphql   {"query": "...", "variables": {...}}
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { execute, type GraphQLError, parse, specifiedRules, validate } from "graphql";
import { typeDefs } from "./schema.ts";
import { resolvers } from "./resolvers.ts";
import { makeExecutableSchema } from "./executable.ts";
import { createContext } from "./context.ts";
import { complexityLimit, depthLimit, noIntrospection } from "./security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Built once per isolate, not per request: parsing and validating the SDL on
// every call would dominate the latency of a small query.
const schema = makeExecutableSchema(typeDefs, resolvers);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? null;
const ALLOW_INTROSPECTION =
  Deno.env.get("GRAPHQL_ALLOW_INTROSPECTION") === "true";

const validationRules = [
  ...specifiedRules,
  depthLimit(),
  complexityLimit(),
  ...(ALLOW_INTROSPECTION ? [] : [noIntrospection]),
];

interface GraphQLRequestBody {
  query?: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
}

function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Strips resolver internals out of errors before they cross the wire.
 * A stack trace or a raw Postgres message is a free schema disclosure.
 */
function publicError(error: GraphQLError) {
  const isClientError = Boolean(error.extensions?.code) ||
    error.message.startsWith("Query ") ||
    error.message.startsWith("Introspection ");

  if (!isClientError) console.error("gateway resolver error:", error);

  return {
    message: isClientError ? error.message : "Internal server error",
    path: error.path,
    locations: error.locations,
    extensions: error.extensions,
  };
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json(
      { errors: [{ message: "This endpoint accepts POST only." }] },
      405,
    );
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("gateway: SUPABASE_URL / SUPABASE_ANON_KEY are not set");
    return json({ errors: [{ message: "Gateway is misconfigured." }] }, 500);
  }

  let body: GraphQLRequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ errors: [{ message: "Request body must be JSON." }] }, 400);
  }

  if (!body.query) {
    return json({ errors: [{ message: "No query supplied." }] }, 400);
  }

  // Parse and validate before building context: a malformed or over-budget
  // query should never reach the point of opening a database client.
  let document;
  try {
    document = parse(body.query);
  } catch (error) {
    return json({ errors: [{ message: (error as Error).message }] }, 400);
  }

  const validationErrors = validate(schema, document, validationRules);
  if (validationErrors.length > 0) {
    return json({ errors: validationErrors.map(publicError) }, 400);
  }

  const started = performance.now();

  try {
    const context = await createContext(request, {
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
      stripeSecretKey: STRIPE_SECRET_KEY,
    });

    const result = await execute({
      schema,
      document,
      contextValue: context,
      variableValues: body.variables ?? undefined,
      operationName: body.operationName ?? undefined,
    });

    const elapsed = Math.round(performance.now() - started);

    // The query counts are the point of the whole DataLoader layer, so they are
    // observable rather than a claim in a comment. `curl -i` shows whether a
    // change reintroduced an N+1.
    return json(
      {
        data: result.data,
        ...(result.errors
          ? { errors: result.errors.map(publicError) }
          : {}),
      },
      200,
      {
        "x-gateway-db-queries": String(context.db.queryCount),
        "x-gateway-stripe-requests": String(context.payouts.requestCount),
        "x-gateway-duration-ms": String(elapsed),
      },
    );
  } catch (error) {
    console.error("gateway: unhandled error", error);
    return json({ errors: [{ message: "Internal server error" }] }, 500);
  }
});
