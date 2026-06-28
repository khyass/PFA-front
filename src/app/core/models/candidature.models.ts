export interface CandidatureRequestDTO {
  jobOfferId: string;
  coverLetter: string;
  resumeUrl?: string;
}

export interface CandidatureUpdateDTO {
  coverLetter: string;
}

export interface CandidatureResponseDTO {
  id: string;
  jobOfferId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  candidateName?: string;
  coverLetter: string;
  resumeUrl?: string;
  status: CandidatureStatus;
  appliedDate: string;
  lastStatusChange: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryDTO {
  id: string;
  status: CandidatureStatus;
  changedAt: string;
  changedBy?: string;
  comment?: string;
}

export enum CandidatureStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface CandidatureDTO {
  id: string;
  jobOfferId: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  coverLetter: string;
  resumeUrl?: string;
  status: CandidatureStatus;
  appliedDate: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
