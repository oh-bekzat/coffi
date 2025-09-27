import { WebSocketOrderMessage } from '../types/order';
import { useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { useEffect } from 'react';

// Define the message handler type
type MessageHandler = (message: WebSocketOrderMessage, queryClient: ReturnType<typeof useQueryClient>) => void;

// Create a store to manage message handlers
interface WebSocketHandlersStore {
  handlers: Record<string, Set<MessageHandler>>;
  registerHandler: (type: string, handler: MessageHandler) => () => void;
  handleMessage: (message: WebSocketOrderMessage, queryClient: ReturnType<typeof useQueryClient>) => void;
}

export const useWebSocketHandlersStore = create<WebSocketHandlersStore>((set, get) => ({
  handlers: {},
  
  registerHandler: (type, handler) => {
    // Initialize the set for this message type if it doesn't exist
    if (!get().handlers[type]) {
      set(state => ({
        handlers: {
          ...state.handlers,
          [type]: new Set()
        }
      }));
    }
    
    // Add the handler to the set
    set(state => {
      const updatedHandlers = { ...state.handlers };
      updatedHandlers[type].add(handler);
      return { handlers: updatedHandlers };
    });
    
    // Return an unsubscribe function
    return () => {
      set(state => {
        const updatedHandlers = { ...state.handlers };
        if (updatedHandlers[type]) {
          updatedHandlers[type].delete(handler);
        }
        return { handlers: updatedHandlers };
      });
    };
  },
  
  handleMessage: (message, queryClient) => {
    const { handlers } = get();
    const messageType = message.type || '';
    
    // console.log('[WebSocketHandlers] Handling message type:', messageType);
    // console.log('[WebSocketHandlers] Available handler types:', Object.keys(handlers));
    // console.log('[WebSocketHandlers] Message content:', message);
    
    // Call all handlers registered for this message type
    if (handlers[messageType]) {
      const handlerCount = handlers[messageType].size;
      // console.log('[WebSocketHandlers] Found', handlerCount, 'handlers for type:', messageType);
      
      handlers[messageType].forEach((handler) => {
        try {
          // console.log('[WebSocketHandlers] Executing handler for type:', messageType);
          handler(message, queryClient);
          // console.log('[WebSocketHandlers] Handler executed successfully for type:', messageType);
        } catch (error) {
          console.error(`[WebSocketHandlers] Error in handler for ${messageType}:`, error);
        }
      });
    } else {
      console.warn('[WebSocketHandlers] No handlers registered for message type:', messageType);
    }
  }
}));

// Helper hook for components to register message handlers
export function useWebSocketHandler<T extends WebSocketOrderMessage['type']>(
  type: T | undefined,
  handler: (message: Extract<WebSocketOrderMessage, { type: T }>, queryClient: ReturnType<typeof useQueryClient>) => void
) {
  const queryClient = useQueryClient();
  const registerHandler = useWebSocketHandlersStore(state => state.registerHandler);
  
  // Register the handler on mount and unregister on unmount
  useEffect(() => {
    if (!type) {
      return () => {};
    }
    
    const unregister = registerHandler(type, handler as MessageHandler);
    
    return () => {
      unregister();
    };
  }, [type, handler, registerHandler]);
} 