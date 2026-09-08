/**
 * Gateway schema.
 *
 * One graph over two services: tutoring data in Postgres and payout state in
 * Stripe Connect. Clients ask for a tutor and their payout status in one query;
 * the gateway fans out and batches.
 */

export const typeDefs = /* GraphQL */ `
  scalar DateTime

  type Query {
    "The signed-in user, or null when the request is anonymous."
    me: Viewer

    "A single tutor by profile id."
    tutor(id: ID!): Tutor

    "Approved, publicly visible tutors."
    tutors(filter: TutorFilter, first: Int = 20, offset: Int = 0): TutorPage!
  }

  type Viewer {
    id: ID!
    profile: Profile
    isTutor: Boolean!
    "Sessions where the viewer is the tutor. Tutors only."
    tutorSessions(status: SessionStatus): [Session!]!
    "Sessions where the viewer is the student."
    studentSessions(status: SessionStatus): [Session!]!
  }

  type Profile {
    id: ID!
    firstName: String
    lastName: String
    displayName: String!
    avatarUrl: String
    major: String
    graduationYear: String
    bio: String
    createdAt: DateTime!
  }

  type Tutor {
    id: ID!
    profile: Profile
    firstName: String
    lastName: String
    displayName: String!
    bio: String
    hourlyRate: Float
    averageRating: Float
    availableInPerson: Boolean
    availableOnline: Boolean
    subjects: [String!]!
    courses: [Course!]!
    badges: [Badge!]!
    reviews(first: Int = 10): [Review!]!
    reviewStats: ReviewStats!
    """
    Stripe Connect payout status. Resolves to null unless the viewer is this
    tutor — payout readiness is not public data.
    """
    payoutAccount: PayoutAccount
  }

  type TutorPage {
    nodes: [Tutor!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  input TutorFilter {
    "Case-insensitive match against name, major, or bio."
    search: String
    "Course numbers, e.g. [\\"CSCI-201\\"]. A tutor matches if they teach any."
    courseNumbers: [String!]
    department: String
    maxHourlyRate: Float
    minRating: Float
    availableOnline: Boolean
    availableInPerson: Boolean
  }

  type Course {
    id: ID!
    courseNumber: String!
    courseTitle: String
    department: String
    instructor: String
  }

  type Badge {
    id: ID!
    type: String!
    earnedDate: DateTime!
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String
    createdAt: DateTime!
    "The reviewer's profile — the field that makes naive gateways go N+1."
    reviewer: Profile
  }

  type ReviewStats {
    count: Int!
    average: Float
  }

  type Session {
    id: ID!
    startTime: DateTime!
    endTime: DateTime!
    status: SessionStatus
    paymentStatus: String
    sessionType: String
    location: String
    zoomJoinUrl: String
    courseId: String
    tutor: Tutor
    student: Profile
  }

  type PayoutAccount {
    id: ID!
    chargesEnabled: Boolean!
    payoutsEnabled: Boolean!
    detailsSubmitted: Boolean!
    requirementsDue: [String!]!
  }

  "Mirrors the public.session_status Postgres enum exactly."
  enum SessionStatus {
    scheduled
    in_progress
    completed
    cancelled
  }
`;
