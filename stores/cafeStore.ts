import { create } from 'zustand';
import { Cafe } from '../api/cafe';
import { getPreferredCafe, savePreferredCafe } from '../utils/asyncStorage';

interface CafeState {
  preferredCafe: Cafe | null;
  setPreferredCafe: (cafe: Cafe | null) => Promise<void>;
  loadPreferredCafe: () => Promise<void>;
}

export const useCafeStore = create<CafeState>((set) => ({
  preferredCafe: null,
  
  setPreferredCafe: async (cafe) => {
    try {
      await savePreferredCafe(cafe);
      set({ preferredCafe: cafe });
    } catch (error) {
      // console.error("Error saving preferred cafe:", error);
      throw error;
    }
  },
  
  loadPreferredCafe: async () => {
    try {
      const cafe = await getPreferredCafe();
      set({ preferredCafe: cafe });
    } catch (error) {
      // console.error("Error loading preferred cafe:", error);
      set({ preferredCafe: null });
    }
  }
}));