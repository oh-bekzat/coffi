import { useQuery } from "@tanstack/react-query";
import { getMenuAdditives, getMenuDrinks, getMenuFoods } from "../api/menu";

export const useMenuFoods = (cafeId: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["foods", cafeId],
        queryFn: () => getMenuFoods(cafeId),
        staleTime: 1000 * 60 * 5,
        enabled: options?.enabled !== false && !!cafeId,
    });
}

export const useMenuDrinks = (cafeId: string) => {
    return useQuery({
        queryKey: ["drinks", cafeId],
        queryFn: () => getMenuDrinks(cafeId),
        enabled: !!cafeId,
    });
}

export const useMenuAdditives = (cafeId: string) => {
    return useQuery({
        queryKey: ["additives", cafeId],
        queryFn: () => getMenuAdditives(cafeId),
        enabled: !!cafeId,
    });
}