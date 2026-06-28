export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCandidateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  skills?: string[];
}

export interface RegisterEnterpriseRequest {
  email: string;
  password: string;
  companyName: string;
  industry?: string;
  website?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user_profile: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  roles: string[];
  attributes?: any;
}

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  ENTERPRISE = 'ENTERPRISE',
  ADMIN = 'ADMIN'
}
