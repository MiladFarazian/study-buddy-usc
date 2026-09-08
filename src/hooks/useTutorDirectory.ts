/**
 * Tutor directory, served by the GraphQL gateway.
 *
 * The REST equivalent (`useTutors`) fetches tutors, joins profiles, then reads
 * review aggregates. This asks for the same screen in one request and lets the
 * gateway batch the fan-out.
 */

import { useMemo } from "react";
import { useGraphQLQuery } from "./useGraphQLQuery";
import {
  TUTOR_DIRECTORY_QUERY,
  type TutorDirectoryResult,
} from "@/lib/graphql/operations";

export interface TutorDirectoryFilter {
  search?: string;
  courseNumbers?: string[];
  department?: string;
  maxHourlyRate?: number;
  minRating?: number;
  availableOnline?: boolean;
  availableInPerson?: boolean;
}

export interface UseTutorDirectoryOptions {
  filter?: TutorDirectoryFilter;
  pageSize?: number;
  page?: number;
  enabled?: boolean;
}

export function useTutorDirectory(options: UseTutorDirectoryOptions = {}) {
  const { filter, pageSize = 20, page = 0, enabled = true } = options;

  // Drop empty entries so an unset filter control doesn't narrow the query.
  const activeFilter = useMemo(() => {
    if (!filter) return null;
    const entries = Object.entries(filter).filter(([, value]) =>
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    );
    return entries.length ? Object.fromEntries(entries) : null;
  }, [filter]);

  const { data, loading, error, refetch } = useGraphQLQuery<TutorDirectoryResult>(
    TUTOR_DIRECTORY_QUERY,
    {
      enabled,
      variables: {
        filter: activeFilter,
        first: pageSize,
        offset: page * pageSize,
      },
    },
  );

  return {
    tutors: data?.tutors.nodes ?? [],
    totalCount: data?.tutors.totalCount ?? 0,
    hasNextPage: data?.tutors.hasNextPage ?? false,
    loading,
    error,
    refetch,
  };
}
