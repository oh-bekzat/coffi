import { useEffect } from 'react';
import { Redirect, SplashScreen } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

// Prevent auto-hiding the splash screen - we'll handle it manually
SplashScreen.preventAutoHideAsync();

/**
 * Root index component - Uses Expo's default splash screen, then determines initial route
 */
export default function Index() {
  const { isAuthenticated, role, isLoading } = useAuthStore();

  useEffect(() => {
    // Hide the splash screen once the app is ready
    const hideSplash = async () => {
      if (!isLoading) {
        await SplashScreen.hideAsync();
      }
    };
    
    hideSplash();
  }, [isLoading]);
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1D1D1D' }}>
        <LoadingSpinner bg="transparent" />
      </View>
    );
  }
  
  // Authenticated users
  if (isAuthenticated) {
    if (role === 'cashier') {
      return <Redirect href="/cashier" />;
    } else {
      return <Redirect href="/map" />;
    }
  }
  
  // Non-authenticated users go to auth (which will check onboarding)
  return <Redirect href="/auth" />;
}