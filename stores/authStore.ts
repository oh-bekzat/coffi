import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { saveTokenData, clearTokens, getAccessToken, getExpiryTime, getRefreshToken, getRole } from "../utils/tokenStorage";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerAuthHandlers } from "../api/fetch";
import { jwtDecode } from "jwt-decode";
import { JWTPayload } from "../types/auth";
import { refreshToken as refreshTokenApi } from "../api/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  cafe_id: string | null;
  isRefreshing: boolean;
  lastRefreshTime: number | null;
  
  // Core functions
  checkAuth: () => Promise<void>;
  login: (accessToken: string, refreshToken: string, expiresAt: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
}

// Storage implementation that works with Expo Secure Store
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return null;
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    await SecureStore.deleteItemAsync(name);
  },
};

// Use AsyncStorage for non-sensitive metadata
const hybridStorage = {
  getItem: async (key: string) => {
    try {
      const secureValue = await secureStorage.getItem(key);
      if (secureValue !== null) return secureValue;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      // console.error('Storage error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (key.includes('token') || key.includes('auth')) {
        await secureStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      // console.error('Storage error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await secureStorage.removeItem(key);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // console.error('Storage error:', error);
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,
      cafe_id: null,
      isRefreshing: false,
      lastRefreshTime: null,
      
      refreshSession: async () => {
        // Check if refresh is already in progress
        if (get().isRefreshing) {
          // console.log("🔄 Token refresh already in progress, waiting...");
          
          // Wait for the current refresh to complete (poll every 100ms)
          let attempts = 0;
          while (get().isRefreshing && attempts < 50) { // 5 second timeout
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          // If refreshing is complete and we have a token, return it
          if (!get().isRefreshing && get().accessToken) {
            // console.log("✅ Using token from completed refresh");
            return get().accessToken;
          }
          
          // If timeout reached but still refreshing, something is wrong
          if (get().isRefreshing) {
            // console.error("⏱️ Refresh timeout reached, forcing new refresh");
          }
        }
        
        // Set refreshing flag to true
        set({ isRefreshing: true });
        // console.log("🔑 Starting token refresh");
        
        const currentRefreshToken = get().refreshToken || await getRefreshToken();
        if (!currentRefreshToken) {
          set({ isRefreshing: false });
          // console.log("❌ No refresh token available");
          return null;
        }
        
        try {
          const response = await refreshTokenApi({ refreshToken: currentRefreshToken });
          // console.log("✅ Token refresh successful");
          
          await saveTokenData(
            response.accessToken,
            response.refreshToken,
            response.expiresAt,
            get().role || ""
          );
          
          const role = get().role || "";
          
          // Extract cafe_id from token if role is cashier
          let cafe_id = null;
          if (role === 'cashier') {
            try {
              const decoded = jwtDecode<JWTPayload>(response.accessToken);
              cafe_id = decoded.cafe_id || null;
            } catch (e) {
              // console.error("Error decoding JWT during refresh:", e);
            }
          }
          
          // Update store with new tokens and completion status
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresAt: response.expiresAt,
            isAuthenticated: true,
            cafe_id,
            isRefreshing: false,
            lastRefreshTime: Date.now()
          });
          
          // Re-register auth handlers with fresh token
          registerAuthHandlers(
            async () => response.accessToken,
            get().refreshSession,
            get().logout
          );
          
          return response.accessToken;
        } catch (error) {
          // console.error("❌ Token refresh failed:", error);
          
          // Clear tokens immediately on failure
          await clearTokens();
          
          // Update state to force logout, but don't try to navigate here
          set({
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            role: null,
            cafe_id: null,
            isRefreshing: false
          });
          
          return null;
        }
      },
      
      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const token = await getAccessToken();
          const refreshTokenValue = await getRefreshToken();
          const expiryTime = await getExpiryTime();
          const userRole = await getRole();
          
          // If no tokens exist, clear everything and return early
          if (!token || !refreshTokenValue || !expiryTime) {
            await clearTokens();
            set({
              accessToken: null,
              refreshToken: null,
              expiresAt: null,
              isAuthenticated: false,
              role: null,
              cafe_id: null,
              isLoading: false
            });
            return;
          }
          
          // Check if token is expired
          const expiry = new Date(expiryTime).getTime();
          const currentTime = Date.now();
          const tokenLifetime = expiry - currentTime;
          
          // console.log(`🔐 Token lifetime: ${Math.floor(tokenLifetime / 1000 / 60 / 60)} hours`);
          
          // If token is expired, try to refresh it
          if (tokenLifetime <= 0) {
            // console.log("⏰ Token expired, refreshing");
            const newToken = await get().refreshSession();
            if (!newToken) {
              // Token refresh failed, clear everything
              await clearTokens();
              set({
                accessToken: null,
                refreshToken: null,
                expiresAt: null,
                isAuthenticated: false,
                role: null,
                cafe_id: null,
                isLoading: false
              });
              return;
            }
            
            // Token was refreshed successfully - state is already updated by refreshSession
            set({ isLoading: false });
            return;
          }
          
          // Calculate minutes, hours, and days until expiry for logging
          const minutesUntilExpiry = Math.floor(tokenLifetime / 1000 / 60);
          const hoursUntilExpiry = Math.floor(minutesUntilExpiry / 60);
          const daysUntilExpiry = Math.floor(hoursUntilExpiry / 24);
          
          // console.log(`⏱️ Token expires in: ${daysUntilExpiry} days, ${hoursUntilExpiry % 24} hours, ${minutesUntilExpiry % 60} minutes`);
          
          // Refresh if token has less than 7 days remaining
          // 7 days in milliseconds = 7 * 24 * 60 * 60 * 1000
          const refreshThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
          const shouldRefresh = tokenLifetime < refreshThreshold;
          
          if (shouldRefresh) {
            // console.log(`🔄 Token has less than 7 days remaining (${Math.floor(tokenLifetime / 86400000)} days left), refreshing proactively`);
            // Refresh token proactively but don't block the flow
            get().refreshSession().catch(err => {
              // console.error("⚠️ Background token refresh failed:", err);
            });
          }
          
          // Token is valid, update state with stored values
          try {
            const decoded = jwtDecode<JWTPayload>(token);
            const cafe_id = decoded.cafe_id || null;
            
            set({
              accessToken: token,
              refreshToken: refreshTokenValue,
              expiresAt: expiryTime,
              role: userRole,
              cafe_id,
              isLoading: false,
              isAuthenticated: true
            });
            
            registerAuthHandlers(
              async () => get().accessToken, 
              get().refreshSession,
              get().logout
            );
          } catch (error) {
            // console.error("Error decoding JWT:", error);
            set({
              accessToken: token,
              refreshToken: refreshTokenValue,
              expiresAt: expiryTime,
              role: userRole,
              cafe_id: null,
              isLoading: false,
              isAuthenticated: true
            });
            
            registerAuthHandlers(
              async () => get().accessToken,
              get().refreshSession,
              get().logout
            );
          }
        } catch (error) {
          // console.error("Error in checkAuth:", error);
          set({ isLoading: false });
        }
      },
      
      login: async (accessToken, refreshToken, expiresAt, role) => {
        try {
          const cafe_id = role === 'cashier' ? 
            jwtDecode<JWTPayload>(accessToken).cafe_id || null : 
            null;
          
          await saveTokenData(accessToken, refreshToken, expiresAt, role);
          set({
            accessToken,
            refreshToken,
            expiresAt,
            isAuthenticated: true,
            role,
            cafe_id,
          });

          registerAuthHandlers(
            async () => get().accessToken || await getAccessToken(),
            get().refreshSession,
            get().logout
          );
        } catch (error) {
          // console.error('Login error:', error);
          throw new Error('Failed to save authentication data');
        }
      },
      
      logout: async () => {
        try {
          // First set state to immediately update UI
          set({
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            role: null,
            cafe_id: null,
          });
          
          // Then clear tokens from storage
          await clearTokens();
        } catch (error) {
          // console.error('Logout process failed:', error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => hybridStorage)
    }
  )
);