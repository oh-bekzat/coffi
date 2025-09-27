import { create } from 'zustand';

interface PhoneNumberStore {
  phoneNumber: string;
  phoneNumberDisplay: string;
  setPhoneNumber: (number: string) => void;
  setPhoneNumberDisplay: (display: string) => void;
}

export const usePhoneNumberStore = create<PhoneNumberStore>((set) => ({
    phoneNumber: '',
    phoneNumberDisplay: '',
    setPhoneNumber: (number) => set((state) => ({
      phoneNumber: number,
      phoneNumberDisplay: number
        .slice(0, 11)
        .replace(/(\d{3})(\d{0,3})(\d{0,2})(\d{0,2})/, (_, g1, g2, g3, g4) => {
          let formatted = g1;
          if (g2) formatted += ` ${g2}`;
          if (g3) formatted += ` ${g3}`;
          if (g4) formatted += ` ${g4}`;
          return formatted;
        })
    })),
    setPhoneNumberDisplay: (display) => set({ phoneNumberDisplay: display })
}));