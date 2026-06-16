export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCandidateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface RegisterEnterpriseRequest {
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  phoneNumber?: string;
  website?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userProfile: UserProfile;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  roles: string[];
  profileComplete: boolean;
}

export enum UserRole {
  CANDIDATE = 'ROLE_CANDIDATE',
  ENTREPRISE = 'ROLE_ENTREPRISE',
  ADMIN = 'ROLE_ADMIN'
}
