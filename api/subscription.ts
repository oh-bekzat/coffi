import { fetchApi } from "./fetch";

type SubscriptionResponse = Subscription[];

interface Subscription {
    name: string;
    description: string;
    price: number;
    monthlyLimit: number;
    dailyLimit: number;
    duration: number;
    id: string;
    attachmentUrls: string[];
    items: {
        id: string;
        name: string;
        description: string;
        attachmentUrls: string[];
        type: string;
    }[];
    additives: {
        id: string;
        name: string;
        description: string;
        attachmentUrls: string[];
        type: string;
    }[];
}

interface SubscribeResponse {
    userId: string;
    subId: string;
    status: string;
    startDate: string;
    endDate: string;
    balance: number;
    createdAt: string;
}

export const getSubscriptions = async (): Promise<SubscriptionResponse> => {
    return fetchApi<SubscriptionResponse>("/subscription", {
        method: "GET",
    }, false);
}

export const subscribe = async ({ sub_id, card_id, cafe_id }: { sub_id: string; card_id?: string; cafe_id?: string }): Promise<SubscribeResponse> => {
    return fetchApi<SubscribeResponse>(`/subscription/${sub_id}/subscribe`, {
        method: "POST",
        body: JSON.stringify({
            card_id: card_id,
            cafe_id: cafe_id,
        }),
    });
}

export const unsubscribe = async (sub_id: string): Promise<void> => {
    return fetchApi<void>(`/subscription/${sub_id}/unsubscribe`, {
        method: "POST",
    });
}

export const getSubscriptionDetails = async (sub_id: string): Promise<Subscription> => {
    return fetchApi<Subscription>(`/subscription/${sub_id}`, {
        method: "GET",
    });
}