import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

const colorMap: Record<string, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function QuickAction({ icon, label, onPress, color = 'primary' }: QuickActionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="items-center"
    >
      <View className={`w-14 h-14 rounded-2xl ${colorMap[color]} items-center justify-center shadow-sm`}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <Text className="text-text-muted text-xs mt-2 text-center">{label}</Text>
    </TouchableOpacity>
  );
}
