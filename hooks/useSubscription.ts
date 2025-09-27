import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubscriptionDetails, getSubscriptions, subscribe, unsubscribe } from "../api/subscription";
import { handleSuccess, useErrorHandler } from "./useErrorHandler";
import { router } from "expo-router";
import { useBottomSheetStore } from "../stores/bottomSheetStore";

export const useGetSubscriptions = () => {
    return useQuery({
        queryKey: ["subscriptions"],
        queryFn: getSubscriptions,
        staleTime: 1000 * 60 * 5,
    });
};

export const useSubscribe = () => {
    const queryClient = useQueryClient();
    const { handleError } = useErrorHandler();
    
    return useMutation({
        mutationFn: (params: { sub_id: string; card_id?: string; cafe_id?: string }) => subscribe(params || null),
        onSuccess: (data) => {
            // We will handle all UI operations like closing the sheet,
            // invalidating queries, showing success toast, and navigation
            // in the WebSocket handler in Cards.tsx
            // console.log("Subscription API request successful");
        },
        onError: handleError, // Using the error handler directly is cleaner
    });
};

export const useUnsubscribe = () => {
    const queryClient = useQueryClient();
    const { handleError } = useErrorHandler();

    return useMutation({
        mutationFn: unsubscribe,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            handleSuccess("Подписка отменена");
        },
        onError: (error) => {
            handleError(error);
        },
    });
};

export const useGetSubscriptionDetails = (sub_id: string) => {
    return useQuery({
        queryKey: ["subscriptionDetails", sub_id],
        queryFn: () => getSubscriptionDetails(sub_id),
    });
};