export interface JobOfferRequestDTO {
  title: string;
  companyName: string;
  status: JobOfferStatus;
  publishedDate?: string;
  notes?: string;
}

export interface JobOfferResponseDTO {
  id: string;
  title: string;
  companyName: string;
  status: JobOfferStatus;
  publishedDate?: string;
  notes?: string;
  ownerId: string;
  candidatureCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobOfferStatusUpdateDTO {
  status: JobOfferStatus;
}

export enum JobOfferStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DRAFT = 'DRAFT'
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
