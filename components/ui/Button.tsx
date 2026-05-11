import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-gray-200',
  danger: 'bg-danger',
  ghost: 'bg-transparent border border-border',
  success: 'bg-success',
};

const textStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-text-primary',
  danger: 'text-white',
  ghost: 'text-primary',
  success: 'text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-xl
        flex-row items-center justify-center
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#0F766E' : '#fff'} />
      ) : (
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon as any}
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
              color={variant === 'secondary' || variant === 'ghost' ? '#0F766E' : '#fff'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`${textStyles[variant]} ${textSizeStyles[size]} font-semibold`}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
