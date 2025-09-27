import Toast from 'react-native-toast-message';
import { ApiError, ErrorCode } from '../types/api';

// Map backend error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.INVALID_SMS_CODE]: 'Неверный код подтверждения',
  [ErrorCode.WRONG_PASSWORD]: 'Неверный пароль',
  [ErrorCode.CARD_NOT_FOUND]: 'Карта не найдена',
  'DEFAULT': 'Произошла ошибка'
};

/**
 * Extracts a user-friendly error message from any error type
 */
function extractErrorMessage(error: unknown): string {
  // Default message
  let message = ERROR_MESSAGES.DEFAULT;

  try {
    // Case 1: ApiError with error code
    if (error instanceof Error && 'detail' in error) {
      const apiError = error as ApiError;
      
      // If we have a known error code, use its message
      if (apiError.detail?.error_code && apiError.detail.error_code in ERROR_MESSAGES) {
        return ERROR_MESSAGES[apiError.detail.error_code];
      }
      
      // Otherwise use the message from the API
      if (apiError.detail?.message) {
        return apiError.detail.message;
      }
    }
    
    // Case 2: Standard Error
    if (error instanceof Error) {
      return error.message || ERROR_MESSAGES.DEFAULT;
    }
    
    // Case 3: Object with message
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return (error as any).message || ERROR_MESSAGES.DEFAULT;
    }
    
    // Case 4: String error
    if (typeof error === 'string') {
      return error;
    }
  } catch (e) {
    // console.error('Error while parsing error message:', e);
  }
  
  return message;
}

export function useErrorHandler() {
  const handleError = (error: unknown) => {
    // Log error for debugging
    // console.error('API Error:', error);
    
    // Extract user-friendly message
    const message = extractErrorMessage(error);
    
    // Show toast to user
    Toast.show({
      type: 'tomatoToast',
      text1: message,
      position: 'top'
    });
  };

  return { handleError };
}

export const handleSuccess = (message: string) => {
  Toast.show({
    type: 'tomatoToast',
    text1: message,
    position: 'top'
  });
};