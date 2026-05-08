import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../lib/format";
import { PackageSearch, Filter, Plus, Edit2, Check, X, Trash2, Box, BarChart3, AlertCircle, Download, FileUp, History, Boxes, FileDown, Printer, FileText } from "lucide-react";
import { useStore, Product } from "../store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { GeometricLoader } from "../components/GeometricLoader";
import { exportToExcel, importFromExcel } from "../lib/excel";
import { useSearchParams } from "react-router-dom";
import { TrazabilidadModal } from "../components/TrazabilidadModal";
import { LoteModal } from "../components/LoteModal";
import { downloadTemplate } from "../lib/templates";
import { generateThermalTicket, generateStickerLabel, generateMultipleStickerLabels, generateInventoryPDF } from "../lib/pdf";
import { format } from "date-fns";

export function Stock() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");

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
      const data = await importFromExcel(file);
      data.forEach((row: any) => {
        if (row.SKU && row.Modelo) {
          addProduct({
            sku: String(row.SKU),
            brand: row.Marca || '',
            model: row.Modelo,
            category: row.Categoria || 'Heladera',
            stock: Number(row.Stock) || 0,
            cost: Number(row.Costo) || 0,
            wholesalePrice: Number(row['Precio Mayorista']) || 0,
            retailPrice: Number(row['Precio Minorista']) || 0,
            series: [],
            status: 'Disponible'
          });
        }
      });
      alert(`Se han importado ${data.length} artículos exitosamente.`);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo Excel.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [searchParams] = useSearchParams();

  const handleAddNewProductClick = () => {
    setIsAdding(true);
    setNewProductForm({
      sku: 'ART-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      brand: '',
      model: '',
      category: 'Heladera',
      stock: 0,
      cost: 0,
      wholesalePrice: 0,
      retailPrice: 0,
      series: [],
      location: '',
      status: 'Disponible'
    });
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleAddNewProductClick();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    sku: '', brand: '', model: '', category: 'Heladera', stock: 0, cost: 0, wholesalePrice: 0, retailPrice: 0, series: [], location: ''
  });

  const filteredInventory = products.filter(item => {
    const matchesSearch = item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "Todas" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

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
      addProduct({ ...newProductForm, status: 'Disponible' } as Product);
      setIsAdding(false);
      setNewProductForm({
        sku: '', brand: '', model: '', category: 'Heladera', stock: 0, cost: 0, wholesalePrice: 0, retailPrice: 0, series: [], location: '', status: 'Disponible'
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
      <motion.div variants={itemAnim} className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:p-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#38bdf8]/60">
            <PackageSearch className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-70">Inventario</span>
          </div>
          <h1 className="text-xl font-display font-medium text-white tracking-[0.1em] uppercase" >Stock y Precios</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <PackageSearch className="w-4 h-4 text-[#38bdf8]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SKU, MARCA O MODELO..." 
              className="w-full pl-10 pr-4 py-2 crystal-input text-xs transition-all placeholder:text-[#38bdf8]/30 font-mono focus:ring-[#38bdf8]/50"
            />
          </div>

          <div className="relative">
             <Filter className="w-4 h-4 text-[#38bdf8]/50 absolute left-4 top-1/2 -translate-y-1/2" />
             <select
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
               className="w-full pl-10 pr-8 py-2 crystal-input text-[10px] transition-all appearance-none bg-transparent font-mono font-bold uppercase tracking-widest text-[#38bdf8] focus:ring-[#38bdf8]/50"
             >
              <option value="Todas" className="bg-[#09090b]">Todas</option>
              {['Heladera', 'Lavarropas', 'Microondas', 'Lavavajillas', 'Secarropas', 'Cocina', 'Pequeños'].map(cat => (
                <option key={cat} value={cat} className="bg-[#09090b]">{cat}</option>
              ))}
            </select>
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
            className="p-2.5 crystal-panel rounded-sm border border-[#38bdf8]/20 text-[#38bdf8]/60 hover:text-[#38bdf8] transition-all flex items-center gap-2 hover:bg-[#38bdf8]/10 hover:"
            title="Descargar Plantilla Excel"
          >
            <FileDown className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase hidden sm:inline tracking-widest">Plantilla</span>
          </button>

          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="p-2.5 crystal-panel rounded-sm border border-[#8b5cf6]/30 text-[#8b5cf6] hover:text-[#8b5cf6] transition-all flex items-center gap-2 hover:bg-[#8b5cf6]/10 hover:"
            title="Importar Excel"
          >
            {isImporting ? <GeometricLoader size={16} color="#8b5cf6" /> : <FileUp className="w-4 h-4" />}
            <span className="text-[10px] font-mono font-bold uppercase hidden sm:inline tracking-widest text-[#8b5cf6]">Importar</span>
          </button>

          <button 
            onClick={handleExport}
            className="p-2.5 crystal-panel rounded-sm border border-[#10b981]/30 text-[#10b981] hover:text-[#10b981] transition-all flex items-center gap-2 hover:bg-[#10b981]/10 hover:"
            title="Exportar Excel"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => generateInventoryPDF(products)}
            className="p-2.5 crystal-panel rounded-sm border border-red-500/30 text-red-500 hover:text-red-400 transition-all flex items-center gap-2 hover:bg-red-500/10 hover:"
            title="Generar Reporte PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase hidden sm:inline tracking-widest">PDF</span>
          </button>

          <button 
            onClick={() => setShowLoteModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 border border-[#bf00ff]/50 bg-[#bf00ff]/10 text-[#bf00ff] hover:bg-[#bf00ff]/20 rounded-sm font-mono font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95"
          >
            <Boxes className="w-4 h-4" />
            Registrar Lote
          </button>
          <button 
            onClick={handleAddNewProductClick}
            className="flex items-center gap-2 px-6 py-2.5 crystal-button whitespace-nowrap ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo Artículo
          </button>
        </div>
      </motion.div>

      {selectedSkus.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 md:mx-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-400 bg-blue-500/20 px-3 py-1 rounded-lg">
              {selectedSkus.length} seleccionados
            </span>
            <button 
              onClick={() => setSelectedSkus([])}
              className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
            >
              Deseleccionar todos
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const selectedProducts = products.filter(p => selectedSkus.includes(p.sku));
                generateMultipleStickerLabels(selectedProducts);
                setSelectedSkus([]);
              }}
              className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir Etiquetas
            </button>
          </div>
        </motion.div>
      )}

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
      <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4 md:p-6 relative z-10">
        {[
          { label: "Valor Inventario", value: formatCurrency(totalInversion), icon: BarChart3, color: "text-[#38bdf8]", bg: "bg-[#38bdf8]/10", shadow: "" },
          { label: "Total Unidades", value: totalStock.toString(), icon: Box, color: "text-[#10b981]", bg: "bg-[#10b981]/10", shadow: "" },
          { label: "Bajo Stock", value: products.filter(p => p.stock <= 2).length, icon: AlertCircle, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", shadow: "" },
          { label: "Productos", value: products.length, icon: PackageSearch, color: "text-[#f8fafc]/70", bg: "bg-[#09090b]", shadow: "" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("crystal-card p-4 md:p-6 border border-white/5 relative overflow-hidden", stat.shadow)}
          >
            <div className={cn("absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[40px]", stat.bg)} />
            <div className="flex items-start justify-between mb-2 relative z-10">
               <p className={cn("text-[9px] font-mono font-bold uppercase tracking-[0.2em]", stat.color)}>{stat.label}</p>
               <stat.icon className={cn("w-4 h-4 opacity-70", stat.color)} />
            </div>
            <p className="text-xl font-display font-medium text-white tracking-[0.1em] relative z-10" >{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-col gap-3 mt-6">
        <AnimatePresence mode="popLayout">
          {isAdding && (
            <motion.div 
              key="add-new-product-form"
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
                  type="text" 
                  placeholder="Ubicación"
                  title="Ubicación (Pasillo/Estante)"
                  value={newProductForm.location || ''} 
                  onChange={(e) => setNewProductForm({...newProductForm, location: e.target.value})}
                  className="crystal-input px-3 py-2 text-sm text-center w-24 uppercase"
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

              <div className="flex flex-col gap-2 w-full mt-4">
                <input 
                  type="text" 
                  placeholder="Descripción"
                  title="Descripción"
                  value={newProductForm.description || ''} 
                  onChange={(e) => setNewProductForm({...newProductForm, description: e.target.value})}
                  className="crystal-input px-3 py-2 text-sm w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0 mt-4">
                <button 
                  onClick={handleSaveNewProduct} 
                  disabled={!newProductForm.sku || !newProductForm.model}
                  className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
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
                  "crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300 relative overflow-hidden",
                  isEditing && "border-[#38bdf8]/50 bg-[#38bdf8]/10",
                  !isEditing && "hover:bg-white/5 hover:border-[#38bdf8]/20"
                )}
              >
                {/* HUD Scanning Line */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#38bdf8]/20 to-transparent animate-[pan_5s_infinite] pointer-events-none" />
                
                {/* Technical Node ID */}
                <div className="absolute top-0 right-10 px-2 py-0.5 bg-[#38bdf8]/5 border-x border-b border-[#38bdf8]/10 text-[6px] font-mono text-[#38bdf8]/40 z-20 hidden md:block">
                  NODE_STK_{item.sku.slice(-4)}
                </div>

                {/* Left: SKU/Brand */}
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedSkus.includes(item.sku)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSkus([...selectedSkus, item.sku]);
                      } else {
                        setSelectedSkus(selectedSkus.filter((sku) => sku !== item.sku));
                      }
                    }}
                    className="w-4 h-4 rounded-sm border-[#00f3ff]/50 bg-black/50 text-cyan-400 focus:ring-cyan-500/40"
                  />
                  <div className={cn(
                    "w-12 h-12 rounded-sm flex items-center justify-center border shrink-0 cursor-pointer overflow-hidden relative group/icon transition-all",
                    item.stock <= 2 ? "bg-[#ef4444]/10 border-[#ef4444]/50 text-[#ef4444]" : "bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8]"
                  )} onClick={() => {
                      if (selectedSkus.includes(item.sku)) {
                        setSelectedSkus(selectedSkus.filter(s => s !== item.sku));
                      } else {
                        setSelectedSkus([...selectedSkus, item.sku]);
                      }
                  }}>
                    <Box className="w-5 h-5 group-hover/icon:scale-110 transition-transform" />
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
                      <span className={cn("font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border w-fit mb-1",
                        item.stock <= 2 ? "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20" : "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/20"
                      )}>
                        {item.sku}
                      </span>
                      <span className="font-sans font-medium text-white text-[11px] uppercase tracking-[0.1em]" >{item.brand} {item.model}</span>
                      <span className="text-[9px] font-mono font-bold text-[#f8fafc]/60 uppercase tracking-[0.2em]">{item.category}</span>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex-1 flex flex-col md:flex-row gap-2 min-w-[200px]">
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-col md:flex-row gap-2 w-full">
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
                      <div className="flex flex-col gap-2 w-full mt-2">
                        <input 
                          type="text" 
                          placeholder="Descripción"
                          title="Descripción"
                          value={editForm.description || ''} 
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="crystal-input px-3 py-2 text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Right: Stats & Pricing */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 ml-auto">
                  {/* Stock */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono font-bold text-[#f8fafc]/50 uppercase tracking-[0.2em] mb-1">Stock</span>
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editForm.stock || 0} 
                        onChange={(e) => setEditForm({...editForm, stock: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm font-mono font-bold text-center w-20"
                      />
                    ) : (
                      <span className={cn(
                         "text-sm font-mono font-bold px-3 py-1 rounded-sm border",
                         item.stock <= 2 ? "bg-[#ef4444]/10 border-[#ef4444]/40 text-[#ef4444]" : "bg-[#38bdf8]/10 border-[#38bdf8]/20 text-[#38bdf8]"
                      )}>
                        {item.stock}
                      </span>
                    )}
                  </div>

                  {/* Ubicación */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono font-bold text-[#00c3cc]/70 uppercase tracking-[0.2em] mb-1">Ubicación</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.location || ''} 
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        className="crystal-input px-3 py-1 text-xs text-center w-20 uppercase"
                        placeholder="N/A"
                      />
                    ) : (
                      <span className="text-xs font-mono font-bold text-[#00c3cc]/80 tracking-widest bg-[#00c3cc]/5 px-2 py-1 rounded-sm border border-[#00c3cc]/20 min-w-[3rem] text-center">
                        {item.location || 'N/A'}
                      </span>
                    )}
                  </div>

                  {/* Costo */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono font-bold text-[#8b5cf6]/70 uppercase tracking-[0.2em] mb-1">Costo</span>
                    {/* ... omitted edit check for brevity mapping */}
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
                          className="crystal-input px-2 py-0.5 text-[10px] w-24 bg-[#09090b] text-white"
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
                          className="crystal-input px-3 py-1 text-sm font-mono font-bold text-right w-24 text-[#8b5cf6]"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-display font-medium text-[#8b5cf6] tracking-widest">{formatCurrency(item.cost)}</span>
                    )}
                  </div>

                  {/* Mayorista */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono font-bold text-[#00c3cc]/70 uppercase tracking-[0.2em] mb-1">Mayorista</span>
                    {isEditing ? (
                       <input 
                        type="number" 
                        value={editForm.wholesalePrice || 0} 
                        onChange={(e) => setEditForm({...editForm, wholesalePrice: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm font-mono font-bold text-right w-24 text-[#00c3cc]"
                      />
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-display font-medium text-[#00c3cc] tracking-widest">{formatCurrency(item.wholesalePrice)}</span>
                        {item.cost > 0 && (
                          <span className="text-[8px] font-mono text-[#00c3cc]/60">
                            +M: {(((item.wholesalePrice - item.cost) / item.cost) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Minorista */}
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono font-bold text-[#10b981]/70 uppercase tracking-[0.2em] mb-1">Minorista</span>
                    {isEditing ? (
                       <input 
                        type="number" 
                        value={editForm.retailPrice || 0} 
                        onChange={(e) => setEditForm({...editForm, retailPrice: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm font-mono font-bold text-right text-[#10b981] w-24"
                      />
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-display font-medium text-[#10b981] tracking-widest" >{formatCurrency(item.retailPrice)}</span>
                        {item.cost > 0 && (
                          <span className="text-[8px] font-mono text-[#10b981]/60">
                            +M: {(((item.retailPrice - item.cost) / item.cost) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 md:mt-0 ml-auto md:ml-4 shrink-0 flex flex-col justify-start">
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
                         onClick={() => generateStickerLabel(item)}
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
                
                {/* Series & Serials */}
                {(isEditing || (item.series && item.series.length > 0)) && (
                  <div className="w-full mt-4 pt-4 border-t border-white/5 md:pl-16 flex flex-col gap-2 relative">
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-mono font-bold text-[#f8fafc]/50 uppercase tracking-[0.2em] mb-1">
                         Números de Serie registrados ({isEditing ? (editForm.series?.length || 0) : (item.series?.length || 0)})
                       </span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {(isEditing ? editForm.series : item.series)?.map((sn, idx) => (
                        <div key={idx} className="flex items-center gap-1 crystal-input px-2 py-1 rounded-sm border border-blue-500/20 bg-blue-500/5 group/sn">
                          <span className="text-[10px] font-mono text-blue-400">{sn}</span>
                          {isEditing && (
                            <button 
                              onClick={() => {
                                const newSeries = (editForm.series || []).filter((_, i) => i !== idx);
                                setEditForm({ ...editForm, series: newSeries });
                              }}
                              className="text-red-500 hover:text-red-400 ml-1 opacity-50 hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <div className="flex items-center gap-2">
                           <input 
                              type="text" 
                              placeholder="Ej: SN-12345"
                              className="crystal-input px-2 py-1 text-[10px] font-mono w-32"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = e.currentTarget.value.trim();
                                  if (val) {
                                    setEditForm({ ...editForm, series: [...(editForm.series || []), val] });
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                           />
                           <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono hidden sm:inline">Presiona ENTER para agregar serie</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredInventory.length === 0 && !isAdding && (
           <div className="crystal-card p-12 flex flex-col items-center justify-center text-center mt-4">
             <div className="w-16 h-16 rounded-sm bg-[#38bdf8]/5 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]/50 mb-4">
               <Box className="w-8 h-8" />
             </div>
             <p className="text-[11px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em] leading-relaxed">
               NO SE REGISTRARON<br/>PRODUCTOS RECIENTES.
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
