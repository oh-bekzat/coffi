import { useToastStore } from '../stores/toastStore';

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorDetail {
  error_code: string;
  message: string;
}

export interface ApiError {
  detail: ApiErrorDetail;
}

export function isApiError(error: any): error is ApiError {
  return (
    error &&
    (typeof error.message === 'string' ||
     Array.isArray(error.detail))
  );
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Произошла неизвестная ошибка';
  
  if (typeof error === 'object' && error !== null) {
    const apiError = error as any;
    
    if (apiError.detail?.message) {
      return apiError.detail.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

export const ERROR_CODES = {
  INVALID_SMS_CODE: 'Неверный код подтверждения',
  WRONG_PASSWORD: 'Неверный пароль',
  ALREADY_SUBSCRIBED: 'Вы уже владеете подпиской',
  FORBIDDEN: 'Доступ запрещен',
  SUB_NOT_FOUND: 'Подписка не найдена',
} as const;

export function handleApiError(error: unknown) {
  // console.error('API Error:', error);
  
  const message = getErrorMessage(error);
  useToastStore.getState().showToast(message, 'error');
}