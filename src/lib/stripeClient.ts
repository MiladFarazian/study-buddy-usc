import { loadStripe, type Stripe } from "@stripe/stripe-js";

let cache: { pk: string; p: Promise<Stripe | null> } | null = null;

export function getStripe(pk: string): Promise<Stripe | null> {
  if (!cache || cache.pk !== pk) {
    console.log('[stripe] Creating new loadStripe promise for pk ending:', pk.slice(-6));
    cache = { pk, p: loadStripe(pk) };
  }
  return cache.p;
}