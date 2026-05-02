import { useState, KeyboardEvent } from "react";
import { formatCurrency } from "../lib/format";
import { Search, ShoppingCart, Check, ArrowLeft, Package, Trash2, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore, SaleItem, Product } from "../store/useStore";
import { motion, AnimatePresence } from "motion/react";

interface CartItem extends SaleItem {
  cartId: string;
}

export function NuevaVenta({ onBack }: { onBack: () => void }) {
  const { products, clients, addSale } = useStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [batchQuantity, setBatchQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showProductList, setShowProductList] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<string>(clients[0]?.id || "");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");

  const handleSearch = (query: string) => {
    const q = query.toUpperCase();
    const product = products.find(p => p.sku === q || p.series.includes(q) || p.model.toUpperCase().includes(q));
    if (product) {
      setActiveProduct(product);
      setSelectedSeries(new Set());
      setBatchQuantity(1);
      setSearchQuery("");
      setShowProductList(false);
    }
  };

  const selectProduct = (product: Product) => {
    setActiveProduct(product);
    setSelectedSeries(new Set());
    setBatchQuantity(1);
    setSearchQuery("");
    setShowProductList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(searchQuery);
  };

  const toggleSerie = (serie: string) => {
    const newSet = new Set(selectedSeries);
    if (newSet.has(serie)) newSet.delete(serie);
    else newSet.add(serie);
    setSelectedSeries(newSet);
  };

  const getAvailableStock = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    if (!product) return 0;
    const inCart = cart.filter(item => item.sku === sku).reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0, product.stock - inCart);
  };

  const addProductToCart = () => {
    if (!activeProduct) return;

    // Check if adding more is possible
    if (getAvailableStock(activeProduct.sku) <= 0 && (!activeProduct.series || activeProduct.series.length === 0)) return;

    const currentClient = clients.find(c => c.id === selectedClient);
    const applicablePrice = currentClient?.type === 'Mayorista' ? activeProduct.wholesalePrice : activeProduct.retailPrice;

    if (activeProduct.series && activeProduct.series.length > 0) {
      if (selectedSeries.size === 0) return;
      
      const newItems: CartItem[] = Array.from(selectedSeries).map((serie: string) => ({
        cartId: crypto.randomUUID(),
        id: crypto.randomUUID(),
        sku: activeProduct.sku,
        serie,
        name: `${activeProduct.brand} ${activeProduct.model}`,
        price: applicablePrice,
        quantity: 1
      }));
      setCart([...cart, ...newItems]);
    } else {
      // Check if product already in cart without serie
      const existingIndex = cart.findIndex(item => item.sku === activeProduct.sku && !item.serie);
      if (existingIndex >= 0) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += batchQuantity;
        setCart(newCart);
      } else {
        const newItem: CartItem = {
          cartId: crypto.randomUUID(),
          id: crypto.randomUUID(),
          sku: activeProduct.sku,
          name: `${activeProduct.brand} ${activeProduct.model}`,
          price: applicablePrice,
          quantity: batchQuantity
        };
        setCart([...cart, newItem]);
      }
    }
    
    setActiveProduct(null);
    setSelectedSeries(new Set());
    setBatchQuantity(1);
    setSearchQuery("");
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const product = products.find(p => p.sku === item.sku);
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        
        // If it has series, quantity must be 1 generally, but if not:
        if (item.serie && newQty > 1) return item;
        
        // Check stock
        if (product && newQty > product.stock) return item;
        
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + Number(shippingCost);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    addSale({
      date: new Date().toISOString(),
      clientId: selectedClient,
      items: cart.map(({ cartId, ...rest }) => rest),
      subtotal,
      shippingCost: Number(shippingCost),
      total,
      paymentMethod,
      status: 'Completada'
    });
    onBack();
  };

  const filteredProducts = products.filter(p => 
    p.sku.toUpperCase().includes(searchQuery.toUpperCase()) || 
    p.model.toUpperCase().includes(searchQuery.toUpperCase()) ||
    p.brand.toUpperCase().includes(searchQuery.toUpperCase())
  ).filter(p => !activeProduct || p.sku !== activeProduct.sku);

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 15
      }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 md:p-8 w-full max-w-[1400px] mx-auto pb-20"
      onClick={() => setShowProductList(false)}
    >
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack} 
          className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#7BA4BD]">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Operación de Salida</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-white tracking-tight">Nueva Venta</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:p-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.section variants={itemAnim} className="crystal-card p-4 md:p-8 border border-white/10 shadow-sm">
            <h2 className="text-2xl font-display font-bold text-white mb-8 tracking-tight flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 text-[#7BA4BD] rounded-2xl flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              Selección de Artículos
            </h2>
            <div className="flex gap-4 relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowProductList(true);
                  }}
                  onFocus={() => setShowProductList(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar por SKU, Modelo o Serie..." 
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#7BA4BD]/20 shadow-inner overflow-hidden placeholder:text-slate-600"
                />
                
                <AnimatePresence>
                  {showProductList && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-3 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-50 max-h-80 overflow-y-auto p-2"
                    >
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(p => (
                          <button
                            key={p.sku}
                            onClick={() => selectProduct(p)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 rounded-2xl transition-all text-left group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-[#7BA4BD]/20 group-hover:text-[#7BA4BD] transition-colors border border-white/5">
                                <Package className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{p.brand} {p.model}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "text-[10px] font-bold uppercase tracking-widest mb-1",
                                p.stock > 0 ? "text-[#A4BE9D]" : "text-[#ECA99E]"
                              )}>Stock: {p.stock}</p>
                              <p className="text-base font-bold text-white">{formatCurrency(p.retailPrice)}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <Search className="w-8 h-8 text-slate-600" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sin coincidencias</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => handleSearch(searchQuery)}
                className="px-4 md:px-8 py-4 bg-[#7BA4BD] text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#8AB4CC] transition-all active:scale-95 shadow-xl shadow-[#7BA4BD]/20"
              >
                Buscar
              </button>
            </div>

            <AnimatePresence>
              {activeProduct && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="mt-8 p-4 md:p-8 border border-white/10 rounded-[2rem] bg-white/3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#7BA4BD]/5 rounded-bl-[100px] pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex gap-5">
                      <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-sm">
                        <Package className="w-8 h-8 text-[#7BA4BD]" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-display font-bold text-white tracking-tight">{activeProduct.brand} {activeProduct.model}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5 uppercase tracking-[0.2em]">{activeProduct.sku}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm",
                            activeProduct.stock > 0 ? "text-[#A4BE9D] bg-[#A4BE9D]/10 border border-[#A4BE9D]/20 shadow-sm" : "text-[#ECA99E] bg-[#ECA99E]/10 border border-[#ECA99E]/20"
                          )}>
                            {activeProduct.stock} Disponibles
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Precio sugerido</p>
                      <p className="text-4xl font-display font-bold text-[#A4BE9D] tracking-tight">
                        {formatCurrency(clients.find(c => c.id === selectedClient)?.type === 'Mayorista' ? activeProduct.wholesalePrice : activeProduct.retailPrice)}
                      </p>
                    </div>
                  </div>

                  {activeProduct.series && activeProduct.series.length > 0 && (
                    <div className="mb-8 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 ml-1 gap-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] shrink-0">Selección de Unidades Serializadas</p>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Pegar lotes..." 
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#7BA4BD]/50 placeholder:text-slate-600 w-32 sm:w-40"
                            onChange={() => {}}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData("text");
                              if(!pasted) return;
                              const seriesList = pasted.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
                              const newSet = new Set(selectedSeries);
                              seriesList.forEach(serie => {
                                if (activeProduct?.series?.includes(serie) && !cart.some(c => c.serie === serie)) {
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
                                if (!cart.some(c => c.serie === serie)) {
                                  newSet.add(serie);
                                }
                              });
                              setSelectedSeries(newSet);
                            }}
                            className="px-3 py-1.5 bg-[#7BA4BD]/10 text-[#7BA4BD] hover:bg-[#7BA4BD]/20 border border-[#7BA4BD]/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                          >
                            Todos
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {activeProduct.series.map(serie => (
                          <button
                            key={serie}
                            disabled={cart.some(c => c.serie === serie)}
                            onClick={() => toggleSerie(serie)}
                            className={cn(
                              "py-3.5 px-4 rounded-xl text-xs font-bold border transition-all flex flex-col gap-1 items-start group relative overflow-hidden backdrop-blur-md",
                              cart.some(c => c.serie === serie) ? "opacity-20 cursor-not-allowed bg-white/5 border-transparent" :
                              selectedSeries.has(serie) ? "bg-[#7BA4BD] border-[#7BA4BD] text-white shadow-lg active:scale-95" : "bg-white/5 border-white/5 text-slate-400 hover:border-[#7BA4BD]/50 hover:bg-white/10 shadow-sm"
                            )}
                          >
                            <span className="text-[9px] uppercase tracking-widest opacity-60">S/N</span>
                            <span className="font-mono text-xs">{serie}</span>
                            {selectedSeries.has(serie) && (
                              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#1E293B] text-[#7BA4BD] flex items-center justify-center shadow-lg">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!activeProduct.series || activeProduct.series.length === 0) && activeProduct.stock > 0 && (
                    <div className="mb-6 relative z-10">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2 ml-1">Lote / Cantidad</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <button 
                            onClick={() => setBatchQuantity(Math.max(1, batchQuantity - 1))}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all font-bold text-xl active:scale-95 shrink-0"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={getAvailableStock(activeProduct.sku)}
                            value={batchQuantity}
                            onChange={(e) => setBatchQuantity(Math.min(getAvailableStock(activeProduct.sku), Math.max(1, Number(e.target.value))))}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#7BA4BD]/50"
                          />
                          <button 
                            onClick={() => setBatchQuantity(Math.min(getAvailableStock(activeProduct.sku), batchQuantity + 1))}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all font-bold text-xl active:scale-95 shrink-0"
                          >
                            +
                          </button>
                        </div>
                        <div className="px-4 py-3 bg-[#7BA4BD]/10 border border-[#7BA4BD]/20 rounded-2xl flex flex-col justify-center text-[#7BA4BD] sm:min-w-[120px] text-center">
                          <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">Subtotal Lote</span>
                          <span className="font-bold text-sm">
                            {formatCurrency(batchQuantity * (clients.find(c => c.id === selectedClient)?.type === 'Mayorista' ? activeProduct.wholesalePrice : activeProduct.retailPrice))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={addProductToCart}
                    disabled={(activeProduct.series?.length > 0 && selectedSeries.size === 0) || activeProduct.stock === 0}
                    className="w-full py-4.5 bg-white/10 hover:bg-[#1E293B] border border-white/10 text-white disabled:opacity-20 disabled:cursor-not-allowed rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] relative z-10 shadow-2xl"
                  >
                    <Plus className="w-5 h-5" />
                    Confirmar Selección
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <motion.section variants={itemAnim} className="crystal-card p-4 md:p-8 border border-white/10 shadow-sm overflow-hidden min-h-[400px]">
            <h2 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-4 tracking-tight">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                 <ShoppingCart className="w-5 h-5 text-[#7BA4BD]" />
              </div>
              Detalle de Comprobante
            </h2>
            
            {cart.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2">
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-[0.2em] text-[10px]">Artículos</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-[0.2em] text-[10px] text-center">Unidades</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-[0.2em] text-[10px] text-right">Unitario</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-[0.2em] text-[10px] text-right">Subtotal</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-[0.2em] text-[10px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.tr 
                          key={item.cartId} 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="hover:bg-[#1E293B] transition-colors group"
                        >
                          <td className="px-6 py-6">
                            <div className="flex flex-col gap-1">
                              <p className="font-bold text-white text-base">{item.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.sku}</span>
                                {item.serie && (
                                  <span className="text-[9px] font-bold bg-[#ECA99E]/10 text-[#ECA99E] px-2 py-0.5 rounded uppercase tracking-widest">
                                    SN: {item.serie}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center justify-center gap-4">
                              <button 
                                onClick={() => updateQuantity(item.cartId, -1)}
                                disabled={item.quantity <= 1 || !!item.serie}
                                className="w-8 h-8 rounded-xl border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E293B] hover:shadow-sm disabled:opacity-20 transition-all active:scale-90"
                              >
                                -
                              </button>
                              <span className="font-display font-bold text-white text-lg w-6 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.cartId, 1)}
                                disabled={!!item.serie || item.quantity >= (products.find(p => p.sku === item.sku)?.stock || 0)}
                                className="w-8 h-8 rounded-xl border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E293B] hover:shadow-sm disabled:opacity-20 transition-all active:scale-90"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="text-slate-400 font-bold">{formatCurrency(item.price)}</span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="font-display font-bold text-white text-base">{formatCurrency(item.price * item.quantity)}</span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <button 
                              onClick={() => removeFromCart(item.cartId)}
                              className="p-3 text-slate-300 hover:text-[#ECA99E] hover:bg-[#ECA99E]/5 rounded-2xl transition-all active:scale-90"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-[#1E293B] rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">El carrito está vacío</h4>
                <p className="text-xs text-slate-300 mt-2 max-w-[200px] mx-auto italic font-medium">Inicia la carga de artículos buscando un SKU o Modelo arriba.</p>
              </div>
            )}
          </motion.section>
        </div>

        <motion.div variants={itemAnim} className="lg:col-span-1">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 md:p-8 shadow-2xl sticky top-10 space-y-10 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            
            <h2 className="text-3xl font-display font-bold text-white tracking-tight relative z-10">Resumen Final</h2>
            
            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1">Cliente Receptor</label>
                <div className="relative">
                  <select 
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#7BA4BD]/50 appearance-none transition-all cursor-pointer shadow-inner"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="text-white">{c.name} ({c.type})</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    <Check className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1">Cargos / Flete / Otros</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                  <input 
                    type="number"
                    value={shippingCost || ''}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#7BA4BD]/50 transition-all shadow-inner placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1">Medio de Pago</label>
                <div className="relative">
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#7BA4BD]/50 appearance-none transition-all cursor-pointer shadow-inner"
                  >
                    <option value="Efectivo" className="text-white">Efectivo Billete</option>
                    <option value="Transferencia" className="text-white">Transferencia Bancaria</option>
                    <option value="Mercadopago" className="text-white">Mercadopago / CVU</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    <Check className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-white/5 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                <span>Subtotal Artículos</span>
                <span className="text-base text-slate-300">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                <span>Adicionales</span>
                <span className="text-base text-slate-300">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="pt-8 flex flex-col gap-2 text-right">
                <p className="text-[11px] font-bold text-[#ECA99E] uppercase tracking-[0.4em]">Total a Percibir</p>
                <p className="text-6xl font-display font-bold text-[#A4BE9D] tabular-nums tracking-tighter drop-shadow-2xl">{formatCurrency(total)}</p>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-6 primary-cta disabled:opacity-30 disabled:cursor-not-allowed group relative z-10 text-sm tracking-[0.2em] flex items-center justify-center gap-4 uppercase"
            >
              Finalizar Venta
              <Check className="w-6 h-6 transition-transform group-hover:scale-125" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
