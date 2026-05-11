import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@/hooks/useDatabase';
import { useUIStore } from '@/stores/uiStore';
import { createCustomer, getCustomerById, updateCustomer } from '@/db/operations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ClienteForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { db, isReady } = useDatabase();
  const { showToast } = useUIStore();

  const isEditing = !!id;
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isReady && db && isEditing) {
      loadCustomer();
    }
  }, [isReady, db]);

  const loadCustomer = async () => {
    if (!db) return;
    try {
      const customer = await getCustomerById(db, Number(id));
      if (customer) {
        setName(customer.name);
        setPhone(customer.phone || '');
        setAddress(customer.address || '');
        setNotes(customer.notes || '');
      }
    } catch (error) {
      showToast('Error cargando cliente', 'error');
    }
  };

  const handleSave = async () => {
    if (!db || !name) {
      showToast('El nombre es requerido', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateCustomer(db, Number(id), { name, phone: phone || undefined, address: address || undefined, notes: notes || undefined });
        showToast('Cliente actualizado', 'success');
      } else {
        await createCustomer(db, { name, phone: phone || undefined, address: address || undefined, notes: notes || undefined });
        showToast('Cliente creado', 'success');
      }

      router.back();
    } catch (error) {
      showToast('Error guardando cliente', 'error');
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
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        <Input
          label="Nombre completo *"
          value={name}
          onChangeText={setName}
          placeholder="Nombre del cliente"
        />

        <Input
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Número de teléfono"
        />

        <Input
          label="Dirección"
          value={address}
          onChangeText={setAddress}
          placeholder="Dirección del cliente"
        />

        <Input
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
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
    </SafeAreaView>
  );
}
