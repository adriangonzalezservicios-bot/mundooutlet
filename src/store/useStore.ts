import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { isFirebaseConfigured, db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs, writeBatch, runTransaction } from 'firebase/firestore';
import { get, set as idbSet, del } from 'idb-keyval';
import { generateId } from '../lib/id';
import { toast } from 'sonner';

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

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
  description?: string;
  location?: string; // Pasillo/Estante
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

export interface UIConfig {
  primaryColor: string;
  secondaryColor: string;
  theme: 'cyber' | 'minimal' | 'glass';
  layoutDensity: 'compact' | 'standard';
  customCss?: string;
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
  lastSyncTime: string | null;
  isSyncing: boolean;
  uiConfig: UIConfig;
  
  // Actions
  setLastSyncTime: (time: string | null) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  updateUIConfig: (config: Partial<UIConfig>) => void;
  addBatch: (batch: Omit<Batch, 'id' | 'costPerUnit'>) => void;
  addWorkshopExpense: (expense: Omit<WorkshopExpense, 'id'>) => void;
  registerSale: (saleData: {
    productId: string;
    clientId: string;
    salePrice: number;
    paymentMethod: string;
  }) => Promise<{ profit: number; margin: number; totalCost: number }>;
  
  // Backup & Restore
  exportBackup: () => string;
  importBackup: (jsonData: string) => Promise<boolean>;
  
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
  clearAllData: () => Promise<void>;
  fetchData: () => Promise<void>;
}

const initialProducts: Product[] = [];

const initialClients: Client[] = [];

const initialProviders: Provider[] = [];

const initialWorkshopJobs: WorkshopJob[] = [];

const initialPurchases: Purchase[] = [];

const initialSales: Sale[] = [];

const initialTransactions: Transaction[] = [];

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
  lastSyncTime: null,
  isSyncing: false,
  uiConfig: {
    primaryColor: '#38bdf8',
    secondaryColor: '#ef4444',
    theme: 'cyber',
    layoutDensity: 'standard'
  },

  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  updateUIConfig: (config) => set((state) => ({ 
    uiConfig: { ...state.uiConfig, ...config } 
  })),



  addBatch: async (batchData) => {
    const id = generateId();
    const costPerUnit = batchData.totalCost / batchData.quantity;
    const newBatch: Batch = { ...batchData, id, costPerUnit };
    
    set((state) => ({ batches: [newBatch, ...state.batches] }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await setDoc(doc(db, 'batches', (newBatch as any).sku || newBatch.id), newBatch); } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'batches'); }
      if (error) console.error('Error saving batch to Firebase:', error);
    }
  },

  addWorkshopExpense: async (expenseData) => {
    const newExpense: WorkshopExpense = { ...expenseData, id: generateId() };
    set((state) => ({ workshopExpenses: [newExpense, ...state.workshopExpenses] }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await setDoc(doc(db, 'workshop_expenses', (newExpense as any).sku || newExpense.id), newExpense); } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'workshop_expenses'); }
      if (error) console.error('Error saving expense to Firebase:', error);
    }
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
    const saleId = generateId();
    const newSale: Sale = {
      id: saleId,
      date: new Date().toISOString(),
      clientId,
      items: [{
        id: generateId(),
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
    const transactionId = generateId();
    const newTx: Transaction = {
      id: transactionId,
      date: new Date().toISOString(),
      type: 'Ingreso',
      category: 'Venta',
      amount: salePrice,
      description: `Venta de ${product.sku} (Margen: ${margin.toFixed(1)}%)`,
      referenceId: saleId,
      paymentMethod
    };

    set((state) => ({
      sales: [newSale, ...state.sales],
      products: state.products.map(p => p.sku === productId ? { ...p, status: 'Vendido' } : p),
      transactions: [newTx, ...state.transactions]
    }));

    if (isFirebaseConfigured) {
      const results = await Promise.all([
        setDoc(doc(db, 'sales', (newSale as any).sku || newSale.id), newSale).then(() => ({ error: null })).catch(error => { handleFirestoreError(error, OperationType.WRITE, 'batch_operation'); return { error }; }),
        updateDoc(doc(db, 'products', productId), { status: 'Vendido' }).then(() => ({ error: null })).catch(error => { handleFirestoreError(error, OperationType.WRITE, 'batch_operation'); return { error }; }),
        setDoc(doc(db, 'transactions', (newTx as any).sku || newTx.id), newTx).then(() => ({ error: null })).catch(error => { handleFirestoreError(error, OperationType.WRITE, 'batch_operation'); return { error }; })
      ]);
      results.forEach(res => {
        if (res.error) console.error('Error syncing registerSale with Firebase:', res.error);
      });
    }

    return { profit, margin, totalCost };
  },

  fetchData: async () => {
    if (!isFirebaseConfigured || !auth.currentUser) {
      console.log('Skipping sync: Firebase not configured or user not logged in.');
      return;
    }
    
    set({ isSyncing: true });
    try {
      console.log('Starting cloud sync for user:', auth.currentUser.uid);
      const collectionsToFetch = [
        'products', 'clients', 'sales', 'transactions', 'batches', 
        'workshop_expenses', 'providers', 'workshop_jobs', 'purchases'
      ];
      
      const results = await Promise.all(
        collectionsToFetch.map(colName => 
          getDocs(collection(db, colName))
            .then(snapshot => ({ colName, data: snapshot.docs.map(d => d.data()), error: null }))
            .catch(error => {
              console.error(`Error fetching ${colName}:`, error);
              return { colName, data: null, error };
            })
        )
      );

      const updates: Partial<AppState> = {};
      const keyMap: Record<string, keyof AppState> = {
        'products': 'products',
        'clients': 'clients',
        'sales': 'sales',
        'transactions': 'transactions',
        'batches': 'batches',
        'workshop_expenses': 'workshopExpenses',
        'providers': 'providers',
        'workshop_jobs': 'workshopJobs',
        'purchases': 'purchases'
      };
      
      let hasValidData = false;
      
      // Determine if the entire cloud database is empty across ALL syncing collections
      const isCloudEmpty = results.every(res => !res.data || res.data.length === 0);

      if (isCloudEmpty) {
        console.log('Cloud is empty. Assuming fresh setup, keeping local state and pushing to cloud.');
        
        // Push local state to cloud to initialize it
        const state = get();
        try {
          for (const res of results) {
            const key = keyMap[res.colName];
            if (key) {
              const localItems: any[] = state[key] as any[] || [];
              for (let i = 0; i < localItems.length; i += 400) {
                const batchChunk = localItems.slice(i, i + 400);
                if (batchChunk.length > 0) {
                  const dbBatch = writeBatch(db);
                  batchChunk.forEach(item => {
                    const docId = item.sku || item.id;
                    if (docId) {
                      dbBatch.set(doc(db, res.colName, docId), item);
                    }
                  });
                  await dbBatch.commit();
                }
              }
            }
          }
          console.log('Successfully initialized cloud with local data.');
        } catch (pushErr) {
          console.error('Error auto-initializing cloud database:', pushErr);
        }
      } else {
        results.forEach((res) => {
          if (!res.error && res.data) {
            const key = keyMap[res.colName];
            if (key) {
              (updates as any)[key] = res.data;
              hasValidData = true;
            }
          }
        });
      }
      
      if (hasValidData) {
        set(updates);
        console.log('Sync from Cloud complete. Data merged from server.');
      } else {
        console.log('No valid data fetched from Cloud. Keeping local state.');
      }
      set({ lastSyncTime: new Date().toISOString() });
    } catch (error) {
      console.error('Critical sync error:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  addSale: async (sale) => {
    const state = get();
    const newSale = { ...sale, id: generateId() };
    const transactionId = generateId();
    
    // 1. Local Update (optimistic)
    const affectedSkus: string[] = [];
    const updatedProducts = state.products.map(product => {
      const soldItems = newSale.items.filter(item => item.sku === product.sku);
      if (soldItems.length > 0) {
        affectedSkus.push(product.sku);
        const totalQuantitySold = soldItems.reduce((sum, item) => sum + item.quantity, 0);
        const soldSeries = soldItems.map(item => item.serie).filter(Boolean) as string[];
        
        return {
          ...product,
          status: (product.stock - totalQuantitySold <= 0 ? 'Vendido' : 'Disponible') as ProductStatus,
          stock: Math.max(0, product.stock - totalQuantitySold),
          series: product.series.filter(s => !soldSeries.includes(s))
        };
      }
      return product;
    });

    set((state) => ({
      sales: [newSale, ...state.sales],
      products: updatedProducts,
      transactions: [{
        id: transactionId,
        date: newSale.date,
        type: 'Ingreso',
        category: 'Venta',
        amount: newSale.total,
        description: `Venta a ${state.clients.find(c => c.id === newSale.clientId)?.name || 'Cliente'}`,
        referenceId: newSale.id,
        paymentMethod: newSale.paymentMethod
      }, ...state.transactions]
    }));

    // 2. Cloud Transactional Update
    if (isFirebaseConfigured) {
      try {
        await runTransaction(db, async (txn) => {
          // Verify stock for each item in the cloud
          for (const item of newSale.items) {
            const productRef = doc(db, 'products', item.sku);
            const productDoc = await txn.get(productRef);
            if (!productDoc.exists()) throw new Error(`Producto ${item.sku} no existe en la nube.`);
            
            const cloudProduct = productDoc.data() as Product;
            if (cloudProduct.stock < item.quantity) {
              throw new Error(`Stock insuficiente para ${item.sku} en la nube (Disponible: ${cloudProduct.stock})`);
            }

            const soldSeries = newSale.items.filter(i => i.sku === item.sku).map(i => i.serie).filter(Boolean) as string[];
            
            txn.update(productRef, {
              stock: cloudProduct.stock - item.quantity,
              status: cloudProduct.stock - item.quantity <= 0 ? 'Vendido' : cloudProduct.status,
              series: cloudProduct.series.filter(s => !soldSeries.includes(s))
            });
          }

          // Register Sale and Transaction
          txn.set(doc(db, 'sales', newSale.id), newSale);
          txn.set(doc(db, 'transactions', transactionId), {
            id: transactionId,
            date: newSale.date,
            type: 'Ingreso',
            category: 'Venta',
            amount: newSale.total,
            description: `Venta a ${state.clients.find(c => c.id === newSale.clientId)?.name || 'Cliente'}`,
            referenceId: newSale.id,
            paymentMethod: newSale.paymentMethod
          });
        });
      } catch (error) {
        console.error('Sale Transaction Failed:', error);
        // We might want to revert local state here in a real production app
        handleFirestoreError(error, OperationType.WRITE, 'sales_transaction');
      }
    }
  },

  updateProduct: async (sku, updatedFields) => {
    set((state) => ({
      products: state.products.map(p => p.sku === sku ? { ...p, ...updatedFields } : p)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'products', sku), updatedFields); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'products'); }
      if (error) console.error('Error updating product in Firebase:', error);
    }
  },

  addClient: async (client) => {
    const newClient = { ...client, id: generateId() };
    set((state) => ({ clients: [newClient, ...state.clients] }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await setDoc(doc(db, 'clients', (newClient as any).sku || newClient.id), newClient); } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'clients'); }
      if (error) console.error('Error adding client to Firebase:', error);
    }
  },

  updateClient: async (id, updatedFields) => {
    set((state) => ({
      clients: state.clients.map(c => c.id === id ? { ...c, ...updatedFields } : c)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'clients', id), updatedFields); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'clients'); }
      if (error) console.error('Error updating client in Firebase:', error);
    }
  },

  deleteClient: async (id) => {
    set((state) => ({
      clients: state.clients.filter(c => c.id !== id)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await deleteDoc(doc(db, 'clients', id)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'clients'); }
      if (error) console.error('Error deleting client from Firebase:', error);
    }
  },

  addProduct: async (product) => {
    set((state) => ({ products: [product, ...state.products] }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await setDoc(doc(db, 'products', product.sku), product); } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'products'); }
      if (error) console.error('Error adding product to Firebase:', error);
    }
  },

  deleteProduct: async (sku) => {
    set((state) => ({ products: state.products.filter(p => p.sku !== sku) }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await deleteDoc(doc(db, 'products', sku)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'products'); }
      if (error) console.error('Error deleting product from Firebase:', error);
    }
  },

  addTransaction: async (transaction) => {
    const newTx = { ...transaction, id: generateId() };
    set((state) => ({ transactions: [newTx, ...state.transactions] }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await setDoc(doc(db, 'transactions', (newTx as any).sku || newTx.id), newTx); } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'transactions'); }
      if (error) console.error('Error adding transaction to Firebase:', error);
    }
  },

  updateTransaction: async (id, updatedFields) => {
    set((state) => ({
      transactions: state.transactions.map(t => t.id === id ? { ...t, ...updatedFields } : t)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'transactions', id), updatedFields); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'transactions'); }
      if (error) console.error('Error updating transaction in Firebase:', error);
    }
  },

  deleteTransaction: async (id) => {
    set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await deleteDoc(doc(db, 'transactions', id)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'transactions'); }
      if (error) console.error('Error deleting transaction from Firebase:', error);
    }
  },

  addWorkshopJob: async (job) => {
    const newJob = { ...job, id: generateId() };
    set((state) => ({ workshopJobs: [newJob, ...state.workshopJobs] }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await setDoc(doc(db, 'workshop_jobs', (newJob as any).sku || newJob.id), newJob); } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'workshop_jobs'); }
      if (error) console.error('Error adding workshop job to Firebase:', error);
    }
  },

  updateWorkshopJob: async (id, updatedFields) => {
    set((state) => ({
      workshopJobs: state.workshopJobs.map(j => j.id === id ? { ...j, ...updatedFields } : j)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'workshop_jobs', id), updatedFields); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'workshop_jobs'); }
      if (error) console.error('Error updating workshop job in Firebase:', error);
    }
  },

  updateWorkshopJobStatus: async (id, status) => {
    set((state) => ({
      workshopJobs: state.workshopJobs.map(j => j.id === id ? { ...j, status } : j)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'workshop_jobs', id), { status }); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'workshop_jobs'); }
      if (error) console.error('Error updating workshop job status in Firebase:', error);
    }
  },

  deleteWorkshopJob: async (id) => {
    set((state) => ({ workshopJobs: state.workshopJobs.filter(j => j.id !== id) }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await deleteDoc(doc(db, 'workshop_jobs', id)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'workshop_jobs'); }
      if (error) console.error('Error deleting workshop job from Firebase:', error);
    }
  },

  addProvider: async (provider) => {
    const newProvider = { ...provider, id: generateId() };
    set((state) => ({ providers: [newProvider, ...state.providers] }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await setDoc(doc(db, 'providers', (newProvider as any).sku || newProvider.id), newProvider); } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'providers'); }
      if (error) console.error('Error adding provider to Firebase:', error);
    }
  },

  updateProvider: async (id, updatedFields) => {
    set((state) => ({
      providers: state.providers.map(p => p.id === id ? { ...p, ...updatedFields } : p)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'providers', id), updatedFields); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'providers'); }
      if (error) console.error('Error updating provider in Firebase:', error);
    }
  },

  deleteProvider: async (id) => {
    set((state) => ({ providers: state.providers.filter(p => p.id !== id) }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await deleteDoc(doc(db, 'providers', id)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'providers'); }
      if (error) console.error('Error deleting provider from Firebase:', error);
    }
  },

  addPurchase: async (purchase) => {
    const state = get();
    const newPurchase = { ...purchase, id: generateId() };
    const transactionId = generateId();
    
    // 1. Local Update
    const updatedProducts = state.products.map(product => {
      const boughtItems = newPurchase.items.filter(item => item.sku === product.sku);
      if (boughtItems.length > 0) {
        const totalQuantityBought = boughtItems.reduce((sum, item) => sum + item.quantity, 0);
        const newSeries = boughtItems.map(item => (item as any).serie).filter(Boolean) as string[];
        
        return {
          ...product,
          stock: product.stock + totalQuantityBought,
          series: [...product.series, ...newSeries],
          status: 'Disponible' as ProductStatus
        };
      }
      return product;
    });

    const newTx = {
      id: transactionId,
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

    // 2. Cloud Update
    if (isFirebaseConfigured) {
      try {
        await runTransaction(db, async (txn) => {
          for (const product of updatedProducts) {
             const productRef = doc(db, 'products', product.sku);
             const productDoc = await txn.get(productRef);
             if (productDoc.exists()) {
               txn.update(productRef, { stock: product.stock, series: product.series, status: 'Disponible' });
             } else {
               // If it doesn't exist (new item perhaps?) we set it
               txn.set(productRef, product);
             }
          }
          txn.set(doc(db, 'purchases', newPurchase.id), newPurchase);
          txn.set(doc(db, 'transactions', transactionId), newTx);
        });
      } catch (error) {
        console.error('Purchase Transaction Failed:', error);
        handleFirestoreError(error, OperationType.WRITE, 'purchase_transaction');
      }
    }
  },

  updatePurchase: async (id, updatedFields) => {
    set((state) => ({
      purchases: state.purchases.map(p => p.id === id ? { ...p, ...updatedFields } : p)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'purchases', id), updatedFields); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'purchases'); }
      if (error) console.error('Error updating purchase in Firebase:', error);
    }
  },

  deletePurchase: async (id) => {
    set((state) => ({ purchases: state.purchases.filter(p => p.id !== id) }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await deleteDoc(doc(db, 'purchases', id)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'purchases'); }
      if (error) console.error('Error deleting purchase from Firebase:', error);
    }
  },

  updateSale: async (id, updatedFields) => {
    set((state) => ({
      sales: state.sales.map(s => s.id === id ? { ...s, ...updatedFields } : s)
    }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await updateDoc(doc(db, 'sales', id), updatedFields); } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'sales'); }
      if (error) console.error('Error updating sale in Firebase:', error);
    }
  },

  deleteSale: async (id) => {
    set((state) => ({ sales: state.sales.filter(s => s.id !== id) }));
    if (isFirebaseConfigured) {
      let error = null;
      try { await deleteDoc(doc(db, 'sales', id)); } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'sales'); }
      if (error) console.error('Error deleting sale from Firebase:', error);
    }
  },

  exportBackup: () => {
    const state = get();
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        products: state.products,
        clients: state.clients,
        providers: state.providers,
        sales: state.sales,
        purchases: state.purchases,
        transactions: state.transactions,
        workshopJobs: state.workshopJobs,
        workshopExpenses: state.workshopExpenses,
        batches: state.batches
      }
    };
    return JSON.stringify(backupData, null, 2);
  },

  importBackup: async (jsonData: string) => {
    try {
      const backup = JSON.parse(jsonData);
      if (!backup.data) throw new Error("Formato de backup inválido.");
      
      const { data } = backup;
      
      // Update local state
      set({
        products: data.products || [],
        clients: data.clients || [],
        providers: data.providers || [],
        sales: data.sales || [],
        purchases: data.purchases || [],
        transactions: data.transactions || [],
        workshopJobs: data.workshopJobs || [],
        workshopExpenses: data.workshopExpenses || [],
        batches: data.batches || []
      });

      // Sync to Firebase if configured
      if (isFirebaseConfigured) {
        toast.info("Iniciando restauración en la nube...");
        
        try {
          const keyMapToCol: Record<string, string> = {
            'products': 'products',
            'clients': 'clients',
            'sales': 'sales',
            'transactions': 'transactions',
            'batches': 'batches',
            'workshopExpenses': 'workshop_expenses',
            'providers': 'providers',
            'workshopJobs': 'workshop_jobs',
            'purchases': 'purchases'
          };
          
          for (const [stateKey, colName] of Object.entries(keyMapToCol)) {
            const items = data[stateKey as keyof typeof data] || [];
            
            // To be completely safe and avoid huge batches, we can do batches of 400
            for (let i = 0; i < items.length; i += 400) {
              const batchChunk = items.slice(i, i + 400);
              const batch = writeBatch(db);
              batchChunk.forEach((item: any) => {
                const docId = item.sku || item.id;
                if (docId) {
                  batch.set(doc(db, colName, docId), item);
                }
              });
              await batch.commit();
            }
          }
          toast.success("Restauración en la nube completada");
        } catch (fbError) {
          console.error("Error syncing backup to cloud:", fbError);
          toast.error("Error restaurando en la nube.");
        }
      }
      
      return true;
    } catch (error) {
      console.error('Backup Import Failed:', error);
      return false;
    }
  },

  clearAllData: async () => {
    const keys: (keyof AppState)[] = ['products', 'clients', 'sales', 'transactions', 'batches', 'workshopExpenses', 'providers', 'workshopJobs', 'purchases'];
    const state = get();

    // 1. Clear local state
    const emptyState: any = {};
    keys.forEach(key => {
      emptyState[key] = [];
    });
    set(emptyState);

    // 2. Clear Firebase if configured
    if (isFirebaseConfigured) {
      console.log('Clearing all data from Firebase...');
      try {
        for (const key of keys) {
          const snapshot = await getDocs(collection(db, key as string));
          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`Cleared collection: ${key}`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'clear_all_data');
      }
    }
  }
}), { 
  name: 'mundo-outlet-storage-v2',
  storage: createJSONStorage(() => storage)
})
);

