import { create } from 'zustand';
import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string | null;
  type: ToastType;
  isVisible: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  isVisible: false,
  showToast: (message: string, type: ToastType = 'info') => {
    Toast.show({
      type: 'tomatoToast',
      text1: message,
      position: 'top'
    });
  },
  hideToast: () => set({ isVisible: false }),
}));