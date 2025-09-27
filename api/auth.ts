import { fetchApi } from "./fetch";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  role: string;
}

interface LoginRequest {
  phoneNumber: string;
}

interface LoginResponse {
  userId: string;
  role: string;
  code: string;
  hasSubscription: boolean;
}

export interface ConfirmCodeRequest {
  userId: string;
  code?: string;
  password?: string;
}
  
export interface ConfirmCodeResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  isNewUser: boolean;
  role: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return fetchApi<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  }, false);
};

export const logout = async () => {
  try {
    return fetchApi("/auth/logout", { method: "POST" });
  } catch (error) {
    // console.warn("Logout API call failed:", error);
    return { error: "Logout failed", details: error };
  }
};

export const deleteAccount = async () => {
  return fetchApi("/client", { method: "DELETE" });
};

export const confirmCode = async (data: ConfirmCodeRequest): Promise<ConfirmCodeResponse> => {
  return fetchApi<ConfirmCodeResponse>("/auth/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  }, false);
};

export const refreshToken = async (request: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
  return fetchApi<RefreshTokenResponse>("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify(request),
  }, false);
};