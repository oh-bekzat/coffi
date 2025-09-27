import { useEffect, useRef } from 'react';
import { useWebSocketStore } from './useWebSocket';
import { useWebSocketHandler } from './useWebSocketHandlers';
import { WebSocketOrderMessage } from '../types/order';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to subscribe to WebSocket messages of a specific type
 * 
 * @param type The message type to subscribe to
 * @param handler The handler function to call when a message is received
 * @param options Additional options
 * @returns An object with connection status
 */
export function useWebSocketSubscription<T extends WebSocketOrderMessage['type']>(
  type: T | undefined,
  handler: (message: Extract<WebSocketOrderMessage, { type: T }>, queryClient: ReturnType<typeof useQueryClient>) => void,
  options: {
    enabled?: boolean;
    onError?: (error: Error) => void;
  } = {}
) {
  const { enabled = true, onError } = options;
  const queryClient = useQueryClient();
  const isMounted = useRef(true);
  const { isConnected } = useWebSocketStore();
  
  // Only log when actually registering (not on every render)
  const shouldRegister = enabled && isConnected;
  
  // Only register handlers if enabled and connected
  useWebSocketHandler(shouldRegister ? type : undefined, (message, queryClient) => {
    if (!isMounted.current) return;
    
    try {
      // console.log('[useWebSocketSubscription] Executing handler for type:', type, 'message:', message);
      handler(message, queryClient);
    } catch (error) {
      console.error(`[useWebSocketSubscription] Error in WebSocket handler for ${type}:`, error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  });
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return {
    isConnected,
    isEnabled: enabled
  };
}

/**
 * Hook to subscribe to multiple WebSocket message types
 * 
 * @param subscriptions Array of subscriptions
 * @returns An object with connection status
 */
export function useWebSocketSubscriptions(
  subscriptions: Array<{
    type: WebSocketOrderMessage['type'] | undefined;
    handler: (message: WebSocketOrderMessage, queryClient: ReturnType<typeof useQueryClient>) => void;
    enabled?: boolean;
  }>
) {
  const isMounted = useRef(true);
  const { isConnected } = useWebSocketStore();
  
  // Register handlers for each subscription type individually
  // This avoids the hook-in-loop issue
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // For each subscription type, we need to call useWebSocketHandler separately
  // This is a limitation of React hooks - they can't be called in loops
  const enabledSubscriptions = subscriptions.filter(sub => sub.enabled !== false);
  
  // Handle 'order.created' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'order.created' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'order.created');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for order.created:', error);
        }
      }
    }
  );
  
  // Handle 'order.update' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'order.update' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'order.update');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for order.update:', error);
        }
      }
    }
  );
  
  // Handle 'order.give_away' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'order.give_away' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'order.give_away');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for order.give_away:', error);
        }
      }
    }
  );
  
  // Handle 'card.save' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'card.save' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'card.save');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for card.save:', error);
        }
      }
    }
  );
  
  // Handle 'card.save_failed' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'card.save_failed' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'card.save_failed');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for card.save_failed:', error);
        }
      }
    }
  );
  
  // Handle 'subscription.payment' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'subscription.payment' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'subscription.payment');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for subscription.payment:', error);
        }
      }
    }
  );
  
  // Handle 'subscription.payment_failed' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'subscription.payment_failed' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'subscription.payment_failed');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for subscription.payment_failed:', error);
        }
      }
    }
  );
  
  // Handle 'order.arrival-status.update' messages - only if connected
  useWebSocketHandler(
    isConnected ? 'order.arrival-status.update' : undefined,
    (message, queryClient) => {
      if (!isMounted.current) return;
      
      const subscription = enabledSubscriptions.find(sub => sub.type === 'order.arrival-status.update');
      if (subscription) {
        try {
          subscription.handler(message, queryClient);
        } catch (error) {
          console.error('Error in WebSocket handler for order.arrival-status.update:', error);
        }
      }
    }
  );
  
  return {
    isConnected,
    isEnabled: enabledSubscriptions.length > 0
  };
} 