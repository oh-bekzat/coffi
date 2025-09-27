import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, verifyPhoneNumber } from "../api/profile";
import { handleSuccess, useErrorHandler } from "./useErrorHandler";

export const useGetProfile = () => {
    return useQuery({
        queryKey: ["profile"],
        queryFn: getProfile,
        staleTime: 1000 * 60 * 5,
    });
};

interface ProfileUpdateRequest {
    username?: string;
    phoneNumber?: string;
    code?: string;
    email?: string;
    pfpId?: string;
}
  
export const useUpdateProfile = () => {
    const { handleError } = useErrorHandler();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<ProfileUpdateRequest>) => updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            handleSuccess("Профиль успешно обновлен");
        },
        onError: (error) => {
            handleError(error);
        },
    });
};

export const useVerifyPhoneNumber = () => {
    const { handleError } = useErrorHandler();

    return useMutation({
        mutationFn: (data: {phoneNumber: string} ) => verifyPhoneNumber(data),
        onSuccess: () => {
            handleSuccess("Номер успешно подтвержден");
        },
        onError: (error) => {
        handleError(error);
        },
    });   
};