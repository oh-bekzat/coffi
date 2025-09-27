import { create } from "zustand";

interface BottomSheetState {
  isOpen: boolean;
  content: React.ReactNode | null;
  openSheet: (content: React.ReactNode) => void;
  closeSheet: () => void;
}

export const useBottomSheetStore = create<BottomSheetState>((set) => ({
  isOpen: false,
  content: null,
  openSheet: (content) => set({ isOpen: true, content }),
  closeSheet: () => set({ isOpen: false, content: null }),
}));