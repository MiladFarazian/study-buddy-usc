/**
 * Per-request context.
 *
 * Built fresh for every HTTP request. That is not a style preference: the
 * loaders it holds are caches, and a cache that outlives the request would
 * serve one user's rows to the next caller.
 */

import { createClient } from "@supabase/supabase-js";
import { type DataSource, PostgrestSource } from "./sources/postgrest.ts";
import {
  NullPayoutSource,
  type PayoutSource,
  StripeConnectSource,
} from "./sources/stripe.ts";
import { createLoaders, type Loaders } from "./loaders.ts";

export interface Viewer {
  id: string;
  email: string | null;
}

export interface GatewayContext {
  viewer: Viewer | null;
  db: DataSource;
  payouts: PayoutSource;
  loaders: Loaders;
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Resolves the caller's identity.
 *
 * The JWT is verified by Supabase Auth rather than decoded locally — an
 * unverified `sub` claim is an authorization bypass, since anyone can mint an
 * unsigned JWT. An invalid token yields an anonymous viewer instead of an
 * error: public fields stay readable, and RLS refuses the rest.
 */
export async function resolveViewer(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string | null,
): Promise<Viewer | null> {
  if (!accessToken) return null;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    console.warn("gateway: token rejected", error?.message);
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? null };
}

export interface ContextOptions {
  supabaseUrl: string;
  anonKey: string;
  stripeSecretKey?: string | null;
}

export async function createContext(
  request: Request,
  options: ContextOptions,
): Promise<GatewayContext> {
  const accessToken = bearerToken(request);
  const viewer = await resolveViewer(
    options.supabaseUrl,
    options.anonKey,
    accessToken,
  );

  // The caller's token rides along on every query, so row-level security is
  // still what decides which rows come back.
  const db = PostgrestSource.forRequest(
    options.supabaseUrl,
    options.anonKey,
    accessToken,
  );

  const payouts: PayoutSource = options.stripeSecretKey
    ? new StripeConnectSource(options.stripeSecretKey)
    : new NullPayoutSource();

  return { viewer, db, payouts, loaders: createLoaders(db, payouts) };
}

/** Test seam: build a context around fakes without touching the network. */
export function createTestContext(
  db: DataSource,
  payouts: PayoutSource,
  viewer: Viewer | null = null,
): GatewayContext {
  return { viewer, db, payouts, loaders: createLoaders(db, payouts) };
}
