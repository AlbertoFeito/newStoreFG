import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Installment } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { calculateDebtProgress, calculateInstallmentAmount, getPaymentNumber } from '@/helpers/calculations';
import { formatDate, isOverdue, calculateNextPaymentDate } from '@/helpers/dates';

interface InstallmentCardProps {
  installment: Installment;
  onPay?: () => void;
}

export function InstallmentCard({ installment, onPay }: InstallmentCardProps) {
  const progress = calculateDebtProgress(installment);
  const paymentNum = getPaymentNumber(installment);
  const nextPaymentDate = calculateNextPaymentDate(installment, paymentNum + 1);
  const overdue = isOverdue(nextPaymentDate);
  const installmentAmount = calculateInstallmentAmount(installment);

  return (
    <View className="bg-card rounded-xl p-4 shadow-sm mb-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-text-primary font-semibold">{installment.customerName}</Text>
          <Text className="text-text-muted text-sm">
            Cuota {paymentNum + 1} de {installment.numberOfPayments}
          </Text>
        </View>

        <View className="items-end">
          <Text className={`font-bold ${overdue ? 'text-danger' : 'text-text-primary'}`}>
            {installmentAmount.toFixed(2)} CUP
          </Text>
          <Text className={`text-xs ${overdue ? 'text-danger' : 'text-text-light'}`}>
            {overdue ? 'Vencida' : `Vence: ${formatDate(nextPaymentDate)}`}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <ProgressBar value={progress} />
      </View>

      <View className="flex-row justify-between mt-3">
        <Text className="text-text-muted text-sm">
          Pagado: {installment.paidAmount.toFixed(2)} / {installment.totalAmount.toFixed(2)} CUP
        </Text>

        {onPay && installment.status === 'active' && (
          <Button
            title="Pagar"
            onPress={onPay}
            size="sm"
            className="ml-2"
          />
        )}
      </View>
    </View>
  );
}
