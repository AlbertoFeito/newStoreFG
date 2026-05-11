import { Installment, InstallmentFrequency } from '@/types';

export function getPeriodDates(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setDate(start.getDate() - 30);
      break;
    case 'year':
      start.setDate(start.getDate() - 365);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

export function calculateNextPaymentDate(inst: Installment, paymentNum: number): Date {
  const start = new Date(inst.startDate);
  const days = inst.frequency === 'weekly' ? 7 : inst.frequency === 'biweekly' ? 15 : 30;
  const nextDate = new Date(start);
  nextDate.setDate(nextDate.getDate() + (days * paymentNum));
  return nextDate;
}

export function isOverdue(dueDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-CU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
