import { useState, KeyboardEvent } from "react";
import { formatCurrency } from "../lib/format";
import { Search, ShoppingCart, Check, ArrowRight, Truck, Banknote, ArrowLeft, Package, Trash2, Tag } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore, SaleItem, Product } from "../store/useStore";
import { motion, AnimatePresence } from "motion/react";

interface CartItem extends SaleItem {
  cartId: string;
  cost: number;
}

export function NuevaCompra({ onBack }: { onBack: () => void }) {
  const { products, providers, addPurchase } = useStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [selectedProvider, setSelectedProvider] = useState<string>(providers[0]?.id || "");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Transferencia");

  const handleSearch = () => {
    const query = searchQuery.toUpperCase();
    const product = products.find(p => p.sku === query || p.series.includes(query) || p.model.toUpperCase().includes(query));
    if (product) {
      setActiveProduct(product);
      setSelectedSeries(new Set());
    } else {
      setActiveProduct(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleSerie = (serie: string) => {
    const newSet = new Set(selectedSeries);
    if (newSet.has(serie)) newSet.delete(serie);
    else newSet.add(serie);
    setSelectedSeries(newSet);
  };

  const addProductToCart = () => {
    if (!activeProduct) return;

    if (activeProduct.series && activeProduct.series.length > 0) {
      if (selectedSeries.size === 0) return;
      const newItems = Array.from(selectedSeries).map((serie: string) => ({
        cartId: crypto.randomUUID(),
        id: crypto.randomUUID(), // for a new item or existing match ID
        sku: activeProduct.sku,
        serie,
        name: `${activeProduct.brand} ${activeProduct.model}`,
        price: activeProduct.cost,
        cost: activeProduct.cost,
        quantity: 1
      }));
      setCart([...cart, ...newItems]);
    } else {
      const newItem: CartItem = {
        cartId: crypto.randomUUID(),
        id: crypto.randomUUID(),
        sku: activeProduct.sku,
        name: `${activeProduct.brand} ${activeProduct.model}`,
        price: activeProduct.cost,
        cost: activeProduct.cost,
        quantity: 1
      };
      setCart([...cart, newItem]);
    }
    
    setActiveProduct(null);
    setSelectedSeries(new Set());
    setSearchQuery("");
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal + Number(shippingCost);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    addPurchase({
      date: new Date().toISOString(),
      providerId: selectedProvider,
      items: cart.map(({ cartId, ...rest }) => rest),
      subtotal,
      shippingCost: Number(shippingCost),
      total,
      paymentMethod,
      status: 'Completada'
    });
    onBack();
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={itemAnim} className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 border border-white/5 rounded-full text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Compra</h1>
          <p className="text-sm text-slate-400">Ingreso de stock y registro de remito</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={itemAnim} className="lg:col-span-2 space-y-6">
          {/* Product Search */}
          <section className="crystal-card border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Buscar Producto</h2>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escanea SKU, Serie o Modelo..." 
                  className="w-full crystal-input text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#7BA4BD]/40"
                />
              </div>
              <button 
                onClick={handleSearch}
                className="px-6 py-2 bg-slate-100 hover:bg-zinc-700 text-white rounded-full text-sm font-medium transition-colors"
              >
                Buscar
              </button>
            </div>

            {activeProduct && (
              <div className="mt-6 p-4 border border-white/5 rounded-xl bg-[#1E293B]/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{activeProduct.brand} {activeProduct.model}</h3>
                    <p className="text-sm text-slate-500">{activeProduct.sku} - Stock actual: {activeProduct.stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Costo Unitario</p>
                    <p className="text-xl font-bold text-[#7BA4BD]">{formatCurrency(activeProduct.cost)}</p>
                  </div>
                </div>

                {activeProduct.series && activeProduct.series.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <p className="text-xs font-medium text-slate-400">Seleccionar Series</p>
                      <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Pegar lotes..." 
                            className="crystal-input px-2 py-1 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#7BA4BD]/50 placeholder:text-slate-500 w-32 sm:w-40 border border-white/10 rounded-lg"
                            onChange={() => {}}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData("text");
                              if(!pasted) return;
                              const seriesList = pasted.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
                              const newSet = new Set(selectedSeries);
                              seriesList.forEach(serie => {
                                if (activeProduct?.series?.includes(serie)) {
                                  newSet.add(serie);
                                }
                              });
                              setSelectedSeries(newSet);
                              e.currentTarget.value = "";
                            }}
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!activeProduct?.series) return;
                              const newSet = new Set(selectedSeries);
                              activeProduct.series.forEach(serie => {
                                newSet.add(serie);
                              });
                              setSelectedSeries(newSet);
                            }}
                            className="px-2 py-1 bg-[#7BA4BD]/10 text-[#7BA4BD] hover:bg-[#7BA4BD]/20 border border-[#7BA4BD]/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                          >
                            Todos
                          </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {activeProduct.series.map(serie => (
                        <button
                          key={serie}
                          onClick={() => toggleSerie(serie)}
                          className={cn(
                            "py-1.5 px-3 rounded-lg text-xs font-mono border transition-all text-left flex justify-between items-center",
                            selectedSeries.has(serie) ? "bg-[#7BA4BD]/10 border-[#7BA4BD] text-[#7BA4BD]" : "crystal-input border-white/5 text-slate-400"
                          )}
                        >
                          {serie}
                          {selectedSeries.has(serie) && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={addProductToCart}
                  className="w-full py-2.5 bg-[#7BA4BD] text-white hover:bg-[#8AB4CC] hover:bg-zinc-200 border border-transparent rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Agregar al Detalle
                </button>
              </div>
            )}
          </section>

          {/* Cart Table */}
          <section className="crystal-card border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-slate-400" />
              Detalle de Ingreso
            </h2>
            
            {cart.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#1E293B]/50 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Identificación</th>
                      <th className="px-4 py-3 font-medium text-right">Costo</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.tr 
                          key={item.cartId} 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td className="px-4 py-3 text-white">
                            <p>{item.name}</p>
                            <span className="text-xs text-slate-500 font-mono">{item.sku}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400 font-mono">{item.serie || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-white">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => removeFromCart(item.cartId)}
                              className="p-1.5 text-slate-500 hover:text-[#ECA99E] hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 md:py-12 text-center flex flex-col items-center">
                <Package className="w-12 h-12 text-zinc-700 mb-3" />
                <p className="text-slate-500 text-sm">El detalle está vacío</p>
              </div>
            )}
          </section>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemAnim} className="lg:col-span-1">
          <div className="crystal-card border border-white/10 rounded-3xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-6">Resumen</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Proveedor</label>
                <select 
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full crystal-input rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7BA4BD]/40"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="text-xs font-medium text-slate-400 mb-1.5 block">Envío / Conceptos</label>
                 <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input 
                      type="number"
                      value={shippingCost || ''}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                      className="w-full crystal-input rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#7BA4BD]/40"
                    />
                 </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Facturación</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full crystal-input rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7BA4BD]/40"
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Envío</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white pt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 bg-[#7BA4BD] hover:bg-[#8AB4CC] disabled:opacity-50 disabled:bg-[#7BA4BD] text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Confirmar Compra
              <Check className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
