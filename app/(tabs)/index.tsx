import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@/hooks/useDatabase';
import { useAppStore } from '@/stores/appStore';
import { useUIStore } from '@/stores/uiStore';
import { DashboardStats, Product, Sale, Installment } from '@/types';
import { getDashboardStats, getProducts, getSales, getInstallments } from '@/db/operations';
import { StatCard } from '@/components/business/StatCard';
import { QuickAction } from '@/components/business/QuickAction';
import { ProductCard } from '@/components/business/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/helpers/currency';
import { formatDateTime } from '@/helpers/dates';

export default function Dashboard() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { settings, loadSettings } = useAppStore();
  const { showToast } = useUIStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<Installment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!db) return;
    try {
      const [dashboardStats, products, sales, installments] = await Promise.all([
        getDashboardStats(db),
        getProducts(db, { lowStock: true, activeOnly: true }),
        getSales(db, { limit: 5, period: 'today' }),
        getInstallments(db, { status: 'active' }),
      ]);

      setStats(dashboardStats);
      setLowStockProducts(products.slice(0, 5));
      setRecentSales(sales);

      // Filter upcoming payments (next 30 days)
      const now = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);

      const upcoming = installments.filter(inst => {
        const nextDate = new Date(inst.startDate);
        // Simple check: if start date is within next 30 days
        return nextDate >= now && nextDate <= thirtyDaysLater;
      }).slice(0, 5);

      setUpcomingPayments(upcoming);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showToast('Error cargando datos', 'error');
    }
  }, [db, showToast]);

  useEffect(() => {
    if (isReady) {
      loadSettings();
      loadData();
    }
  }, [isReady, loadSettings, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!isReady || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-muted">Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-light text-sm">{settings?.storeName || 'Mi Tienda'}</Text>
              <Text className="text-text-primary font-bold text-xl">Dashboard</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/modal/settings')}
              className="w-10 h-10 bg-card rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="settings" size={20} color="#0F766E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-4 mt-4">
          <View className="flex-row flex-wrap -mx-1">
            <View className="w-1/2 px-1 mb-2">
              <StatCard
                icon="cash"
                label="Ventas hoy"
                value={formatPrice(stats.todaySales, 'CUP')}
                subValue={`${stats.todaySalesCount} ventas`}
                color="success"
              />
            </View>
            <View className="w-1/2 px-1 mb-2">
              <StatCard
                icon="trending-up"
                label="Ganancia hoy"
                value={formatPrice(stats.todayProfit, 'CUP')}
                color="primary"
              />
            </View>
            <View className="w-1/2 px-1">
              <StatCard
                icon="cube"
                label="Stock total"
                value={`${stats.totalStock} unidades`}
                color="warning"
              />
            </View>
            <View className="w-1/2 px-1">
              <StatCard
                icon="alert-circle"
                label="Por cobrar"
                value={formatPrice(stats.totalDebt, 'CUP')}
                subValue={`${stats.debtorsCount} deudores`}
                color="danger"
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mt-6">
          <Text className="text-text-primary font-semibold text-lg mb-3">Acciones rápidas</Text>
          <View className="flex-row justify-between">
            <QuickAction
              icon="cart"
              label="Nueva venta"
              onPress={() => router.push('/ventas')}
              color="primary"
            />
            <QuickAction
              icon="cube"
              label="Producto"
              onPress={() => router.push('/modal/producto-form')}
              color="success"
            />
            <QuickAction
              icon="person-add"
              label="Cliente"
              onPress={() => router.push('/modal/cliente-form')}
              color="warning"
            />
            <QuickAction
              icon="bar-chart"
              label="Reporte"
              onPress={() => router.push('/analisis')}
              color="danger"
            />
          </View>
        </View>

        {/* Recent Sales */}
        <View className="px-4 mt-6">
          <Text className="text-text-primary font-semibold text-lg mb-3">Ventas recientes</Text>
          {recentSales.length === 0 ? (
            <EmptyState
              icon="cart"
              message="Sin ventas hoy"
              subMessage="Las ventas del día aparecerán aquí"
            />
          ) : (
            recentSales.map((sale) => (
              <View key={sale.id} className="bg-card rounded-xl p-3 mb-2 flex-row items-center">
                <View className="w-10 h-10 bg-primary-lighter rounded-full items-center justify-center">
                  <Ionicons
                    name={sale.paymentMethod === 'cash' ? 'cash' : sale.paymentMethod === 'transfer' ? 'card' : 'time'}
                    size={20}
                    color="#0F766E"
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-text-primary font-medium">{sale.receiptNumber}</Text>
                  <Text className="text-text-muted text-sm">
                    {sale.items.length} productos • {formatDateTime(sale.createdAt)}
                  </Text>
                </View>
                <Text className="text-text-primary font-bold">
                  {formatPrice(sale.total, sale.currency)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Low Stock */}
        <View className="px-4 mt-6">
          <Text className="text-text-primary font-semibold text-lg mb-3">Stock bajo</Text>
          {lowStockProducts.length === 0 ? (
            <EmptyState
              icon="cube"
              message="Todo en orden"
              subMessage="No hay productos con stock bajo"
            />
          ) : (
            lowStockProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/productos/${product.id}`)}
              />
            ))
          )}
        </View>

        {/* Upcoming Payments */}
        <View className="px-4 mt-6 mb-8">
          <Text className="text-text-primary font-semibold text-lg mb-3">Cobros próximos</Text>
          {upcomingPayments.length === 0 ? (
            <EmptyState
              icon="calendar"
              message="Sin cobros próximos"
              subMessage="Las cuotas a cobrar aparecerán aquí"
            />
          ) : (
            upcomingPayments.map((inst) => (
              <View key={inst.id} className="bg-card rounded-xl p-3 mb-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-primary font-medium">{inst.customerName}</Text>
                  <Text className="text-primary font-bold">
                    {(inst.totalAmount / inst.numberOfPayments).toFixed(2)} CUP
                  </Text>
                </View>
                <Text className="text-text-muted text-sm mt-1">
                  Cuota pendiente • {formatDateTime(inst.startDate)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
