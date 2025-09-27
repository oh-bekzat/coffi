import { fetchApi } from "./fetch";
import { ArrivalStatus } from "../types/order";

interface Coffee {
    id: string;
    name: string;
    priceS: number;
    priceM: number;
    priceL: number;
    attachmentUrls: string[];
}

interface CoffeeResponse {
    id: string;
    name: string;
    description: string;
    priceS: number;
    priceM: number;
    priceL: number;
    attachmentUrls: string[];
    additiveTypes: CoffeeAdditive[];
}

export interface CoffeeAdditive {
    type: string;
    additives: {
        id: string;
        name: string;
        price: number;
        attachmentUrls: string[];
    }[]
}

export interface CoffeeOrder {
    coffeeId: string;
    cupSize: "s" | "m" | "l";
    additives: string[];
}

export interface MenuOrder {
    foodId: string;
}

export interface MenuItem {
    id: string;
    name: string;
    attachmentUrls: string[];
    price?: number;
    priceS?: number;
}

interface CoffeesResponse {
    recent: Coffee[];
    popular: Coffee[];
    other: Category[];
}

interface Category {
    category: string;
    coffees: Coffee[];
}

export interface DisplayOrderRequest {
    data: {
        coffees: Array<{
            coffeeId: string;
            cupSize: 's' | 'm' | 'l';
            additives: string[];
        }>;
        food: MenuOrder[];
    };
    cafeId: string;
}

export interface OrderRequest {
    data: {
        coffees: Array<{
            coffeeId: string;
            cupSize: 's' | 'm' | 'l';
            additives: string[];
        }>;
        food: MenuOrder[];
        cardId?: string;
        clientComment?: string;
        orderType?: 'in_cafe' | 'pickup';
    };
    cafeId: string;
}

export interface DisplayOrderResponse {
    id: string,
    coffees: DisplayOrderCoffee[],
    food: MenuItem[],
    cafeName?: string,
    totalPrice: number,
    arrivalStatus: string | null,
    arrivalTime: string | null,
    cancellationReason: string | null,
    status: string
}

export interface DisplayOrderCoffee {
    id: string;
    name: string;
    cupSize: string;
    price: number;
    isSub: boolean;
    attachmentUrls: string[];
    additives: Array<{
        id: string;
        name: string;
        price: number;
        attachmentUrls: string[];
    }>;
}

export const getCoffees = async (cafe_id?: string, requiresAuth: boolean = false): Promise<CoffeesResponse> => {
    const query = cafe_id ? `?cafe_id=${encodeURIComponent(cafe_id)}` : "";
    return fetchApi<CoffeesResponse>(`/client/coffee${query}`, {
      method: "GET",
    }, requiresAuth);
};

export const getCoffee = async ({coffee_id, cafe_id, requiresAuth = false} : {coffee_id: string, cafe_id: string, requiresAuth?: boolean}): Promise<CoffeeResponse> => {
    const query = cafe_id ? `?cafe_id=${encodeURIComponent(cafe_id)}` : "";
    return fetchApi<CoffeeResponse>(`/client/coffee/${coffee_id}${query}`, {
      method: "GET",
    }, requiresAuth);
};

export const displayOrder = async (request: DisplayOrderRequest): Promise<DisplayOrderResponse> => {
    const query = `?cafe_id=${encodeURIComponent(request.cafeId)}`;
    return fetchApi<DisplayOrderResponse>(`/client/display-order${query}`, {
        method: "POST",
        body: JSON.stringify(request.data),
    });
};

// maybe not void as response, CHANGE LATER
export const orderCoffee = async (request: OrderRequest): Promise<{ url?: string } | void> => {
    const query = `?cafe_id=${encodeURIComponent(request.cafeId)}`;
    return fetchApi<{ url?: string } | void>(`/client/order${query}`, {
        method: "POST",
        body: JSON.stringify(request.data),
    });
};

export const getOrder = async (statuses: ('new' | 'in_progress' | 'completed' | 'cancelled')[]): Promise<DisplayOrderResponse[]> => {
    const statusParams = statuses.map(status => `statuses=${status}`).join('&');
    return fetchApi<DisplayOrderResponse[]>(`/client/order?${statusParams}`, {
        method: "GET",
    });
};

export const setArrivalStatus = async (orderId: string, arrivalStatus: ArrivalStatus): Promise<void> => {
    return fetchApi<void>(`/client/order/${orderId}/leave-arrival_status?arrival_status=${arrivalStatus}`, {
        method: "POST",
    });
};