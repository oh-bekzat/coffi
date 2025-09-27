import { fetchApi } from "./fetch";
import { CoffeeOrder } from "./coffee";

export interface Cafe {
    name: string;
    description: string;
    country: string;
    city: string;
    streetName: string;
    streetNumber: string;
    lat: number;
    lon: number;
    id: string;
    rating: number;
    ratingCount: number;
    pfpUrl: string;
    attachmentUrls: string[];
    isOpen: boolean;
    twogisLink?: string;
    openingSchedule: [
      {
        day: string;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
      },
    ];
}

export const getCafes = async (search?: string, lat?: number, lon?: number, requiresAuth: boolean = false): Promise<Cafe[]> => {
    // Build query with required lat/lon
    let query = `?lat=${lat || 43.238949}&lon=${lon || 76.889709}`;
    
    // Add search if provided
    if (search) {
        query += `&search=${encodeURIComponent(search)}`;
    }
    
    return fetchApi<Cafe[]>(`/cafe${query}`, {
        method: "GET",
    }, requiresAuth);
};

export const getCafe = async (cafeId: string, requiresAuth: boolean = false): Promise<Cafe> => {
    return fetchApi<Cafe>(`/cafe/${cafeId}`, {
        method: "GET",
    }, requiresAuth);
};

export const getCafesByCoffee = async (coffeeId: string, search?: string, lat?: number, lon?: number, requiresAuth: boolean = false): Promise<Cafe[]> => {
    // Build query with required lat/lon
    let query = `?lat=${lat || 43.238949}&lon=${lon || 76.889709}`;
    
    // Add search if provided
    if (search) {
        query += `&search=${encodeURIComponent(search)}`;
    }
    
    return fetchApi<Cafe[]>(`/client/coffee/${coffeeId}/cafe${query}`, {
        method: "GET",
    }, requiresAuth);
};

export interface CafeBag {
  cafe: Cafe;
  items: CoffeeOrder[];
}