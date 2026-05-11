import { Currency } from '@/types';

export function convertToCUP(amount: number, currency: Currency, rates: { USD: number; EUR: number; MLC: number }): number {
  if (currency === 'CUP') return amount;
  if (currency === 'USD') return amount * rates.USD;
  if (currency === 'EUR') return amount * rates.EUR;
  if (currency === 'MLC') return amount * rates.MLC;
  return amount;
}

export function formatPrice(amount: number, currency: Currency): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function formatCUP(amount: number): string {
  return `${amount.toFixed(2)} CUP`;
}
