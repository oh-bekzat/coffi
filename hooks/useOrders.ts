import { useQuery } from '@tanstack/react-query';
import { Order, WebSocketOrderMessage } from '../types/order';
import { mapOrder } from '../utils/orderMapping';
import { getOrder } from '../api/coffee';
import { create } from 'zustand';
import { useWebSocketSubscription } from './useWebSocketSubscription';

interface GiveAwayStore {
  pendingPickups: { [orderId: string]: string }; // orderId -> code
  addPickup: (orderId: string, code: string) => void;
  removePickup: (orderId: string) => void;
  getCode: (orderId: string) => string | undefined;
}

export const useGiveAwayStore = create<GiveAwayStore>((set, get) => ({
  pendingPickups: {},
  addPickup: (orderId, code) => 
    set(state => ({ 
      pendingPickups: { ...state.pendingPickups, [orderId]: code }
    })),
  removePickup: (orderId) =>
    set(state => {
      const { [orderId]: _, ...rest } = state.pendingPickups;
      return { pendingPickups: rest };
    }),
  getCode: (orderId) => get().pendingPickups[orderId],
}));

export function useOrders(statuses: string[]) {
  const queryKey = ['orders', statuses];

  const { data: orders, ...queryResults } = useQuery({
    queryKey,
    queryFn: () => getOrder(statuses as ('new' | 'in_progress' | 'completed' | 'cancelled')[]),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000,   // Keep in cache for 30 minutes
  });

  // Subscribe to order.created messages
  useWebSocketSubscription('order.created', (message: WebSocketOrderMessage & { type: 'order.created' }, queryClient) => {
    if (message.order) {
      const mappedCreatedOrder = mapOrder(message.order);
      queryClient.setQueryData(queryKey, (oldData: Order[] = []) => {
        return [mappedCreatedOrder, ...oldData];
      });
    }
  });

  // Subscribe to order.update messages
  useWebSocketSubscription('order.update', (message: WebSocketOrderMessage & { type: 'order.update' }, queryClient) => {
    if (message.order) {
      queryClient.setQueryData(queryKey, (oldData: Order[] = []) => {
        return oldData.map(order => {
          if (order.id === message.order?.id) {
            const updatedOrder = { ...order, ...message.order };
            return updatedOrder;
          }
          return order;
        });
      });
    }
  });

  // Subscribe to order.give_away messages
  useWebSocketSubscription('order.give_away', (message: WebSocketOrderMessage & { type: 'order.give_away' }) => {
    if (message.code && message.orderId) {
      useGiveAwayStore.getState().addPickup(message.orderId, message.code);
    }
  });

  return { orders, ...queryResults };
}

export function usePickupCode(orderId: string) {
  return useQuery({
    queryKey: ['pickup-codes', orderId],
    enabled: false, // Only fetch when needed
    gcTime: 5 * 60 * 1000, // Cache pickup code for 5 minutes
  });
} 