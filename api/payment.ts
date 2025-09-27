import { fetchApi } from "./fetch";

export interface Card {
    cardNumber: string;
    cardMonth: string;
    cardYear: string;
    cardSecurity: string;
}

export interface CardResponse {
    id: string;
    cardNumber: string;
    cardBrand: string;
    paymentToken: string;
}

export const addCard = async () => {
    return fetchApi<{url: string}>("/client/card", {
        method: "POST",
    });
};

export const getCards = async () => {
    return fetchApi<CardResponse[]>("/client/card", {
        method: "GET",
    });
};

export const deleteCard = async (cardId: string) => {
    return fetchApi<void>(`/client/card/${cardId}`, {
        method: "DELETE",
    });
};