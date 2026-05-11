import { create } from 'zustand';
import { CartItem, Currency } from '@/types';

interface CartStore {
  items: CartItem[];
  paymentMethod: 'cash' | 'transfer' | 'installment';
  currency: Currency;
  customerId?: number;
  customerName?: string;
  discount: number;
  frequency?: 'weekly' | 'biweekly' | 'monthly';
  numberOfPayments?: number;

  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: 'cash' | 'transfer' | 'installment') => void;
  setCurrency: (currency: Currency) => void;
  setCustomer: (id: number, name: string) => void;
  setDiscount: (discount: number) => void;
  setInstallmentConfig: (frequency: 'weekly' | 'biweekly' | 'monthly', numberOfPayments: number) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  paymentMethod: 'cash',
  currency: 'CUP',
  discount: 0,

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      paymentMethod: 'cash',
      currency: 'CUP',
      customerId: undefined,
      customerName: undefined,
      discount: 0,
      frequency: undefined,
      numberOfPayments: undefined,
    });
  },

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCurrency: (currency) => set({ currency }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setDiscount: (discount) => set({ discount }),
  setInstallmentConfig: (frequency, numberOfPayments) => set({ frequency, numberOfPayments }),

  getTotal: () => {
    const { items, discount } = get();
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return Math.max(0, subtotal - discount);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
