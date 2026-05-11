import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomerDebt } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';

interface CustomerCardProps {
  customerDebt: CustomerDebt;
  onPress?: () => void;
}

export function CustomerCard({ customerDebt, onPress }: CustomerCardProps) {
  const { customer, totalDebt, totalPaid, remaining, hasOverdue, activeInstallments } = customerDebt;
  const progress = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 100;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-card rounded-xl p-4 shadow-sm mb-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-text-primary font-semibold text-base">{customer.name}</Text>
            {hasOverdue && (
              <Badge text="Mora" variant="danger" className="ml-2" />
            )}
          </View>

          {customer.phone && (
            <Text className="text-text-muted text-sm mt-0.5">{customer.phone}</Text>
          )}
        </View>

        <View className="items-end">
          <Text className="text-danger font-bold">{remaining.toFixed(2)} CUP</Text>
          <Text className="text-text-light text-xs">{activeInstallments} cuotas activas</Text>
        </View>
      </View>

      <View className="mt-3">
        <ProgressBar value={progress} color={hasOverdue ? 'bg-danger' : 'bg-primary'} />
      </View>
    </TouchableOpacity>
  );
}
