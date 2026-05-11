import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@/hooks/useDatabase';
import { useAppStore } from '@/stores/appStore';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { Product, Customer, Currency, PaymentMethod } from '@/types';
import { getProducts, getCustomers, createSale, generateReceiptNumber, createInstallment } from '@/db/operations';
import { ProductCard } from '@/components/business/ProductCard';
import { SaleItemCart } from '@/components/business/SaleItem';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/helpers/currency';

export default function Ventas() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { formatPrice: formatPriceStore } = useAppStore();
  const { showToast } = useUIStore();
  const cart = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!db) return;
    try {
      const [prods, cats, custs] = await Promise.all([
        getProducts(db, { activeOnly: true, search: searchQuery || undefined }),
        getProductCategories(db),
        getCustomers(db),
      ]);
      setProducts(prods);
      setCategories(['all', ...cats]);
      setCustomers(custs);
    } catch (error) {
      console.error('Error loading ventas:', error);
    }
  }, [db, searchQuery]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product) => {
    const existing = cart.items.find(i => i.productId === product.id);
    if (existing && existing.quantity >= product.stock) {
      showToast('No hay suficiente stock', 'warning');
      return;
    }
    if (product.stock <= 0) {
      showToast('Producto sin stock', 'warning');
      return;
    }

    cart.addItem({
      productId: product.id!,
      productName: product.name,
      quantity: 1,
      unitPrice: product.salePrice,
      unitCurrency: product.saleCurrency,
    });
    showToast('Agregado al carrito', 'success');
  };

  const processSale = async () => {
    if (!db || cart.items.length === 0) return;

    try {
      const receiptNumber = await generateReceiptNumber(db);

      const saleData = {
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCurrency: item.unitCurrency,
          subtotal: item.unitPrice * item.quantity,
        })),
        total: cart.getTotal(),
        currency: cart.currency,
        paymentMethod: cart.paymentMethod,
        customerId: cart.customerId,
        customerName: cart.customerName,
        discount: cart.discount,
        receiptNumber,
      };

      const saleId = await createSale(db, saleData);

      // Create installment if needed
      if (cart.paymentMethod === 'installment' && cart.customerId && cart.frequency && cart.numberOfPayments) {
        await createInstallment(db, {
          saleId,
          customerId: cart.customerId,
          customerName: cart.customerName || '',
          totalAmount: cart.getTotal(),
          paidAmount: 0,
          remainingAmount: cart.getTotal(),
          numberOfPayments: cart.numberOfPayments,
          frequency: cart.frequency,
          startDate: new Date().toISOString(),
          status: 'active',
        });
      }

      cart.clearCart();
      setShowCart(false);
      setShowCheckout(false);
      showToast('Venta procesada exitosamente', 'success');
      loadData(); // Refresh stock
    } catch (error) {
      console.error('Error processing sale:', error);
      showToast('Error procesando venta', 'error');
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
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-text-primary font-bold text-xl">Nueva Venta</Text>
          <TouchableOpacity
            onPress={() => setShowCart(true)}
            className="relative w-10 h-10 bg-card rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="cart" size={20} color="#0F766E" />
            {cart.getItemCount() > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">{cart.getItemCount()}</Text>
              </View>
            )}
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

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mt-3"
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            className={`mr-2 px-4 py-2 rounded-full ${
              selectedCategory === cat ? 'bg-primary' : 'bg-background-alt'
            }`}
          >
            <Text className={`text-sm font-medium ${
              selectedCategory === cat ? 'text-white' : 'text-text-muted'
            }`}>
              {cat === 'all' ? 'Todos' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      <ScrollView className="flex-1 px-4 mt-4">
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon="cube"
            message="Sin productos"
            subMessage="Agrega productos en la pestaña Productos"
          />
        ) : (
          filteredProducts.map((product) => (
            <View key={product.id} className="mb-3">
              <ProductCard
                product={product}
                onAdd={() => addToCart(product)}
                disabled={product.stock <= 0}
              />
            </View>
          ))
        )}
      </ScrollView>

      {/* Cart Modal */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCart(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl max-h-[80%]">
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-text-primary font-bold text-lg">Carrito</Text>
                <TouchableOpacity onPress={() => setShowCart(false)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="px-4">
              {cart.items.length === 0 ? (
                <EmptyState
                  icon="cart"
                  message="Carrito vacío"
                  subMessage="Agrega productos desde el catálogo"
                />
              ) : (
                cart.items.map((item) => (
                  <SaleItemCart
                    key={item.productId}
                    item={item}
                    onUpdateQty={cart.updateQuantity}
                    onRemove={cart.removeItem}
                  />
                ))
              )}
            </ScrollView>

            {cart.items.length > 0 && (
              <View className="px-4 pb-6 pt-4 bg-card rounded-t-3xl">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-text-muted">Subtotal</Text>
                  <Text className="text-text-primary">
                    {formatPriceStore(cart.getTotal() + cart.discount, cart.currency)}
                  </Text>
                </View>
                {cart.discount > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-text-muted">Descuento</Text>
                    <Text className="text-danger">-{cart.discount.toFixed(2)} CUP</Text>
                  </View>
                )}
                <View className="flex-row justify-between mb-4">
                  <Text className="text-text-primary font-bold">Total</Text>
                  <Text className="text-text-primary font-bold text-lg">
                    {formatPriceStore(cart.getTotal(), cart.currency)}
                  </Text>
                </View>

                <Button
                  title="Proceder al pago"
                  onPress={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  size="lg"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal
        visible={showCheckout}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCheckout(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl max-h-[90%]">
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-text-primary font-bold text-lg">Checkout</Text>
                <TouchableOpacity onPress={() => setShowCheckout(false)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="px-4 pb-6">
              {/* Payment Method */}
              <Text className="text-text-primary font-semibold mb-2">Método de pago</Text>
              <View className="flex-row mb-4">
                {(['cash', 'transfer', 'installment'] as PaymentMethod[]).map((method) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => cart.setPaymentMethod(method)}
                    className={`flex-1 mr-2 p-3 rounded-xl border-2 ${
                      cart.paymentMethod === method ? 'border-primary bg-primary-lighter' : 'border-border'
                    }`}
                  >
                    <Ionicons
                      name={method === 'cash' ? 'cash' : method === 'transfer' ? 'card' : 'time'}
                      size={24}
                      color={cart.paymentMethod === method ? '#0F766E' : '#94A3B8'}
                    />
                    <Text className={`text-sm mt-1 font-medium ${
                      cart.paymentMethod === method ? 'text-primary' : 'text-text-muted'
                    }`}>
                      {method === 'cash' ? 'Efectivo' : method === 'transfer' ? 'Transferencia' : 'A plazos'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Currency */}
              <Text className="text-text-primary font-semibold mb-2">Moneda</Text>
              <View className="flex-row mb-4">
                {(['CUP', 'USD', 'EUR', 'MLC'] as Currency[]).map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    onPress={() => cart.setCurrency(curr)}
                    className={`mr-2 px-4 py-2 rounded-full ${
                      cart.currency === curr ? 'bg-primary' : 'bg-background-alt'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      cart.currency === curr ? 'text-white' : 'text-text-muted'
                    }`}>
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Discount */}
              <Text className="text-text-primary font-semibold mb-2">Descuento (CUP)</Text>
              <TextInput
                value={cart.discount > 0 ? cart.discount.toString() : ''}
                onChangeText={(text) => cart.setDiscount(parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="0.00"
                className="bg-background-alt rounded-xl px-4 py-3 text-text-primary text-base border border-border mb-4"
              />

              {/* Installment Options */}
              {cart.paymentMethod === 'installment' && (
                <>
                  <Text className="text-text-primary font-semibold mb-2">Cliente</Text>
                  <TouchableOpacity
                    onPress={() => setShowCustomerSelect(true)}
                    className="bg-background-alt rounded-xl px-4 py-3 border border-border mb-4"
                  >
                    <Text className={cart.customerName ? 'text-text-primary' : 'text-text-light'}>
                      {cart.customerName || 'Seleccionar cliente...'}
                    </Text>
                  </TouchableOpacity>

                  <Text className="text-text-primary font-semibold mb-2">Frecuencia</Text>
                  <View className="flex-row mb-4">
                    {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        onPress={() => cart.setInstallmentConfig(freq, cart.numberOfPayments || 4)}
                        className={`flex-1 mr-2 p-3 rounded-xl border-2 ${
                          cart.frequency === freq ? 'border-primary bg-primary-lighter' : 'border-border'
                        }`}
                      >
                        <Text className={`text-sm font-medium text-center ${
                          cart.frequency === freq ? 'text-primary' : 'text-text-muted'
                        }`}>
                          {freq === 'weekly' ? 'Semanal' : freq === 'biweekly' ? 'Quincenal' : 'Mensual'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-text-primary font-semibold mb-2">Cantidad de cuotas</Text>
                  <View className="flex-row flex-wrap mb-4">
                    {[2, 3, 4, 6, 8, 10, 12].map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => cart.setInstallmentConfig(cart.frequency || 'monthly', num)}
                        className={`mr-2 mb-2 px-4 py-2 rounded-full ${
                          cart.numberOfPayments === num ? 'bg-primary' : 'bg-background-alt'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          cart.numberOfPayments === num ? 'text-white' : 'text-text-muted'
                        }`}>
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Total */}
              <View className="bg-primary-lighter rounded-xl p-4 mb-4">
                <View className="flex-row justify-between">
                  <Text className="text-text-primary font-semibold">Total a pagar</Text>
                  <Text className="text-primary font-bold text-xl">
                    {formatPriceStore(cart.getTotal(), cart.currency)}
                  </Text>
                </View>
              </View>

              <Button
                title="Confirmar venta"
                onPress={processSale}
                size="lg"
                disabled={cart.paymentMethod === 'installment' && !cart.customerId}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Customer Select Modal */}
      <Modal
        visible={showCustomerSelect}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerSelect(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl max-h-[70%]">
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-text-primary font-bold text-lg">Seleccionar cliente</Text>
                <TouchableOpacity onPress={() => setShowCustomerSelect(false)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="px-4">
              <SearchBar
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Buscar cliente..."
              />
            </View>

            <ScrollView className="px-4">
              {customers
                .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    onPress={() => {
                      cart.setCustomer(customer.id!, customer.name);
                      setShowCustomerSelect(false);
                    }}
                    className="bg-card rounded-xl p-4 mb-2"
                  >
                    <Text className="text-text-primary font-medium">{customer.name}</Text>
                    {customer.phone && (
                      <Text className="text-text-muted text-sm">{customer.phone}</Text>
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
