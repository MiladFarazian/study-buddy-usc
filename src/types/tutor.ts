
export interface Subject {
  code: string;
  name: string;
  instructor?: string;
}

export interface Tutor {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  field: string;
  rating: number;
  hourlyRate: number;
  subjects: Subject[];
  imageUrl: string;
  bio?: string;
  graduationYear?: string;
  available_in_person?: boolean;
  available_online?: boolean;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  tutorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
