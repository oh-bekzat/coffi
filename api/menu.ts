import { fetchApi } from "./fetch";
import { MenuItem, MenuAdditive, MenuCategorizedResponse } from "../types/menu";

export const getMenuFoods = async (cafeId: string) => {
    return fetchApi<MenuCategorizedResponse>(`/cafe/${cafeId}/menu/item?type=food`, {
        method: "GET",
    });
}

export const getMenuDrinks = async (cafeId: string) => {
    return fetchApi<MenuCategorizedResponse>(`/cafe/${cafeId}/menu/item?type=drink`, {
        method: "GET",
    });
}

export const getMenuAdditives = async (cafeId: string) => {
    return fetchApi<MenuAdditive[]>(`/cafe/${cafeId}/menu/additive`, {
        method: "GET",
    });
}