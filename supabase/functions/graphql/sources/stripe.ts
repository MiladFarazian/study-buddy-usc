/**
 * Stripe Connect source — the second service behind the gateway.
 *
 * Stripe has no batch "get many accounts" endpoint, so batching here cannot
 * collapse into one round trip the way Postgres does. DataLoader still earns its
 * place: it de-duplicates repeated ids within a request and lets us cap
 * concurrency, so a query touching 50 tutors issues at most `maxConcurrency`
 * in-flight calls instead of 50 — and issues zero for ids it has already seen.
 */

import type { PayoutAccountRow } from "./types.ts";

export interface PayoutSource {
  fetchAccounts(
    accountIds: readonly string[],
  ): Promise<(PayoutAccountRow | null)[]>;
  readonly requestCount: number;
}

/** Runs `task` over `items` with at most `limit` promises in flight. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await task(items[index]);
      }
    },
  );

  await Promise.all(workers);
  return results;
}

export class StripeConnectSource implements PayoutSource {
  #secretKey: string;
  #maxConcurrency: number;
  #requests = 0;

  constructor(secretKey: string, maxConcurrency = 6) {
    this.#secretKey = secretKey;
    this.#maxConcurrency = maxConcurrency;
  }

  get requestCount(): number {
    return this.#requests;
  }

  async fetchAccounts(
    accountIds: readonly string[],
  ): Promise<(PayoutAccountRow | null)[]> {
    return await mapWithConcurrency(
      accountIds,
      this.#maxConcurrency,
      (id) => this.#fetchAccount(id),
    );
  }

  async #fetchAccount(accountId: string): Promise<PayoutAccountRow | null> {
    this.#requests++;
    const response = await fetch(
      `https://api.stripe.com/v1/accounts/${encodeURIComponent(accountId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.#secretKey}`,
          "Stripe-Version": "2023-10-16",
        },
      },
    );

    if (response.status === 404) return null;
    if (!response.ok) {
      // A degraded payout panel must not fail the whole GraphQL response; the
      // resolver turns null into a nullable field.
      console.error(
        `stripe account ${accountId} failed: ${response.status}`,
      );
      return null;
    }

    const account = await response.json();
    return {
      id: account.id,
      charges_enabled: Boolean(account.charges_enabled),
      payouts_enabled: Boolean(account.payouts_enabled),
      details_submitted: Boolean(account.details_submitted),
      requirements_due: account.requirements?.currently_due ?? [],
    };
  }
}

/** Used when no Stripe key is configured; payout fields resolve to null. */
export class NullPayoutSource implements PayoutSource {
  readonly requestCount = 0;
  fetchAccounts(accountIds: readonly string[]) {
    return Promise.resolve(accountIds.map(() => null));
  }
}
