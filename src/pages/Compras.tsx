import { useState } from "react";
import { formatCurrency } from "../lib/format";
import { Plus, Search, Truck, Package, Calendar, Trash2, Edit2, Check, X, Filter } from "lucide-react";
import { useStore, Purchase } from "../store/useStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../lib/utils";
import { NuevaCompra } from "./NuevaCompra";
import { motion, AnimatePresence } from "motion/react";

export function Compras() {
  const { purchases, providers, deletePurchase, updatePurchase } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todas");

  const [isCreating, setIsCreating] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Purchase>>({});

  const filteredPurchases = purchases.filter((p) => {
    const provider = providers.find((prov) => prov.id === p.providerId);
    const matchesSearch = provider?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.items.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );
    
    const matchesStatus = statusFilter === "Todas" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    deletePurchase(id);
    setEditingPurchaseId(null);
  };

  const handleEditClick = (purchase: Purchase) => {
    setEditingPurchaseId(purchase.id);
    setEditForm(purchase);
  };

  const handleCancelEdit = () => {
    setEditingPurchaseId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingPurchaseId && editForm) {
      updatePurchase(editingPurchaseId, editForm);
      setEditingPurchaseId(null);
      setEditForm({});
    }
  };

  const totalPurchases = purchases.reduce((acc, p) => acc + p.total, 0);

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
        type: "spring",
        stiffness: 70,
        damping: 15
      }
    }
  };

  if (isCreating) {
    return <NuevaCompra onBack={() => setIsCreating(false)} />;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header & Controls */}
      <motion.div variants={itemAnim} className="flex flex-col lg:flex-row justify-between gap-6 relative z-10 md:p-6 pb-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#38bdf8]/60 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-70">Supply Chain</span>
          </div>
          <h1 className="text-xl font-display font-medium text-white tracking-[0.1em] uppercase" >Registro de Compras</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 text-[#38bdf8]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR PROVEEDOR..." 
              className="w-full pl-11 pr-4 py-2.5 crystal-input text-xs font-mono transition-all placeholder:text-[#38bdf8]/30 focus:ring-[#38bdf8]/50"
            />
          </div>
          
          <div className="relative w-full sm:w-[200px]">
             <Filter className="w-4 h-4 text-[#38bdf8]/50 absolute left-4 top-1/2 -translate-y-1/2" />
             <select
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full pl-11 pr-8 py-2.5 crystal-input text-xs font-mono font-bold transition-all appearance-none bg-[#09090b] text-white cursor-pointer focus:ring-[#38bdf8]/50"
             >
               <option value="Todas" className="bg-[#0A111E]">Todos los Estados</option>
               <option value="Completada" className="bg-[#0A111E]">Completada</option>
               <option value="Pendiente" className="bg-[#0A111E]">Pendiente</option>
             </select>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-2.5 crystal-button whitespace-nowrap active:scale-95 text-xs font-mono"
            >
              <Plus className="w-4 h-4" />
              Ingresar Compra
            </button>
          </div>
        </div>
      </motion.div>
      <div className="flex flex-col gap-3 md:px-6">
        <AnimatePresence mode="popLayout">
          {filteredPurchases.map((purchase) => {
            const provider = providers.find((p) => p.id === purchase.providerId);
            const isEditing = editingPurchaseId === purchase.id;

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={purchase.id} 
                className={cn(
                  "crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300 relative overflow-hidden border border-white/5",
                  isEditing ? "border-[#38bdf8]/50 bg-[#38bdf8]/10" : "hover:bg-white/5 hover:border-[#38bdf8]/20 bg-[#09090b]"
                )}
              >
                {/* Left: Date */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#38bdf8]/10 flex items-center justify-center shrink-0 rounded-sm border border-[#38bdf8]/30 text-[#38bdf8]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  {isEditing ? (
                    <input 
                      type="datetime-local" 
                      value={editForm.date ? editForm.date.slice(0, 16) : ''}
                      onChange={(e) => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                      className="crystal-input px-4 py-2 w-full text-xs font-mono"
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-white text-xs uppercase tracking-widest">
                        {format(new Date(purchase.date), "dd MMM yyyy", { locale: es })}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#f8fafc]/50 tracking-[0.2em] uppercase mt-0.5">
                        {format(new Date(purchase.date), "HH:mm")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Center: Provider */}
                <div className="flex-1 min-w-[200px]">
                  {isEditing ? (
                    <select 
                      value={editForm.providerId || ''}
                      onChange={(e) => setEditForm({...editForm, providerId: e.target.value})}
                      className="crystal-input px-4 py-2 w-full text-xs font-mono bg-[#09090b]"
                    >
                      <option value="">Selecciona proveedor...</option>
                      {providers.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : provider ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-display font-medium text-[11px] text-white tracking-[0.1em] uppercase" >
                        {provider.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase tracking-[0.2em] bg-white/5 text-[#f8fafc]/50 border border-white/10">
                        Proveedor
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#8b5cf6]/70 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">No Registrado</span>
                  )}
                </div>

                {/* Articles */}
                <div className="flex flex-col gap-2 max-w-[200px]">
                  {purchase.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                       <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] rounded-sm whitespace-nowrap">
                        {item.quantity}x
                      </span>
                      <span className="text-xs font-mono font-bold text-[#f8fafc]/80 truncate uppercase tracking-widest" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                  {purchase.items.length > 2 && (
                    <span className="text-[9px] font-mono text-[#f8fafc]/40 tracking-[0.2em] uppercase">+{purchase.items.length - 2} items...</span>
                  )}
                </div>

                {/* Status & Total */}
                <div className="flex items-center gap-6 justify-between md:justify-end ml-auto">
                   {isEditing ? (
                    <div className="flex flex-col gap-2">
                       <select 
                        value={editForm.status || purchase.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value as Purchase['status']})}
                        className="crystal-input px-3 py-1 text-xs font-mono font-bold w-32 bg-[#09090b]"
                      >
                        <option value="Completada">Completada</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                      <input 
                        type="number" 
                        value={editForm.total || 0} 
                        onChange={(e) => setEditForm({...editForm, total: Number(e.target.value)})}
                         className="crystal-input px-3 py-1 text-xs font-mono font-bold w-32 text-right text-[#10b981]"
                      />
                    </div>
                   ) : (
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase tracking-[0.2em] border flex items-center gap-1.5",
                          purchase.status === 'Completada' ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30" :
                          "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30"
                        )}>
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            purchase.status === 'Completada' ? "bg-[#10b981]" : "animate-pulse bg-[#38bdf8]"
                          )} />
                          {purchase.status}
                        </div>
                        <span className={cn(
                          "text-xl font-display font-medium tracking-[0.1em]",
                          purchase.status === 'Completada' ? "text-[#f8fafc]" : "text-[#10b981]"
                        )} >
                          {formatCurrency(purchase.total)}
                        </span>
                     </div>
                   )}

                   {/* Actions */}
                   {isEditing ? (
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button onClick={handleSaveEdit} className="p-2.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-sm hover:bg-[#10b981]/20 transition-all">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-2.5 bg-white/5 text-[#f8fafc]/50 border border-white/10 rounded-sm hover:bg-white/10 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                   ) : (
                    <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(purchase)} className="p-2 text-[#38bdf8]/50 hover:text-[#38bdf8] hover:bg-[#38bdf8]/10 rounded-sm transition-all" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(purchase.id)} className="p-2 text-[#ef4444]/50 hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-sm transition-all" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                   )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredPurchases.length === 0 && (
           <div className="crystal-card p-12 flex flex-col items-center justify-center text-center mt-4 relative overflow-hidden border border-[#38bdf8]/20">
             <div className="absolute inset-0 bg-[#38bdf8]/5" />
             <div className="w-16 h-16 rounded-sm bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] mb-4 relative z-10">
               <Package className="w-8 h-8" />
             </div>
             <p className="text-[10px] font-mono font-bold text-[#f8fafc]/60 uppercase tracking-[0.2em] relative z-10">
               NO SE REGISTRARON COMPRAS RECIENTES.
             </p>
           </div>
        )}
      </div>
    </motion.div>
  );
}
