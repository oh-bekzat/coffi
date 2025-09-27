import { ApiError } from "../types/api";

const API_BASE_URL = "https://dev-refill.kz/backend/0e885b3a-905f-4ce3-8881-1369c323b7ad/api/v1";

// Request retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Token management functions that will be implemented externally
let getTokenFn: () => Promise<string | null> = async () => null;
let refreshTokenFn: () => Promise<string | null> = async () => null;
let logoutFn: () => Promise<void> = async () => {};

// Register auth handlers from outside
export function registerAuthHandlers(
  getToken: () => Promise<string | null>,
  refreshToken: () => Promise<string | null>,
  logout: () => Promise<void>
) {
  getTokenFn = getToken;
  refreshTokenFn = refreshToken;
  logoutFn = logout;
}

// Create a proper API error with all details
function createApiError(message: string, errorData?: any, status?: number): ApiError {
  const apiError = new Error(message) as ApiError;
  
  if (errorData) {
    // Handle nested 'detail' object structure from API
    if (errorData.detail) {
      apiError.detail = errorData.detail;
    } 
    // Some endpoints might return { message, error_code } directly
    else if (errorData.message || errorData.error_code) {
      apiError.detail = {
        message: errorData.message || message,
        error_code: errorData.error_code
      };
    }
  }
  
  if (status) {
    apiError.status = status;
  }
  
  return apiError;
}

// Helper for reliable fetching with retries
async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit,
  retriesLeft: number
): Promise<T> {
  try {
    console.log(`🚀 REQUEST [${options.method || 'GET'}]: ${API_BASE_URL}${endpoint}`, {
      headers: options.headers,
      body: options.body ? JSON.parse(options.body.toString()) : undefined,
      retriesLeft
    });
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    
    if (options.headers && options.headers instanceof Headers) {
      options.headers.forEach((value: string, key: string) => {
        headers[key] = value;
      });
    }
    
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    // console.log(`⏱️ RESPONSE TIME: ${responseTime}ms for ${options.method || 'GET'} ${endpoint}`);
    // console.log(`📊 RESPONSE STATUS: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Log basic error info
      console.error(`❌ ERROR RESPONSE [${response.status}] for ${options.method || 'GET'} ${endpoint}`);
      
      // Get error body if exists
      let errorData: any = null;
      try {
        errorData = await response.clone().json();
        console.error('📄 ERROR DETAILS:', JSON.stringify(errorData, null, 2));
      } catch (jsonError) {
        const text = await response.clone().text();
        console.error('📄 ERROR RESPONSE TEXT:', text || 'Empty response');
      }
      
      // Special case for unauthorized
      if (response.status === 401) {
        throw createApiError("Unauthorized", errorData, 401);
      }
      
      // Extract error message
      let errorMessage = `API request failed: ${response.statusText} (Status: ${response.status})`;
      
      if (errorData) {
        if (errorData.detail?.message) {
          errorMessage = errorData.detail.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }
      
      console.error(`🔍 ERROR MESSAGE: ${errorMessage}`);
      throw createApiError(errorMessage, errorData, response.status);
    }
    
    // Handle different response types
    const contentType = response.headers.get("content-type");
    // console.log(`📋 RESPONSE CONTENT-TYPE: ${contentType || 'none'}`);
    
    // For 204 No Content or empty responses, return an empty object
    if (response.status === 204 || !contentType) {
      // console.log(`✅ EMPTY RESPONSE: ${response.status}`);
      return {} as T;
    }
    
    // For JSON responses
    if (contentType && contentType.includes("application/json")) {
      // Check if there's actually content to parse
      const text = await response.text();
      if (!text) {
        // console.log('✅ EMPTY JSON RESPONSE');
        return {} as T;
      }
      
      const data = JSON.parse(text) as T;
      console.log('✅ RESPONSE DATA:', JSON.stringify(data, null, 2));
      return data;
    } 
    
    // For other content types, return an empty object
    // console.log('✅ NON-JSON RESPONSE');
    return {} as T;
  } catch (error) {
    // Only log non-ApiError types fully, ApiErrors already logged above
    if (!(error instanceof Error && 'detail' in error)) {
      // console.error(`❌ FETCH ERROR:`, error);
    }
    
    // Retry logic
    if (retriesLeft > 0) {
      // console.log(`🔄 RETRYING: ${retriesLeft} attempts left for ${endpoint}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(endpoint, options, retriesLeft - 1);
    }
    
    throw error;
  }
}

// Main fetch API function with authentication
export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true,
  config: {
    retries?: number;
  } = {}
): Promise<T> => {
  const { retries = MAX_RETRIES } = config;
  
  // console.log(`🔐 API REQUEST: ${endpoint}`, { 
  //   requiresAuth, 
  //   method: options.method || 'GET',
  //   retries
  // });
  
  // Set up headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  
  // Add authentication if required
  if (requiresAuth) {
    const token = await getTokenFn();
    
    if (token) {
      // console.log(`🔑 Using existing token for ${endpoint}`);
      headers.Authorization = `Bearer ${token}`;
    } else {
      // Try refresh token if not an auth endpoint
      if (!endpoint.startsWith('/auth/')) {
        // console.log(`🔄 No token found, attempting refresh for ${endpoint}`);
        const refreshedToken = await refreshTokenFn();
        if (refreshedToken) {
          // console.log(`✅ Token refreshed successfully for ${endpoint}`);
          headers.Authorization = `Bearer ${refreshedToken}`;
        } else {
          // console.error(`❌ Token refresh failed for ${endpoint}`);
          // Only log out if token refresh failed and not on auth endpoints
          await logoutFn();
          throw createApiError("Session expired. Please log in again.", undefined, 401);
        }
      }
    }
  }
  
  const fetchOptions = {
    ...options,
    headers
  };
  
  try {
    return await fetchWithRetry<T>(endpoint, fetchOptions, retries);
  } catch (error: any) {
    // Handle USER_NOT_FOUND error - this means user no longer exists in the system
    if (error.detail?.error_code === "USER_NOT_FOUND" && requiresAuth) {
      // console.error(`❌ User not found error detected, logging out and redirecting to auth`);
      await logoutFn();
      throw createApiError("Your account was not found. Please log in again.", error.detail, 404);
    }
    
    // Handle authentication errors with a single retry after token refresh
    if (error.message === 'Unauthorized' && requiresAuth && !endpoint.startsWith('/auth/')) {
      // console.log(`🔄 Unauthorized error, attempting token refresh for ${endpoint}`);
      try {
        const refreshedToken = await refreshTokenFn();
        if (refreshedToken) {
          // console.log(`✅ Token refreshed after unauthorized error for ${endpoint}`);
          headers.Authorization = `Bearer ${refreshedToken}`;
          return fetchWithRetry<T>(endpoint, { ...options, headers }, 0);
        } else {
          // console.error(`❌ Token refresh failed after unauthorized error for ${endpoint}`);
          // Let AuthGuard handle navigation after state is updated
          await logoutFn();
          throw createApiError("Session expired. Please log in again.", undefined, 401);
        }
      } catch (refreshError) {
        // console.error(`❌ Token refresh failed with error:`, refreshError);
        // Let AuthGuard handle navigation after state is updated
        await logoutFn();
        throw createApiError("Session expired. Please log in again.", undefined, 401);
      }
    }
    
    // Just rethrow the error - it's already properly formatted
    throw error;
  }
};