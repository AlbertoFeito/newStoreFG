import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@/hooks/useDatabase';
import { useUIStore } from '@/stores/uiStore';
import { Installment, Customer } from '@/types';
import { getInstallments, getCustomers, createInstallmentPayment } from '@/db/operations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { InstallmentCard } from '@/components/business/InstallmentCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { calculateInstallmentAmount } from '@/helpers/calculations';

export default function PagoCuota() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { showToast } = useUIStore();

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!db) return;
    try {
      const [insts, custs] = await Promise.all([
        getInstallments(db, { status: 'active' }),
        getCustomers(db),
      ]);
      setInstallments(insts);
      setCustomers(custs);
    } catch (error) {
      console.error('Error loading installments:', error);
    }
  }, [db]);

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady, loadData]);

  const handlePayment = async () => {
    if (!db || !selectedInstallment || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Monto inválido', 'warning');
      return;
    }

    setLoading(true);
    try {
      await createInstallmentPayment(db, {
        installmentId: selectedInstallment.id!,
        amount,
        paymentDate: new Date().toISOString(),
        paymentMethod,
        notes: '',
      });

      showToast('Pago registrado exitosamente', 'success');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedInstallment(null);
      loadData();
    } catch (error) {
      showToast('Error registrando pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstallments = selectedCustomer
    ? installments.filter(i => i.customerId === selectedCustomer.id)
    : installments;

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
        <Text className="text-text-primary font-bold text-lg">Registrar Pago</Text>
        <View className="w-6" />
      </View>

      {/* Customer Filter */}
      <View className="px-4 mt-2">
        <TouchableOpacity
          onPress={() => setShowCustomerSelect(true)}
          className="bg-background-alt rounded-xl px-4 py-3 border border-border"
        >
          <Text className="text-sm text-text-muted mb-1">Filtrar por cliente</Text>
          <Text className={selectedCustomer ? 'text-text-primary' : 'text-text-light'}>
            {selectedCustomer ? selectedCustomer.name : 'Todos los clientes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Installments List */}
      <ScrollView className="flex-1 px-4 mt-4">
        {filteredInstallments.length === 0 ? (
          <EmptyState
            icon="time"
            message="Sin cuotas activas"
            subMessage={selectedCustomer ? "Este cliente no tiene cuotas pendientes" : "No hay cuotas pendientes de pago"}
          />
        ) : (
          filteredInstallments.map((installment) => (
            <InstallmentCard
              key={installment.id}
              installment={installment}
              onPay={() => {
                setSelectedInstallment(installment);
                setPaymentAmount(calculateInstallmentAmount(installment).toFixed(2));
                setShowPaymentModal(true);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary font-bold text-lg">Registrar pago</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {selectedInstallment && (
              <>
                <View className="bg-primary-lighter rounded-xl p-3 mb-4">
                  <Text className="text-primary text-sm">Cliente: {selectedInstallment.customerName}</Text>
                  <Text className="text-primary font-bold mt-1">
                    Cuota: {calculateInstallmentAmount(selectedInstallment).toFixed(2)} CUP
                  </Text>
                  <Text className="text-primary text-sm mt-1">
                    Pendiente: {selectedInstallment.remainingAmount.toFixed(2)} CUP
                  </Text>
                </View>

                <Input
                  label="Monto a pagar"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                />

                <Text className="text-text-primary font-semibold mb-2">Método de pago</Text>
                <View className="flex-row mb-4">
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('cash')}
                    className={`flex-1 mr-2 py-3 rounded-xl border-2 ${
                      paymentMethod === 'cash' ? 'border-primary bg-primary-lighter' : 'border-border'
                    }`}
                  >
                    <Text className={`text-center font-medium ${
                      paymentMethod === 'cash' ? 'text-primary' : 'text-text-muted'
                    }`}>Efectivo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('transfer')}
                    className={`flex-1 py-3 rounded-xl border-2 ${
                      paymentMethod === 'transfer' ? 'border-primary bg-primary-lighter' : 'border-border'
                    }`}
                  >
                    <Text className={`text-center font-medium ${
                      paymentMethod === 'transfer' ? 'text-primary' : 'text-text-muted'
                    }`}>Transferencia</Text>
                  </TouchableOpacity>
                </View>

                <Button
                  title="Confirmar pago"
                  onPress={handlePayment}
                  loading={loading}
                  size="lg"
                />
              </>
            )}
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

            <ScrollView className="px-4 pb-6">
              <TouchableOpacity
                onPress={() => {
                  setSelectedCustomer(null);
                  setShowCustomerSelect(false);
                }}
                className="bg-background-alt rounded-xl p-4 mb-2"
              >
                <Text className="text-text-primary font-medium">Todos los clientes</Text>
              </TouchableOpacity>

              {customers
                .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    onPress={() => {
                      setSelectedCustomer(customer);
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
