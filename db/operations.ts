import { SQLiteDatabase } from 'expo-sqlite';
import {
  Product, Sale, Customer, Installment, InstallmentPayment,
  AppSettings, CartItem, Currency, PaymentMethod, InstallmentFrequency,
  DashboardStats, DailySale, SalesByMethod, TopProduct, CategorySummary,
  CustomerDebt
} from '@/types';

// ============ SETTINGS ============
export async function getSettings(db: SQLiteDatabase): Promise<AppSettings | null> {
  const result = await db.getFirstAsync<{
    id: number; store_name: string; address: string | null; phone: string | null;
    primary_currency: string; usd_rate: number; eur_rate: number; mlc_rate: number;
    created_at: string; updated_at: string;
  }>('SELECT * FROM settings WHERE id = 1');

  if (!result) return null;
  return {
    id: result.id,
    storeName: result.store_name,
    address: result.address || undefined,
    phone: result.phone || undefined,
    primaryCurrency: result.primary_currency as Currency,
    usdRate: result.usd_rate,
    eurRate: result.eur_rate,
    mlcRate: result.mlc_rate,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}

export async function updateSettings(db: SQLiteDatabase, settings: Partial<AppSettings>): Promise<void> {
  const now = new Date().toISOString();
  const current = await getSettings(db);
  if (!current) return;

  await db.runAsync(
    `UPDATE settings SET 
      store_name = COALESCE(?, store_name),
      address = COALESCE(?, address),
      phone = COALESCE(?, phone),
      primary_currency = COALESCE(?, primary_currency),
      usd_rate = COALESCE(?, usd_rate),
      eur_rate = COALESCE(?, eur_rate),
      mlc_rate = COALESCE(?, mlc_rate),
      updated_at = ?
     WHERE id = 1`,
    [
      settings.storeName ?? null,
      settings.address ?? null,
      settings.phone ?? null,
      settings.primaryCurrency ?? null,
      settings.usdRate ?? null,
      settings.eurRate ?? null,
      settings.mlcRate ?? null,
      now,
    ]
  );
}

// ============ PRODUCTS ============
export async function getProducts(db: SQLiteDatabase, filter?: { type?: string; activeOnly?: boolean; lowStock?: boolean; search?: string }): Promise<Product[]> {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (filter?.activeOnly !== false) {
    query += ' AND is_active = 1';
  }
  if (filter?.type) {
    query += ' AND type = ?';
    params.push(filter.type);
  }
  if (filter?.lowStock) {
    query += ' AND stock <= min_stock';
  }
  if (filter?.search) {
    query += ' AND (name LIKE ? OR category LIKE ?)';
    params.push(`%${filter.search}%`, `%${filter.search}%`);
  }

  query += ' ORDER BY name ASC';

  const results = await db.getAllAsync<{
    id: number; name: string; category: string; type: string;
    cost_price: number; cost_currency: string; sale_price: number; sale_currency: string;
    stock: number; min_stock: number; image: string | null; description: string | null;
    owner_name: string | null; owner_contact: string | null; notes: string | null;
    is_active: number; created_at: string; updated_at: string;
  }>(query, params);

  return results.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    type: r.type as Product['type'],
    costPrice: r.cost_price,
    costCurrency: r.cost_currency as Currency,
    salePrice: r.sale_price,
    saleCurrency: r.sale_currency as Currency,
    stock: r.stock,
    minStock: r.min_stock,
    image: r.image || undefined,
    description: r.description || undefined,
    ownerName: r.owner_name || undefined,
    ownerContact: r.owner_contact || undefined,
    notes: r.notes || undefined,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getProductById(db: SQLiteDatabase, id: number): Promise<Product | null> {
  const results = await getProducts(db, { activeOnly: false });
  return results.find(p => p.id === id) || null;
}

export async function createProduct(db: SQLiteDatabase, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO products (name, category, type, cost_price, cost_currency, sale_price, sale_currency,
     stock, min_stock, image, description, owner_name, owner_contact, notes, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.name, product.category, product.type, product.costPrice, product.costCurrency,
      product.salePrice, product.saleCurrency, product.stock, product.minStock,
      product.image || null, product.description || null, product.ownerName || null,
      product.ownerContact || null, product.notes || null, product.isActive ?? 1,
      now, now,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateProduct(db: SQLiteDatabase, id: number, product: Partial<Product>): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE products SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      type = COALESCE(?, type),
      cost_price = COALESCE(?, cost_price),
      cost_currency = COALESCE(?, cost_currency),
      sale_price = COALESCE(?, sale_price),
      sale_currency = COALESCE(?, sale_currency),
      stock = COALESCE(?, stock),
      min_stock = COALESCE(?, min_stock),
      image = COALESCE(?, image),
      description = COALESCE(?, description),
      owner_name = COALESCE(?, owner_name),
      owner_contact = COALESCE(?, owner_contact),
      notes = COALESCE(?, notes),
      is_active = COALESCE(?, is_active),
      updated_at = ?
     WHERE id = ?`,
    [
      product.name ?? null, product.category ?? null, product.type ?? null,
      product.costPrice ?? null, product.costCurrency ?? null,
      product.salePrice ?? null, product.saleCurrency ?? null,
      product.stock ?? null, product.minStock ?? null,
      product.image ?? null, product.description ?? null,
      product.ownerName ?? null, product.ownerContact ?? null,
      product.notes ?? null, product.isActive ?? null,
      now, id,
    ]
  );
}

export async function deleteProduct(db: SQLiteDatabase, id: number): Promise<void> {
  // Soft delete
  await updateProduct(db, id, { isActive: 0 });
}

export async function getProductCategories(db: SQLiteDatabase): Promise<string[]> {
  const results = await db.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC'
  );
  return results.map(r => r.category);
}

// ============ CUSTOMERS ============
export async function getCustomers(db: SQLiteDatabase, search?: string): Promise<Customer[]> {
  let query = 'SELECT * FROM customers';
  const params: any[] = [];

  if (search) {
    query += ' WHERE name LIKE ? OR phone LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC';

  const results = await db.getAllAsync<{
    id: number; name: string; phone: string | null; address: string | null;
    notes: string | null; created_at: string;
  }>(query, params);

  return results.map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone || undefined,
    address: r.address || undefined,
    notes: r.notes || undefined,
    createdAt: r.created_at,
  }));
}

export async function getCustomerById(db: SQLiteDatabase, id: number): Promise<Customer | null> {
  const results = await getCustomers(db);
  return results.find(c => c.id === id) || null;
}

export async function createCustomer(db: SQLiteDatabase, customer: Omit<Customer, 'id' | 'createdAt'>): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO customers (name, phone, address, notes, created_at) VALUES (?, ?, ?, ?, ?)',
    [customer.name, customer.phone || null, customer.address || null, customer.notes || null, now]
  );
  return result.lastInsertRowId;
}

export async function updateCustomer(db: SQLiteDatabase, id: number, customer: Partial<Customer>): Promise<void> {
  await db.runAsync(
    `UPDATE customers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      notes = COALESCE(?, notes)
     WHERE id = ?`,
    [customer.name ?? null, customer.phone ?? null, customer.address ?? null, customer.notes ?? null, id]
  );
}

export async function deleteCustomer(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
}

// ============ SALES ============
export async function createSale(db: SQLiteDatabase, sale: Omit<Sale, 'id' | 'createdAt'>): Promise<number> {
  const now = new Date().toISOString();

  return await db.withTransactionAsync(async () => {
    // Insert sale
    const result = await db.runAsync(
      `INSERT INTO sales (items, total, currency, payment_method, customer_id, customer_name, discount, receipt_number, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        JSON.stringify(sale.items), sale.total, sale.currency, sale.paymentMethod,
        sale.customerId || null, sale.customerName || null, sale.discount,
        sale.receiptNumber, now,
      ]
    );
    const saleId = result.lastInsertRowId;

    // Update stock
    for (const item of sale.items) {
      await db.runAsync(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    return saleId;
  });
}

export async function getSales(db: SQLiteDatabase, options?: { limit?: number; period?: string; paymentMethod?: string }): Promise<Sale[]> {
  let query = 'SELECT * FROM sales WHERE 1=1';
  const params: any[] = [];

  if (options?.period === 'today') {
    const today = new Date().toISOString().split('T')[0];
    query += " AND date(created_at) = date('now', 'localtime')";
  } else if (options?.period === 'week') {
    query += " AND created_at >= datetime('now', '-7 days', 'localtime')";
  } else if (options?.period === 'month') {
    query += " AND created_at >= datetime('now', '-30 days', 'localtime')";
  } else if (options?.period === 'year') {
    query += " AND created_at >= datetime('now', '-365 days', 'localtime')";
  }

  if (options?.paymentMethod) {
    query += ' AND payment_method = ?';
    params.push(options.paymentMethod);
  }

  query += ' ORDER BY created_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  const results = await db.getAllAsync<{
    id: number; items: string; total: number; currency: string;
    payment_method: string; customer_id: number | null; customer_name: string | null;
    discount: number; receipt_number: string; created_at: string;
  }>(query, params);

  return results.map(r => ({
    id: r.id,
    items: JSON.parse(r.items) as Sale['items'],
    total: r.total,
    currency: r.currency as Currency,
    paymentMethod: r.payment_method as PaymentMethod,
    customerId: r.customer_id || undefined,
    customerName: r.customer_name || undefined,
    discount: r.discount,
    receiptNumber: r.receipt_number,
    createdAt: r.created_at,
  }));
}

export async function getTodaySalesCount(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sales WHERE date(created_at) = date('now', 'localtime')"
  );
  return result?.count ?? 0;
}

export async function generateReceiptNumber(db: SQLiteDatabase): Promise<string> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const count = await getTodaySalesCount(db);
  const seq = String(count + 1).padStart(3, '0');
  return `VT-${today}-${seq}`;
}

// ============ INSTALLMENTS ============
export async function createInstallment(db: SQLiteDatabase, installment: Omit<Installment, 'id' | 'createdAt'>): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO installments (sale_id, customer_id, customer_name, total_amount, paid_amount,
     remaining_amount, number_of_payments, frequency, start_date, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      installment.saleId, installment.customerId, installment.customerName,
      installment.totalAmount, installment.paidAmount, installment.remainingAmount,
      installment.numberOfPayments, installment.frequency, installment.startDate,
      installment.status, now,
    ]
  );
  return result.lastInsertRowId;
}

export async function getInstallments(db: SQLiteDatabase, options?: { customerId?: number; status?: string }): Promise<Installment[]> {
  let query = 'SELECT * FROM installments WHERE 1=1';
  const params: any[] = [];

  if (options?.customerId) {
    query += ' AND customer_id = ?';
    params.push(options.customerId);
  }
  if (options?.status) {
    query += ' AND status = ?';
    params.push(options.status);
  }

  query += ' ORDER BY created_at DESC';

  const results = await db.getAllAsync<{
    id: number; sale_id: number; customer_id: number; customer_name: string;
    total_amount: number; paid_amount: number; remaining_amount: number;
    number_of_payments: number; frequency: string; start_date: string;
    status: string; created_at: string;
  }>(query, params);

  return results.map(r => ({
    id: r.id,
    saleId: r.sale_id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    totalAmount: r.total_amount,
    paidAmount: r.paid_amount,
    remainingAmount: r.remaining_amount,
    numberOfPayments: r.number_of_payments,
    frequency: r.frequency as InstallmentFrequency,
    startDate: r.start_date,
    status: r.status as InstallmentStatus,
    createdAt: r.created_at,
  }));
}

export async function getInstallmentById(db: SQLiteDatabase, id: number): Promise<Installment | null> {
  const results = await getInstallments(db);
  return results.find(i => i.id === id) || null;
}

export async function updateInstallment(db: SQLiteDatabase, id: number, updates: Partial<Installment>): Promise<void> {
  await db.runAsync(
    `UPDATE installments SET
      paid_amount = COALESCE(?, paid_amount),
      remaining_amount = COALESCE(?, remaining_amount),
      status = COALESCE(?, status)
     WHERE id = ?`,
    [updates.paidAmount ?? null, updates.remainingAmount ?? null, updates.status ?? null, id]
  );
}

export async function createInstallmentPayment(db: SQLiteDatabase, payment: Omit<InstallmentPayment, 'id' | 'createdAt'>): Promise<void> {
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO installment_payments (installment_id, amount, payment_date, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payment.installmentId, payment.amount, payment.paymentDate, payment.paymentMethod, payment.notes || null, now]
    );

    // Update installment
    const installment = await getInstallmentById(db, payment.installmentId);
    if (installment) {
      const newPaid = installment.paidAmount + payment.amount;
      const newRemaining = installment.totalAmount - newPaid;
      const status: InstallmentStatus = newRemaining <= 0 ? 'completed' : 'active';

      await updateInstallment(db, payment.installmentId, {
        paidAmount: newPaid,
        remainingAmount: Math.max(0, newRemaining),
        status,
      });
    }
  });
}

export async function getInstallmentPayments(db: SQLiteDatabase, installmentId: number): Promise<InstallmentPayment[]> {
  const results = await db.getAllAsync<{
    id: number; installment_id: number; amount: number; payment_date: string;
    payment_method: string; notes: string | null; created_at: string;
  }>(
    'SELECT * FROM installment_payments WHERE installment_id = ? ORDER BY payment_date DESC',
    [installmentId]
  );

  return results.map(r => ({
    id: r.id,
    installmentId: r.installment_id,
    amount: r.amount,
    paymentDate: r.payment_date,
    paymentMethod: r.payment_method as PaymentMethod,
    notes: r.notes || undefined,
    createdAt: r.created_at,
  }));
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats(db: SQLiteDatabase): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  // Today sales
  const salesResult = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
     FROM sales 
     WHERE date(created_at) = date('now', 'localtime')`
  );

  // Today profit (approximate)
  const profitResult = await db.getFirstAsync<{ profit: number }>(
    `SELECT COALESCE(SUM(
      (SELECT SUM((si.unit_price - p.cost_price * 
        CASE WHEN s.currency = p.cost_currency THEN 1 
             WHEN s.currency = 'CUP' THEN 1.0 / CASE p.cost_currency 
               WHEN 'USD' THEN (SELECT usd_rate FROM settings WHERE id = 1)
               WHEN 'EUR' THEN (SELECT eur_rate FROM settings WHERE id = 1)
               WHEN 'MLC' THEN (SELECT mlc_rate FROM settings WHERE id = 1)
               ELSE 1 END
             ELSE 1 END) * si.quantity)
       FROM json_each(s.items) as si 
       JOIN products p ON p.id = si.productId)
     ), 0) as profit
     FROM sales s
     WHERE date(s.created_at) = date('now', 'localtime')`
  );

  // Total stock
  const stockResult = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE is_active = 1'
  );

  // Total debt
  const debtResult = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(remaining_amount), 0) as total, 
            COUNT(DISTINCT customer_id) as count
     FROM installments WHERE status = 'active'`
  );

  return {
    todaySales: salesResult?.total ?? 0,
    todaySalesCount: salesResult?.count ?? 0,
    todayProfit: profitResult?.profit ?? 0,
    totalStock: stockResult?.total ?? 0,
    totalDebt: debtResult?.total ?? 0,
    debtorsCount: debtResult?.count ?? 0,
  };
}

// ============ ANALYTICS ============
export async function getSalesByPeriod(db: SQLiteDatabase, period: string): Promise<DailySale[]> {
  let dateFilter: string;
  let groupBy: string;

  switch (period) {
    case 'today':
      dateFilter = "date(created_at) = date('now', 'localtime')";
      groupBy = "strftime('%H', created_at)";
      break;
    case 'week':
      dateFilter = "created_at >= datetime('now', '-7 days', 'localtime')";
      groupBy = "date(created_at)";
      break;
    case 'month':
      dateFilter = "created_at >= datetime('now', '-30 days', 'localtime')";
      groupBy = "date(created_at)";
      break;
    case 'year':
      dateFilter = "created_at >= datetime('now', '-365 days', 'localtime')";
      groupBy = "strftime('%Y-%m', created_at)";
      break;
    default:
      dateFilter = "date(created_at) = date('now', 'localtime')";
      groupBy = "date(created_at)";
  }

  const query = `
    SELECT ${groupBy} as date, SUM(total) as total, COUNT(*) as count
    FROM sales
    WHERE ${dateFilter}
    GROUP BY ${groupBy}
    ORDER BY date ASC
  `;

  const results = await db.getAllAsync<{ date: string; total: number; count: number }>(query);

  return results.map(r => ({
    date: r.date,
    total: r.total,
    profit: 0, // Simplified
  }));
}

export async function getSalesByMethod(db: SQLiteDatabase, period: string): Promise<SalesByMethod[]> {
  let dateFilter: string;

  switch (period) {
    case 'today':
      dateFilter = "date(created_at) = date('now', 'localtime')";
      break;
    case 'week':
      dateFilter = "created_at >= datetime('now', '-7 days', 'localtime')";
      break;
    case 'month':
      dateFilter = "created_at >= datetime('now', '-30 days', 'localtime')";
      break;
    case 'year':
      dateFilter = "created_at >= datetime('now', '-365 days', 'localtime')";
      break;
    default:
      dateFilter = '1=1';
  }

  const results = await db.getAllAsync<{ method: string; count: number; total: number }>(
    `SELECT payment_method as method, COUNT(*) as count, SUM(total) as total
     FROM sales WHERE ${dateFilter}
     GROUP BY payment_method`,
  );

  return results.map(r => ({
    method: r.method as PaymentMethod,
    count: r.count,
    total: r.total,
  }));
}

export async function getTopProducts(db: SQLiteDatabase, period: string, limit: number = 5): Promise<TopProduct[]> {
  let dateFilter: string;

  switch (period) {
    case 'today':
      dateFilter = "date(s.created_at) = date('now', 'localtime')";
      break;
    case 'week':
      dateFilter = "s.created_at >= datetime('now', '-7 days', 'localtime')";
      break;
    case 'month':
      dateFilter = "s.created_at >= datetime('now', '-30 days', 'localtime')";
      break;
    case 'year':
      dateFilter = "s.created_at >= datetime('now', '-365 days', 'localtime')";
      break;
    default:
      dateFilter = '1=1';
  }

  // This is a simplified version - in production you'd parse JSON properly
  const results = await db.getAllAsync<{
    id: number; name: string; image: string | null;
    quantity_sold: number; total_revenue: number;
  }>(
    `SELECT p.id, p.name, p.image,
            SUM(json_extract(value, '$.quantity')) as quantity_sold,
            SUM(json_extract(value, '$.subtotal')) as total_revenue
     FROM sales s, json_each(s.items) as item
     JOIN products p ON p.id = json_extract(item.value, '$.productId')
     WHERE ${dateFilter}
     GROUP BY p.id
     ORDER BY quantity_sold DESC
     LIMIT ?`,
    [limit]
  );

  return results.map(r => ({
    id: r.id,
    name: r.name,
    image: r.image || undefined,
    quantitySold: r.quantity_sold,
    totalRevenue: r.total_revenue,
  }));
}

export async function getCategorySummary(db: SQLiteDatabase, period: string): Promise<CategorySummary[]> {
  let dateFilter: string;

  switch (period) {
    case 'today':
      dateFilter = "date(s.created_at) = date('now', 'localtime')";
      break;
    case 'week':
      dateFilter = "s.created_at >= datetime('now', '-7 days', 'localtime')";
      break;
    case 'month':
      dateFilter = "s.created_at >= datetime('now', '-30 days', 'localtime')";
      break;
    case 'year':
      dateFilter = "s.created_at >= datetime('now', '-365 days', 'localtime')";
      break;
    default:
      dateFilter = '1=1';
  }

  const results = await db.getAllAsync<{
    category: string; total_revenue: number; total_profit: number; product_count: number;
  }>(
    `SELECT p.category,
            SUM(json_extract(item.value, '$.subtotal')) as total_revenue,
            SUM((json_extract(item.value, '$.unitPrice') - p.cost_price) * json_extract(item.value, '$.quantity')) as total_profit,
            COUNT(DISTINCT p.id) as product_count
     FROM sales s, json_each(s.items) as item
     JOIN products p ON p.id = json_extract(item.value, '$.productId')
     WHERE ${dateFilter}
     GROUP BY p.category
     ORDER BY total_revenue DESC`
  );

  return results.map(r => ({
    name: r.category,
    totalRevenue: r.total_revenue,
    totalProfit: r.total_profit,
    productCount: r.product_count,
  }));
}

// ============ EXPORT / IMPORT ============
export async function exportAllData(db: SQLiteDatabase): Promise<string> {
  const products = await db.getAllAsync('SELECT * FROM products');
  const sales = await db.getAllAsync('SELECT * FROM sales');
  const customers = await db.getAllAsync('SELECT * FROM customers');
  const installments = await db.getAllAsync('SELECT * FROM installments');
  const payments = await db.getAllAsync('SELECT * FROM installment_payments');
  const settings = await db.getAllAsync('SELECT * FROM settings');

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    sales,
    customers,
    installments,
    installment_payments: payments,
    settings,
  };

  return JSON.stringify(data, null, 2);
}

export async function importAllData(db: SQLiteDatabase, jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);

  await db.withTransactionAsync(async () => {
    // Clear existing data
    await db.execAsync(`
      DELETE FROM installment_payments;
      DELETE FROM installments;
      DELETE FROM sales;
      DELETE FROM customers;
      DELETE FROM products;
      DELETE FROM settings;
    `);

    // Import products
    if (data.products) {
      for (const p of data.products) {
        await db.runAsync(
          `INSERT INTO products (id, name, category, type, cost_price, cost_currency, sale_price, sale_currency,
           stock, min_stock, image, description, owner_name, owner_contact, notes, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.category, p.type, p.cost_price, p.cost_currency, p.sale_price, p.sale_currency,
           p.stock, p.min_stock, p.image, p.description, p.owner_name, p.owner_contact, p.notes, p.is_active, p.created_at, p.updated_at]
        );
      }
    }

    // Import customers
    if (data.customers) {
      for (const c of data.customers) {
        await db.runAsync(
          'INSERT INTO customers (id, name, phone, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.phone, c.address, c.notes, c.created_at]
        );
      }
    }

    // Import sales
    if (data.sales) {
      for (const s of data.sales) {
        await db.runAsync(
          `INSERT INTO sales (id, items, total, currency, payment_method, customer_id, customer_name, discount, receipt_number, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.items, s.total, s.currency, s.payment_method, s.customer_id, s.customer_name, s.discount, s.receipt_number, s.created_at]
        );
      }
    }

    // Import installments
    if (data.installments) {
      for (const i of data.installments) {
        await db.runAsync(
          `INSERT INTO installments (id, sale_id, customer_id, customer_name, total_amount, paid_amount,
           remaining_amount, number_of_payments, frequency, start_date, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [i.id, i.sale_id, i.customer_id, i.customer_name, i.total_amount, i.paid_amount,
           i.remaining_amount, i.number_of_payments, i.frequency, i.start_date, i.status, i.created_at]
        );
      }
    }

    // Import payments
    if (data.installment_payments) {
      for (const p of data.installment_payments) {
        await db.runAsync(
          `INSERT INTO installment_payments (id, installment_id, amount, payment_date, payment_method, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.installment_id, p.amount, p.payment_date, p.payment_method, p.notes, p.created_at]
        );
      }
    }

    // Import settings
    if (data.settings && data.settings[0]) {
      const s = data.settings[0];
      await db.runAsync(
        `INSERT INTO settings (id, store_name, address, phone, primary_currency, usd_rate, eur_rate, mlc_rate, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.store_name, s.address, s.phone, s.primary_currency, s.usd_rate, s.eur_rate, s.mlc_rate, s.created_at, s.updated_at]
      );
    }
  });
}

export async function clearAllData(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM installment_payments;
    DELETE FROM installments;
    DELETE FROM sales;
    DELETE FROM customers;
    DELETE FROM products;
  `);
}
