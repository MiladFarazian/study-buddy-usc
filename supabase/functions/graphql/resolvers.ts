/**
 * Resolvers.
 *
 * Every resolver that crosses an entity boundary goes through a loader. A
 * resolver is called once per parent object, so a direct query here is an N+1
 * by construction — `Review.reviewer` is called once per review, and there may
 * be hundreds in a single response.
 */

import { GraphQLScalarType, Kind } from "graphql";
import type { GatewayContext } from "./context.ts";
import { primeProfiles, primeTutors } from "./loaders.ts";
import type {
  BadgeRow,
  ProfileRow,
  ReviewRow,
  SessionRow,
  TutorCourseRow,
  TutorRow,
} from "./sources/types.ts";

const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "An ISO-8601 timestamp.",
  serialize: (value) =>
    value instanceof Date ? value.toISOString() : String(value),
  parseValue: (value) => new Date(String(value)),
  parseLiteral: (node) =>
    node.kind === Kind.STRING ? new Date(node.value) : null,
});

const displayName = (
  first: string | null | undefined,
  last: string | null | undefined,
  fallback: string,
) => `${first ?? ""} ${last ?? ""}`.trim() || fallback;

interface TutorFilter {
  search?: string | null;
  courseNumbers?: string[] | null;
  department?: string | null;
  maxHourlyRate?: number | null;
  minRating?: number | null;
  availableOnline?: boolean | null;
  availableInPerson?: boolean | null;
}

/**
 * `tutors` reads profiles rather than the tutors table because availability and
 * course subjects live on the profile. The two rows are then zipped, and both
 * caches are primed so `tutor { profile { ... } }` costs nothing extra.
 */
async function listTutors(
  context: GatewayContext,
  filter: TutorFilter | null | undefined,
  first: number,
  offset: number,
) {
  const profiles = await context.db.select<ProfileRow>("profiles", {
    eq: { approved_tutor: true },
    orderBy: { column: "average_rating", ascending: false },
  });

  const tutors = await context.db.selectIn<TutorRow>(
    "tutors",
    "profile_id",
    profiles.map((profile) => profile.id),
  );

  primeProfiles(context.loaders, profiles);
  primeTutors(context.loaders, tutors);

  const tutorsByProfileId = new Map(
    tutors.map((tutor) => [tutor.profile_id, tutor]),
  );

  let rows = profiles
    .map((profile) => ({ profile, tutor: tutorsByProfileId.get(profile.id) }))
    .filter((row) => row.tutor !== undefined)
    .filter((row) => row.tutor!.profile_visibility !== "private");

  if (filter) {
    const {
      search,
      courseNumbers,
      department,
      maxHourlyRate,
      minRating,
      availableOnline,
      availableInPerson,
    } = filter;

    if (search) {
      const needle = search.toLowerCase();
      rows = rows.filter(({ profile, tutor }) =>
        [
          profile.first_name,
          profile.last_name,
          profile.major,
          tutor!.bio ?? profile.tutor_bio,
        ].some((value) => value?.toLowerCase().includes(needle))
      );
    }

    if (courseNumbers?.length) {
      const wanted = new Set(courseNumbers.map((c) => c.toUpperCase()));
      rows = rows.filter(({ profile, tutor }) =>
        [...(profile.tutor_courses_subjects ?? []), ...(tutor!.subjects ?? [])]
          .some((subject) => wanted.has(subject.toUpperCase()))
      );
    }

    if (department) {
      const prefix = department.toUpperCase();
      rows = rows.filter(({ profile, tutor }) =>
        [...(profile.tutor_courses_subjects ?? []), ...(tutor!.subjects ?? [])]
          .some((subject) => subject.toUpperCase().startsWith(prefix))
      );
    }

    if (maxHourlyRate != null) {
      rows = rows.filter(({ profile, tutor }) =>
        (tutor!.hourly_rate ?? profile.hourly_rate ?? 0) <= maxHourlyRate
      );
    }

    if (minRating != null) {
      rows = rows.filter(({ profile, tutor }) =>
        (tutor!.average_rating ?? profile.average_rating ?? 0) >= minRating
      );
    }

    if (availableOnline === true) {
      rows = rows.filter(({ profile }) => profile.available_online === true);
    }

    if (availableInPerson === true) {
      rows = rows.filter(({ profile }) => profile.available_in_person === true);
    }
  }

  const totalCount = rows.length;
  const page = rows.slice(offset, offset + first);

  return {
    nodes: page.map((row) => row.tutor!),
    totalCount,
    hasNextPage: offset + first < totalCount,
  };
}

export const resolvers = {
  DateTime,

  Query: {
    me: (_parent: unknown, _args: unknown, context: GatewayContext) =>
      context.viewer,

    tutor: async (
      _parent: unknown,
      args: { id: string },
      context: GatewayContext,
    ) => await context.loaders.tutorByProfileId.load(args.id),

    tutors: async (
      _parent: unknown,
      args: { filter?: TutorFilter | null; first?: number; offset?: number },
      context: GatewayContext,
    ) =>
      await listTutors(
        context,
        args.filter,
        Math.min(args.first ?? 20, 100),
        args.offset ?? 0,
      ),
  },

  Viewer: {
    id: (viewer: { id: string }) => viewer.id,

    profile: async (
      viewer: { id: string },
      _args: unknown,
      context: GatewayContext,
    ) => await context.loaders.profileById.load(viewer.id),

    isTutor: async (
      viewer: { id: string },
      _args: unknown,
      context: GatewayContext,
    ) => {
      const profile = await context.loaders.profileById.load(viewer.id);
      return profile?.approved_tutor === true;
    },

    tutorSessions: async (
      viewer: { id: string },
      args: { status?: string | null },
      context: GatewayContext,
    ) =>
      await context.loaders.sessionsByUser.load({
        userId: viewer.id,
        role: "tutor",
        status: args.status ?? undefined,
      }),

    studentSessions: async (
      viewer: { id: string },
      args: { status?: string | null },
      context: GatewayContext,
    ) =>
      await context.loaders.sessionsByUser.load({
        userId: viewer.id,
        role: "student",
        status: args.status ?? undefined,
      }),
  },

  Profile: {
    firstName: (profile: ProfileRow) => profile.first_name,
    lastName: (profile: ProfileRow) => profile.last_name,
    displayName: (profile: ProfileRow) =>
      displayName(profile.first_name, profile.last_name, "USC Student"),
    avatarUrl: (profile: ProfileRow) => profile.avatar_url,
    graduationYear: (profile: ProfileRow) => profile.graduation_year,
    bio: (profile: ProfileRow) =>
      profile.approved_tutor
        ? profile.tutor_bio ?? profile.bio
        : profile.student_bio ?? profile.bio,
    createdAt: (profile: ProfileRow) => profile.created_at,
  },

  Tutor: {
    // A tutor is addressed by profile id everywhere in the app; keeping that
    // as the GraphQL id means client cache keys line up with route params.
    id: (tutor: TutorRow) => tutor.profile_id,

    profile: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) => await context.loaders.profileById.load(tutor.profile_id),

    firstName: (tutor: TutorRow) => tutor.first_name,
    lastName: (tutor: TutorRow) => tutor.last_name,
    displayName: (tutor: TutorRow) =>
      displayName(tutor.first_name, tutor.last_name, "USC Tutor"),
    bio: (tutor: TutorRow) => tutor.bio,
    hourlyRate: (tutor: TutorRow) => tutor.hourly_rate,
    averageRating: (tutor: TutorRow) => tutor.average_rating,

    availableInPerson: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) =>
      (await context.loaders.profileById.load(tutor.profile_id))
        ?.available_in_person ?? null,

    availableOnline: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) =>
      (await context.loaders.profileById.load(tutor.profile_id))
        ?.available_online ?? null,

    subjects: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) => {
      const profile = await context.loaders.profileById.load(tutor.profile_id);
      const merged = new Set([
        ...(profile?.tutor_courses_subjects ?? []),
        ...(tutor.subjects ?? []),
      ]);
      return [...merged];
    },

    courses: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) => await context.loaders.coursesByTutorId.load(tutor.profile_id),

    badges: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) => await context.loaders.badgesByTutorId.load(tutor.profile_id),

    reviews: async (
      tutor: TutorRow,
      args: { first?: number },
      context: GatewayContext,
    ) => {
      const reviews = await context.loaders.reviewsByTutorId.load(
        tutor.profile_id,
      );
      return reviews.slice(0, Math.min(args.first ?? 10, 100));
    },

    reviewStats: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) => {
      const reviews = await context.loaders.reviewsByTutorId.load(
        tutor.profile_id,
      );
      if (reviews.length === 0) return { count: 0, average: null };
      const total = reviews.reduce((sum, review) => sum + review.rating, 0);
      return {
        count: reviews.length,
        average: Number((total / reviews.length).toFixed(2)),
      };
    },

    payoutAccount: async (
      tutor: TutorRow,
      _args: unknown,
      context: GatewayContext,
    ) => {
      // Payout readiness is the tutor's own business. RLS does not cover
      // Stripe, so the check has to happen here.
      if (!context.viewer || context.viewer.id !== tutor.profile_id) return null;
      if (!tutor.stripe_connect_id) return null;
      return await context.loaders.payoutAccountById.load(
        tutor.stripe_connect_id,
      );
    },
  },

  Course: {
    courseNumber: (course: TutorCourseRow) => course.course_number,
    courseTitle: (course: TutorCourseRow) => course.course_title,
    instructor: (course: TutorCourseRow) => course.instructor,
  },

  Badge: {
    type: (badge: BadgeRow) => badge.badge_type,
    earnedDate: (badge: BadgeRow) => badge.earned_date,
  },

  Review: {
    createdAt: (review: ReviewRow) => review.created_at,

    // Called once per review. Without the loader, rendering 100 reviews across
    // 20 tutors is 2,000 point lookups; with it, one batched query.
    reviewer: async (
      review: ReviewRow,
      _args: unknown,
      context: GatewayContext,
    ) => await context.loaders.profileById.load(review.reviewer_id),
  },

  Session: {
    startTime: (session: SessionRow) => session.start_time,
    endTime: (session: SessionRow) => session.end_time,
    paymentStatus: (session: SessionRow) => session.payment_status,
    sessionType: (session: SessionRow) => session.session_type,
    zoomJoinUrl: (session: SessionRow) => session.zoom_join_url,
    courseId: (session: SessionRow) => session.course_id,

    tutor: async (
      session: SessionRow,
      _args: unknown,
      context: GatewayContext,
    ) => await context.loaders.tutorByProfileId.load(session.tutor_id),

    student: async (
      session: SessionRow,
      _args: unknown,
      context: GatewayContext,
    ) => await context.loaders.profileById.load(session.student_id),
  },

  PayoutAccount: {
    chargesEnabled: (account: { charges_enabled: boolean }) =>
      account.charges_enabled,
    payoutsEnabled: (account: { payouts_enabled: boolean }) =>
      account.payouts_enabled,
    detailsSubmitted: (account: { details_submitted: boolean }) =>
      account.details_submitted,
    requirementsDue: (account: { requirements_due: string[] }) =>
      account.requirements_due,
  },
};
