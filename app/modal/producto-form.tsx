import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useDatabase } from '@/hooks/useDatabase';
import { useUIStore } from '@/stores/uiStore';
import { Product, Currency, ProductType } from '@/types';
import { createProduct, getProductById, updateProduct, getProductCategories } from '@/db/operations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const DEFAULT_CATEGORIES = ['Comida', 'Bebida', 'Limpieza', 'Higiene', 'Otro'];
const CURRENCIES: Currency[] = ['CUP', 'USD', 'EUR', 'MLC'];

export default function ProductoForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { db, isReady } = useDatabase();
  const { showToast } = useUIStore();

  const isEditing = !!id;
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [type, setType] = useState<ProductType>('own');
  const [costPrice, setCostPrice] = useState('');
  const [costCurrency, setCostCurrency] = useState<Currency>('CUP');
  const [salePrice, setSalePrice] = useState('');
  const [saleCurrency, setSaleCurrency] = useState<Currency>('CUP');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isReady && db) {
      loadCategories();
      if (isEditing) loadProduct();
    }
  }, [isReady, db]);

  const loadCategories = async () => {
    if (!db) return;
    const cats = await getProductCategories(db);
    setCategories([...new Set([...DEFAULT_CATEGORIES, ...cats])]);
  };

  const loadProduct = async () => {
    if (!db) return;
    try {
      const product = await getProductById(db, Number(id));
      if (product) {
        setName(product.name);
        setCategory(product.category);
        setType(product.type);
        setCostPrice(product.costPrice.toString());
        setCostCurrency(product.costCurrency);
        setSalePrice(product.salePrice.toString());
        setSaleCurrency(product.saleCurrency);
        setStock(product.stock.toString());
        setMinStock(product.minStock.toString());
        setImage(product.image || null);
        setDescription(product.description || '');
        setOwnerName(product.ownerName || '');
        setOwnerContact(product.ownerContact || '');
        setNotes(product.notes || '');
      }
    } catch (error) {
      showToast('Error cargando producto', 'error');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const calculateSuggestedPrice = () => {
    const cost = parseFloat(costPrice);
    if (isNaN(cost)) return 0;
    // 30% margin for consignment
    return cost * 1.3;
  };

  const handleSave = async () => {
    if (!db || !name || !category) {
      showToast('Nombre y categoría son requeridos', 'warning');
      return;
    }

    setLoading(true);
    try {
      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        category: category === 'Otro' && customCategory ? customCategory : category,
        type,
        costPrice: parseFloat(costPrice) || 0,
        costCurrency,
        salePrice: parseFloat(salePrice) || 0,
        saleCurrency,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 5,
        image: image || undefined,
        description: description || undefined,
        ownerName: type === 'consignment' ? ownerName || undefined : undefined,
        ownerContact: type === 'consignment' ? ownerContact || undefined : undefined,
        notes: notes || undefined,
        isActive: 1,
      };

      if (isEditing) {
        await updateProduct(db, Number(id), productData);
        showToast('Producto actualizado', 'success');
      } else {
        await createProduct(db, productData);
        showToast('Producto creado', 'success');
      }

      router.back();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Error guardando producto', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-lg">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Type Toggle */}
        <View className="flex-row mb-4">
          <TouchableOpacity
            onPress={() => setType('own')}
            className={`flex-1 mr-2 py-3 rounded-xl border-2 ${
              type === 'own' ? 'border-primary bg-primary-lighter' : 'border-border'
            }`}
          >
            <Text className={`text-center font-medium ${
              type === 'own' ? 'text-primary' : 'text-text-muted'
            }`}>Propio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setType('consignment')}
            className={`flex-1 py-3 rounded-xl border-2 ${
              type === 'consignment' ? 'border-primary bg-primary-lighter' : 'border-border'
            }`}
          >
            <Text className={`text-center font-medium ${
              type === 'consignment' ? 'text-primary' : 'text-text-muted'
            }`}>Ajeno</Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View className="items-center mb-4">
          {image ? (
            <TouchableOpacity onPress={() => setImage(null)} className="relative">
              <Image source={{ uri: image }} className="w-32 h-32 rounded-xl" />
              <View className="absolute top-0 right-0 w-6 h-6 bg-danger rounded-full items-center justify-center">
                <Ionicons name="close" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : (
            <View className="flex-row">
              <TouchableOpacity
                onPress={takePhoto}
                className="w-16 h-16 bg-background-alt rounded-xl items-center justify-center mr-3"
              >
                <Ionicons name="camera" size={24} color="#0F766E" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                className="w-16 h-16 bg-background-alt rounded-xl items-center justify-center"
              >
                <Ionicons name="image" size={24} color="#0F766E" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Input label="Nombre *" value={name} onChangeText={setName} placeholder="Nombre del producto" />

        {/* Category */}
        <TouchableOpacity
          onPress={() => setShowCategoryModal(true)}
          className="bg-background-alt rounded-xl px-4 py-3 border border-border mb-4"
        >
          <Text className="text-sm text-text-muted mb-1">Categoría *</Text>
          <Text className={category ? 'text-text-primary' : 'text-text-light'}>
            {category || 'Seleccionar categoría...'}
          </Text>
        </TouchableOpacity>

        {category === 'Otro' && (
          <Input
            label="Categoría personalizada"
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholder="Escribe la categoría"
          />
        )}

        {/* Prices */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Input
              label="Precio de costo"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
          <View className="w-20">
            <Text className="text-sm text-text-muted mb-1">Moneda</Text>
            <TouchableOpacity
              onPress={() => {
                const idx = CURRENCIES.indexOf(costCurrency);
                setCostCurrency(CURRENCIES[(idx + 1) % CURRENCIES.length]);
              }}
              className="bg-background-alt rounded-xl px-3 py-3 border border-border items-center"
            >
              <Text className="text-text-primary font-medium">{costCurrency}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Input
              label="Precio de venta"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
          <View className="w-20">
            <Text className="text-sm text-text-muted mb-1">Moneda</Text>
            <TouchableOpacity
              onPress={() => {
                const idx = CURRENCIES.indexOf(saleCurrency);
                setSaleCurrency(CURRENCIES[(idx + 1) % CURRENCIES.length]);
              }}
              className="bg-background-alt rounded-xl px-3 py-3 border border-border items-center"
            >
              <Text className="text-text-primary font-medium">{saleCurrency}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {type === 'consignment' && costPrice && (
          <View className="bg-primary-lighter rounded-xl p-3 mb-4">
            <Text className="text-primary text-sm">Precio sugerido (30% margen): {calculateSuggestedPrice().toFixed(2)} {costCurrency}</Text>
          </View>
        )}

        {/* Stock */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Input
              label="Stock actual"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View className="flex-1">
            <Input
              label="Stock mínimo"
              value={minStock}
              onChangeText={setMinStock}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
        </View>

        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          placeholder="Descripción opcional"
        />

        {/* Consignment fields */}
        {type === 'consignment' && (
          <>
            <Input
              label="Nombre del dueño"
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Dueño del producto"
            />
            <Input
              label="Contacto del dueño"
              value={ownerContact}
              onChangeText={setOwnerContact}
              placeholder="Teléfono o contacto"
            />
          </>
        )}

        <Input
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          placeholder="Notas adicionales"
        />

        <Button
          title={isEditing ? 'Actualizar' : 'Guardar'}
          onPress={handleSave}
          loading={loading}
          size="lg"
          className="mb-8"
        />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6 max-h-[70%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary font-bold text-lg">Seleccionar categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryModal(false);
                }}
                className={`py-3 px-4 rounded-xl mb-2 ${
                  category === cat ? 'bg-primary-lighter' : 'bg-background-alt'
                }`}
              >
                <Text className={category === cat ? 'text-primary font-medium' : 'text-text-primary'}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
