import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/stores/appStore';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAdd?: () => void;
  disabled?: boolean;
  selected?: boolean;
}

export function ProductCard({ product, onPress, onAdd, disabled, selected }: ProductCardProps) {
  const { formatPrice } = useAppStore();

  const stockStatus = product.stock <= 0 ? 'out' : product.stock <= product.minStock ? 'low' : 'normal';

  const stockColors = {
    normal: 'bg-success-light text-success',
    low: 'bg-warning-light text-warning',
    out: 'bg-danger-light text-danger',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      className={`
        bg-card rounded-xl p-3 shadow-sm border-2
        ${selected ? 'border-primary' : 'border-transparent'}
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      <View className="flex-row">
        {product.image ? (
          <Image source={{ uri: product.image }} className="w-16 h-16 rounded-lg bg-background-alt" />
        ) : (
          <View className="w-16 h-16 rounded-lg bg-background-alt items-center justify-center">
            <Ionicons name="cube" size={28} color="#94A3B8" />
          </View>
        )}

        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-text-primary font-semibold flex-1" numberOfLines={1}>{product.name}</Text>
            <Badge 
              text={product.type === 'own' ? 'Propio' : 'Ajeno'} 
              variant={product.type === 'own' ? 'primary' : 'default'} 
            />
          </View>

          <Text className="text-text-muted text-sm mt-0.5">{product.category}</Text>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-primary font-bold text-base">
              {formatPrice(product.salePrice, product.saleCurrency)}
            </Text>

            <View className="flex-row items-center">
              <View className={`px-2 py-0.5 rounded-full ${stockColors[stockStatus].split(' ')[0]}`}>
                <Text className={`text-xs font-medium ${stockColors[stockStatus].split(' ')[1]}`}>
                  Stock: {product.stock}
                </Text>
              </View>

              {onAdd && stockStatus !== 'out' && (
                <TouchableOpacity
                  onPress={onAdd}
                  className="ml-2 w-7 h-7 bg-primary rounded-full items-center justify-center"
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
