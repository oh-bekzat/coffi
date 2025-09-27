import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Redirect, useSegments, useRouter } from 'expo-router';
import LoadingSpinner from './LoadingSpinner';
import { View } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectPath?: string;
}

type AppRoute = '/auth' | '/cashier' | '/map' | '/bag' | '/' | '/subscription';

/**
 * Authentication and role-based access control component.
 * Handles authentication state and role-based routing in a single place.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole, redirectPath }) => {
  const { isAuthenticated, role, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  const currentPath = '/' + segments.join('/');
  const isAuthRoute = currentPath.startsWith('/auth');
  const isCashierRoute = currentPath.startsWith('/cashier');
  const isBagRoute = currentPath === '/bag';
  const isProfileRoute = currentPath === '/profile';
  const isSubscriptionRoute = currentPath === '/subscription';
  const isProtectedRoute = isBagRoute || isProfileRoute || isCashierRoute || isSubscriptionRoute;
  const isUserRoute = !isCashierRoute && !isAuthRoute;
  
  // Handle role-based routing
  useEffect(() => {
    if (!isLoading) {
      if (role === 'cashier' && isUserRoute) {
        router.replace('/cashier' as AppRoute);
      } else if (role !== 'cashier' && isCashierRoute) {
        router.replace('/map' as AppRoute);
      }
    }
  }, [role, isUserRoute, isCashierRoute, isLoading, router]);

  // Show loading state while authentication is checking
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  // Handle authentication for protected routes only
  if (!isAuthenticated && isProtectedRoute) {
    return <Redirect href="/auth" />;
  }

  // Allow authenticated users to access auth routes
  if (isAuthRoute && isAuthenticated) {
    return <>{children}</>;
  }

  // Handle role-based access control for protected routes
  if (requiredRole && role !== requiredRole) {
    const homePath = role === 'cashier' ? "/cashier" : "/map";
    return <Redirect href={(redirectPath || homePath) as AppRoute} />;
  }

  return <>{children}</>;
};

export default AuthGuard;