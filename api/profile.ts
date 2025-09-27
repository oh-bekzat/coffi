import { fetchApi } from "./fetch";

interface ProfileResponse {
    id: string;
    username: string;
    phoneNumber: string;
    email: string;
    pfpUrl: string;
    subscription: {
        balance: number;
        dailyBalance: number;
        endDate: string;
        id: string;
        startDate: string;
        status: string;
        subId: string;
        subName: string;
    }
}

interface ProfileUpdateRequest {
    username: string;
    phoneNumber: string;
    code: string;
    email: string;
    pfpId: string;
}

export const getProfile = async (): Promise<ProfileResponse> => {
    return fetchApi<ProfileResponse>("/client", {
        method: "GET",
    });
}
  
export const updateProfile = async (data: Partial<ProfileUpdateRequest>): Promise<ProfileResponse> => {
    return fetchApi<ProfileResponse>("/client", {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export const verifyPhoneNumber = async (data: {phoneNumber: string}): Promise<{ code: string }> => {
    return fetchApi<{ code: string }>("/auth/verify-phone", {
        method: "POST",
        body: JSON.stringify(data),
    });
}