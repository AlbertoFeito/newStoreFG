# AGENTS.md — Mi Tienda Agenda

## Stack
- Expo SDK 52, React Native 0.76, expo-router
- expo-sqlite (sync API: `openDatabaseSync`), Zustand + MMKV, NativeWind (Tailwind 4), react-native-gifted-charts

## Entry Point
- `"main": "expo-router/entry"` — not `index.js`. Router handles all routing via `app/` directory.

## Path Alias
- `@/*` maps to project root (defined in `tsconfig.json` and `babel.config.js`). Always use `@/` for imports, e.g. `import { Product } from '@/types'`.

## TypeScript
- `strict: true` is enforced. All types in `types/index.ts`.

## Tailwind / NativeWind
- Babel uses `nativewind/babel` plugin — NOT standard Tailwind. The `jsxImportSource: 'nativewind'` in `babel-preset-expo` is required. Custom colors defined in `tailwind.config.js` (primary, success, warning, danger, background, card, text, border).

## Database Pattern
- `hooks/useDatabase.ts` exposes `getDatabase()` which returns a **module-level singleton**. Do NOT call `openDatabaseSync` repeatedly — reuse the instance.
- Schema migration via `db/schema.ts` uses `PRAGMA user_version`. Bump `DATABASE_VERSION` when adding tables/columns.
- All write operations (createSale, createInstallmentPayment, importAllData) run inside `db.withTransactionAsync()`.

## Key Conventions
- **Soft delete on products**: `deleteProduct` sets `is_active = 0`. `getProducts` filters inactive by default (`activeOnly !== false`).
- **Receipt numbers**: Generated as `VT-YYYYMMDD-NNN` via `generateReceiptNumber`. NNN is the daily sales count + 1, zero-padded to 3 digits.
- **Stock**: Automatically decremented inside `createSale` transaction.
- **Installment status**: Automatically flips to `completed` when `remainingAmount <= 0` inside `createInstallmentPayment`.
- **Currency types**: `CUP` | `USD` | `EUR` | `MLC`. Rates stored in settings table, loaded via `appStore`.
- **Sales `items` column**: Stored as JSON string — parsed via `JSON.parse()` when reading.

## Build Commands
```bash
npx expo start               # dev
npx eas build --platform android --profile preview  # APK (local)
```
GitHub Actions uses: `npx expo prebuild --platform android --clean` then `./gradlew assembleRelease`.

## CI Workflow
- Cleans `node_modules`, `package-lock.json`, `android`, `ios`, `.expo` before `npm install` — ensures fresh native build.
- Node 20, Java 17, Android SDK required in CI.

## File Structure
```
app/(tabs)/        # Expo Router screens: index, ventas, productos, clientes, analisis
app/modal/         # Modal screens: producto-form, cliente-form, settings, pago-cuota
components/ui/     # Base UI components
components/business/ # Business-specific components
db/schema.ts       # SQLite schema + migration
db/operations.ts   # All CRUD + analytics queries
stores/            # Zustand stores (appStore, cartStore, uiStore)
types/index.ts     # All TypeScript interfaces
helpers/          # Currency, dates, calculations utilities
```
