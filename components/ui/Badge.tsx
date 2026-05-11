import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-text-muted',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  primary: 'bg-primary-lighter text-primary',
};

export function Badge({ text, variant = 'default', className = '' }: BadgeProps) {
  return (
    <View className={`px-2.5 py-1 rounded-full ${variantStyles[variant].split(' ')[0]} ${className}`}>
      <Text className={`text-xs font-medium ${variantStyles[variant].split(' ')[1]}`}>
        {text}
      </Text>
    </View>
  );
}
