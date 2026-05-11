import { create } from 'zustand';

type ToastType = 'success' | 'warning' | 'error';

interface UIStore {
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;

  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  toast: null,
  showToast: (message, type) => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  hideToast: () => set({ toast: null }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));
