import React from 'react';
import { View, TextInput, Text } from 'react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  secureTextEntry?: boolean;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  helperText,
  multiline = false,
  numberOfLines = 1,
  className = '',
}: InputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-medium text-text-muted mb-1.5">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        className={`
          bg-background-alt rounded-xl px-4 py-3
          text-text-primary text-base
          border ${error ? 'border-danger' : 'border-border'}
          ${multiline ? 'h-24' : ''}
        `}
      />
      {error && (
        <Text className="text-sm text-danger mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-sm text-text-light mt-1">{helperText}</Text>
      )}
    </View>
  );
}
