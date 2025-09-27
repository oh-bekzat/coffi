import { create } from 'zustand';
import { Cafe } from '../api/cafe';
import { CoffeeOrder, MenuOrder } from '../api/coffee';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BagState {
  cafe: Cafe | null;
  coffees: CoffeeOrder[];
  foods: MenuOrder[];
  _hasHydrated: boolean;
  
  // Actions
  setCafe: (cafe: Cafe) => void;
  addCoffee: (cafe: Cafe, coffee: CoffeeOrder) => void;
  addFood: (cafe: Cafe, food: MenuOrder) => void;
  removeCoffee: (index: number) => void;
  removeFood: (index: number) => void;
  clearBag: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  
  // Computed values
  getTotalPrice: () => number;
}

export const useBagStore = create<BagState>()(
  devtools(
    persist(
      (set, get) => ({
        cafe: null,
        coffees: [],
        foods: [],
        _hasHydrated: false,
        
        setCafe: (cafe) => {
          set({ cafe });
        },
        
        addCoffee: (cafe, coffee) => {
          set((state) => {
            // If no cafe is set or a different cafe is selected
            if (!state.cafe || state.cafe.id !== cafe.id) {
              // Clear existing items and set new cafe
              return {
                cafe,
                coffees: [coffee],
                foods: []
              };
            }
            
            // Add coffee to existing cafe
            return {
              ...state,
              coffees: [...state.coffees, coffee]
            };
          });
        },
        
        addFood: (cafe, food) => {
          set((state) => {
            // If no cafe is set or a different cafe is selected
            if (!state.cafe || state.cafe.id !== cafe.id) {
              // console.log('Setting new cafe and adding food', cafe.id, food);
              // Clear existing items and set new cafe
              return {
                cafe,
                coffees: [],
                foods: [food]
              };
            }
            
            // console.log('Adding food to existing cafe', food);
            // Add food to existing cafe
            return {
              ...state,
              foods: [...state.foods, food]
            };
          });
        },
        
        removeCoffee: (index) => {
          set((state) => {
            const newCoffees = [...state.coffees];
            newCoffees.splice(index, 1);
            
            // If bag is completely empty, clear cafe too
            if (newCoffees.length === 0 && state.foods.length === 0) {
              return { cafe: null, coffees: [], foods: [] };
            }
            
            // Otherwise just update coffees
            return { coffees: newCoffees };
          });
        },
        
        removeFood: (index) => {
          set((state) => {
            const newFoods = [...state.foods];
            newFoods.splice(index, 1);
            
            // If bag is completely empty, clear cafe too
            if (newFoods.length === 0 && state.coffees.length === 0) {
              return { cafe: null, coffees: [], foods: [] };
            }
            
            // Otherwise just update foods
            return { foods: newFoods };
          });
        },
        
        clearBag: () => {
          set({ cafe: null, coffees: [], foods: [] });
        },
        
        setHasHydrated: (hasHydrated) => {
          set({ _hasHydrated: hasHydrated });
        },
        
        getTotalPrice: () => {
          const state = get();
          let total = 0;
          
          // Add coffee prices
          state.coffees.forEach(coffee => {
            // Add coffee price logic here
          });
          
          // Add food prices
          state.foods.forEach(food => {
            // Add food price logic here
          });
          
          return total;
        }
      }),
      {
        name: 'bag-storage',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.setHasHydrated(true);
          }
        },
      }
    )
  )
); 