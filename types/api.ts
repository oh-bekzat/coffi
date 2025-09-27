// Define common API error structure
export interface ApiError extends Error {
  detail?: {
    message: string;
    error_code?: string;
  };
  status?: number;
}

// Error codes from backend
export enum ErrorCode {
  INVALID_SMS_CODE = 'INVALID_SMS_CODE',
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  // Add other error codes as they appear
} 