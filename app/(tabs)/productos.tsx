import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@/hooks/useDatabase';
import { useUIStore } from '@/stores/uiStore';
import { Product } from '@/types';
import { getProducts, getProductCategories, deleteProduct } from '@/db/operations';
import { ProductCard } from '@/components/business/ProductCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';

type ProductFilter = 'all' | 'own' | 'consignment' | 'lowStock' | 'inactive';

export default function Productos() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { showToast } = useUIStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const loadData = useCallback(async () => {
    if (!db) return;
    try {
      const [prods, cats] = await Promise.all([
        getProducts(db, {
          type: activeFilter === 'own' ? 'own' : activeFilter === 'consignment' ? 'consignment' : undefined,
          activeOnly: activeFilter === 'inactive' ? false : true,
          lowStock: activeFilter === 'lowStock' ? true : false,
          search: searchQuery || undefined,
        }),
        getProductCategories(db),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, [db, activeFilter, searchQuery]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  const handleDelete = async () => {
    if (!db || !selectedProduct?.id) return;
    try {
      await deleteProduct(db, selectedProduct.id);
      showToast('Producto desactivado', 'success');
      setShowOptions(false);
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      showToast('Error desactivando producto', 'error');
    }
  };

  const filters: { key: ProductFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'own', label: 'Propios' },
    { key: 'consignment', label: 'Ajenos' },
    { key: 'lowStock', label: 'Stock Bajo' },
    { key: 'inactive', label: 'Inactivos' },
  ];

  if (!isReady) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-muted">Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-text-primary font-bold text-xl">Productos</Text>
          <TouchableOpacity
            onPress={() => router.push('/modal/producto-form')}
            className="w-10 h-10 bg-primary rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className="px-4 mt-2">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar productos..."
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mt-3"
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            onPress={() => setActiveFilter(filter.key)}
            className={`mr-2 px-4 py-2 rounded-full ${
              activeFilter === filter.key ? 'bg-primary' : 'bg-background-alt'
            }`}
          >
            <Text className={`text-sm font-medium ${
              activeFilter === filter.key ? 'text-white' : 'text-text-muted'
            }`}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List */}
      <ScrollView className="flex-1 px-4 mt-4">
        {products.length === 0 ? (
          <EmptyState
            icon="cube"
            message="Sin productos"
            subMessage={activeFilter === 'inactive' 
              ? "No hay productos inactivos" 
              : "Agrega tu primer producto con el botón +"}
          />
        ) : (
          products.map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => {
                setSelectedProduct(product);
                setShowOptions(true);
              }}
              className="mb-3"
            >
              <ProductCard product={product} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptions(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary font-bold text-lg">
                {selectedProduct?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                router.push(`/modal/producto-form?id=${selectedProduct?.id}`);
              }}
              className="flex-row items-center py-4 border-b border-border"
            >
              <Ionicons name="create" size={20} color="#0F766E" />
              <Text className="text-text-primary ml-3 text-base">Editar producto</Text>
            </TouchableOpacity>

            {selectedProduct?.isActive === 1 && (
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center py-4"
              >
                <Ionicons name="trash" size={20} color="#DC2626" />
                <Text className="text-danger ml-3 text-base">Desactivar producto</Text>
              </TouchableOpacity>
            )}

            {selectedProduct?.isActive === 0 && (
              <TouchableOpacity
                onPress={async () => {
                  if (!db || !selectedProduct.id) return;
                  // Reactivate
                  const { updateProduct } = await import('@/db/operations');
                  await updateProduct(db, selectedProduct.id, { isActive: 1 });
                  showToast('Producto reactivado', 'success');
                  setShowOptions(false);
                  loadData();
                }}
                className="flex-row items-center py-4"
              >
                <Ionicons name="refresh" size={20} color="#059669" />
                <Text className="text-success ml-3 text-base">Reactivar producto</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
