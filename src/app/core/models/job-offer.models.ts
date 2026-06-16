export interface JobOfferRequestDTO {
  title: string;
  description: string;
  companyName: string;
  location: string;
  contractType: ContractType;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  status: JobOfferStatus;
}

export interface JobOfferResponseDTO {
  id: string;
  title: string;
  description: string;
  companyName: string;
  location: string;
  contractType: ContractType;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  status: JobOfferStatus;
  publishedDate: string;
  ownerId: string;
  candidatureCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobOfferStatusUpdateDTO {
  status: JobOfferStatus;
}

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'STAGE',
  ALTERNANCE = 'ALTERNANCE',
  FREELANCE = 'FREELANCE'
}

export enum ExperienceLevel {
  JUNIOR = 'JUNIOR',
  INTERMEDIATE = 'INTERMEDIATE',
  SENIOR = 'SENIOR',
  EXPERT = 'EXPERT'
}

export enum JobOfferStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
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
