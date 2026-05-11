import { Sale, Product, Installment } from '@/types';

export function calculateSaleProfit(sale: Sale, products: Product[]): number {
  let profit = 0;
  for (const item of sale.items) {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      const costInSaleCurrency = product.costPrice; // Simplified - assumes same currency
      profit += (item.unitPrice - costInSaleCurrency) * item.quantity;
    }
  }
  return profit - sale.discount;
}

export function calculateDebtProgress(inst: Installment): number {
  if (inst.totalAmount === 0) return 100;
  return Math.min(100, (inst.paidAmount / inst.totalAmount) * 100);
}

export function calculateInstallmentAmount(inst: Installment): number {
  return inst.totalAmount / inst.numberOfPayments;
}

export function getPaymentNumber(inst: Installment): number {
  if (inst.totalAmount === 0) return 0;
  return Math.ceil((inst.paidAmount / inst.totalAmount) * inst.numberOfPayments);
}
