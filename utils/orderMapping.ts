import { Order, OrderCoffee, OrderFood } from '../types/order';

const mapCoffee = (coffee: OrderCoffee) => ({
    ...coffee,
    cupSize: coffee.cupSize,
    isSub: coffee.isSub,
    attachmentUrls: coffee.attachmentUrls
});

const mapFood = (food: OrderFood) => ({
    ...food,
    attachmentUrls: food.attachmentUrls
});

const getRelevantTime = (order: Order): string | null => {
    switch (order.status) {
        case 'cancelled': return order.cancelledAt;
        case 'picked_up': return order.pickedUpAt;
        case 'completed': return order.completedAt;
        case 'in_progress': return order.inProgressAt;
        default: return order.createdAt;
    }
};

const formatLocalTime = (utcTime: string | null): string | null => {
    if (!utcTime) return null;
    
    // Parse the UTC time string into a Date object
    // This automatically converts it to the local timezone of the device
    const date = new Date(utcTime);
    
    // Format it according to the user's locale
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
};

export const mapOrder = (order: Order) => {
    if (!order) return null;
    const relevantTime = getRelevantTime(order);
    
    return {
        id: order.id,
        cafeId: order.cafeId,
        clientId: order.clientId,
        clientUsername: order.clientUsername,
        clientPhoneNumber: order.clientPhoneNumber,
        totalPrice: order.totalPrice,
        coffees: order.coffees?.map(coffee => ({
            id: coffee.id,
            name: coffee.name,
            cupSize: coffee.cupSize,
            price: coffee.price,
            isSub: coffee.isSub,
            attachmentUrls: coffee.attachmentUrls,
            additives: coffee.additives
        })) || [],
        food: order.food?.map(food => ({
            id: food.id,
            name: food.name,
            price: food.price,
            attachmentUrls: food.attachmentUrls
        })) || [],
        arrivalStatus: order.arrivalStatus || null,
        arrivalTime: order.arrivalTime || null,
        cancellationReason: order.cancellationReason || "",
        status: order.status || "new",
        relevantTime: formatLocalTime(relevantTime),
        createdAt: order.createdAt,
        inProgressAt: order.inProgressAt,
        completedAt: order.completedAt,
        pickedUpAt: order.pickedUpAt,
        cancelledAt: order.cancelledAt,
        clientComment: order.clientComment || null,
        orderType: order.orderType || null
    };
};