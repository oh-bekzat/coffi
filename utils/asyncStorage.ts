import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERRED_CAFE_KEY = "preferredCafe";
const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const EXPIRY_KEY = "expiryTime";
const ROLE_KEY = "role";
const HAS_SEEN = "hasSeenOnboarding31";

export const getPreferredCafe = async () => {
  try {
    const cafe = await AsyncStorage.getItem(PREFERRED_CAFE_KEY);
    return cafe ? JSON.parse(cafe) : null;
  } catch (error) {
    // console.error("Error reading preferred cafe:", error);
    return null;
  }
};

export const savePreferredCafe = async (cafe: any) => {
  try {
    if (cafe) {
      await AsyncStorage.setItem(PREFERRED_CAFE_KEY, JSON.stringify(cafe));
    } else {
      await AsyncStorage.removeItem(PREFERRED_CAFE_KEY);
    }
  } catch (error) {
    // console.error("Error saving preferred cafe:", error);
    throw error;
  }
};

export const removePreferredCafe = async () => {
  try {
    await AsyncStorage.removeItem(PREFERRED_CAFE_KEY);
  } catch (error) {
    // console.error("Error removing preferred cafe:", error);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    // console.error("Error reading access token:", error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    // console.error("Error reading refresh token:", error);
    return null;
  }
};

export const getExpiryTime = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(EXPIRY_KEY);
  } catch (error) {
    // console.error("Error reading expiry time:", error);
    return null;
  }
};

export const getRole = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(ROLE_KEY);
  } catch (error) {
    // console.error("Error reading role:", error);
    return null;
  }
};

export const getHasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(HAS_SEEN);
    return value === 'true';
  } catch (error) {
    // console.error('Error reading onboarding status:', error);
    return false;
  }
};

export const setHasSeenOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_SEEN, 'true');
  } catch (error) {
    // console.error('Error saving onboarding status:', error);
  }
};