# Mi Tienda Agenda

Aplicación de gestión de tienda offline para Android.

## Características

- ✅ Gestión de productos (propios y ajenos)
- ✅ Ventas con múltiples métodos de pago
- ✅ Clientes y sistema de cuotas
- ✅ Análisis y reportes con gráficos
- ✅ Multimoneda (CUP, USD, EUR, MLC)
- ✅ 100% offline con SQLite
- ✅ Exportar/Importar datos (backup)

## Tecnologías

- Expo SDK 53
- React Native 0.79
- expo-sqlite
- Expo Router
- Zustand + MMKV
- NativeWind (Tailwind)
- react-native-gifted-charts

## Instalación

```bash
npm install
npx expo start
```

## Compilar APK

```bash
npx eas build --platform android --profile preview
```

O usa GitHub Actions (configura EXPO_TOKEN en secrets).

## Estructura

```
app/
  (tabs)/           # Pantallas principales
    index.tsx       # Dashboard
    ventas.tsx      # Nueva venta
    productos.tsx   # Productos
    clientes.tsx    # Clientes
    analisis.tsx    # Reportes
  modal/            # Formularios modales
    producto-form.tsx
    cliente-form.tsx
    settings.tsx
    pago-cuota.tsx
components/
  ui/               # Componentes base
  business/         # Componentes de negocio
db/
  schema.ts         # Esquema SQLite
  operations.ts     # CRUD operations
stores/
  appStore.ts       # Configuración global
  uiStore.ts        # Estado UI
  cartStore.ts      # Carrito de compras
helpers/
  currency.ts       # Conversión de monedas
  dates.ts          # Utilidades de fecha
  calculations.ts   # Cálculos de negocio
```
