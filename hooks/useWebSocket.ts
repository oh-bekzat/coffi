import { create } from 'zustand';
import { useAuthStore } from '../stores/authStore';
import { WebSocketOrderMessage } from '../types/order';
import { QueryClient } from '@tanstack/react-query';
import { useWebSocketHandlersStore } from './useWebSocketHandlers';

// Create a global query client reference that can be updated
let globalQueryClient: QueryClient | null = null;

// Function to set the global query client
export const setGlobalQueryClient = (queryClient: QueryClient) => {
  globalQueryClient = queryClient;
};

interface WebSocketStore {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  onMessage: (callback: (message: WebSocketOrderMessage) => void) => () => void;
  messageCallbacks: Set<(message: WebSocketOrderMessage) => void>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectDelay: number;
  heartbeatTimer: ReturnType<typeof setTimeout> | null;
  lastHeartbeat: number | null;
  sendTestMessage: () => boolean;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectTimer: null,
  reconnectDelay: 1000, // Start with 1 second delay
  heartbeatTimer: null,
  lastHeartbeat: null,
  messageCallbacks: new Set<(message: WebSocketOrderMessage) => void>(),
  
  connect: () => {
    // console.log('[WebSocket] *** CONNECT FUNCTION CALLED ***');
    const { socket, isConnecting, isConnected } = get();
    
    // console.log('[WebSocket] Connect attempt - socket:', !!socket, 'isConnecting:', isConnecting);
    
    // Don't try to connect if already connected or connecting
    if (socket?.readyState === WebSocket.OPEN || isConnecting || isConnected) {
      return;
    }
    
    // Also check if socket exists but is in connecting state
    if (socket?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    // Check auth state only once to avoid potential race conditions
    const token = useAuthStore.getState().accessToken;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    // console.log('[WebSocket] Auth check - isAuthenticated:', isAuthenticated, 'hasToken:', !!token);
    
    // Don't connect if not authenticated or no token
    if (!token || !isAuthenticated) {
      // console.log('[WebSocket] Skipping connect - not authenticated or no token');
      return;
    }

    try {
      // Set connecting state
      set({ isConnecting: true });
      
      // Try different WebSocket endpoints to debug the 404 error
      // Common WebSocket paths: /websocket, /socket, /ws, /api/ws, or just the base URL
      const wsUrl = `wss://dev-refill.kz/backend/0e885b3a-905f-4ce3-8881-1369c323b7ad/api/v1/ws/connect?token=${token}`;
      // console.log('[WebSocket] Creating connection to:', wsUrl);
      // console.log('[WebSocket] Token being used:', token ? `${token.substring(0, 20)}...` : 'null');
      // console.log('[WebSocket] User role:', useAuthStore.getState().role);
      
      // Decode token to get user ID
      let userId = null;
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          userId = decoded.sub;
          // console.log('[WebSocket] User ID from token:', userId);
        } catch (e) {
          console.warn('[WebSocket] Failed to decode token for user ID');
        }
      }
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        // console.log('[WebSocket] Connection opened successfully');
        const now = Date.now();
        set({ 
          socket: ws, 
          isConnected: true, 
          isConnecting: false,
          reconnectAttempts: 0,
          reconnectDelay: 1000, // Reset delay on successful connection
          lastHeartbeat: now
        });
        
        // Clear any pending reconnect timer
        const timer = get().reconnectTimer;
        if (timer !== null) {
          clearTimeout(timer);
          set({ reconnectTimer: null });
        }
        
        // Start heartbeat mechanism
        const startHeartbeat = () => {
          const heartbeatInterval = setInterval(() => {
            const { socket: currentSocket, isConnected: currentlyConnected } = get();
            if (currentSocket && currentlyConnected && currentSocket.readyState === WebSocket.OPEN) {
              try {
                // Send ping message to keep connection alive
                const pingMessage = JSON.stringify({ type: 'ping', timestamp: Date.now() });
                currentSocket.send(pingMessage);
                // console.log('[WebSocket] Sent heartbeat ping - readyState:', currentSocket.readyState);
                set({ lastHeartbeat: Date.now() });
              } catch (error) {
                console.error('[WebSocket] Failed to send heartbeat:', error);
                // Connection might be dead, trigger reconnection
                get().disconnect();
                get().connect();
              }
            } else {
              // Clear heartbeat if not connected
              clearInterval(heartbeatInterval);
              set({ heartbeatTimer: null });
            }
          }, 30000); // Send heartbeat every 30 seconds
          
          set({ heartbeatTimer: heartbeatInterval });
        };
        
        startHeartbeat();
      };
      
      ws.onmessage = (event) => {
        // console.log('[WebSocket] Raw message received:', event.data);
        try {
          const message = JSON.parse(event.data) as WebSocketOrderMessage;
          // console.log('[WebSocket] Parsed message:', message);
          // console.log('[WebSocket] Message type:', message.type);
          
          // Handle pong responses from server
          if (message.type === 'pong') {
            // console.log('[WebSocket] Received pong response from server');
            set({ lastHeartbeat: Date.now() });
            return;
          }
          
          // Handle authentication responses
          if (message.type === 'authenticated') {
            // console.log('[WebSocket] Server confirmed authentication');
            // console.log('[WebSocket] Authentication response:', message);
            return;
          }
          
          // Handle test responses
          if (message.type === 'test_response') {
            // console.log('[WebSocket] Received test response from server');
            // console.log('[WebSocket] Test response:', message);
            return;
          }
          
                  // Handle connection confirmation
        if (message.type === 'connection_established') {
          // console.log('[WebSocket] Server confirmed connection establishment');
          // console.log('[WebSocket] Connection details:', message);
          // console.log('[WebSocket] Connection established');
          set({ lastHeartbeat: Date.now() });
          
          // Send authentication/registration message to server
          const { socket: currentSocket } = get();
          if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
            const token = useAuthStore.getState().accessToken;
            const authMessage = JSON.stringify({
              type: 'authenticate',
              token: token,
              timestamp: Date.now()
            });
            
            try {
              currentSocket.send(authMessage);
              // console.log('[WebSocket] Sent authentication message to server');
            } catch (error) {
              console.error('[WebSocket] Failed to send authentication message:', error);
            }
          }
        }
          
          // Use the global query client reference instead of the hook
          if (globalQueryClient) {
            // console.log('[WebSocket] Forwarding to centralized handler, type:', message.type);
            // Use the centralized message handler
            useWebSocketHandlersStore.getState().handleMessage(message, globalQueryClient);
          } else {
            console.warn('[WebSocket] No global query client available');
          }
          
          // Also call component-specific callbacks for backward compatibility
          const callbackCount = get().messageCallbacks.size;
          // console.log('[WebSocket] Calling', callbackCount, 'component callbacks');
          get().messageCallbacks.forEach(callback => callback(message));
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e, 'Raw data:', event.data);
        }
      };

      ws.onclose = (event) => {
        // console.log('[WebSocket] Connection closed - code:', event.code, 'reason:', event.reason);
        
        // Clear heartbeat timer
        const { heartbeatTimer } = get();
        if (heartbeatTimer !== null) {
          clearInterval(heartbeatTimer);
        }
        
        // Clean up the socket
        set({ 
          socket: null, 
          isConnected: false, 
          isConnecting: false,
          heartbeatTimer: null,
          lastHeartbeat: null
        });
        
        // Don't attempt to reconnect if this was a normal closure
        if (event.code === 1000) {
          // console.log('[WebSocket] Normal closure, not reconnecting');
          return;
        }
        
        // Check if still authenticated
        const isStillAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isStillAuthenticated) {
          // console.log('[WebSocket] Not authenticated, not reconnecting');
          return;
        }
        
        // Schedule reconnect with exponential backoff
        const { reconnectAttempts, maxReconnectAttempts, reconnectDelay } = get();
        // console.log('[WebSocket] Scheduling reconnect - attempt:', reconnectAttempts + 1, 'of', maxReconnectAttempts, 'delay:', reconnectDelay);
        
        if (reconnectAttempts < maxReconnectAttempts) {
          const nextDelay = Math.min(reconnectDelay * 2, 30000); // Max 30 seconds
          
          // Clear any existing timer
          const currentTimer = get().reconnectTimer;
          if (currentTimer !== null) {
            clearTimeout(currentTimer);
          }
          
          const timer = setTimeout(() => {
            // console.log('[WebSocket] Executing reconnect attempt', reconnectAttempts + 1);
            set({ 
              reconnectAttempts: reconnectAttempts + 1,
              reconnectDelay: nextDelay,
              reconnectTimer: null
            });
            get().connect();
          }, nextDelay);
          
          set({ reconnectTimer: timer });
        } else {
          // console.log('[WebSocket] Max reconnect attempts reached, giving up');
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        // Just log the error - onclose will handle reconnection
        set({ isConnecting: false });
      };

    } catch (error) {
      console.error('[WebSocket] Connection setup error:', error);
      set({ isConnecting: false });
    }
  },
  
  disconnect: () => {
    const { socket, reconnectTimer, heartbeatTimer } = get();
    
    // Clear any reconnect timer
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      set({ reconnectTimer: null });
    }
    
    // Clear heartbeat timer
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
      set({ heartbeatTimer: null });
    }
    
    // Clear callbacks to prevent memory leaks
    set({ messageCallbacks: new Set() });
    
    if (socket) {
      // Use code 1000 for normal closure
      socket.close(1000, 'User logout or navigation');
      
      // Clean up handlers
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      
      set({ 
        socket: null, 
        isConnected: false, 
        isConnecting: false,
        reconnectAttempts: 0,
        reconnectDelay: 1000,
        heartbeatTimer: null,
        lastHeartbeat: null
      });
    }
  },
  
  onMessage: (callback) => {
    get().messageCallbacks.add(callback);
    return () => get().messageCallbacks.delete(callback);
  },
  
  // Debug method to test connection
  sendTestMessage: () => {
    const { socket, isConnected } = get();
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      try {
        // Decode token to get user ID
        let userId = null;
        const token = useAuthStore.getState().accessToken;
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            userId = decoded.sub;
          } catch (e) {
            console.warn('[WebSocket] Failed to decode token for user ID in test message');
          }
        }
        
        const testMessage = JSON.stringify({
          type: 'test',
          message: 'Connection test from client',
          timestamp: Date.now(),
          userId: userId
        });
        socket.send(testMessage);
        // console.log('[WebSocket] Sent test message');
        return true;
      } catch (error) {
        console.error('[WebSocket] Failed to send test message:', error);
        return false;
      }
    } else {
      // console.log('[WebSocket] Cannot send test message - not connected. ReadyState:', socket?.readyState);
      return false;
    }
  }
}));