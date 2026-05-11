import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, color = 'bg-primary', showLabel = true, className = '' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={`${className}`}>
      <View className="h-2 bg-background-alt rounded-full overflow-hidden">
        <View
          className={`h-full rounded-full ${color}`}
          style={{ width: `${clampedValue}%` }}
        />
      </View>
      {showLabel && (
        <Text className="text-xs text-text-muted mt-1">{clampedValue.toFixed(0)}%</Text>
      )}
    </View>
  );
}
