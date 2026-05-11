import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '@/types';
import { useAppStore } from '@/stores/appStore';

interface SaleItemProps {
  item: CartItem;
  onUpdateQty: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export function SaleItemCart({ item, onUpdateQty, onRemove }: SaleItemProps) {
  const { formatPrice } = useAppStore();

  return (
    <View className="bg-card rounded-xl p-3 mb-2 flex-row items-center">
      <View className="flex-1">
        <Text className="text-text-primary font-medium">{item.productName}</Text>
        <Text className="text-text-muted text-sm">
          {formatPrice(item.unitPrice, item.unitCurrency)} c/u
        </Text>
      </View>

      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => onUpdateQty(item.productId, item.quantity - 1)}
          className="w-8 h-8 bg-background-alt rounded-full items-center justify-center"
        >
          <Ionicons name="remove" size={16} color="#0F766E" />
        </TouchableOpacity>

        <Text className="text-text-primary font-semibold mx-3 min-w-[24px] text-center">
          {item.quantity}
        </Text>

        <TouchableOpacity
          onPress={() => onUpdateQty(item.productId, item.quantity + 1)}
          className="w-8 h-8 bg-background-alt rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={16} color="#0F766E" />
        </TouchableOpacity>
      </View>

      <View className="ml-4 items-end min-w-[80px]">
        <Text className="text-text-primary font-semibold">
          {(item.unitPrice * item.quantity).toFixed(2)} {item.unitCurrency}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onRemove(item.productId)}
        className="ml-3 w-8 h-8 bg-danger-light rounded-full items-center justify-center"
      >
        <Ionicons name="trash" size={16} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );
}
