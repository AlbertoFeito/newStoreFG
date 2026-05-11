import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: string;
  message: string;
  subMessage?: string;
  className?: string;
}

export function EmptyState({ icon, message, subMessage, className = '' }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-12 ${className}`}>
      <Ionicons name={icon as any} size={48} color="#94A3B8" />
      <Text className="text-text-muted text-base mt-4 text-center">{message}</Text>
      {subMessage && (
        <Text className="text-text-light text-sm mt-1 text-center">{subMessage}</Text>
      )}
    </View>
  );
}
