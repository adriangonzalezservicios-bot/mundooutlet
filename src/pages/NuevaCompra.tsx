import { useState, KeyboardEvent } from "react";
import { formatCurrency } from "../lib/format";
import { Search, ShoppingCart, Check, ArrowRight, Truck, Banknote, ArrowLeft, Package, Trash2, Tag } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore, SaleItem, Product } from "../store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { generateId } from "../lib/id";

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
        cartId: generateId(),
        id: generateId(), // for a new item or existing match ID
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
        cartId: generateId(),
        id: generateId(),
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
      <motion.div variants={itemAnim} className="flex items-center gap-4 relative z-10 md:p-6 pb-0">
        <button onClick={onBack} className="p-2 border border-white/5 bg-white/5 rounded-sm text-[#38bdf8]/50 hover:text-[#38bdf8] hover:border-[#38bdf8]/30 transition-all hover:bg-[#38bdf8]/10 hover:">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-medium text-white tracking-[0.1em] uppercase" >Nueva Compra</h1>
          <div className="flex items-center gap-2 text-[#8b5cf6]/60 mt-1">
             <Package className="w-3 h-3" />
             <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] opacity-70">Ingreso de stock y registro de remito</span>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6 md:px-6 relative z-10">
        <motion.div variants={itemAnim} className="lg:col-span-2 space-y-6">
          {/* Product Search */}
          <section className="crystal-card border border-[#38bdf8]/20 rounded-sm p-6 relative overflow-hidden bg-[#09090b]">
             <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-[#38bdf8]/5 rounded-full blur-[40px] pointer-events-none" />
            <h2 className="text-[10px] font-mono font-bold text-[#f8fafc]/60 mb-4 uppercase tracking-[0.2em]">Buscar Componente</h2>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38bdf8]/50" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ESCANEA SKU, SERIE O MODELO..." 
                  className="w-full crystal-input text-xs font-mono transition-all placeholder:text-[#38bdf8]/30 focus:ring-[#38bdf8]/50 rounded-sm pl-11 pr-4 py-2.5"
                />
              </div>
              <button 
                onClick={handleSearch}
                className="px-6 py-2.5 crystal-panel bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 rounded-sm text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-[#38bdf8]/20 hover: transition-all active:scale-95"
              >
                Buscar
              </button>
            </div>

            {activeProduct && (
              <div className="mt-6 p-4 border border-[#10b981]/20 rounded-sm bg-[#10b981]/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-display font-medium text-white tracking-[0.1em] uppercase" >{activeProduct.brand} {activeProduct.model}</h3>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 rounded-sm uppercase tracking-[0.2em]">SKU: {activeProduct.sku}</span>
                       <span className="text-[9px] font-mono font-bold text-[#8b5cf6]/70 uppercase tracking-[0.2em]">Stock Total: {activeProduct.stock}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono font-bold text-[#f8fafc]/40 uppercase tracking-[0.2em] mb-1">Costo Unit</p>
                    <p className="text-2xl font-display font-medium text-[#10b981]" >{formatCurrency(activeProduct.cost)}</p>
                  </div>
                </div>

                {activeProduct.series && activeProduct.series.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                      <p className="text-[10px] font-mono font-bold text-[#f8fafc]/60 uppercase tracking-[0.2em]">Seleccionar Lotes</p>
                      <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="PEGAR LOTES..." 
                            className="crystal-input px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:ring-[#38bdf8]/50 placeholder:text-[#38bdf8]/30 w-32 sm:w-40 border border-white/10 rounded-sm"
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
                            className="px-3 py-1.5 bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 rounded-sm text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap active:scale-95"
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
                            "py-1.5 px-3 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest border transition-all text-left flex justify-between items-center group/btn",
                            selectedSeries.has(serie) ? "bg-[#10b981]/10 border-[#10b981]/50 text-[#10b981]" : "bg-white/5 border-white/5 text-[#f8fafc]/50 hover:border-[#38bdf8]/30 hover:text-[#38bdf8]"
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
                  className="w-full py-2.5 crystal-panel bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-sm text-xs font-mono font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#10b981]/20 transition-all active:scale-95 mt-4"
                >
                  <Package className="w-4 h-4" />
                  Agregar al Detalle
                </button>
              </div>
            )}
          </section>

          {/* Cart Table */}
          <section className="crystal-card border border-white/5 rounded-sm p-6 bg-[#09090b]">
            <h2 className="text-[10px] font-mono font-bold text-[#f8fafc]/60 mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
              <div className="p-1.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] rounded-sm">
                 <ShoppingCart className="w-4 h-4" />
              </div>
              Buffer de Ingreso
            </h2>
            
            {cart.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#8b5cf6]/5 text-[#8b5cf6]/70 border-b border-[#8b5cf6]/20">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-mono font-bold uppercase tracking-[0.2em]">Componente</th>
                      <th className="px-4 py-3 text-[9px] font-mono font-bold uppercase tracking-[0.2em]">Lote / ID</th>
                      <th className="px-4 py-3 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-right">Valor</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.tr 
                          key={item.cartId} 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-white">
                            <p className="text-xs font-mono font-bold tracking-widest uppercase">{item.name}</p>
                            <span className="text-[10px] text-[#38bdf8]/60 font-mono mt-1 opacity-70">SKU: {item.sku}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] text-[#8b5cf6]/60 font-mono uppercase tracking-[0.2em]">{item.serie || 'GENERIC'}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-[#10b981] font-mono font-bold" >
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => removeFromCart(item.cartId)}
                              className="p-1.5 text-[#ef4444]/50 hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-sm transition-colors border border-transparent hover:border-[#ef4444]/30"
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
              <div className="py-12 md:py-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5 relative">
                   <div className="absolute inset-0 rounded-full animate-pulse blur-[10px] bg-[#8b5cf6]/5" />
                   <Package className="w-8 h-8 text-[#8b5cf6]/30 relative z-10" />
                </div>
                <p className="text-[10px] font-mono font-bold text-[#f8fafc]/40 tracking-[0.3em] uppercase">Memoria de ingresos vacía</p>
              </div>
            )}
          </section>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemAnim} className="lg:col-span-1">
          <div className="crystal-card border border-[#8b5cf6]/20 rounded-sm p-6 sticky top-6 bg-[#09090b] relative overflow-hidden group">
            <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 bg-[#8b5cf6]/5 rounded-full blur-[30px] pointer-events-none" />
            <h2 className="text-[10px] font-mono font-bold text-[#f8fafc]/60 mb-8 uppercase tracking-[0.2em] border-b border-[#8b5cf6]/20 pb-4">Consolidado de Red</h2>
            
            <div className="space-y-6 mb-8 relative z-10">
              <div>
                <label className="text-[9px] font-mono font-bold text-[#f8fafc]/40 uppercase tracking-[0.2em] mb-2 block ml-1">Estación Origen (Proveedor)</label>
                <select 
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full crystal-input rounded-sm px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#8b5cf6]/40 bg-[#09090b]"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="text-[9px] font-mono font-bold text-[#f8fafc]/40 uppercase tracking-[0.2em] mb-2 block ml-1">Tasas de Red / Envío</label>
                 <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b5cf6] font-bold text-xs">$</span>
                    <input 
                      type="number"
                      value={shippingCost || ''}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                      className="w-full crystal-input rounded-sm pl-8 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#8b5cf6]/40"
                    />
                 </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-[#f8fafc]/40 uppercase tracking-[0.2em] mb-2 block ml-1">Protocolo Transaccional</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full crystal-input rounded-sm px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#8b5cf6]/40 bg-[#0A111E]"
                >
                  <option value="Transferencia">Transferencia Cuántica</option>
                  <option value="Efectivo">Créditos Físicos</option>
                  <option value="Tarjeta">Tarjeta Credencial</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#8b5cf6]/20 pt-6 space-y-4 mb-8 relative z-10">
              <div className="flex justify-between text-[10px] font-mono font-bold text-[#f8fafc]/50 tracking-[0.2em] uppercase">
                <span>Sub-Bloque</span>
                <span className="text-[#38bdf8]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono font-bold text-[#f8fafc]/50 tracking-[0.2em] uppercase">
                <span>Tránsito</span>
                <span className="text-[#8b5cf6]">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-2xl font-display font-medium text-white pt-4 border-t border-white/5">
                <span className="text-sm self-end pb-1 text-[#f8fafc]/60 uppercase tracking-[0.1em]">Total</span>
                <span className="text-[#10b981]" >{formatCurrency(total)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 crystal-panel bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/30 rounded-sm text-xs font-mono font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-[#8b5cf6]/20 active:scale-95 disabled:opacity-30 disabled:hover:bg-[#8b5cf6]/10 relative z-10"
            >
              Confirmar Operación
              <Check className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
