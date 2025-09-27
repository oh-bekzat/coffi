import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, takeOrder, completeOrder, cancelOrder, changeMenuItemAvailability, changeAdditiveAvailability } from "../api/cashier";
import { OrdersRequest } from "../api/cashier";
import { handleSuccess, useErrorHandler } from "./useErrorHandler";

export const useGetOrders = (request: OrdersRequest) => {
    return useQuery({
        queryKey: ["orders", request],
        queryFn: () => getOrders(request),
        staleTime: 0,
        refetchInterval: 50000,
    });
};

export const useTakeOrder = () => {
    const queryClient = useQueryClient();
    const { handleError } = useErrorHandler();
    return useMutation({
        mutationFn: (order_id: string) => takeOrder(order_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            handleSuccess("Заказ успешно принят");
        },
        onError: (error) => {
            handleError(error);
        },
    });
};

export const useCompleteOrder = () => {
    const queryClient = useQueryClient();
    const { handleError } = useErrorHandler();

    return useMutation({
        mutationFn: (order_id: string) => completeOrder(order_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            handleSuccess("Заказ успешно выполнен");
        },
        onError: (error) => {
            handleError(error);
        },
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    const { handleError } = useErrorHandler();

    return useMutation({
        mutationFn: ({ order_id, reason }: { order_id: string; reason: string }) => 
            cancelOrder(order_id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            handleSuccess("Заказ отменен");
        },
        onError: (error) => {
            handleError(error);
        },
    });
};

export const useChangeMenuItemAvailability = () => {
    const queryClient = useQueryClient();
    const { handleError } = useErrorHandler();

    return useMutation({
        mutationFn: ({ cafe_id, item_id, available }: { cafe_id: string; item_id: string; available: boolean }) =>
            changeMenuItemAvailability(cafe_id, item_id, available),
        onSuccess: (_, { cafe_id }) => {
            queryClient.invalidateQueries({ queryKey: ["foods", cafe_id] });
            queryClient.invalidateQueries({ queryKey: ["drinks", cafe_id] });
            handleSuccess("Доступность блюда изменена");
        },
        onError: (error) => {
            handleError(error);
        },
    });
};

export const useChangeAdditiveAvailability = () => {
    const queryClient = useQueryClient();
    const { handleError } = useErrorHandler();

    return useMutation({
        mutationFn: ({ cafe_id, additive_id, available }: { cafe_id: string; additive_id: string; available: boolean }) =>
            changeAdditiveAvailability(cafe_id, additive_id, available),
        onSuccess: (_, { cafe_id }) => {
            queryClient.invalidateQueries({ queryKey: ["additives", cafe_id] });
            handleSuccess("Доступность добавки изменена");
        },
        onError: (error) => {
            handleError(error);
        },
    });
};