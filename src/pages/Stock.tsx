import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../lib/format";
import { PackageSearch, Filter, Plus, Edit2, Check, X, Trash2, Box, BarChart3, AlertCircle, Download, FileUp, Sparkles, Loader2, History, Boxes, FileDown, Printer } from "lucide-react";
import { useStore, Product } from "../store/useStore";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { exportToExcel } from "../lib/excel";
import { useSearchParams } from "react-router-dom";
import { processFileWithGemini } from "../lib/gemini";
import { TrazabilidadModal } from "../components/TrazabilidadModal";
import { LoteModal } from "../components/LoteModal";
import { downloadTemplate } from "../lib/templates";
import { generateThermalTicket } from "../lib/pdf";
import { format } from "date-fns";

export function Stock() {
  const [searchQuery, setSearchQuery] = useState("");
  const { products, updateProduct, addProduct, deleteProduct, batches } = useStore();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tracedProduct, setTracedProduct] = useState<Product | null>(null);
  const [showLoteModal, setShowLoteModal] = useState(false);

  const handleExport = () => {
    exportToExcel(products, "Stock_Mundo_Outlet");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await processFileWithGemini(file, "Extrae la lista de productos de este archivo. Para cada producto necesito: SKU, Marca, Modelo, Categoría, Stock actual, Costo, Precio Mayorista y Precio Minorista.");
      alert(result.message);
      // Optional: force a refresh if needed, though useStore should auto-update if Gemini used tools
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo con la IA.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAdding(true);
    }
  }, [searchParams]);

  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    sku: '', brand: '', model: '', category: 'Heladera', stock: 0, cost: 0, wholesalePrice: 0, retailPrice: 0, series: []
  });

  const filteredInventory = products.filter(item => 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInversion = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  const handleEditClick = (product: Product) => {
    setEditingSku(product.sku);
    setEditForm(product);
  };

  const handleDelete = (sku: string) => {
    deleteProduct(sku);
    setEditingSku(null);
  };

  const handleCancelEdit = () => {
    setEditingSku(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingSku && editForm) {
      updateProduct(editingSku, editForm);
      setEditingSku(null);
      setEditForm({});
    }
  };

  const handleSaveNewProduct = () => {
    if (newProductForm.sku && newProductForm.model) {
      addProduct(newProductForm as Product);
      setIsAdding(false);
      setNewProductForm({
        sku: '', brand: '', model: '', category: 'Heladera', stock: 0, cost: 0, wholesalePrice: 0, retailPrice: 0, series: []
      });
    }
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 70, damping: 15 }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header & Controls */}
      <motion.div variants={itemAnim} className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#7BA4BD]">
            <PackageSearch className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Inventario</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Stock y Precios</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <PackageSearch className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SKU, marca o modelo..." 
              className="w-full pl-11 pr-4 py-3 crystal-input rounded-2xl text-sm transition-all placeholder:text-slate-500"
            />
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv,.xlsx,.xls,.pdf,image/*"
          />

          <button 
            onClick={() => downloadTemplate('inventory')}
            className="p-3 crystal-panel rounded-2xl text-slate-400 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
            title="Descargar Plantilla Excel"
          >
            <FileDown className="w-5 h-5" />
            <span className="text-xs font-bold uppercase hidden sm:inline">Plantilla</span>
          </button>

          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="p-3 crystal-panel rounded-2xl text-slate-400 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
            title="Importar con IA"
          >
            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase hidden sm:inline">Importar IA</span>
          </button>

          <button 
            onClick={handleExport}
            className="p-3 crystal-panel rounded-2xl text-slate-400 hover:text-white transition-all shadow-sm active:scale-95"
            title="Exportar Excel"
          >
            <Download className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setShowLoteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white hover:bg-purple-600 rounded-2xl font-bold text-sm shadow-xl shadow-purple-500/20 transition-all active:scale-95"
          >
            <Boxes className="w-5 h-5" />
            Registrar Lote
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#38bdf8] text-[#0A111E] hover:bg-[#0ea5e9] rounded-2xl font-bold text-sm shadow-xl shadow-[#38bdf8]/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nuevo Artículo
          </button>
        </div>
      </motion.div>

      {products.filter(p => p.stock <= 2 && p.stock > 0).length > 0 && (
         <motion.div variants={itemAnim} className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex items-center justify-between mx-4 md:mx-6">
            <div className="flex items-center gap-4 text-amber-400">
               <AlertCircle className="w-6 h-6" />
               <div>
                 <span className="text-sm font-bold block mb-1">Inventario Crítico</span>
                 <span className="text-xs text-amber-500/80">Hay {products.filter(p => p.stock <= 2 && p.stock > 0).length} productos a punto de agotarse (Stock {'<'} 3). Considera reponer.</span>
               </div>
            </div>
         </motion.div>
      )}

      {/* Stats */}
      <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4 md:p-6">
        {[
          { label: "Valor Inventario", value: formatCurrency(totalInversion), icon: BarChart3, color: "text-[#38bdf8]", bg: "bg-[#38bdf8]/10" },
          { label: "Total Unidades", value: totalStock.toString(), icon: Box, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Bajo Stock", value: products.filter(p => p.stock <= 2).length, icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Productos", value: products.length, icon: PackageSearch, color: "text-slate-400", bg: "bg-[#131B2F]" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="crystal-card p-4 md:p-6 border border-white/10"
          >
            <div className="flex items-start justify-between mb-2">
               <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", stat.color)}>{stat.label}</p>
               <stat.icon className={cn("w-4 h-4 opacity-30", stat.color)} />
            </div>
            <p className="text-3xl font-display font-bold text-white tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-col gap-3 mt-6">
        <AnimatePresence mode="popLayout">
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-blue-500/30 bg-blue-500/5 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400 shrink-0">
                  <Box className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="SKU"
                  value={newProductForm.sku} 
                  onChange={(e) => setNewProductForm({...newProductForm, sku: e.target.value})}
                  className="crystal-input px-4 py-2 text-xs font-mono font-bold w-full md:w-28 uppercase"
                />
              </div>

              <div className="flex-1 flex flex-col md:flex-row gap-2 min-w-[200px]">
                <input 
                  type="text" 
                  placeholder="Marca"
                  value={newProductForm.brand} 
                  onChange={(e) => setNewProductForm({...newProductForm, brand: e.target.value})}
                  className="crystal-input px-4 py-2 text-xs font-bold w-full"
                />
                <select 
                  value={newProductForm.category} 
                  onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value as Product['category']})}
                  className="crystal-input px-4 py-2 text-xs font-bold w-full md:w-32"
                >
                  {['Heladera', 'Lavarropas', 'Microondas', 'Lavavajillas', 'Secarropas', 'Cocina', 'Pequeños'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="Modelo"
                  value={newProductForm.model} 
                  onChange={(e) => setNewProductForm({...newProductForm, model: e.target.value})}
                  className="crystal-input px-4 py-2 text-xs font-bold w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="number" 
                  placeholder="Stock"
                  title="Stock"
                  value={newProductForm.stock || ''} 
                  onChange={(e) => setNewProductForm({...newProductForm, stock: Number(e.target.value)})}
                  className="crystal-input px-3 py-2 text-sm font-bold text-center w-20"
                />
                <input 
                  type="number" 
                  placeholder="Costo"
                  title="Costo"
                  value={newProductForm.cost || ''} 
                  onChange={(e) => setNewProductForm({...newProductForm, cost: Number(e.target.value)})}
                  className="crystal-input px-3 py-2 text-sm font-bold text-right w-24"
                />
                <input 
                  type="number"
                  placeholder="Mayorista"
                  title="Precio Mayorista"
                  value={newProductForm.wholesalePrice || ''} 
                  onChange={(e) => setNewProductForm({...newProductForm, wholesalePrice: Number(e.target.value)})}
                  className="crystal-input px-3 py-2 text-sm font-bold text-right w-24"
                />
                <input 
                  type="number" 
                  placeholder="Minorista"
                  title="Precio Minorista"
                  value={newProductForm.retailPrice || ''} 
                  onChange={(e) => setNewProductForm({...newProductForm, retailPrice: Number(e.target.value)})}
                  className="crystal-input px-3 py-2 text-sm font-bold text-right text-emerald-400 w-24"
                />
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button onClick={handleSaveNewProduct} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition-all">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-2.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {filteredInventory.map((item) => {
            const isEditing = editingSku === item.sku;

            return (
              <motion.div 
                layout
                key={item.sku} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300",
                  isEditing && "border-blue-500/30 bg-blue-500/5",
                  !isEditing && "hover:bg-white/5"
                )}
              >
                {/* Left: SKU/Brand */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
                    item.stock <= 2 ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  )}>
                    <Box className="w-5 h-5" />
                  </div>
                  
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.sku || ''} 
                      onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
                      className="crystal-input px-4 py-2 text-xs font-mono font-bold w-full md:w-28 uppercase"
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-fit mb-1">
                        {item.sku}
                      </span>
                      <span className="font-bold text-white text-[15px]">{item.brand} {item.model}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.category}</span>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex-1 flex flex-col md:flex-row gap-2 min-w-[200px]">
                    <input 
                      type="text" 
                      placeholder="Marca"
                      value={editForm.brand || ''} 
                      onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                      className="crystal-input px-4 py-2 text-xs font-bold w-full"
                    />
                    <select 
                      value={editForm.category || item.category} 
                      onChange={(e) => setEditForm({...editForm, category: e.target.value as Product['category']})}
                      className="crystal-input px-4 py-2 text-xs font-bold w-full md:w-32"
                    >
                      {['Heladera', 'Lavarropas', 'Microondas', 'Lavavajillas', 'Secarropas', 'Cocina', 'Pequeños'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Modelo"
                      value={editForm.model || ''} 
                      onChange={(e) => setEditForm({...editForm, model: e.target.value})}
                      className="crystal-input px-4 py-2 text-xs font-bold w-full"
                    />
                  </div>
                )}

                {/* Right: Stats & Pricing */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 ml-auto">
                  {/* Stock */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stock</span>
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editForm.stock || 0} 
                        onChange={(e) => setEditForm({...editForm, stock: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm font-bold text-center w-20"
                      />
                    ) : (
                      <span className={cn(
                         "text-sm font-bold px-3 py-1 rounded-full border",
                         item.stock <= 2 ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      )}>
                        {item.stock}
                      </span>
                    )}
                  </div>

                  {/* Costo */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Costo</span>
                    {isEditing ? (
                      <div className="flex flex-col gap-1">
                        <select
                          value={editForm.batchId || ""}
                          onChange={(e) => {
                            const selectedBatch = batches.find(b => b.id === e.target.value);
                            setEditForm({
                              ...editForm, 
                              batchId: e.target.value,
                              cost: selectedBatch ? selectedBatch.costPerUnit : editForm.cost
                            });
                          }}
                          className="crystal-input px-2 py-0.5 text-[10px] w-24"
                        >
                          <option value="">Sin Lote</option>
                          {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <input 
                          type="number" 
                          value={editForm.cost || 0} 
                          onChange={(e) => setEditForm({...editForm, cost: Number(e.target.value)})}
                          className="crystal-input px-3 py-1 text-sm font-bold text-right w-24"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{formatCurrency(item.cost)}</span>
                    )}
                  </div>

                  {/* Mayorista */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mayorista</span>
                    {isEditing ? (
                       <input 
                        type="number" 
                        value={editForm.wholesalePrice || 0} 
                        onChange={(e) => setEditForm({...editForm, wholesalePrice: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm font-bold text-right w-24"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-200">{formatCurrency(item.wholesalePrice)}</span>
                    )}
                  </div>

                  {/* Minorista */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Minorista</span>
                    {isEditing ? (
                       <input 
                        type="number" 
                        value={editForm.retailPrice || 0} 
                        onChange={(e) => setEditForm({...editForm, retailPrice: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm font-bold text-right text-emerald-400 w-24"
                      />
                    ) : (
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(item.retailPrice)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 md:mt-0 ml-auto md:ml-4 shrink-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                       <button onClick={handleSaveEdit} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition-all">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-2.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => generateThermalTicket({
                           title: 'Etiqueta de Stock',
                           code: item.sku,
                           status: item.status,
                           date: format(new Date(), "dd/MM/yyyy"),
                           details: `${item.brand} ${item.model} (${item.category})`
                         })}
                         className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-full transition-all" 
                         title="Imprimir Etiqueta"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => setTracedProduct(item)} className="p-2 text-slate-400 hover:text-purple-400 hover:bg-white/5 rounded-full transition-all" title="Ver Historial de Unidades">
                        <History className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-full transition-all" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.sku)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-all" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredInventory.length === 0 && !isAdding && (
           <div className="crystal-card p-12 flex flex-col items-center justify-center text-center mt-4">
             <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
               <Box className="w-8 h-8" />
             </div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
               No se registraron productos recientes.
             </p>
           </div>
        )}
      </div>
      {tracedProduct && (
        <TrazabilidadModal product={tracedProduct} onClose={() => setTracedProduct(null)} />
      )}
      {showLoteModal && (
        <LoteModal onClose={() => setShowLoteModal(false)} />
      )}
    </motion.div>
  );
}
