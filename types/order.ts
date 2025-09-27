export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'cancelled' | 'picked_up';
export type ArrivalStatus = 'here' | 'min_5' | 'min_10' | 'min_15' | 'min_20' | null;

export interface Additive {
    id: string;
    name: string;
    price: number;
    type: string;
    attachmentUrls: string[];
}

export interface OrderCoffee {
    id: string;
    name: string;
    cupSize: string;
    price: number;
    isSub: boolean;
    attachmentUrls: string[];
    additives: Additive[];
}

export interface OrderFood {
    id: string;
    name: string;
    price: number;
    attachmentUrls: string[];
}

export interface Order {
    id: string;
    cafeId: string;
    clientId: string;
    clientUsername: string;
    clientPhoneNumber: string;
    totalPrice: number;
    coffees: OrderCoffee[];
    food: OrderFood[];
    arrivalStatus: ArrivalStatus | null;
    arrivalTime: string | null;
    cancellationReason: string | null;
    status: OrderStatus | null;
    createdAt: string | null;
    inProgressAt: string | null;
    completedAt: string | null;
    pickedUpAt: string | null;
    cancelledAt: string | null;
    clientComment: string | null;
    orderType: 'in_cafe' | 'pickup' | null;
}

export interface WebSocketOrderMessage {
    type?: 'order.created' | 'order.update' | 'order.give_away' | 'card.save' | 'card.save_failed' | 'subscription.payment' | 'subscription.payment_failed' | 'order.arrival-status.update' | 'connection_established' | 'ping' | 'pong' | 'authenticate' | 'authenticated' | 'test' | 'test_response';
    order?: Order;
    id?: string;
    code?: string;
    orderId?: string;
    cancellationReason?: string | null;
    status?: OrderStatus | null;
    // Card related fields
    cardId?: string;
    cardError?: string;
    // Additional card.save fields
    cardBrand?: string;
    cardNumber?: string;
    paymentToken?: string;
    // Subscription related fields
    subId?: string;
    subName?: string;
    balance?: number;
    dailyBalance?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
    arrivalStatus?: ArrivalStatus | null;
    arrivalTime?: string | null;
}