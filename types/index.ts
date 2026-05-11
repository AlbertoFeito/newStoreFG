export type ProductType = 'own' | 'consignment';
export type PaymentMethod = 'cash' | 'transfer' | 'installment';
export type Currency = 'CUP' | 'USD' | 'EUR' | 'MLC';
export type InstallmentFrequency = 'weekly' | 'biweekly' | 'monthly';
export type InstallmentStatus = 'active' | 'completed' | 'cancelled';
export type PeriodFilter = 'today' | 'week' | 'month' | 'year';

export interface Product {
  id?: number;
  name: string;
  category: string;
  type: ProductType;
  costPrice: number;
  costCurrency: Currency;
  salePrice: number;
  saleCurrency: Currency;
  stock: number;
  minStock: number;
  image?: string;
  description?: string;
  ownerName?: string;
  ownerContact?: string;
  notes?: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCurrency: Currency;
  subtotal: number;
}

export interface Sale {
  id?: number;
  items: SaleItem[];
  total: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  customerId?: number;
  customerName?: string;
  discount: number;
  createdAt: string;
  receiptNumber: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Installment {
  id?: number;
  saleId: number;
  customerId: number;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  numberOfPayments: number;
  frequency: InstallmentFrequency;
  startDate: string;
  status: InstallmentStatus;
  createdAt: string;
}

export interface InstallmentPayment {
  id?: number;
  installmentId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  id?: number;
  storeName: string;
  address?: string;
  phone?: string;
  primaryCurrency: Currency;
  usdRate: number;
  eurRate: number;
  mlcRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCurrency: Currency;
}

export interface CategorySummary {
  name: string;
  totalRevenue: number;
  totalProfit: number;
  productCount: number;
}

export interface SalesByMethod {
  method: PaymentMethod;
  count: number;
  total: number;
}

export interface DailySale {
  date: string;
  total: number;
  profit: number;
}

export interface TopProduct {
  id: number;
  name: string;
  image?: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface CustomerDebt {
  customer: Customer;
  totalDebt: number;
  totalPaid: number;
  remaining: number;
  hasOverdue: boolean;
  activeInstallments: number;
}

export interface DashboardStats {
  todaySales: number;
  todaySalesCount: number;
  todayProfit: number;
  totalStock: number;
  totalDebt: number;
  debtorsCount: number;
}
