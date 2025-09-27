import { useFonts } from "expo-font";
import { Slot, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import "react-native-reanimated";
import "../global.css";

import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, Keyboard } from "react-native";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import BottomSheet, { BottomSheetRefProps } from "../components/BottomSheet";
import { useBottomSheetStore } from "../stores/bottomSheetStore";
import { useAuthStore } from "../stores/authStore";
import { useWebSocketStore, setGlobalQueryClient } from '../hooks/useWebSocket';
import { usePushNotifications } from '../services/notifications';
import { useBagStore } from '../stores/bagStore';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Set the global query client reference
setGlobalQueryClient(queryClient);

const toastConfig = {
  tomatoToast: ({ text1 }: { text1?: string }) => (
    <View className="rounded-full px-4 py-2 justify-center items-center bg-mono_900 border-white border-2">
      <Text className="text-white">{text1 ?? "Default Text"}</Text>
    </View>
  ),
};

function ToastContainer() {
  const insets = useSafeAreaInsets();
  return (
    <Toast
      config={toastConfig}
      topOffset={insets.top + 10}
      bottomOffset={insets.bottom + 10}
    />
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    // console.error("Layout error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E1E' }}>
          <Text style={{ color: 'white', marginBottom: 20 }}>Something went wrong with the app layout.</Text>
          <Text style={{ color: 'white', opacity: 0.7, marginHorizontal: 20 }}>
            {this.state.error ? String(this.state.error) : 'Unknown error'}
          </Text>
        </View>
      );
    }
    
    return this.props.children;
  }
}

/**
 * Root layout component for the entire application.
 */
export default function RootLayout() {
  usePushNotifications();
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();
  
  const [fontLoaded] = useFonts({
    Manrope: require("../assets/fonts/Manrope.ttf"),
  });

  const bottomSheetRef = useRef<BottomSheetRefProps>(null);
  const { isOpen, content, closeSheet } = useBottomSheetStore();
  const { connect, disconnect } = useWebSocketStore();

  // Check auth on mount
  useEffect(() => {
    if (fontLoaded) {
      checkAuth().catch(error => {
        // If auth check fails, just continue loading the app
        // The AuthGuard will handle the redirect to login
      });
    }
  }, [fontLoaded, checkAuth]);

  // Handle bottom sheet
  useEffect(() => {
    if (bottomSheetRef.current) {
      if (isOpen) {
        bottomSheetRef.current.scrollTo(-1);
      } else {
        bottomSheetRef.current.scrollTo(0);
      }
    }
  }, [isOpen, content]);

  // WebSocket connection management
  useEffect(() => {
    // console.log('[_layout] *** WEBSOCKET EFFECT TRIGGERED ***');
    // console.log('[_layout] Auth state - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    // console.log('[_layout] Connect function available:', typeof connect);
    // console.log('[_layout] Disconnect function available:', typeof disconnect);
    
    if (isAuthenticated) {
      // console.log('[_layout] User authenticated, connecting WebSocket');
      connect();
    } else {
      // console.log('[_layout] User not authenticated, disconnecting WebSocket');
      disconnect();
    }
    
    return () => {
      // console.log('[_layout] *** WEBSOCKET EFFECT CLEANUP ***');
      if (isAuthenticated) {
        // console.log('[_layout] Cleanup - disconnecting WebSocket');
        disconnect();
      }
    };
  }, [isAuthenticated]);

  // Note: Removed forced bag state update - now handled by proper hydration in bagStore

  // Always render the basic layout structure first
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#1D1D1D' }}>
          <View 
            style={{ flex: 1, backgroundColor: '#1D1D1D' }}
            onTouchStart={(e) => {
              // Dismiss keyboard when tapping outside of bottomsheet content
              // The bottomsheet will handle its own keyboard dismissal
              const target = e.target as any;
              
              // Check if the touch is within bottomsheet area by checking if target has bottomsheet-related properties
              const isBottomSheetContent = target?._nativeTag && 
                (target.constructor?.name?.includes('Animated') || 
                 target.constructor?.name?.includes('Pressable'));
              
              // Only dismiss keyboard if not touching bottomsheet content
              if (!isBottomSheetContent) {
                Keyboard.dismiss();
              }
            }}
          >
            <Slot />
          </View>
          <StatusBar style="light" />
          <ToastContainer />
          <BottomSheet 
            ref={bottomSheetRef} 
            onClose={closeSheet} 
            locationPath={pathname}
            useFixedHeight={true}
            initialHeight={0.6}
          >
            {content || <></>}
          </BottomSheet>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}