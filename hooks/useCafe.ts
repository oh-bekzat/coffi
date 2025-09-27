import { useQuery } from "@tanstack/react-query";
import { getCafes, getCafesByCoffee, getCafe } from "../api/cafe";
import { useLocationStore } from "../stores/locationStore";
import { useEffect } from "react";
import { useAuthStore } from '../stores/authStore';

export const useGetCafes = (search?: string) => {
    const { getCurrentCoordinates, refreshLocation } = useLocationStore();
    const { isAuthenticated } = useAuthStore();
    
    // Refresh location when hook is called
    useEffect(() => {
        refreshLocation();
    }, []);
    
    const { lat, lon } = getCurrentCoordinates();
    
    return useQuery({
        queryKey: ["cafes", search, lat, lon, isAuthenticated],
        queryFn: () => {
            return getCafes(search, lat, lon, isAuthenticated);
        },
        staleTime: 1000 * 60 * 5,
    });
};

export const useGetCafe = (cafeId?: string) => {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: ["cafe", cafeId, isAuthenticated],
        queryFn: () => getCafe(cafeId!, isAuthenticated),
        enabled: !!cafeId,
        staleTime: 1000 * 60 * 2,
    });
};

export const useGetCafesByCoffee = (coffeeId: string, search?: string) => {
    const { getCurrentCoordinates, refreshLocation } = useLocationStore();
    const { isAuthenticated } = useAuthStore();
    
    // Refresh location when hook is called
    useEffect(() => {
        refreshLocation();
    }, []);
    
    const { lat, lon } = getCurrentCoordinates();
    
    return useQuery({
        queryKey: ["cafesByCoffee", coffeeId, search, lat, lon, isAuthenticated],
        queryFn: () => {
            return getCafesByCoffee(coffeeId, search, lat, lon, isAuthenticated);
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!coffeeId
    });
};