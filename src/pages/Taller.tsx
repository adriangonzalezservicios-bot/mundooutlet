import { useState, useRef } from "react";
import { Wrench, CheckCircle2, Clock, Plus, Filter, Search, Calendar, Edit2, Trash2, Check, X, Download, Package, User, Hash, AlertTriangle, ChevronRight, Sparkles, Loader2, Printer } from "lucide-react";
import { formatCurrency } from "../lib/format";
import { useStore, WorkshopJob, Product } from "../store/useStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { exportToExcel, importFromExcel } from "../lib/excel";
import { generateThermalTicket } from "../lib/pdf";

export function Taller() {
  const { workshopJobs, clients, products, updateWorkshopJob, addWorkshopJob, deleteWorkshopJob } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  
  const [editForm, setEditForm] = useState<Partial<WorkshopJob>>({});
  const [addForm, setAddForm] = useState<Partial<WorkshopJob>>({
    status: 'Pendiente',
    cost: 0,
    clientId: '',
    device: '',
    sku: '',
    serie: '',
    issue: '',
    notes: ''
  });

  const handleExport = () => {
    const data = workshopJobs.map(j => ({
      ID: j.id.slice(0, 8),
      Fecha_Ingreso: format(new Date(j.dateIn), "dd/MM/yyyy HH:mm"),
      Cliente: clients.find(c => c.id === j.clientId)?.name || 'N/A',
      Equipo: j.device,
      SKU: j.sku || '',
      Serie: j.serie || '',
      Falla: j.issue,
      Estado: j.status,
      Costo: j.cost,
      Notas: j.notes || ''
    }));
    exportToExcel(data, "Taller_Mundo_Outlet");
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
        if (row.Equipo && row.Falla) {
          addWorkshopJob({
            device: row.Equipo,
            issue: row.Falla,
            cost: Number(row.Costo) || 0,
            status: row.Estado || 'Pendiente',
            clientId: row.ClienteId || '',
            dateIn: new Date().toISOString(),
            sku: row.SKU,
            serie: row.Serie,
            notes: row.Notas
          });
        }
      });
      alert(`Se han importado ${data.length} ingresos técnicos exitosamente.`);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo Excel.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredJobs = workshopJobs.filter(job => {
    const client = clients.find(c => c.id === job.clientId);
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch = (
      client?.name.toLowerCase().includes(searchStr) ||
      job.device.toLowerCase().includes(searchStr) ||
      job.issue.toLowerCase().includes(searchStr) ||
      job.id.toLowerCase().includes(searchStr) ||
      (job.sku && job.sku.toLowerCase().includes(searchStr)) ||
      (job.serie && job.serie.toLowerCase().includes(searchStr))
    );
    const matchesStatus = statusFilter === "Todos" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: "En Espera", count: workshopJobs.filter(j => j.status === 'Pendiente').length, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "En Proceso", count: workshopJobs.filter(j => ['En diagnóstico', 'Reparando'].includes(j.status)).length, color: "text-[#7BA4BD]", bg: "bg-[#7BA4BD]/10" },
    { label: "Falta Repuesto", count: workshopJobs.filter(j => j.status === 'Esperando repuesto').length, color: "text-[#ECA99E]", bg: "bg-[#ECA99E]/10" },
    { label: "Listos", count: workshopJobs.filter(j => j.status === 'Completado').length, color: "text-[#A4BE9D]", bg: "bg-[#A4BE9D]/10" },
  ];

  const handleEdit = (job: WorkshopJob) => {
    setEditingId(job.id);
    setEditForm(job);
    setIsCreating(false);
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      updateWorkshopJob(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCreate = () => {
    if (!addForm.clientId || (!addForm.device && !selectedProduct) || !addForm.issue) {
      alert("Por favor complete los campos obligatorios (Cliente, Equipo y Falla)");
      return;
    }
    
    addWorkshopJob({
      ...addForm,
      device: selectedProduct ? `${selectedProduct.brand} ${selectedProduct.model}` : addForm.device,
      sku: selectedProduct ? selectedProduct.sku : addForm.sku,
      dateIn: new Date().toISOString()
    } as Omit<WorkshopJob, 'id'>);
    
    setIsCreating(false);
    setAddForm({ status: 'Pendiente', cost: 0, clientId: '', device: '', sku: '', serie: '', issue: '', notes: '' });
    setSelectedProduct(null);
  };

  const handleDelete = (id: string) => {
    deleteWorkshopJob(id);
  };

  const selectStockItem = (p: Product) => {
    setSelectedProduct(p);
    setAddForm({ ...addForm, device: `${p.brand} ${p.model}`, sku: p.sku });
    setShowStockDropdown(false);
  };

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
      className="space-y-8 max-w-[1400px] mx-auto pb-20"
    >
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#7BA4BD]">
            <Wrench className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Service Center</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-white tracking-tight">Gestión de Taller</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Orden, cliente, modelo..." 
              className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium w-full sm:w-[300px] shadow-sm focus:ring-2 focus:ring-[#7BA4BD]/20 outline-none transition-all text-white placeholder:text-slate-600"
            />
          </div>

          <div className="relative flex-grow sm:flex-grow-0 min-w-[200px]">
            <Filter className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium w-full shadow-sm focus:ring-2 focus:ring-[#7BA4BD]/20 outline-none transition-all text-white appearance-none"
            >
              <option value="Todos" className="bg-[#0A111E]">Todos los estados</option>
              <option value="Pendiente" className="bg-[#0A111E]">Pendiente</option>
              <option value="En diagnóstico" className="bg-[#0A111E]">En diagnóstico</option>
              <option value="Esperando repuesto" className="bg-[#0A111E]">Esperando repuesto</option>
              <option value="Reparando" className="bg-[#0A111E]">Reparando</option>
              <option value="Completado" className="bg-[#0A111E]">Completado</option>
              <option value="Entregado" className="bg-[#0A111E]">Entregado</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-sm active:scale-95"
            title="Exportar Reporte"
          >
            <Download className="w-5 h-5" />
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv,.xlsx,.xls,.pdf,image/*,.txt"
          />

          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[#7BA4BD] hover:bg-[#7BA4BD]/10 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Importar Excel"
          >
            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 rotate-180" />}
          </button>

          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl font-bold text-sm backdrop-blur-md transition-all active:scale-95 shadow-xl shadow-black/20"
          >
            <Plus className="w-5 h-5" />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4 md:p-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemAnim}
            className="crystal-card p-4 md:p-6 border border-white/10"
          >
             <div className="flex items-center justify-between mb-2">
                 <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", stat.color)}>{stat.label}</p>
                 <div className={cn("w-2 h-2 rounded-full animate-pulse", stat.color.replace('text-', 'bg-'))} />
             </div>
             <p className="text-3xl font-display font-bold text-white tracking-tight">{stat.count}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8">
        {/* Main List */}
        <div className="xl:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {isCreating && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="crystal-card p-4 md:p-8 border-2 border-[#7BA4BD]/20 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7BA4BD]/5 rounded-bl-[100px] pointer-events-none" />
                
                <h3 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 text-[#7BA4BD] rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Plus className="w-6 h-6" />
                  </div>
                  Formulario de Ingreso Técnico
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:p-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Cliente Responsable</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                          value={addForm.clientId}
                          onChange={e => setAddForm({...addForm, clientId: e.target.value})}
                          className="w-full crystal-input rounded-xl pl-10 pr-4 py-3 text-sm font-bold appearance-none"
                        >
                          <option value="" className="bg-slate-900">Seleccionar Cliente</option>
                          {clients.map(c => <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Equipo / Modelo (en stock)</label>
                      <button 
                        onClick={() => setShowStockDropdown(!showStockDropdown)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white flex items-center justify-between hover:bg-white/10 transition-colors backdrop-blur-md"
                      >
                        <span className={selectedProduct ? "text-white" : "text-slate-500"}>
                          {selectedProduct ? `${selectedProduct.brand} ${selectedProduct.model}` : "Vincular con Stock (Opcional)"}
                        </span>
                        <ChevronRight className={cn("w-4 h-4 text-slate-500 transition-transform", showStockDropdown && "rotate-90")} />
                      </button>

                      <AnimatePresence>
                        {showStockDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 crystal-card z-50 max-h-60 overflow-y-auto"
                          >
                            <div className="p-2 border-b border-slate-50">
                              <p className="text-[10px] font-bold text-slate-400 p-2 uppercase">Productos Disponibles</p>
                            </div>
                            {products.map(p => (
                              <button
                                key={p.sku}
                                onClick={() => selectStockItem(p)}
                                className="w-full p-4 flex items-center justify-between hover:bg-[#1E293B] text-left border-b border-slate-50 last:border-0 grow"
                              >
                                <div>
                                  <p className="text-sm font-bold text-white">{p.brand} {p.model}</p>
                                  <p className="text-[10px] text-slate-400 uppercase">{p.sku}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-slate-500">Stock: {p.stock}</p>
                                </div>
                              </button>
                            ))}
                            <button 
                              onClick={() => { setSelectedProduct(null); setShowStockDropdown(false); }}
                              className="w-full p-3 text-xs font-bold text-[#ECA99E] hover:bg-red-50 transition-colors"
                            >
                              Limpiar selección
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {!selectedProduct && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Manual: Dispositivo / Modelo</label>
                        <div className="relative">
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Ej: Heladera Samsung RT32"
                            value={addForm.device}
                            onChange={e => setAddForm({...addForm, device: e.target.value})}
                            className="w-full crystal-input border-transparent rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-[#7BA4BD]/20"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Falla Reportada</label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea 
                          placeholder="Describe el problema..."
                          value={addForm.issue}
                          onChange={e => setAddForm({...addForm, issue: e.target.value})}
                          className="w-full crystal-input border-transparent rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-white h-28 focus:ring-2 focus:ring-[#7BA4BD]/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Costo Presupuestado</label>
                        <input 
                          type="number"
                          value={addForm.cost || 0}
                          onChange={e => setAddForm({...addForm, cost: Number(e.target.value)})}
                          className="w-full crystal-input border-transparent rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-[#7BA4BD]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado Inicial</label>
                        <select
                          value={addForm.status}
                          onChange={e => setAddForm({...addForm, status: e.target.value as any})}
                          className="w-full crystal-input border-transparent rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-[#7BA4BD]/20"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En diagnóstico">En diagnóstico</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setIsCreating(false);
                      setAddForm({ status: 'Pendiente', cost: 0, clientId: '', device: '', issue: '', notes: '' });
                      setSelectedProduct(null);
                    }}
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-8 py-3 primary-cta text-sm transition-all"
                  >
                    Finalizar Ingreso
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const client = clients.find(c => c.id === job.clientId);
                const isEditing = editingId === job.id;
                
                return (
                  <motion.div 
                    layout
                    variants={itemAnim}
                    key={job.id}
                    className={cn(
                      "group crystal-card border-white/10 p-4 md:p-6 rounded-[2rem] transition-all hover:shadow-md relative overflow-hidden",
                      isEditing && "border-[#7BA4BD]/50 ring-4 ring-[#7BA4BD]/5"
                    )}
                  >
                    <div className="flex flex-col md:flex-row gap-4 md:p-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                              job.status === 'Completado' ? "bg-[#A4BE9D]/10 text-[#A4BE9D]" :
                              job.status === 'Entregado' ? "bg-[#1E293B] text-slate-400" :
                              job.status === 'Esperando repuesto' ? "bg-[#ECA99E]/10 text-[#ECA99E]" : "bg-[#7BA4BD]/10 text-[#7BA4BD]"
                            )}>
                              <Wrench className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-bold text-white">{isEditing ? (
                                  <input 
                                    className="bg-[#1E293B] px-2 py-0.5 rounded"
                                    value={editForm.device}
                                    onChange={(e) => setEditForm({...editForm, device: e.target.value})}
                                  />
                                ) : job.device}</h4>
                                <span className="text-[10px] font-mono font-bold bg-[#1E293B] text-slate-400 border border-white/5 px-2 py-0.5 rounded uppercase tracking-widest">
                                  ID-{job.id.slice(0, 8)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 mt-1">
                                {isEditing ? (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <User className="w-3.5 h-3.5 text-slate-400" />
                                      <select 
                                        className="bg-[#1E293B] px-2 py-0.5 rounded text-white"
                                        value={editForm.clientId || ''}
                                        onChange={(e) => setEditForm({...editForm, clientId: e.target.value})}
                                      >
                                        <option value="">Sin cliente...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <input 
                                        type="datetime-local"
                                        className="bg-[#1E293B] px-2 py-0.5 rounded text-white"
                                        value={editForm.dateIn ? editForm.dateIn.slice(0, 16) : ''}
                                        onChange={(e) => setEditForm({...editForm, dateIn: new Date(e.target.value).toISOString()})}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8]">
                                      <Hash className="w-3.5 h-3.5" />
                                      SKU: 
                                      <input 
                                        type="text"
                                        className="bg-[#1E293B] px-2 py-0.5 rounded text-[#38bdf8] w-24"
                                        value={editForm.sku || ''}
                                        onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                                      <Hash className="w-3.5 h-3.5" />
                                      Serie: 
                                      <input 
                                        type="text"
                                        className="bg-[#1E293B] px-2 py-0.5 rounded text-purple-400 w-24"
                                        value={editForm.serie || ''}
                                        onChange={(e) => setEditForm({...editForm, serie: e.target.value})}
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                      <User className="w-3.5 h-3.5" />
                                      {client?.name || 'Cliente Desconocido'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {format(new Date(job.dateIn), "dd MMM, HH:mm", { locale: es })}
                                    </div>
                                    {job.sku && (
                                       <div className="flex items-center gap-1.5 text-xs font-bold text-[#38bdf8]">
                                         <Hash className="w-3.5 h-3.5" />
                                         SKU: {job.sku}
                                       </div>
                                    )}
                                    {job.serie && (
                                       <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                                         <Hash className="w-3.5 h-3.5" />
                                         Serie: {job.serie}
                                       </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                             {isEditing ? (
                               <>
                                 <button onClick={handleSaveEdit} className="p-2 bg-[#A4BE9D]/10 text-[#A4BE9D] rounded-xl hover:bg-[#A4BE9D]/20 transition-all">
                                   <Check className="w-5 h-5" />
                                 </button>
                                 <button onClick={() => setEditingId(null)} className="p-2 bg-[#1E293B] text-slate-400 rounded-xl hover:text-slate-600 transition-all">
                                   <X className="w-5 h-5" />
                                 </button>
                               </>
                             ) : (
                               <>
                                 <button 
                                   onClick={() => generateThermalTicket({
                                     title: 'Ticket de Taller',
                                     code: job.id.slice(0, 8).toUpperCase(),
                                     client: client?.name,
                                     status: job.status,
                                     date: format(new Date(job.dateIn), "dd/MM/yyyy"),
                                     details: `${job.device}\nFalla: ${job.issue}`
                                   })}
                                   className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-[#1E293B] rounded-xl transition-all"
                                   title="Imprimir Ticket"
                                 >
                                   <Printer className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleEdit(job)} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-[#1E293B] rounded-xl transition-all">
                                   <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleDelete(job.id)} className="p-2 text-slate-300 hover:text-[#ECA99E] hover:bg-[#ECA99E]/5 rounded-xl transition-all">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </>
                             )}
                          </div>
                        </div>

                        <div className="bg-[#1E293B]/20 rounded-2xl p-4 border border-[#1E293B]">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Falla & Estado</p>
                          {isEditing ? (
                            <textarea 
                              className="w-full crystal-input rounded-xl p-3 text-sm font-medium"
                              value={editForm.issue}
                              onChange={(e) => setEditForm({...editForm, issue: e.target.value})}
                            />
                          ) : (
                            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{job.issue}"</p>
                          )}
                          
                          {isEditing ? (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Notas Operativas</p>
                              <textarea 
                                className="w-full crystal-input rounded-xl p-3 text-xs text-slate-400 focus:text-white"
                                placeholder="Notas internas..."
                                value={editForm.notes || ''}
                                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              />
                            </div>
                          ) : job.notes && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-xs text-slate-500">{job.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:w-56 space-y-4 border-l border-slate-50 md:pl-6 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Actual</p>
                            {isEditing ? (
                              <select 
                                value={editForm.status}
                                onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                                className="w-full crystal-input rounded-xl px-3 py-2 text-xs font-bold w-full"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En diagnóstico">En diagnóstico</option>
                                <option value="Esperando repuesto">Esperando repuesto</option>
                                <option value="Reparando">Reparando</option>
                                <option value="Completado">Completado</option>
                                <option value="Entregado">Entregado</option>
                              </select>
                            ) : (
                              <div className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                                job.status === 'Completado' ? "bg-[#A4BE9D]/10 text-[#A4BE9D]" :
                                job.status === 'Entregado' ? "bg-[#1E293B] text-slate-500" :
                                job.status === 'Pendiente' ? "bg-amber-500/10 text-amber-600" : "bg-[#7BA4BD]/10 text-[#7BA4BD]"
                              )}>
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  job.status === 'Completado' ? "bg-[#A4BE9D]" :
                                  job.status === 'Entregado' ? "bg-slate-400" :
                                  job.status === 'Pendiente' ? "bg-amber-500" : "bg-[#7BA4BD]"
                                )} />
                                {job.status}
                              </div>
                            )}
                          </div>

                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Costo Estimado</p>
                             {isEditing ? (
                               <input 
                                 type="number"
                                 className="w-full crystal-input rounded-xl px-3 py-2 text-sm font-bold"
                                 value={editForm.cost}
                                 onChange={(e) => setEditForm({...editForm, cost: Number(e.target.value)})}
                               />
                             ) : (
                               <p className="text-xl font-display font-bold text-white">{formatCurrency(job.cost)}</p>
                             )}
                          </div>
                        </div>
                        
                        {!isEditing && (
                          <div className="flex gap-2">
                             {job.status === 'Completado' && (
                               <button 
                                 onClick={() => updateWorkshopJob(job.id, { status: 'Entregado' })}
                                 className="w-full py-2 bg-[#A4BE9D]/10 text-[#A4BE9D] text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#A4BE9D]/20 transition-all border border-[#A4BE9D]/20"
                               >
                                 Entregar
                               </button>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="crystal-card p-24 text-center">
                <div className="w-20 h-20 bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wrench className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No se encontraron órdenes</h3>
                <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
                  Utiliza el botón de "Nuevo Ingreso" para registrar un equipo técnico.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Technical Info Sidebar */}
        <motion.div variants={itemAnim} className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <h4 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                 <Clock className="w-5 h-5 text-[#7BA4BD]" />
              </div>
              Resumen Taller
            </h4>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-sm font-medium text-slate-400">Equipos Activos</span>
                <span className="text-xl font-bold text-white">{workshopJobs.filter(j => j.status !== 'Entregado').length}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-sm font-medium text-slate-400">Trabajos de Hoy</span>
                <span className="text-xl font-bold text-white">
                  {workshopJobs.filter(j => format(new Date(j.dateIn), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
                </span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-sm font-medium text-slate-400">Estimado a Cobrar</span>
                <span className="text-2xl font-display font-bold text-[#A4BE9D]">
                  {formatCurrency(workshopJobs.filter(j => j.status === 'Completado').reduce((sum, j) => sum + j.cost, 0))}
                </span>
              </div>
            </div>
          </div>
          
          <div className="crystal-card p-4 md:p-8 border border-white/10 shadow-sm relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-5 bg-white w-24 h-24 rounded-full blur-xl" />
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8 ml-1">Guía Rápida</h4>
             <ul className="space-y-6">
               {[
                 { icon: Package, text: "Vincular equipo del stock agiliza el inventario.", color: "text-[#7BA4BD]" },
                 { icon: AlertTriangle, text: "Marcar como 'Falta Repuesto' notifica al sector compras.", color: "text-[#ECA99E]" },
                 { icon: CheckCircle2, text: "Un equipo 'Completado' suma al balance de contabilidad al entregarse.", color: "text-[#A4BE9D]" }
               ].map((item, i) => (
                 <li key={i} className="flex gap-5 p-4 rounded-3xl hover:bg-white/5 transition-all group">
                   <item.icon className={cn("w-6 h-6 shrink-0 mt-0.5 transform group-hover:scale-110 transition-transform", item.color)} />
                   <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{item.text}</p>
                 </li>
               ))}
             </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
