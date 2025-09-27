import React from 'react';
import { Slot } from 'expo-router';
import AuthGuard from '../../components/AuthGuard';

/**
 * Layout for cashier routes
 * Uses AuthGuard for protecting cashier routes
 */
export default function CashierLayout() {
  return (
    <AuthGuard requiredRole="cashier">
      <Slot />
    </AuthGuard>
  );
} 