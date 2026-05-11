import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useDatabase } from '@/hooks/useDatabase';
import { useAppStore } from '@/stores/appStore';
import { useUIStore } from '@/stores/uiStore';
import { updateSettings, exportAllData, importAllData, clearAllData } from '@/db/operations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Currency } from '@/types';

const CURRENCIES: Currency[] = ['CUP', 'USD', 'EUR', 'MLC'];

export default function Settings() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const { settings, loadSettings } = useAppStore();
  const { showToast } = useUIStore();

  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryCurrency, setPrimaryCurrency] = useState<Currency>('CUP');
  const [usdRate, setUsdRate] = useState('320');
  const [eurRate, setEurRate] = useState('350');
  const [mlcRate, setMlcRate] = useState('300');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadSettings();
    }
  }, [isReady, loadSettings]);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName);
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setPrimaryCurrency(settings.primaryCurrency);
      setUsdRate(settings.usdRate.toString());
      setEurRate(settings.eurRate.toString());
      setMlcRate(settings.mlcRate.toString());
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;

    setLoading(true);
    try {
      await updateSettings(db, {
        storeName,
        address: address || undefined,
        phone: phone || undefined,
        primaryCurrency,
        usdRate: parseFloat(usdRate) || 320,
        eurRate: parseFloat(eurRate) || 350,
        mlcRate: parseFloat(mlcRate) || 300,
      });

      await loadSettings();
      showToast('Configuración guardada', 'success');
    } catch (error) {
      showToast('Error guardando configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!db) return;
    try {
      setLoading(true);
      const data = await exportAllData(db);
      const fileName = `mitienda_backup_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar datos de Mi Tienda',
        });
      }

      showToast('Datos exportados', 'success');
    } catch (error) {
      showToast('Error exportando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!db) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      Alert.alert(
        'Confirmar importación',
        'Esto reemplazará todos los datos actuales. ¿Estás seguro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
                await importAllData(db, fileContent);
                await loadSettings();
                showToast('Datos importados exitosamente', 'success');
              } catch (error) {
                showToast('Error importando datos', 'error');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      showToast('Error seleccionando archivo', 'error');
    }
  };

  const handleClear = () => {
    if (!db) return;

    Alert.alert(
      'Limpiar todos los datos',
      '¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await clearAllData(db);
              await loadSettings();
              showToast('Datos eliminados', 'success');
            } catch (error) {
              showToast('Error eliminando datos', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
        <Text className="text-text-primary font-bold text-lg">Configuración</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Store Info */}
        <Text className="text-text-primary font-semibold mt-4 mb-2">Información de la tienda</Text>
        <Input
          label="Nombre de la tienda"
          value={storeName}
          onChangeText={setStoreName}
          placeholder="Mi Tienda"
        />
        <Input
          label="Dirección"
          value={address}
          onChangeText={setAddress}
          placeholder="Dirección de la tienda"
        />
        <Input
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Teléfono de contacto"
        />

        {/* Currency Settings */}
        <Text className="text-text-primary font-semibold mt-4 mb-2">Moneda principal</Text>
        <View className="flex-row mb-4">
          {CURRENCIES.map((curr) => (
            <TouchableOpacity
              key={curr}
              onPress={() => setPrimaryCurrency(curr)}
              className={`flex-1 mr-2 py-3 rounded-xl border-2 ${
                primaryCurrency === curr ? 'border-primary bg-primary-lighter' : 'border-border'
              }`}
            >
              <Text className={`text-center font-medium ${
                primaryCurrency === curr ? 'text-primary' : 'text-text-muted'
              }`}>{curr}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exchange Rates */}
        <Text className="text-text-primary font-semibold mt-4 mb-2">Tasas de cambio (en CUP)</Text>
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Input
              label="USD"
              value={usdRate}
              onChangeText={setUsdRate}
              keyboardType="numeric"
              placeholder="320"
            />
          </View>
          <View className="flex-1 mr-2">
            <Input
              label="EUR"
              value={eurRate}
              onChangeText={setEurRate}
              keyboardType="numeric"
              placeholder="350"
            />
          </View>
          <View className="flex-1">
            <Input
              label="MLC"
              value={mlcRate}
              onChangeText={setMlcRate}
              keyboardType="numeric"
              placeholder="300"
            />
          </View>
        </View>

        <Button
          title="Guardar configuración"
          onPress={handleSave}
          loading={loading}
          size="lg"
          className="mt-4"
        />

        {/* Data Management */}
        <Text className="text-text-primary font-semibold mt-8 mb-2">Gestión de datos</Text>

        <TouchableOpacity
          onPress={handleExport}
          className="flex-row items-center bg-card rounded-xl p-4 mb-3"
        >
          <View className="w-10 h-10 bg-primary-lighter rounded-full items-center justify-center">
            <Ionicons name="download" size={20} color="#0F766E" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-text-primary font-medium">Exportar datos</Text>
            <Text className="text-text-muted text-sm">Guardar backup en archivo JSON</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleImport}
          className="flex-row items-center bg-card rounded-xl p-4 mb-3"
        >
          <View className="w-10 h-10 bg-warning-light rounded-full items-center justify-center">
            <Ionicons name="upload" size={20} color="#D97706" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-text-primary font-medium">Importar datos</Text>
            <Text className="text-text-muted text-sm">Restaurar desde archivo JSON</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClear}
          className="flex-row items-center bg-card rounded-xl p-4 mb-8"
        >
          <View className="w-10 h-10 bg-danger-light rounded-full items-center justify-center">
            <Ionicons name="trash" size={20} color="#DC2626" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-danger font-medium">Limpiar todos los datos</Text>
            <Text className="text-text-muted text-sm">Eliminar todo el contenido</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* App Info */}
        <View className="items-center pb-8">
          <Text className="text-text-light text-sm">Mi Tienda Agenda v1.0</Text>
          <Text className="text-text-light text-xs mt-1">Offline • SQLite</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
