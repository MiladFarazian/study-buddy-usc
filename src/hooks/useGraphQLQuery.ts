/**
 * Generic hook over the GraphQL gateway.
 *
 * Follows the codebase's existing fetch-in-effect idiom (see `useTutors`) so it
 * drops in beside the REST hooks, but adds the two things those hooks are
 * missing: in-flight requests are aborted when inputs change, and state is
 * never written after unmount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  graphqlRequest,
  GraphQLRequestError,
  type GraphQLRequestOptions,
} from "@/lib/graphql/client";

export interface UseGraphQLQueryOptions extends GraphQLRequestOptions {
  /** Set false to hold the query until its inputs are ready. */
  enabled?: boolean;
}

export interface UseGraphQLQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGraphQLQuery<T>(
  query: string,
  options: UseGraphQLQueryOptions = {},
): UseGraphQLQueryResult<T> {
  const { enabled = true, variables, rejectOnPartialErrors } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Variables are usually an inline object literal, so a new identity arrives
  // every render. Comparing the serialised form keeps the effect from looping.
  const serialisedVariables = JSON.stringify(variables ?? {});

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    graphqlRequest<T>(query, {
      variables: JSON.parse(serialisedVariables),
      signal: controller.signal,
      rejectOnPartialErrors,
    })
      .then((result) => {
        if (controller.signal.aborted || !mountedRef.current) return;
        setData(result);
      })
      .catch((cause: unknown) => {
        // An abort is this hook superseding its own request, not a failure.
        if (controller.signal.aborted || !mountedRef.current) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        const message = cause instanceof GraphQLRequestError
          ? cause.errors.map((e) => e.message).join("; ")
          : cause instanceof Error
          ? cause.message
          : "Request failed";

        console.error("GraphQL query failed:", cause);
        setError(message);
      })
      .finally(() => {
        if (controller.signal.aborted || !mountedRef.current) return;
        setLoading(false);
      });

    return () => controller.abort();
  }, [query, serialisedVariables, enabled, rejectOnPartialErrors, reloadToken]);

  return { data, loading, error, refetch };
}
