import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/stores/uiStore';

const toastStyles = {
  success: { bg: 'bg-success-light', text: 'text-success', icon: 'checkmark-circle' },
  warning: { bg: 'bg-warning-light', text: 'text-warning', icon: 'warning' },
  error: { bg: 'bg-danger-light', text: 'text-danger', icon: 'alert-circle' },
};

export function Toast() {
  const { toast } = useUIStore();

  if (!toast) return null;

  const style = toastStyles[toast.type];

  return (
    <Animated.View
      className={`absolute top-12 left-4 right-4 z-50 ${style.bg} rounded-xl p-4 shadow-lg flex-row items-center`}
    >
      <Ionicons name={style.icon as any} size={24} color={toast.type === 'success' ? '#059669' : toast.type === 'warning' ? '#D97706' : '#DC2626'} />
      <Text className={`${style.text} ml-3 flex-1 font-medium`}>{toast.message}</Text>
    </Animated.View>
  );
}
