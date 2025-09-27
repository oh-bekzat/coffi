import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Default location (Almaty city center)
const DEFAULT_LOCATION = {
  latitude: 51.08188871938569, 
  longitude: 71.398056966408,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

interface LocationState {
  // Current location
  location: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  
  // Permission status
  hasLocationPermission: boolean;
  
  // Last update timestamp
  lastUpdated: number | null;
  
  // Actions
  setLocation: (location: LocationState['location']) => Promise<void>;
  setLocationPermission: (hasPermission: boolean) => void;
  loadSavedLocation: () => Promise<void>;
  
  // Get current coordinates with fallback
  getCurrentCoordinates: () => { lat: number; lon: number };
  
  // Refresh location if needed
  refreshLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      location: null,
      hasLocationPermission: false,
      lastUpdated: null,
      
      setLocation: async (location) => {
        set({ 
          location, 
          lastUpdated: Date.now() 
        });
      },
      
      setLocationPermission: (hasPermission) => {
        set({ hasLocationPermission: hasPermission });
      },
      
      loadSavedLocation: async () => {
        // This will use the persisted location from storage
        // If no location exists in storage, it will remain null
        // The getCurrentCoordinates method will handle fallbacks
      },
      
      getCurrentCoordinates: () => {
        const { location } = get();
        
        // Return current location if available
        if (location) {
          return {
            lat: location.latitude,
            lon: location.longitude
          };
        }
        
        // Return default location as fallback
        return {
          lat: DEFAULT_LOCATION.latitude,
          lon: DEFAULT_LOCATION.longitude
        };
      },
      
      refreshLocation: async () => {
        const { hasLocationPermission, lastUpdated } = get();
        
        // Skip refresh if we updated recently (within last 5 minutes)
        const fiveMinutes = 5 * 60 * 1000;
        if (lastUpdated && Date.now() - lastUpdated < fiveMinutes) {
          return;
        }
        
        if (hasLocationPermission) {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced
            });
            
            set({
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              lastUpdated: Date.now()
            });
          } catch (error) {
            // console.error('Error getting current location:', error);
            // Keep using existing location on error
          }
        }
      }
    }),
    {
      name: 'location-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          if (value === null) return null;
          return JSON.parse(value);
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
); 