import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoffees, getCoffee, displayOrder, orderCoffee, getOrder, OrderRequest, setArrivalStatus } from "../api/coffee";
import { CoffeeOrder, MenuOrder } from "../api/coffee";
import { useErrorHandler } from "./useErrorHandler";
import { ArrivalStatus } from "../types/order";
import Toast from "react-native-toast-message";
import { useAuthStore } from '../stores/authStore';

export const useGetCoffees = (cafeId?: string, options?: { enabled?: boolean }) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["coffees", cafeId, isAuthenticated],
    queryFn: () => getCoffees(cafeId, isAuthenticated),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled !== false && !!cafeId,
  });
};

export const useGetCoffee = (coffeeId: string, cafeId: string, options?: { enabled?: boolean }) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["coffee", coffeeId, cafeId, isAuthenticated],
    queryFn: () => getCoffee({ coffee_id: coffeeId, cafe_id: cafeId, requiresAuth: isAuthenticated }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useDisplayOrder = ({ coffees, food, cafeId }: { coffees: CoffeeOrder[], food: MenuOrder[], cafeId: string | null }) => {
  return useQuery({
    queryKey: ["display-order", coffees, food, cafeId],
    queryFn: async () => {
      const response = await displayOrder({
        data: { coffees, food },
        cafeId: cafeId || "",
      });
      return response;
    },
    enabled: Boolean(cafeId) && (coffees.length > 0 || food.length > 0),
    staleTime: 0,
  });
};

export const useOrderCoffee = () => {
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (request: OrderRequest) => {
      const response = await orderCoffee(request);
      return response;
    },
    onError: (error, variables) => {
      handleError(error);
    },
  });
};

export const useGetOrder = (statuses: ('new' | 'in_progress' | 'completed' | 'cancelled')[]) => {
  return useQuery({
    queryKey: ["order", statuses],
    queryFn: () => getOrder(statuses),
    staleTime: 1000 * 60 * 5,
    // refetchInterval: 50000,
  });
};

export const useSetArrivalStatus = () => {
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, arrivalStatus }: { orderId: string, arrivalStatus: ArrivalStatus }) => {
      const response = await setArrivalStatus(orderId, arrivalStatus);
      return response;
    },
    onSuccess: () => {
      Toast.show({
        type: 'tomatoToast',
        text1: 'Статус прибытия заказа успешно установлен',
        position: 'top'
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};