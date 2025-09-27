import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { useWebSocketStore } from './useWebSocket';
import { getOrders, OrdersRequest } from '../api/cashier';
import { mapOrder } from '../utils/orderMapping';
import { Order, WebSocketOrderMessage } from '../types/order';
import { useWebSocketSubscription } from './useWebSocketSubscription';
import { useCallback, useMemo, useRef, useEffect } from 'react';

type NonNullMappedOrder = NonNullable<ReturnType<typeof mapOrder>>;

export function useCashierOrders(request: OrdersRequest) {
    const queryClient = useQueryClient();
    const queryKey = ['cashier-orders', request];
  
    const { data: orders = [], ...queryResults } = useQuery<NonNullMappedOrder[]>({
      queryKey,
      queryFn: async () => {
        const orders = await getOrders(request);
        const mapped = orders.map(mapOrder).filter((order): order is NonNullMappedOrder => order !== null);
        return mapped;
      },
      staleTime: 10 * 1000,        // 10 seconds - consider data relatively fresh for a short period
      refetchInterval: 5 * 60 * 1000,  // Refetch every 5 minutes even if tab is in background
      refetchOnWindowFocus: true,  // Also refetch when tab gets focus
      gcTime: 30 * 60 * 1000,      // Keep inactive queries cached for 30 minutes
      retry: 2,                    // Retry failed requests
    });

    // Use refs to store stable handler functions
    const queryKeyRef = useRef(queryKey);
    const queryClientRef = useRef(queryClient);
    
    // Update refs when values change
    useEffect(() => {
      queryKeyRef.current = queryKey;
      queryClientRef.current = queryClient;
    });

    // Create stable handler functions that don't change on re-renders
    const handleOrderCreated = useCallback((message: WebSocketOrderMessage & { type: 'order.created' }, qc: any) => {
      if (message.order) {
        // Validate that the order has content before mapping
        if (!message.order.coffees && !message.order.food) {
          console.warn('[useCashierOrders] Received order without coffees or food:', message.order.id);
          return;
        }
        
        const mappedOrder = mapOrder(message.order as Order);
        if (mappedOrder) {
          queryClientRef.current.setQueryData(queryKeyRef.current, (oldData: NonNullMappedOrder[] = []) => {
            return [mappedOrder, ...oldData];
          });
        }
      }
    }, []);

    const handleOrderUpdate = useCallback((message: WebSocketOrderMessage & { type: 'order.update' }, qc: any) => {
      if (message.order) {
        queryClientRef.current.setQueryData(queryKeyRef.current, (oldData: NonNullMappedOrder[] = []) => {
          return oldData.map(order => {
            if (order.id === message.order?.id) {
              const updatedOrder = { ...order, ...message.order };
              const mappedOrder = mapOrder(updatedOrder as Order);
              return mappedOrder || order;
            }
            return order;
          });
        });
      }
    }, []);

    const handleArrivalStatusUpdate = useCallback((message: WebSocketOrderMessage & { type: 'order.arrival-status.update' }, qc: any) => {
      if (message.id) {
        queryClientRef.current.setQueryData(queryKeyRef.current, (oldData: NonNullMappedOrder[] = []) => {
          return oldData.map(order => {
            if (order.id === message.id) {
              return { 
                ...order, 
                arrivalStatus: message.arrivalStatus,
                arrivalTime: message.arrivalTime
              };
            }
            return order;
          });
        });
      }
    }, []);

    // Subscribe to WebSocket messages with stable handler callbacks
    useWebSocketSubscription('order.created', handleOrderCreated);
    useWebSocketSubscription('order.update', handleOrderUpdate);
    useWebSocketSubscription('order.arrival-status.update', handleArrivalStatusUpdate);

    return {
      orders,
      ...queryResults,
    };
} 