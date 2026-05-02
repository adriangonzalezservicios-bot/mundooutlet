import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type Category = 'Heladera' | 'Lavarropas' | 'Cocina' | 'Lavavajillas' | 'Repuesto';
export type ProductStatus = 'Ingresado' | 'En Taller' | 'Listo' | 'Vendido' | 'Disponible';

export interface Batch {
  id: string;
  name: string;
  providerId: string;
  date: string;
  totalCost: number;
  quantity: number;
  costPerUnit: number; // Prorrateado
}

export interface Product {
  sku: string;
  category: Category;
  brand: string;
  model: string;
  cost: number; // Costo base (lote)
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  series: string[];
  status: ProductStatus;
  batchId?: string;
}

export interface WorkshopExpense {
  id: string;
  productId: string;
  description: string;
  cost: number;
  date: string;
}

export interface Client {
  id: string;
  name: string;
  type: 'Mayorista' | 'Consumidor Final';
  debt: number;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Provider {
  id: string;
  name: string;
  contact: string;
  balance: number;
  phone?: string;
  email?: string;
  address?: string;
}

export interface WorkshopJob {
  id: string;
  dateIn: string;
  device: string;
  sku?: string;
  serie?: string;
  issue: string;
  notes?: string;
  clientId?: string;
  status: 'Pendiente' | 'En diagnóstico' | 'Esperando repuesto' | 'Reparando' | 'Completado' | 'Entregado';
  cost: number;
}

export interface PurchaseItem {
  id: string;
  sku: string;
  name: string;
  cost: number;
  quantity: number;
}

export interface Purchase {
  id: string;
  date: string;
  providerId: string;
  items: PurchaseItem[];
  subtotal: number;
  shippingCost?: number;
  paymentMethod?: string;
  total: number;
  status: 'Completada' | 'Pendiente';
}

export interface SaleItem {
  id: string;
  sku: string;
  serie?: string;
  name: string;
  price: number; // The price it was actually sold at
  quantity: number;
}

export interface Sale {
  id: string;
  date: string;
  clientId: string;
  items: SaleItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  status: 'Completada' | 'Pendiente' | 'Cancelada';
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Ingreso' | 'Egreso';
  category: 'Venta' | 'Compra Proveedor' | 'Logística' | 'Operativo' | 'Sueldo' | 'Repuestos' | 'Otro';
  amount: number;
  description: string;
  referenceId?: string;
  paymentMethod?: string;
}

interface AppState {
  products: Product[];
  batches: Batch[];
  workshopExpenses: WorkshopExpense[];
  clients: Client[];
  providers: Provider[];
  sales: Sale[];
  purchases: Purchase[];
  transactions: Transaction[];
  workshopJobs: WorkshopJob[];
  
  // Actions
  addBatch: (batch: Omit<Batch, 'id' | 'costPerUnit'>) => void;
  addWorkshopExpense: (expense: Omit<WorkshopExpense, 'id'>) => void;
  registerSale: (saleData: {
    productId: string;
    clientId: string;
    salePrice: number;
    paymentMethod: string;
  }) => Promise<{ profit: number; margin: number; totalCost: number }>;
  
  // Existing Actions
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSale: (id: string, updatedFields: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  addPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  updatePurchase: (id: string, updatedFields: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updatedFields: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addProvider: (provider: Omit<Provider, 'id'>) => void;
  updateProvider: (id: string, updatedFields: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, updatedFields: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (sku: string, updatedFields: Partial<Product>) => void;
  deleteProduct: (sku: string) => void;
  addWorkshopJob: (job: Omit<WorkshopJob, 'id'>) => void;
  updateWorkshopJobStatus: (id: string, status: WorkshopJob['status']) => void;
  updateWorkshopJob: (id: string, job: Partial<WorkshopJob>) => void;
  deleteWorkshopJob: (id: string) => void;
}

const initialProducts: Product[] = [
  // LOTE 1 FRANCO (VENDIDOS)
  ...Array.from({ length: 10 }).map((_, i) => ({
    sku: `FR-DRE-L1-00${i + 1}`,
    category: 'Heladera' as Category,
    brand: 'DREAN',
    model: 'Standard (Lote 1)',
    cost: 120000,
    wholesalePrice: 250000,
    retailPrice: 350000,
    stock: 0,
    series: [`SER-FR1-${i + 1}`],
    status: 'Vendido' as ProductStatus
  })),
  // LOTE 2 FRANCO (VENDIDOS)
  ...Array.from({ length: 25 }).map((_, i) => ({
    sku: `FR-DRE-L2-${(i + 1).toString().padStart(3, '0')}`,
    category: 'Heladera' as Category,
    brand: 'DREAN',
    model: 'PHCT225B (Lote 2)',
    cost: 160000,
    wholesalePrice: 290000,
    retailPrice: 400000,
    stock: 0,
    series: [`SER-FR2-${i + 1}`],
    status: 'Vendido' as ProductStatus
  })),
  // PRODUCTOS LOTE PUNICARI (45 UNIDADES)
  // Disponibles (30)
  { sku: 'PUN-HEL-001', category: 'Heladera', brand: 'PHILCO', model: 'PHCT225B', cost: 171111, wholesalePrice: 280000, retailPrice: 350000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-002', category: 'Heladera', brand: 'PHILCO', model: 'PHCT219B', cost: 171111, wholesalePrice: 280000, retailPrice: 350000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-003', category: 'Heladera', brand: 'ESLABON DE LUJO', model: 'ERD34ABDNA', cost: 171111, wholesalePrice: 290000, retailPrice: 365000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-004', category: 'Heladera', brand: 'BEKO', model: 'RDNE455E30VDZX', cost: 171111, wholesalePrice: 450000, retailPrice: 580000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-005', category: 'Heladera', brand: 'WHIRLPOOL', model: 'WRE44BK', cost: 171111, wholesalePrice: 480000, retailPrice: 620000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-006', category: 'Heladera', brand: 'PHILCO', model: 'PHSD179PD2', cost: 171111, wholesalePrice: 270000, retailPrice: 340000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-007', category: 'Heladera', brand: 'HISENSE', model: 'RD-49WRB', cost: 171111, wholesalePrice: 330000, retailPrice: 410000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-008', category: 'Heladera', brand: 'WHIRLPOOL', model: 'WRM39CK', cost: 171111, wholesalePrice: 450000, retailPrice: 590000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-009', category: 'Heladera', brand: 'GAFA', model: 'HGF388AFP', cost: 171111, wholesalePrice: 290000, retailPrice: 370000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-010', category: 'Heladera', brand: 'DREAN', model: 'HDR400F11S', cost: 171111, wholesalePrice: 310000, retailPrice: 390000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-011', category: 'Heladera', brand: 'SIGMA', model: '2F1800BA', cost: 171111, wholesalePrice: 280000, retailPrice: 350000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-012', category: 'Heladera', brand: 'BGH', model: 'BRC33012A', cost: 171111, wholesalePrice: 310000, retailPrice: 395000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-013', category: 'Heladera', brand: 'KOHINOOR', model: 'KSA-3290-7', cost: 171111, wholesalePrice: 340000, retailPrice: 440000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-014', category: 'Heladera', brand: 'SAMSUNG', model: 'RT29K507JSB01', cost: 171111, wholesalePrice: 520000, retailPrice: 680000, stock: 1, series: [], status: 'Listo' },
  { sku: 'PUN-HEL-015', category: 'Heladera', brand: 'GAFA', model: 'HGF388AF3', cost: 171111, wholesalePrice: 290000, retailPrice: 370000, stock: 1, series: [], status: 'Listo' },
  // ... más unidades para completar las 30 disponibles
  ...Array.from({ length: 15 }).map((_, i) => ({
    sku: `PUN-HEL-LREADY-0${i + 1}`,
    category: 'Heladera' as Category,
    brand: 'Varios',
    model: 'Modelos Lote Punicari (Disponibles)',
    cost: 171111,
    wholesalePrice: 300000,
    retailPrice: 400000,
    stock: 1,
    series: [],
    status: 'Listo' as ProductStatus
  })),
  // En Taller (15)
  ...Array.from({ length: 15 }).map((_, i) => ({
    sku: `PUN-TALLER-${(i + 1).toString().padStart(3, '0')}`,
    category: 'Heladera' as Category,
    brand: 'Varios',
    model: 'Modelos Lote Punicari (En Reparación)',
    cost: 171111,
    wholesalePrice: 0,
    retailPrice: 0,
    stock: 1,
    series: [],
    status: 'En Taller' as ProductStatus
  })),
  // Otros Productos
  { sku: 'LAV-DRE-FRANCO', category: 'Lavarropas', brand: 'DREAN', model: 'Next (Lote Franco)', cost: 120000, wholesalePrice: 220000, retailPrice: 280000, stock: 3, series: [], status: 'Disponible' },
  // LOTE LUCIANO (11 KOHINOOR)
  ...Array.from({ length: 11 }).map((_, i) => ({
    sku: `LUC-KOH-${(i + 1).toString().padStart(3, '0')}`,
    category: 'Heladera' as Category,
    brand: 'KOHINOOR',
    model: 'Heladera Kohinoor (Lote Luciano)',
    cost: 170000,
    wholesalePrice: 280000,
    retailPrice: 350000,
    stock: 1,
    series: [],
    status: 'Disponible' as ProductStatus
  })),
  // LOTE DREAN 16 HELADERAS (2026-04-29)
  ...Array.from({ length: 16 }).map((_, i) => ({
    sku: `DRE-HEL-L3-${(i + 1).toString().padStart(3, '0')}`,
    category: 'Heladera' as Category,
    brand: 'DREAN',
    model: 'Heladera Drean (Lote 16)',
    cost: 213875, // 3422000 / 16 (approx, though it includes lavarropas)
    wholesalePrice: 350000,
    retailPrice: 450000,
    stock: 1,
    series: [],
    status: 'Disponible' as ProductStatus
  })),
];

const initialClients: Client[] = [
  { id: 'c1', name: 'Luciano', type: 'Mayorista', debt: 0 },
  { id: 'c2', name: 'Jorge', type: 'Mayorista', debt: 0 },
  { id: 'c3', name: 'Sebastian', type: 'Mayorista', debt: 0 },
  { id: 'c4', name: 'Cristian Electrotino', type: 'Mayorista', debt: 0 },
  { id: 'c5', name: 'Consumidor Final', type: 'Consumidor Final', debt: 0 },
  { id: 'c6', name: 'Facundo Solano', type: 'Mayorista', debt: 0 },
];

const initialProviders: Provider[] = [
  { id: 'p1', name: 'Punicari', contact: '11-1234-5678', balance: 0 },
  { id: 'p2', name: 'Franco', contact: '11-4321-8765', balance: 0 },
  { id: 'p3', name: 'GyH Repuestos', contact: 'gyh@repuestos.com', balance: 0 },
  { id: 'p4', name: 'Luciano (Lote)', contact: '', balance: 0 },
  { id: 'p5', name: 'Proveedor Drean', contact: '', balance: 0 },
];

const initialWorkshopJobs: WorkshopJob[] = [
  { id: 'w1', dateIn: new Date().toISOString(), device: 'Lote Punicari (15 unid)', issue: 'Diagnóstico inicial lote', status: 'En diagnóstico', cost: 0 },
];

const initialPurchases: Purchase[] = [
  {
    id: 'p-1',
    date: new Date('2026-05-08').toISOString(),
    providerId: 'p1', // Punicari
    items: [{ id: 'pi-1', sku: 'PUN-45', name: 'Lote Punicari', cost: 171111, quantity: 45 }],
    subtotal: 7700000,
    total: 7700000,
    status: 'Completada'
  },
  {
    id: 'p-2',
    date: new Date('2026-05-08').toISOString(),
    providerId: 'p2', // Franco / Drean
    items: [{ id: 'pi-2', sku: 'DRE-33', name: 'Lote Drean', cost: 160000, quantity: 33 }],
    subtotal: 5280000,
    total: 5280000,
    status: 'Completada'
  },
  {
    id: 'p-3',
    date: new Date('2026-05-08').toISOString(),
    providerId: 'p2',
    items: [{ id: 'pi-3', sku: 'HEL-16', name: 'Lote Heladeras 16 un', cost: 160000, quantity: 16 }],
    subtotal: 2560000,
    total: 2560000,
    status: 'Completada'
  },
  {
    id: 'p-4',
    date: new Date('2026-05-08').toISOString(),
    providerId: 'p2',
    items: [{ id: 'pi-4', sku: 'LAV-15', name: 'Lote Lavarropas 15 un', cost: 160000, quantity: 15 }],
    subtotal: 2400000,
    total: 2400000,
    status: 'Completada'
  },
  {
    id: 'p-5',
    date: new Date('2026-05-08').toISOString(),
    providerId: 'p4', // Luciano
    items: [{ id: 'pi-5', sku: 'KOH-11', name: 'Lote Kohinoor 11 un', cost: 170000, quantity: 11 }],
    subtotal: 1870000,
    total: 1870000,
    status: 'Completada'
  }
];

const initialSales: Sale[] = [
  {
    id: 's-1',
    date: new Date('2026-05-08').toISOString(),
    clientId: 'c1',
    items: [{ id: 'si-1', sku: 'DRE-33', name: 'Venta Drean 33 unidades', price: 290000, quantity: 33 }],
    subtotal: 9570000,
    shippingCost: 0,
    total: 9570000,
    paymentMethod: 'Transferencia',
    status: 'Completada'
  },
  {
    id: 's-2',
    date: new Date('2026-05-08').toISOString(),
    clientId: 'c1',
    items: [{ id: 'si-2', sku: 'LAV-15', name: 'Venta Lavarropas 15 unidades', price: 290000, quantity: 15 }],
    subtotal: 4350000,
    shippingCost: 0,
    total: 4350000,
    paymentMethod: 'Transferencia',
    status: 'Completada'
  },
  {
    id: 's-3',
    date: new Date('2026-05-08').toISOString(),
    clientId: 'c1',
    items: [{ id: 'si-3', sku: 'HEL-16', name: 'Venta Heladeras 16 unidades', price: 290000, quantity: 16 }],
    subtotal: 4640000,
    shippingCost: 0,
    total: 4640000,
    paymentMethod: 'Transferencia',
    status: 'Completada'
  },
  {
    id: 's-4',
    date: new Date('2026-05-08').toISOString(),
    clientId: 'c1',
    items: [{ id: 'si-4', sku: 'PUN-30', name: 'Venta Punicari 30 unidades', price: 350000, quantity: 30 }],
    subtotal: 10500000,
    shippingCost: 0,
    total: 10500000,
    paymentMethod: 'Transferencia',
    status: 'Completada'
  }
];

const initialTransactions: Transaction[] = [
  { id: 't1', date: new Date('2026-05-08T10:00:00').toISOString(), type: 'Ingreso', category: 'Otro', amount: 1200000, description: 'Saldo inicial 08/05' },
  { id: 't2', date: new Date('2026-05-08T10:01:00').toISOString(), type: 'Egreso', category: 'Compra Proveedor', amount: 7700000, description: 'Compra Lote Punicari 45 heladeras' },
  { id: 't3', date: new Date('2026-05-08T10:02:00').toISOString(), type: 'Egreso', category: 'Compra Proveedor', amount: 5280000, description: 'Compra Lote Drean 33 heladeras' },
  { id: 't4', date: new Date('2026-05-08T10:03:00').toISOString(), type: 'Egreso', category: 'Compra Proveedor', amount: 2560000, description: 'Compra Lote Heladeras 16 unidades' },
  { id: 't5', date: new Date('2026-05-08T10:04:00').toISOString(), type: 'Egreso', category: 'Compra Proveedor', amount: 2400000, description: 'Compra Lote Lavarropas 15 unidades' },
  { id: 't6', date: new Date('2026-05-08T10:05:00').toISOString(), type: 'Egreso', category: 'Compra Proveedor', amount: 1870000, description: 'Compra Lote Kohinoor 11 heladeras' },
  { id: 't7', date: new Date('2026-05-08T10:06:00').toISOString(), type: 'Egreso', category: 'Operativo', amount: 1141534, description: 'Gastos operativos (repuestos, logística, otros)' },
  { id: 't8', date: new Date('2026-05-08T10:07:00').toISOString(), type: 'Ingreso', category: 'Venta', amount: 9570000, description: 'Venta Drean 33 unidades a $290.000', referenceId: 's-1' },
  { id: 't9', date: new Date('2026-05-08T10:08:00').toISOString(), type: 'Ingreso', category: 'Venta', amount: 4350000, description: 'Venta Lavarropas 15 unidades a $290.000', referenceId: 's-2' },
  { id: 't10', date: new Date('2026-05-08T10:09:00').toISOString(), type: 'Ingreso', category: 'Venta', amount: 4640000, description: 'Venta Heladeras 16 unidades a $290.000', referenceId: 's-3' },
  { id: 't11', date: new Date('2026-05-08T10:10:00').toISOString(), type: 'Ingreso', category: 'Venta', amount: 10500000, description: 'Venta Punicari 30 unidades a $350.000', referenceId: 's-4' },
  { id: 't16', date: new Date('2026-05-08T10:15:00').toISOString(), type: 'Egreso', category: 'Repuestos', amount: 600000, description: 'Repuestos Punicari restantes' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: initialProducts.map(p => ({ ...p, status: 'Disponible' as ProductStatus })),
      batches: [],
  workshopExpenses: [],
  clients: initialClients,
  providers: initialProviders,
  workshopJobs: initialWorkshopJobs,
  sales: initialSales,
  purchases: initialPurchases,
  transactions: initialTransactions,

  addBatch: async (batchData) => {
    const id = crypto.randomUUID();
    const costPerUnit = batchData.totalCost / batchData.quantity;
    const newBatch: Batch = { ...batchData, id, costPerUnit };
    
    set((state) => ({ batches: [newBatch, ...state.batches] }));
    if (isSupabaseConfigured) await supabase.from('batches').insert([newBatch]);
  },

  addWorkshopExpense: async (expenseData) => {
    const newExpense: WorkshopExpense = { ...expenseData, id: crypto.randomUUID() };
    set((state) => ({ workshopExpenses: [newExpense, ...state.workshopExpenses] }));
    if (isSupabaseConfigured) await supabase.from('workshop_expenses').insert([newExpense]);
  },

  registerSale: async ({ productId, clientId, salePrice, paymentMethod }) => {
    const state = get();
    const product = state.products.find(p => p.sku === productId);
    if (!product) throw new Error("Producto no encontrado");

    // 1. Calcular Costo de Adquisición (desde Lote o Directo)
    let acquisitionCost = product.cost;
    if (product.batchId) {
      const batch = state.batches.find(b => b.id === product.batchId);
      if (batch) acquisitionCost = batch.costPerUnit;
    }

    // 2. Sumar Gastos de Taller (Repuestos/Mano de obra)
    const repairCosts = state.workshopExpenses
      .filter(e => e.productId === productId)
      .reduce((sum, e) => sum + e.cost, 0);

    const totalCost = acquisitionCost + repairCosts;
    const profit = salePrice - totalCost;
    const margin = (profit / salePrice) * 100;

    // 3. Ejecutar Transacción de Venta
    const saleId = crypto.randomUUID();
    const newSale: Sale = {
      id: saleId,
      date: new Date().toISOString(),
      clientId,
      items: [{
        id: crypto.randomUUID(),
        sku: product.sku,
        name: `${product.brand} ${product.model}`,
        price: salePrice,
        quantity: 1
      }],
      subtotal: salePrice,
      shippingCost: 0,
      total: salePrice,
      paymentMethod,
      status: 'Completada'
    };

    // 4. Actualizar Estado del Producto y Registrar Movimiento
    set((state) => ({
      sales: [newSale, ...state.sales],
      products: state.products.map(p => p.sku === productId ? { ...p, status: 'Vendido' } : p),
      transactions: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'Ingreso',
        category: 'Venta',
        amount: salePrice,
        description: `Venta de ${product.sku} (Margen: ${margin.toFixed(1)}%)`,
        referenceId: saleId,
        paymentMethod
      }, ...state.transactions]
    }));

    if (isSupabaseConfigured) {
      await Promise.all([
        supabase.from('sales').insert([newSale]),
        supabase.from('products').update({ status: 'Vendido' }).eq('sku', productId),
        supabase.from('transactions').insert([{
          type: 'Ingreso',
          category: 'Venta',
          amount: salePrice,
          description: `Venta de ${product.sku}`
        }])
      ]);
    }

    return { profit, margin, totalCost };
  },

  fetchData: async () => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;
    const { data: p } = await supabase.from('products').select('*');
    const { data: c } = await supabase.from('clients').select('*');
    const { data: s } = await supabase.from('sales').select('*');
    const { data: t } = await supabase.from('transactions').select('*');
    if (p) set({ products: p });
    if (c) set({ clients: c });
    if (s) set({ sales: s });
    if (t) set({ transactions: t });
  },

  addSale: async (sale) => {
    const state = get();
    const newSale = { ...sale, id: crypto.randomUUID() };
    const affectedSkus: string[] = [];
    
    // Calculate margins for internal tracking
    let totalSaleCost = 0;

    const updatedProducts = state.products.map(product => {
      const soldItems = newSale.items.filter(item => item.sku === product.sku);
      if (soldItems.length > 0) {
        affectedSkus.push(product.sku);
        const totalQuantitySold = soldItems.reduce((sum, item) => sum + item.quantity, 0);
        const soldSeries = soldItems.map(item => item.serie).filter(Boolean) as string[];
        
        // Calculate costs for this product
        let acquisitionCost = product.cost;
        if (product.batchId) {
          const batch = state.batches.find(b => b.id === product.batchId);
          if (batch) acquisitionCost = batch.costPerUnit;
        }
        const repairCosts = state.workshopExpenses
          .filter(e => e.productId === product.sku)
          .reduce((sum, e) => sum + e.cost, 0);
          
        totalSaleCost += (acquisitionCost + repairCosts) * totalQuantitySold;

        return {
          ...product,
          status: 'Vendido' as ProductStatus,
          stock: Math.max(0, product.stock - totalQuantitySold),
          series: product.series.filter(s => !soldSeries.includes(s))
        };
      }
      return product;
    });

    const profit = newSale.total - totalSaleCost;
    const margin = newSale.total > 0 ? (profit / newSale.total) * 100 : 0;

    set((state) => ({
      sales: [newSale, ...state.sales],
      products: updatedProducts,
      transactions: [{
        id: crypto.randomUUID(),
        date: newSale.date,
        type: 'Ingreso',
        category: 'Venta',
        amount: newSale.total,
        description: `Venta a ${state.clients.find(c => c.id === newSale.clientId)?.name || 'Cliente'} (Margen: ${margin.toFixed(1)}%)`,
        referenceId: newSale.id,
        paymentMethod: newSale.paymentMethod
      }, ...state.transactions]
    }));
    
    // Sync to Supabase
    if (isSupabaseConfigured) {
      await Promise.all([
        supabase.from('sales').insert([newSale]),
        ...updatedProducts.filter(p => affectedSkus.includes(p.sku)).map(p => 
          supabase.from('products').update({ status: 'Vendido', stock: p.stock, series: p.series }).eq('sku', p.sku)
        ),
        supabase.from('transactions').insert([{
          date: newSale.date,
          type: 'Ingreso',
          category: 'Venta',
          amount: newSale.total,
          description: `Venta a ${state.clients.find(c => c.id === newSale.clientId)?.name || 'Cliente'}`
        }])
      ]);
    }
  },

  updateProduct: async (sku, updatedFields) => {
    set((state) => ({
      products: state.products.map(p => p.sku === sku ? { ...p, ...updatedFields } : p)
    }));
    if (import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('products').update(updatedFields).eq('sku', sku);
    }
  },

  addClient: async (client) => {
    const newClient = { ...client, id: crypto.randomUUID() };
    set((state) => ({ clients: [newClient, ...state.clients] }));
    if (import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('clients').insert([newClient]);
    }
  },

  updateClient: async (id, updatedFields) => {
    set((state) => ({
      clients: state.clients.map(c => c.id === id ? { ...c, ...updatedFields } : c)
    }));
    if (isSupabaseConfigured) await supabase.from('clients').update(updatedFields).eq('id', id);
  },

  deleteClient: async (id) => {
    set((state) => ({
      clients: state.clients.filter(c => c.id !== id)
    }));
    if (isSupabaseConfigured) await supabase.from('clients').delete().eq('id', id);
  },

  addProduct: async (product) => {
    set((state) => ({ products: [product, ...state.products] }));
    if (isSupabaseConfigured) await supabase.from('products').insert([product]);
  },

  deleteProduct: async (sku) => {
    set((state) => ({ products: state.products.filter(p => p.sku !== sku) }));
    if (isSupabaseConfigured) await supabase.from('products').delete().eq('sku', sku);
  },

  addTransaction: async (transaction) => {
    const newTx = { ...transaction, id: crypto.randomUUID() };
    set((state) => ({ transactions: [newTx, ...state.transactions] }));
    if (isSupabaseConfigured) await supabase.from('transactions').insert([newTx]);
  },

  updateTransaction: async (id, updatedFields) => {
    set((state) => ({
      transactions: state.transactions.map(t => t.id === id ? { ...t, ...updatedFields } : t)
    }));
    if (isSupabaseConfigured) await supabase.from('transactions').update(updatedFields).eq('id', id);
  },

  deleteTransaction: async (id) => {
    set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
    if (isSupabaseConfigured) await supabase.from('transactions').delete().eq('id', id);
  },

  addWorkshopJob: async (job) => {
    const newJob = { ...job, id: crypto.randomUUID() };
    set((state) => ({ workshopJobs: [newJob, ...state.workshopJobs] }));
    if (isSupabaseConfigured) await supabase.from('workshop_jobs').insert([newJob]);
  },

  updateWorkshopJob: async (id, updatedFields) => {
    set((state) => ({
      workshopJobs: state.workshopJobs.map(j => j.id === id ? { ...j, ...updatedFields } : j)
    }));
    if (isSupabaseConfigured) await supabase.from('workshop_jobs').update(updatedFields).eq('id', id);
  },

  updateWorkshopJobStatus: async (id, status) => {
    set((state) => ({
      workshopJobs: state.workshopJobs.map(j => j.id === id ? { ...j, status } : j)
    }));
    if (isSupabaseConfigured) await supabase.from('workshop_jobs').update({ status }).eq('id', id);
  },

  deleteWorkshopJob: async (id) => {
    set((state) => ({ workshopJobs: state.workshopJobs.filter(j => j.id !== id) }));
    if (isSupabaseConfigured) await supabase.from('workshop_jobs').delete().eq('id', id);
  },

  addProvider: async (provider) => {
    const newProvider = { ...provider, id: crypto.randomUUID() };
    set((state) => ({ providers: [newProvider, ...state.providers] }));
    if (isSupabaseConfigured) await supabase.from('providers').insert([newProvider]);
  },

  updateProvider: async (id, updatedFields) => {
    set((state) => ({
      providers: state.providers.map(p => p.id === id ? { ...p, ...updatedFields } : p)
    }));
    if (isSupabaseConfigured) await supabase.from('providers').update(updatedFields).eq('id', id);
  },

  deleteProvider: async (id) => {
    set((state) => ({ providers: state.providers.filter(p => p.id !== id) }));
    if (isSupabaseConfigured) await supabase.from('providers').delete().eq('id', id);
  },

  addPurchase: async (purchase) => {
    const state = get();
    const newPurchase = { ...purchase, id: crypto.randomUUID() };
    
    // 1. Aumentar stock de los productos
    const affectedSkus: string[] = [];
    const updatedProducts = state.products.map(product => {
      const boughtItems = newPurchase.items.filter(item => item.sku === product.sku);
      if (boughtItems.length > 0) {
        affectedSkus.push(product.sku);
        const totalQuantityBought = boughtItems.reduce((sum, item) => sum + item.quantity, 0);
        // Si hay series nuevas, agregarlas (esto funciona mejor si las provee NuevaCompra)
        const newSeries = boughtItems.map(item => (item as any).serie).filter(Boolean) as string[];
        
        return {
          ...product,
          stock: product.stock + totalQuantityBought,
          series: [...product.series, ...newSeries]
        };
      }
      return product;
    });

    // 2. Crear transacción de Egreso
    const newTx = {
      id: crypto.randomUUID(),
      date: newPurchase.date,
      type: 'Egreso' as const,
      category: 'Compra Proveedor' as const,
      amount: newPurchase.total,
      description: `Compra a ${state.providers.find(p => p.id === newPurchase.providerId)?.name || 'Proveedor'}`,
      referenceId: newPurchase.id,
      paymentMethod: newPurchase.paymentMethod
    };

    set((state) => ({ 
      purchases: [newPurchase, ...state.purchases],
      products: updatedProducts,
      transactions: [newTx, ...state.transactions]
    }));

    if (isSupabaseConfigured) {
      await Promise.all([
        supabase.from('purchases').insert([newPurchase]),
        supabase.from('transactions').insert([newTx]),
        ...updatedProducts.filter(p => affectedSkus.includes(p.sku)).map(p => 
          supabase.from('products').update({ stock: p.stock, series: p.series }).eq('sku', p.sku)
        )
      ]);
    }
  },

  updatePurchase: async (id, updatedFields) => {
    set((state) => ({
      purchases: state.purchases.map(p => p.id === id ? { ...p, ...updatedFields } : p)
    }));
    if (isSupabaseConfigured) await supabase.from('purchases').update(updatedFields).eq('id', id);
  },

  deletePurchase: async (id) => {
    set((state) => ({ purchases: state.purchases.filter(p => p.id !== id) }));
    if (isSupabaseConfigured) await supabase.from('purchases').delete().eq('id', id);
  },

  updateSale: async (id, updatedFields) => {
    set((state) => ({
      sales: state.sales.map(s => s.id === id ? { ...s, ...updatedFields } : s)
    }));
    if (isSupabaseConfigured) await supabase.from('sales').update(updatedFields).eq('id', id);
  },

  deleteSale: async (id) => {
    set((state) => ({ sales: state.sales.filter(s => s.id !== id) }));
    if (isSupabaseConfigured) await supabase.from('sales').delete().eq('id', id);
  }
}), { name: 'mundo-outlet-storage' })
);

