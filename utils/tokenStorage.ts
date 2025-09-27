import * as SecureStore from "expo-secure-store";

// Consistent key names
export const ACCESS_TOKEN_KEY = "auth_access_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";
export const EXPIRY_TIME_KEY = "auth_expiry_time";
export const ROLE_KEY = "auth_role";

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getExpiryTime(): Promise<string | null> {
  return await SecureStore.getItemAsync(EXPIRY_TIME_KEY);
}

export async function getRole(): Promise<string | null> {
  return await SecureStore.getItemAsync(ROLE_KEY);
}

export async function saveTokenData(
  accessToken: string, 
  refreshToken: string, 
  expiresAt: string,
  role: string
): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  await SecureStore.setItemAsync(EXPIRY_TIME_KEY, expiresAt);
  await SecureStore.setItemAsync(ROLE_KEY, role);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPIRY_TIME_KEY);
  await SecureStore.deleteItemAsync(ROLE_KEY);
}