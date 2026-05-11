import { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('own', 'consignment')),
        cost_price REAL NOT NULL,
        cost_currency TEXT NOT NULL,
        sale_price REAL NOT NULL,
        sale_currency TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 5,
        image TEXT,
        description TEXT,
        owner_name TEXT,
        owner_contact TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        currency TEXT NOT NULL,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'installment')),
        customer_id INTEGER,
        customer_name TEXT,
        discount REAL NOT NULL DEFAULT 0,
        receipt_number TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS installments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        paid_amount REAL NOT NULL DEFAULT 0,
        remaining_amount REAL NOT NULL,
        number_of_payments INTEGER NOT NULL,
        frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly')),
        start_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
        created_at TEXT NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS installment_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        installment_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (installment_id) REFERENCES installments(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        store_name TEXT NOT NULL DEFAULT 'Mi Tienda',
        address TEXT,
        phone TEXT,
        primary_currency TEXT NOT NULL DEFAULT 'CUP',
        usd_rate REAL NOT NULL DEFAULT 320,
        eur_rate REAL NOT NULL DEFAULT 350,
        mlc_rate REAL NOT NULL DEFAULT 300,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
      CREATE INDEX IF NOT EXISTS idx_installments_customer ON installments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_installment_payments_installment ON installment_payments(installment_id);
    `);

    // Insert default settings
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO settings (id, store_name, primary_currency, usd_rate, eur_rate, mlc_rate, created_at, updated_at)
       VALUES (1, 'Mi Tienda', 'CUP', 320, 350, 300, ?, ?)`,
      [now, now]
    );
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
