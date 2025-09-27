import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card,
  addCard, 
  deleteCard, 
  getCards,
} from "../api/payment";
import { handleSuccess, useErrorHandler } from "./useErrorHandler";
import { Linking } from "react-native";

export const useAddCard = () => {
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => addCard(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};

export const useGetCards = () => {
  return useQuery({
    queryKey: ["cards"],
    queryFn: getCards,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    gcTime: 1000 * 60 * 60,
  });
};

export const useDeleteCard = () => {
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
    onSuccess: () => {
      handleSuccess("Карта удалена");
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
};