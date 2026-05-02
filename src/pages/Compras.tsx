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
  const [isCreating, setIsCreating] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Purchase>>({});

  const filteredPurchases = purchases.filter((p) => {
    const provider = providers.find((prov) => prov.id === p.providerId);
    return (
      provider?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.items.some((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    );
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
      <motion.div variants={itemAnim} className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Compras</h1>
          <p className="text-sm text-slate-400 mt-2">Seguimiento de compras y proveedores</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar proveedor o artículo..." 
              className="w-full pl-10 pr-4 py-2 crystal-card border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7BA4BD]/20"
            />
          </div>
          <div className="flex gap-4">
            <button className="p-2 crystal-card border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-[#7BA4BD] hover:bg-orange-600 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Ingresar Compra
            </button>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-3">
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
                  "crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300",
                  isEditing && "border-blue-500/30 bg-blue-500/5"
                )}
              >
                {/* Left: Date */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#7BA4BD]/10 rounded-2xl flex items-center justify-center border border-[#7BA4BD]/20 text-[#7BA4BD]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  {isEditing ? (
                    <input 
                      type="datetime-local" 
                      value={editForm.date ? editForm.date.slice(0, 16) : ''}
                      onChange={(e) => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                      className="crystal-input px-4 py-2 w-full"
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">
                        {format(new Date(purchase.date), "dd MMM yyyy", { locale: es })}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
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
                      className="crystal-input px-4 py-2 w-full"
                    >
                      <option value="">Selecciona proveedor...</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : provider ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-[15px] text-white">
                        {provider.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/20">
                        Proveedor
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic text-sm">No Registrado</span>
                  )}
                </div>

                {/* Articles */}
                <div className="flex flex-col gap-2 max-w-[200px]">
                  {purchase.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300 whitespace-nowrap">
                        {item.quantity}x
                      </span>
                      <span className="text-sm font-medium text-slate-200 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                  {purchase.items.length > 2 && (
                    <span className="text-xs text-slate-500 italic">+{purchase.items.length - 2} artículos...</span>
                  )}
                </div>

                {/* Status & Total */}
                <div className="flex items-center gap-6 justify-between md:justify-end ml-auto">
                   {isEditing ? (
                    <div className="flex flex-col gap-2">
                       <select 
                        value={editForm.status || purchase.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value as Purchase['status']})}
                        className="crystal-input px-3 py-1 text-sm w-32"
                      >
                        <option value="Completada">Completada</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                      <input 
                        type="number" 
                        value={editForm.total || 0} 
                        onChange={(e) => setEditForm({...editForm, total: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm w-32 text-right text-orange-400 font-bold"
                      />
                    </div>
                   ) : (
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5",
                          purchase.status === 'Completada' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            purchase.status === 'Completada' ? "bg-emerald-400" : "animate-pulse bg-amber-400"
                          )} />
                          {purchase.status}
                        </div>
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(purchase.total)}
                        </span>
                     </div>
                   )}

                   {/* Actions */}
                   {isEditing ? (
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button onClick={handleSaveEdit} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition-all">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-2.5 bg-white/10 text-slate-300 rounded-full hover:bg-white/20 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                   ) : (
                    <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(purchase)} className="p-2 text-slate-400 hover:text-[#7BA4BD] hover:bg-white/5 rounded-full transition-all" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(purchase.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-all" title="Eliminar">
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
           <div className="crystal-card p-12 flex flex-col items-center justify-center text-center mt-4">
             <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
               <Package className="w-8 h-8" />
             </div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
               No se registraron compras recientes.
             </p>
           </div>
        )}
      </div>
    </motion.div>
  );
}
