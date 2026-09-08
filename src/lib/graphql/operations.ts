/**
 * Query documents and their result types.
 *
 * Types are written by hand to match the schema in
 * `supabase/functions/graphql/schema.ts`. Keep the two in step — the gateway
 * tests will not catch a drift here, only a runtime shape mismatch will.
 */

export interface GqlProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  major: string | null;
  graduationYear: string | null;
}

export interface GqlCourse {
  id: string;
  courseNumber: string;
  courseTitle: string | null;
  department: string | null;
}

export interface GqlReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: Pick<GqlProfile, "id" | "displayName" | "avatarUrl"> | null;
}

export interface GqlTutorSummary {
  id: string;
  displayName: string;
  bio: string | null;
  hourlyRate: number | null;
  averageRating: number | null;
  availableOnline: boolean | null;
  availableInPerson: boolean | null;
  subjects: string[];
  profile: Pick<GqlProfile, "avatarUrl" | "major" | "graduationYear"> | null;
  reviewStats: { count: number; average: number | null };
}

export interface TutorDirectoryResult {
  tutors: {
    totalCount: number;
    hasNextPage: boolean;
    nodes: GqlTutorSummary[];
  };
}

/**
 * The tutor directory in one round trip.
 *
 * The equivalent REST path is a tutors select, then a profiles select, then a
 * review aggregate per tutor.
 */
export const TUTOR_DIRECTORY_QUERY = /* GraphQL */ `
  query TutorDirectory($filter: TutorFilter, $first: Int!, $offset: Int!) {
    tutors(filter: $filter, first: $first, offset: $offset) {
      totalCount
      hasNextPage
      nodes {
        id
        displayName
        bio
        hourlyRate
        averageRating
        availableOnline
        availableInPerson
        subjects
        profile {
          avatarUrl
          major
          graduationYear
        }
        reviewStats {
          count
          average
        }
      }
    }
  }
`;

export interface GqlTutorDetail extends GqlTutorSummary {
  courses: GqlCourse[];
  badges: { id: string; type: string; earnedDate: string }[];
  reviews: GqlReview[];
}

export interface TutorProfileResult {
  tutor: GqlTutorDetail | null;
}

/**
 * A tutor page with courses, badges, reviews, and every reviewer's profile.
 * Naively this is 1 + 1 + 1 + N queries; the gateway serves it in four.
 */
export const TUTOR_PROFILE_QUERY = /* GraphQL */ `
  query TutorProfile($id: ID!, $reviewCount: Int!) {
    tutor(id: $id) {
      id
      displayName
      bio
      hourlyRate
      averageRating
      availableOnline
      availableInPerson
      subjects
      profile {
        avatarUrl
        major
        graduationYear
      }
      reviewStats {
        count
        average
      }
      courses {
        id
        courseNumber
        courseTitle
        department
      }
      badges {
        id
        type
        earnedDate
      }
      reviews(first: $reviewCount) {
        id
        rating
        comment
        createdAt
        reviewer {
          id
          displayName
          avatarUrl
        }
      }
    }
  }
`;

export interface GqlSession {
  id: string;
  startTime: string;
  endTime: string;
  status: string | null;
  sessionType: string | null;
  zoomJoinUrl: string | null;
  tutor: { id: string; displayName: string } | null;
  student: { id: string; displayName: string } | null;
}

export interface ViewerScheduleResult {
  me: {
    id: string;
    isTutor: boolean;
    profile: GqlProfile | null;
    tutorSessions: GqlSession[];
    studentSessions: GqlSession[];
  } | null;
}

/** Both sides of the schedule, plus every counterparty's name, in one call. */
export const VIEWER_SCHEDULE_QUERY = /* GraphQL */ `
  query ViewerSchedule($status: SessionStatus) {
    me {
      id
      isTutor
      profile {
        id
        displayName
        avatarUrl
        major
        graduationYear
      }
      tutorSessions(status: $status) {
        id
        startTime
        endTime
        status
        sessionType
        zoomJoinUrl
        student {
          id
          displayName
        }
      }
      studentSessions(status: $status) {
        id
        startTime
        endTime
        status
        sessionType
        zoomJoinUrl
        tutor {
          id
          displayName
        }
      }
    }
  }
`;
