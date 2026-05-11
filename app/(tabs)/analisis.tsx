import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@/hooks/useDatabase';
import { useAppStore } from '@/stores/appStore';
import { PeriodFilter, DailySale, SalesByMethod, TopProduct, CategorySummary } from '@/types';
import { getSalesByPeriod, getSalesByMethod, getTopProducts, getCategorySummary, getInstallments } from '@/db/operations';
import { StatCard } from '@/components/business/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/helpers/currency';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Analisis() {
  const { db, isReady } = useDatabase();
  const { formatPrice: formatPriceStore } = useAppStore();

  const [activePeriod, setActivePeriod] = useState<PeriodFilter>('today');
  const [salesData, setSalesData] = useState<DailySale[]>([]);
  const [methodsData, setMethodsData] = useState<SalesByMethod[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [debtStats, setDebtStats] = useState({ total: 0, paid: 0, remaining: 0 });

  const loadData = useCallback(async () => {
    if (!db) return;
    try {
      const [sales, methods, top, categories, installments] = await Promise.all([
        getSalesByPeriod(db, activePeriod),
        getSalesByMethod(db, activePeriod),
        getTopProducts(db, activePeriod, 5),
        getCategorySummary(db, activePeriod),
        getInstallments(db),
      ]);

      setSalesData(sales);
      setMethodsData(methods);
      setTopProducts(top);
      setCategoryData(categories);

      // Calculate totals
      const total = sales.reduce((sum, s) => sum + s.total, 0);
      const profit = sales.reduce((sum, s) => sum + s.profit, 0);
      const products = sales.reduce((sum, s) => sum + (s.total > 0 ? 1 : 0), 0); // Simplified
      const avg = sales.length > 0 ? total / sales.length : 0;

      setTotalSales(total);
      setTotalProfit(profit);
      setTotalProducts(products);
      setAvgTicket(avg);

      // Debt stats
      const totalDebt = installments.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = installments.reduce((sum, i) => sum + i.paidAmount, 0);
      setDebtStats({
        total: totalDebt,
        paid: totalPaid,
        remaining: totalDebt - totalPaid,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [db, activePeriod]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  const periods: { key: PeriodFilter; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'year', label: 'Año' },
  ];

  // Prepare chart data
  const lineData = salesData.map(s => ({
    value: s.total,
    label: s.date.slice(5), // MM-DD
  }));

  const pieData = methodsData.map(m => ({
    value: m.total,
    text: m.method === 'cash' ? 'Efectivo' : m.method === 'transfer' ? 'Transferencia' : 'Plazos',
    color: m.method === 'cash' ? '#059669' : m.method === 'transfer' ? '#0F766E' : '#D97706',
  }));

  const debtPieData = [
    { value: debtStats.paid, text: 'Cobrado', color: '#059669' },
    { value: debtStats.remaining, text: 'Pendiente', color: '#DC2626' },
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
        <Text className="text-text-primary font-bold text-xl">Análisis</Text>
      </View>

      {/* Period Selector */}
      <View className="flex-row px-4 mt-2">
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            onPress={() => setActivePeriod(period.key)}
            className={`flex-1 mr-2 py-2 rounded-full ${
              activePeriod === period.key ? 'bg-primary' : 'bg-background-alt'
            }`}
          >
            <Text className={`text-sm font-medium text-center ${
              activePeriod === period.key ? 'text-white' : 'text-text-muted'
            }`}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-4 mt-4">
        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-1 mb-4">
          <View className="w-1/2 px-1 mb-2">
            <StatCard
              icon="cash"
              label="Ventas totales"
              value={formatPriceStore(totalSales, 'CUP')}
              color="success"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <StatCard
              icon="trending-up"
              label="Ganancia neta"
              value={formatPriceStore(totalProfit, 'CUP')}
              color="primary"
            />
          </View>
          <View className="w-1/2 px-1">
            <StatCard
              icon="cube"
              label="Productos vendidos"
              value={`${totalProducts}`}
              color="warning"
            />
          </View>
          <View className="w-1/2 px-1">
            <StatCard
              icon="receipt"
              label="Ticket promedio"
              value={formatPriceStore(avgTicket, 'CUP')}
              color="danger"
            />
          </View>
        </View>

        {/* Sales Trend Chart */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-text-primary font-semibold mb-3">Tendencia de ventas</Text>
          {salesData.length === 0 ? (
            <EmptyState icon="bar-chart" message="Sin datos" subMessage="No hay ventas en este período" />
          ) : (
            <LineChart
              data={lineData}
              width={SCREEN_WIDTH - 48}
              height={200}
              color="#0F766E"
              dataPointsColor="#0F766E"
              textColor="#475569"
              xAxisLabelTextStyle={{ fontSize: 10, color: '#94A3B8' }}
              yAxisTextStyle={{ fontSize: 10, color: '#94A3B8' }}
              showVerticalLines
              verticalLinesColor="#E2E8F0"
            />
          )}
        </View>

        {/* Sales by Method */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-text-primary font-semibold mb-3">Ventas por método</Text>
          {methodsData.length === 0 ? (
            <EmptyState icon="pie-chart" message="Sin datos" subMessage="No hay ventas en este período" />
          ) : (
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - 48}
              height={180}
              showText
              textColor="#0F172A"
              textSize={12}
              radius={80}
            />
          )}
        </View>

        {/* Top Products */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-text-primary font-semibold mb-3">Productos más vendidos</Text>
          {topProducts.length === 0 ? (
            <EmptyState icon="cube" message="Sin datos" subMessage="No hay ventas en este período" />
          ) : (
            topProducts.map((product, index) => (
              <View key={product.id} className="flex-row items-center py-3 border-b border-border last:border-0">
                <Text className="text-text-light w-6">#{index + 1}</Text>
                <View className="flex-1 ml-2">
                  <Text className="text-text-primary font-medium" numberOfLines={1}>{product.name}</Text>
                  <Text className="text-text-muted text-sm">{product.quantitySold} vendidos</Text>
                </View>
                <Text className="text-text-primary font-semibold">
                  {formatPriceStore(product.totalRevenue, 'CUP')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Category Summary */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-text-primary font-semibold mb-3">Ganancia por categoría</Text>
          {categoryData.length === 0 ? (
            <EmptyState icon="grid" message="Sin datos" subMessage="No hay ventas en este período" />
          ) : (
            <BarChart
              data={categoryData.map(c => ({
                value: c.totalProfit,
                label: c.name,
                frontColor: '#0F766E',
              }))}
              width={SCREEN_WIDTH - 48}
              height={200}
              barWidth={30}
              spacing={20}
              xAxisLabelTextStyle={{ fontSize: 10, color: '#94A3B8' }}
              yAxisTextStyle={{ fontSize: 10, color: '#94A3B8' }}
              showVerticalLines
              verticalLinesColor="#E2E8F0"
            />
          )}
        </View>

        {/* Debt Status */}
        <View className="bg-card rounded-2xl p-4 mb-8">
          <Text className="text-text-primary font-semibold mb-3">Estado de deudas</Text>
          <View className="flex-row mb-4">
            <View className="flex-1 bg-success-light rounded-xl p-3 mr-2">
              <Text className="text-success text-sm">Total prestado</Text>
              <Text className="text-success font-bold text-lg">{formatPriceStore(debtStats.total, 'CUP')}</Text>
            </View>
            <View className="flex-1 bg-primary-lighter rounded-xl p-3 mr-2">
              <Text className="text-primary text-sm">Cobrado</Text>
              <Text className="text-primary font-bold text-lg">{formatPriceStore(debtStats.paid, 'CUP')}</Text>
            </View>
            <View className="flex-1 bg-danger-light rounded-xl p-3">
              <Text className="text-danger text-sm">Por cobrar</Text>
              <Text className="text-danger font-bold text-lg">{formatPriceStore(debtStats.remaining, 'CUP')}</Text>
            </View>
          </View>

          {debtStats.total > 0 && (
            <PieChart
              data={debtPieData}
              width={SCREEN_WIDTH - 48}
              height={150}
              showText
              textColor="#0F172A"
              textSize={12}
              radius={60}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
