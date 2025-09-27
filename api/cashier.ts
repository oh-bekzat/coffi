import { fetchApi } from "./fetch";
import { Order as BaseOrder, Order } from '../types/order';

export interface OrdersRequest {
    date_from?: string;
    date_to?: string;
    before_minutes: string;
    statuses: string[];
}

export interface CashierOrder extends BaseOrder {
    totalPrice: number;
    clientUsername: string;
    clientPhoneNumber: string;
    clientId: string;
    attachmentUrls: string[];
}

export const getOrders = async (request: OrdersRequest): Promise<Order[]> => {
    const params = new URLSearchParams({
        // date_from: request.date_from,
        // date_to: request.date_to,
        before_minutes: request.before_minutes
    });
    request.statuses.forEach(status => params.append('statuses', status));
    
    const url = `/cashier/order?${params.toString()}`;
    
    const response = await fetchApi<Order[]>(url, { method: "GET" });
    // console.log(response);
    return response;
};

export const takeOrder = async (order_id: string): Promise<CashierOrder> => {
    return fetchApi<CashierOrder>(`/cashier/order/${order_id}`, {
        method: "PATCH",
        body: JSON.stringify({
            status: "in_progress",
        }),
    });
};

export const completeOrder = async (order_id: string): Promise<CashierOrder> => {
    return fetchApi<CashierOrder>(`/cashier/order/${order_id}`, {
        method: "PATCH",
        body: JSON.stringify({
            status: "completed",
        }),
    });
};

export const cancelOrder = async (order_id: string, reason: string): Promise<CashierOrder> => {
    return fetchApi<CashierOrder>(`/cashier/order/${order_id}`, {
        method: "PATCH",
        body: JSON.stringify({
            status: "cancelled",
            cancellationReason: reason,
        }),
    });
};

export const changeMenuItemAvailability = async (cafe_id: string, item_id: string, available: boolean): Promise<void> => {
    return fetchApi<void>(`/cafe/${cafe_id}/menu/item/${item_id}`, {
        method: "PATCH",
        body: JSON.stringify({
            available: available,
        }),
    });
};

export const changeAdditiveAvailability = async (cafe_id: string, additive_id: string, available: boolean): Promise<void> => {
    return fetchApi<void>(`/cafe/${cafe_id}/menu/additive/${additive_id}`, {
        method: "PATCH",
        body: JSON.stringify({
            available: available,
        }),
    });
};