export interface MenuItem {
    id: string;
    name: string;
    description: string;
    attachmentUrls: string[];
    priceS: number;
    priceM: number;
    priceL: number;
    type: string;
    cafeId: string;
    available: boolean;
    cafeCategoryId: string;
    createdAt: string;
}

export interface MenuAdditive {
    id: string;
    name: string;
    description: string;
    attachmentUrls: string[];
    price: number;
    type: string;
    cafeId: string;
    available: boolean;
    createdAt: string;
}

export interface MenuCategory {
    categoryName: string;
    items: MenuItem[];
}

export interface MenuCategorizedResponse extends Array<MenuCategory> {} 