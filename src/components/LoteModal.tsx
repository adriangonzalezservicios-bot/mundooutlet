import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useStore } from "../store/useStore";

interface LoteModalProps {
  onClose: () => void;
}

export function LoteModal({ onClose }: LoteModalProps) {
  const { providers, addBatch } = useStore();
  const [form, setForm] = useState({
    name: "",
    providerId: "",
    date: new Date().toISOString().split('T')[0],
    totalCost: 0,
    quantity: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity > 0) {
      addBatch({
        name: form.name,
        providerId: form.providerId,
        date: new Date(form.date).toISOString(),
        totalCost: form.totalCost,
        quantity: form.quantity
      });
      onClose();
    }
  };

  const costPerUnit = form.quantity > 0 ? form.totalCost / form.quantity : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A111E]/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#131B2F] rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Registrar Lote</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre / Identificador</label>
            <input 
              required
              type="text" 
              className="w-full crystal-input rounded-xl px-4 py-2 text-white bg-white/5 border border-white/10 focus:border-[#38bdf8]/50" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 mb-1">Proveedor</label>
            <select 
              required
              className="w-full crystal-input rounded-xl px-4 py-2 text-white bg-white/5 border border-white/10 focus:border-[#38bdf8]/50" 
              value={form.providerId} 
              onChange={e => setForm({...form, providerId: e.target.value})}
            >
              <option value="">Seleccione un proveedor</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Fecha de Compra</label>
            <input 
              required
              type="date" 
              className="w-full crystal-input rounded-xl px-4 py-2 text-white bg-white/5 border border-white/10 focus:border-[#38bdf8]/50" 
              value={form.date} 
              onChange={e => setForm({...form, date: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cantidad</label>
              <input 
                required
                type="number" 
                min="1"
                className="w-full crystal-input rounded-xl px-4 py-2 text-white bg-white/5 border border-white/10 focus:border-[#38bdf8]/50" 
                value={form.quantity || ''} 
                onChange={e => setForm({...form, quantity: Number(e.target.value)})} 
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Costo Total ($)</label>
              <input 
                required
                type="number" 
                min="0"
                className="w-full crystal-input rounded-xl px-4 py-2 text-white bg-white/5 border border-white/10 focus:border-[#38bdf8]/50" 
                value={form.totalCost || ''} 
                onChange={e => setForm({...form, totalCost: Number(e.target.value)})} 
              />
            </div>
          </div>

          {form.quantity > 0 && form.totalCost > 0 && (
            <div className="py-2 px-4 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-xl">
               <p className="text-xs text-[#38bdf8]/80 text-center uppercase tracking-wider font-bold">Costo por unidad</p>
               <p className="text-lg text-[#38bdf8] font-bold text-center">${costPerUnit.toFixed(2)}</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-transparent hover:border-white/10 rounded-xl">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-[#38bdf8] text-[#0A111E] rounded-xl font-bold hover:bg-[#0ea5e9]">Guardar Lote</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
