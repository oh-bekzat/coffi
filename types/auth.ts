export interface JWTPayload {
  sub: string;
  exp: number;
  role: string;
  cafe_id?: string;
  [key: string]: any;
}

export type UserRole = 'user' | 'cashier';

export interface User {
  id: string;
  role: UserRole;
  phoneNumber: string;
  email?: string;
  hasSubscription?: boolean;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  cafe_id: string | null;
  
  // Core functions
  checkAuth: () => Promise<void>;
  login: (accessToken: string, refreshToken: string, expiresAt: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
}

export interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    role: string;
    cafe_id?: string;
} 