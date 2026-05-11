import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@/hooks/useDatabase';
import { useUIStore } from '@/stores/uiStore';
import { Customer, CustomerDebt, Installment } from '@/types';
import { getCustomers, getInstallments, createInstallmentPayment } from '@/db/operations';
import { CustomerCard } from '@/components/business/CustomerCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateDebtProgress, calculateInstallmentAmount } from '@/helpers/calculations';
import { formatDate, isOverdue, calculateNextPaymentDate } from '@/helpers/dates';

type CustomerTab = 'active' | 'all' | 'paid';

export default function Clientes() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { showToast } = useUIStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerDebts, setCustomerDebts] = useState<CustomerDebt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CustomerTab>('active');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  const loadData = useCallback(async () => {
    if (!db) return;
    try {
      const allCustomers = await getCustomers(db, searchQuery || undefined);
      const allInstallments = await getInstallments(db);

      // Calculate debts for each customer
      const debts: CustomerDebt[] = allCustomers.map(customer => {
        const customerInstallments = allInstallments.filter(i => i.customerId === customer.id);
        const activeInstallments = customerInstallments.filter(i => i.status === 'active');

        const totalDebt = customerInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
        const totalPaid = customerInstallments.reduce((sum, i) => sum + i.paidAmount, 0);
        const remaining = totalDebt - totalPaid;

        const hasOverdue = activeInstallments.some(inst => {
          const paymentNum = Math.ceil((inst.paidAmount / inst.totalAmount) * inst.numberOfPayments);
          const nextDate = calculateNextPaymentDate(inst, paymentNum + 1);
          return isOverdue(nextDate);
        });

        return {
          customer,
          totalDebt,
          totalPaid,
          remaining,
          hasOverdue,
          activeInstallments: activeInstallments.length,
        };
      });

      // Filter based on tab
      let filtered = debts;
      if (activeTab === 'active') {
        filtered = debts.filter(d => d.activeInstallments > 0);
      } else if (activeTab === 'paid') {
        filtered = debts.filter(d => d.activeInstallments === 0 && d.totalDebt > 0);
      }

      setCustomers(allCustomers);
      setCustomerDebts(filtered);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }, [db, searchQuery, activeTab]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  const handlePayment = async () => {
    if (!db || !selectedInstallment || !paymentAmount) return;

    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        showToast('Monto inválido', 'warning');
        return;
      }

      await createInstallmentPayment(db, {
        installmentId: selectedInstallment.id!,
        amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'cash',
        notes: '',
      });

      showToast('Pago registrado exitosamente', 'success');
      setShowPayment(false);
      setPaymentAmount('');
      setSelectedInstallment(null);
      loadData();
    } catch (error) {
      showToast('Error registrando pago', 'error');
    }
  };

  const tabs: { key: CustomerTab; label: string }[] = [
    { key: 'active', label: 'Activos' },
    { key: 'all', label: 'Todos' },
    { key: 'paid', label: 'Pagados' },
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
          <Text className="text-text-primary font-bold text-xl">Clientes</Text>
          <TouchableOpacity
            onPress={() => router.push('/modal/cliente-form')}
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
          placeholder="Buscar clientes..."
        />
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mt-3">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 mr-2 py-2 rounded-full ${
              activeTab === tab.key ? 'bg-primary' : 'bg-background-alt'
            }`}
          >
            <Text className={`text-sm font-medium text-center ${
              activeTab === tab.key ? 'text-white' : 'text-text-muted'
            }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Customers List */}
      <ScrollView className="flex-1 px-4 mt-4">
        {customerDebts.length === 0 ? (
          <EmptyState
            icon="people"
            message="Sin clientes"
            subMessage={activeTab === 'active' 
              ? "No hay clientes con deudas activas" 
              : "Agrega tu primer cliente con el botón +"}
          />
        ) : (
          customerDebts.map((debt) => (
            <CustomerCard
              key={debt.customer.id}
              customerDebt={debt}
              onPress={() => {
                setSelectedCustomer(debt);
                setShowDetail(true);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetail(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl max-h-[90%]">
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-text-primary font-bold text-lg">Detalle del cliente</Text>
                <TouchableOpacity onPress={() => setShowDetail(false)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="px-4 pb-6">
              {selectedCustomer && (
                <>
                  <View className="bg-card rounded-xl p-4 mb-4">
                    <Text className="text-text-primary font-bold text-xl">{selectedCustomer.customer.name}</Text>
                    {selectedCustomer.customer.phone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedCustomer.customer.phone}`)}
                        className="flex-row items-center mt-2"
                      >
                        <Ionicons name="call" size={16} color="#0F766E" />
                        <Text className="text-primary ml-2">{selectedCustomer.customer.phone}</Text>
                      </TouchableOpacity>
                    )}
                    {selectedCustomer.customer.address && (
                      <Text className="text-text-muted mt-1">{selectedCustomer.customer.address}</Text>
                    )}
                  </View>

                  <View className="flex-row mb-4">
                    <View className="flex-1 bg-card rounded-xl p-3 mr-2">
                      <Text className="text-text-muted text-sm">Total comprado</Text>
                      <Text className="text-text-primary font-bold">{selectedCustomer.totalDebt.toFixed(2)} CUP</Text>
                    </View>
                    <View className="flex-1 bg-card rounded-xl p-3 mr-2">
                      <Text className="text-text-muted text-sm">Pagado</Text>
                      <Text className="text-success font-bold">{selectedCustomer.totalPaid.toFixed(2)} CUP</Text>
                    </View>
                    <View className="flex-1 bg-card rounded-xl p-3">
                      <Text className="text-text-muted text-sm">Pendiente</Text>
                      <Text className="text-danger font-bold">{selectedCustomer.remaining.toFixed(2)} CUP</Text>
                    </View>
                  </View>

                  <Text className="text-text-primary font-semibold mb-2">Deudas activas</Text>
                  {/* This would show installments - simplified for now */}
                  <Button
                    title="Registrar pago"
                    onPress={() => {
                      setShowDetail(false);
                      router.push('/modal/pago-cuota');
                    }}
                    className="mt-4"
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPayment}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayment(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary font-bold text-lg">Registrar pago</Text>
              <TouchableOpacity onPress={() => setShowPayment(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text className="text-text-muted mb-2">
              Cuota: {selectedInstallment ? calculateInstallmentAmount(selectedInstallment).toFixed(2) : '0.00'} CUP
            </Text>

            <Input
              label="Monto a pagar"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />

            <Button
              title="Confirmar pago"
              onPress={handlePayment}
              size="lg"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
