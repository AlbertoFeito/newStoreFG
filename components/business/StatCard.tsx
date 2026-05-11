import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
  className?: string;
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary-lighter', icon: '#0F766E' },
  success: { bg: 'bg-success-light', icon: '#059669' },
  warning: { bg: 'bg-warning-light', icon: '#D97706' },
  danger: { bg: 'bg-danger-light', icon: '#DC2626' },
};

export function StatCard({ icon, label, value, subValue, color = 'primary', className = '' }: StatCardProps) {
  const colors = colorMap[color] || colorMap.primary;

  return (
    <View className={`${colors.bg} rounded-2xl p-4 ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className={`w-10 h-10 rounded-xl bg-white/50 items-center justify-center`}>
          <Ionicons name={icon as any} size={22} color={colors.icon} />
        </View>
        {subValue && (
          <Text className="text-xs text-text-muted">{subValue}</Text>
        )}
      </View>

      <Text className="text-text-primary font-bold text-xl mt-3">{value}</Text>
      <Text className="text-text-muted text-sm mt-0.5">{label}</Text>
    </View>
  );
}
