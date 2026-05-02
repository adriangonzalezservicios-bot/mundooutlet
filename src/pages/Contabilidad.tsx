import { useState, useRef } from "react";
import { formatCurrency } from "../lib/format";
import { ArrowDownRight, ArrowUpRight, Receipt, TrendingUp, Edit2, Check, X, Trash2, Landmark, Download, Plus, Sparkles, Loader2, FileDown } from "lucide-react";
import { useStore, Transaction } from "../store/useStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { exportToExcel, importFromExcel } from "../lib/excel";
import { downloadTemplate } from "../lib/templates";

export function Contabilidad() {
  const { transactions, updateTransaction, deleteTransaction, addTransaction } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    date: new Date().toISOString(),
    type: 'Ingreso',
    category: 'Venta',
    amount: 0,
    description: '',
    paymentMethod: 'Efectivo'
  });

  const handleAddTransaction = () => {
    if (!newTx.description || !newTx.amount) return;
    addTransaction(newTx as Omit<Transaction, 'id'>);
    setIsAdding(false);
    setNewTx({
      date: new Date().toISOString(),
      type: 'Ingreso',
      category: 'Venta',
      amount: 0,
      description: '',
      paymentMethod: 'Efectivo'
    });
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
        if (row.Monto && row.Monto > 0) {
           addTransaction({
             date: row.Fecha ? new Date(row.Fecha).toISOString() : new Date().toISOString(),
             type: row.Tipo === 'Egreso' ? 'Egreso' : 'Ingreso',
             category: row.Categoria || 'Otro',
             amount: Number(row.Monto),
             description: row.Descripcion || 'Importado desde Excel',
             paymentMethod: row.MedioPago || 'Efectivo'
           });
        }
      });
      alert(`Se han importado ${data.length} movimientos exitosamente.`);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo Excel.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    exportToExcel(transactions, "Contabilidad_Mundo_Outlet");
  };
  const [filterType, setFilterType] = useState<"All" | "Ingreso" | "Egreso">("All");
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const filteredTransactions = transactions.filter(t => filterType === "All" || t.type === filterType);
  
  const ingresoTxs = transactions.filter(t => t.type === 'Ingreso');
  const totalIngresos = ingresoTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalEgresos = transactions.filter(t => t.type === 'Egreso').reduce((sum, t) => sum + t.amount, 0);
  const balanceCaja = totalIngresos - totalEgresos;
  
  const ventasTxs = transactions.filter(t => t.type === 'Ingreso' && t.category === 'Venta');
  const promedioVentas = ventasTxs.length > 0 
    ? ventasTxs.reduce((sum, t) => sum + t.amount, 0) / ventasTxs.length 
    : 0;

  const handleEditClick = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditForm(tx);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setEditingTxId(null);
  };

  const handleCancelEdit = () => {
    setEditingTxId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingTxId && editForm) {
      updateTransaction(editingTxId, editForm);
      setEditingTxId(null);
      setEditForm({});
    }
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
      {/* Header */}
      <motion.div variants={itemAnim} className="flex flex-col lg:flex-row justify-between gap-4 md:p-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Contabilidad</h1>
          <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide">Libro diario y finanzas</p>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="flex crystal-panel p-1 rounded-2xl w-fit border border-white/5">
              {[
                { id: 'All', label: 'Todo' },
                { id: 'Ingreso', label: 'Ingresos' },
                { id: 'Egreso', label: 'Egresos' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative overflow-hidden",
                    filterType === tab.id ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <span>{tab.label}</span>
                  {filterType === tab.id && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7BA4BD]" />
                  )}
                </button>
              ))}
            </div>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".csv,.xlsx,.xls,.pdf,image/*,.txt"
            />

            <button 
              onClick={() => downloadTemplate('expenses')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Plantilla
            </button>

            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[#7BA4BD] hover:text-[#8AB4CC] transition-all text-xs font-bold uppercase tracking-widest shadow-sm disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 rotate-180" />}
              Importar
            </button>

            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#7BA4BD] text-white rounded-xl hover:bg-[#8AB4CC] transition-all text-xs font-bold uppercase tracking-widest shadow-xl shadow-[#7BA4BD]/20"
            >
              <Plus className="w-4 h-4" />
              Nueva Transacción
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* KPIs */}
      <motion.div variants={itemAnim} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:p-6">
        {[
          { label: "Balance General", value: balanceCaja, icon: Landmark, color: "text-[#7BA4BD]", bg: "bg-[#7BA4BD]/10" },
          { label: "Total Ingresos", value: totalIngresos, icon: ArrowUpRight, color: "text-[#A4BE9D]", bg: "bg-[#A4BE9D]/10" },
          { label: "Total Egresos", value: totalEgresos, icon: ArrowDownRight, color: "text-[#ECA99E]", bg: "bg-[#ECA99E]/10" },
          { label: "Ticket Promedio", value: promedioVentas, icon: TrendingUp, color: "text-[#6A819C]", bg: "bg-[#6A819C]/10" }
        ].map((stat, i) => (
          <div key={i} className="crystal-card p-7 border border-white/10 group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10 transform scale-150 group-hover:scale-[1.7] transition-transform duration-700">
               <stat.icon className="w-10 h-10" />
            </div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">{stat.label}</h3>
            <p className="text-3xl font-display font-bold text-white tracking-tight">{formatCurrency(stat.value)}</p>
            <div className="mt-4 flex items-center gap-2">
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stat.color.replace('text-', 'bg-'))} />
               <span className="text-[9px] font-bold uppercase text-slate-600 tracking-widest">Tiempo Real</span>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemAnim} className="mt-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 px-2">
          <Receipt className="w-6 h-6 text-[#7BA4BD]" />
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Transacciones</h2>
        </div>
        
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-blue-500/30 bg-blue-500/5 transition-all"
              >
                {/* Left - Date (simulate today) */}
                <div className="flex items-center gap-4 min-w-[120px]">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400 shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hoy</span>
                </div>

                {/* center - description & type */}
                <div className="flex-1 flex flex-col md:flex-row gap-2">
                   <input 
                    type="text" 
                    placeholder="Descripción..."
                    value={newTx.description} 
                    onChange={(e) => setNewTx({...newTx, description: e.target.value})}
                    className="crystal-input px-4 py-2 w-full text-sm font-bold"
                  />
                  <div className="flex gap-2">
                    <select 
                      value={newTx.type}
                      onChange={(e) => setNewTx({...newTx, type: e.target.value as any})}
                      className="crystal-input px-3 py-2 text-sm font-bold w-full md:w-32"
                    >
                      <option value="Ingreso">Ingreso</option>
                      <option value="Egreso">Egreso</option>
                    </select>
                    <select 
                      value={newTx.category}
                      onChange={(e) => setNewTx({...newTx, category: e.target.value as any})}
                      className="crystal-input px-3 py-2 text-sm font-bold w-full md:w-40"
                    >
                      <option value="Venta">Venta</option>
                      <option value="Compra Proveedor">Compra Prov.</option>
                      <option value="Logística">Logística</option>
                      <option value="Operativo">Operativo</option>
                      <option value="Sueldo">Sueldo</option>
                      <option value="Repuestos">Repuestos</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                {/* payment & amount */}
                <div className="flex items-center gap-2">
                  <select 
                    value={newTx.paymentMethod}
                    onChange={(e) => setNewTx({...newTx, paymentMethod: e.target.value})}
                    className="crystal-input px-3 py-2 text-sm font-bold w-32"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Mercadopago">Mercadopago</option>
                  </select>
                  <input 
                    type="number" 
                    value={newTx.amount || 0} 
                    onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})}
                    className="crystal-input px-4 py-2 text-sm font-bold text-right w-32 ml-auto"
                  />
                </div>

                {/* actions */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button onClick={handleAddTransaction} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition-all">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsAdding(false)} className="p-2.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {filteredTransactions.map((tx) => {
              const isEditing = editingTxId === tx.id;
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={tx.id} 
                  className={cn(
                    "crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300",
                    isEditing ? "border-blue-500/30 bg-blue-500/5" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-[140px]">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
                      tx.type === 'Ingreso' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                      {tx.type === 'Ingreso' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    {isEditing ? (
                      <input 
                        type="datetime-local" 
                        value={editForm.date ? editForm.date.slice(0, 16) : ''}
                        onChange={(e) => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                        className="crystal-input px-3 py-1.5 text-xs w-full"
                      />
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">
                          {format(new Date(tx.date), "dd MMM yyyy", { locale: es })}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                          {format(new Date(tx.date), "HH:mm")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row gap-4">
                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          value={editForm.description || ''} 
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          className="crystal-input px-3 py-1.5 text-sm w-full font-bold"
                        />
                        <select 
                          value={editForm.category || tx.category}
                          onChange={(e) => setEditForm({...editForm, category: e.target.value as Transaction['category']})}
                          className="crystal-input px-3 py-1.5 text-sm font-bold"
                        >
                          <option value="Venta">Venta</option>
                          <option value="Compra Proveedor">Compra Prov.</option>
                          <option value="Logística">Logística</option>
                          <option value="Operativo">Operativo</option>
                          <option value="Sueldo">Sueldo</option>
                          <option value="Repuestos">Repuestos</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col flex-1 min-w-[200px]">
                        <span className="font-bold text-[15px] text-white truncate" title={tx.description}>{tx.description}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">
                            {tx.category}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#7BA4BD]">
                            {tx.paymentMethod || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 ml-auto">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                         <select 
                          value={editForm.paymentMethod || ''} 
                          onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})}
                          className="crystal-input px-3 py-1.5 text-sm font-bold w-32"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Mercadopago">Mercadopago</option>
                        </select>
                        <input 
                          type="number" 
                          value={editForm.amount || 0} 
                          onChange={(e) => setEditForm({...editForm, amount: Number(e.target.value)})}
                          className="crystal-input px-3 py-1.5 text-sm font-bold text-right w-32"
                        />
                      </div>
                    ) : (
                      <span className={cn(
                        "text-lg font-bold font-mono tracking-tight",
                        tx.type === 'Ingreso' ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {tx.type === 'Ingreso' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition-all">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancelEdit} className="p-2.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditClick(tx)} className="p-2 text-slate-400 hover:text-[#7BA4BD] hover:bg-white/5 rounded-full transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(tx.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredTransactions.length === 0 && !isAdding && (
             <div className="crystal-card p-12 flex flex-col items-center justify-center text-center mt-4">
               <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
                 <Receipt className="w-8 h-8" />
               </div>
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                 No hay transacciones registradas.
               </p>
             </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
