import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, confirmCode, logout as apiLogout, deleteAccount } from "../api/auth";
import { useAuthStore } from '../stores/authStore';
import { router } from "expo-router";
import { useCallback } from "react";
import { getFCMToken } from "../services/notifications";
import { saveTokenToServer } from "../services/notifications";

interface LoginRequest {
  phoneNumber: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
  });
};

export function useConfirmCode() {
  const { login: storeLogin } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: confirmCode,
    onSuccess: async (response) => {
      try {
        // Ensure role is not empty
        const role = response.role || 'client';
        
        // Store login information
        await storeLogin(
          response.accessToken,
          response.refreshToken,
          response.expiresAt,
          role,
        );
        
        // Get and save FCM token right after successful authentication
        try {
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            await saveTokenToServer(fcmToken, response.accessToken);
            // console.log('FCM token saved to server successfully');
          }
        } catch (fcmError) {
          // console.error('Error handling FCM token:', fcmError);
          // Continue with login flow even if FCM fails
        }
        
        // Clear queries
        queryClient.clear();
        
        // Return the login response for the component to handle navigation
        return response;
      } catch (error) {
        // console.error('Error in confirm code success handler:', error);
        throw error;
      }
    }
  });
}

/**
 * A hook that provides a logout function.
 * Important: This does NOT use onSuccess for navigation to avoid timing issues.
 */
export const useLogout = () => {
  const logoutFromStore = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  
  // Create a memoized logout function that handles everything
  const logout = useCallback(async () => {
    // console.log("Beginning logout process");
    
    try {
      // Navigate to auth FIRST, before any state changes
      // This ensures we don't try to navigate after unmounting
      // console.log("Navigating to auth screen BEFORE state changes");
      router.replace("/auth");
      
      // Call API logout (fire and forget)
      apiLogout().catch((e) => {
        // console.warn("API logout failed:", e);
      });
      
      // Cancel and clear queries
      await queryClient.cancelQueries();
      queryClient.clear();
      
      // Finally clear auth state
      await logoutFromStore();
      
      // console.log("Logout completed");
    } catch (error) {
      // console.error("Error during logout:", error);
    }
  }, [logoutFromStore, queryClient]);
  
  // Return a mutation that doesn't use onSuccess for navigation
  return useMutation({
    mutationFn: logout,
  });
};

export function useDeleteAccount() {
  const logoutFromStore = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  
  const deleteAccountAndLogout = useCallback(async () => {
    try {
      // Navigate to auth FIRST, before any state changes
      router.replace("/auth");
      
      // Call API delete account (fire and forget)
      deleteAccount().catch((e) => {
        // console.warn("API delete account failed:", e);
      });
      
      // Cancel and clear queries
      await queryClient.cancelQueries();
      queryClient.clear();
      
      // Finally clear auth state
      await logoutFromStore();
    } catch (error) {
      // console.error("Error during account deletion:", error);
    }
  }, [logoutFromStore, queryClient]);
  
  return useMutation({
    mutationFn: deleteAccountAndLogout,
  });
}

// Utility function for components to handle logout
export const handleLogout = (logoutMutation: any, closeSheet?: () => void) => {
  if (closeSheet) closeSheet();
  logoutMutation.mutate();
};