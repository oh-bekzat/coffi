import { useAuthStore } from '../stores/authStore';
import { router } from 'expo-router';

/**
 * Utility function to check if user is authenticated before performing an action.
 * If user is not authenticated, redirects to auth screen and returns false.
 * If user is authenticated, returns true.
 * 
 * @returns boolean - Whether the user is authenticated
 */
export function requireAuth(): boolean {
  const { isAuthenticated } = useAuthStore.getState();
  
  if (!isAuthenticated) {
    router.push('/auth');
    return false;
  }
  
  return true;
} 