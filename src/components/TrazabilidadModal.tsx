import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, User, Wrench, Search, Package } from "lucide-react";
import { Product, useStore } from "../store/useStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TrazabilidadModalProps {
  product: Product;
  onClose: () => void;
}

export function TrazabilidadModal({ product, onClose }: TrazabilidadModalProps) {
  const { sales, clients, workshopJobs, purchases } = useStore();

  const seriesDisponibles = product.series || [];
  const stockLimit = Math.max(product.stock, seriesDisponibles.length);
  
  // Reconstruir todas las unidades (vendidas, en taller, disponibles) usando los registros de ventas
  const allUnits: { id: string, status: string, tooltip?: string, events: any[] }[] = [];

  // Recopilamos todas las unidades de ventas
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.sku === product.sku) {
        allUnits.push({
          id: item.serie || 'N/A',
          status: 'Vendida',
          events: [{
            type: 'Venta',
            date: sale.date,
            clientId: sale.clientId,
            clientName: clients.find(c => c.id === sale.clientId)?.name || 'Consumidor Final',
            info: `Venta #${sale.id.slice(0, 8)}`
          }]
        });
      }
    });
  });

  // Recopilamos todas las unidades en taller
  workshopJobs.forEach(job => {
    if (job.sku === product.sku) {
      const existing = allUnits.find(u => u.id === job.serie);
      if (existing) {
         existing.events.push({
            type: 'Taller',
            date: job.dateIn,
            clientId: job.clientId,
            clientName: clients.find(c => c.id === job.clientId)?.name || 'N/A',
            info: `Taller: ${job.issue} (${job.status})`
         });
      } else {
        allUnits.push({
          id: job.serie || 'N/A',
          status: 'En Taller',
          events: [{
            type: 'Taller',
            date: job.dateIn,
            clientId: job.clientId,
            clientName: clients.find(c => c.id === job.clientId)?.name || 'N/A',
            info: `Taller: ${job.issue} (${job.status})`
          }]
        });
      }
    }
  });

  // Agregar las disponibles
  seriesDisponibles.forEach(serie => {
    const existing = allUnits.find(u => u.id === serie);
    if (!existing) {
       allUnits.push({
         id: serie,
         status: 'Disponible',
         events: []
       });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A111E]/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col crystal-card border border-white/10"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1 tracking-tight">Trazabilidad de Unidades</h2>
            <div className="flex items-center gap-3 text-slate-400">
               <span className="font-mono text-xs text-[#38bdf8] uppercase bg-[#38bdf8]/10 px-2 py-1 rounded-md">{product.sku}</span>
               <span className="text-sm">{product.brand} {product.model}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
           {allUnits.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                 No se encontraron unificades identificadas para este producto.
                 <p className="text-sm mt-2">Asegúrate de ingresar "Lotes" O "Series" al registrar compras o ventas.</p>
              </div>
           ) : (
             <div className="space-y-4">
                {allUnits.map((unit, i) => (
                   <div key={`${unit.id}-${i}`} className="bg-[#131B2F] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="flex flex-col flex-shrink-0 w-32 border-l-4 border-[#38bdf8] pl-3">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">ID Único / Serie</span>
                         <span className="font-mono text-white text-sm">{unit.id}</span>
                         <span className={`text-xs mt-2 font-bold w-fit px-2 py-1 rounded-md border ${
                           unit.status === 'Disponible' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                           unit.status === 'Vendida' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                           'bg-amber-500/10 text-amber-400 border-amber-500/20'
                         }`}>
                            {unit.status}
                         </span>
                      </div>
                      
                      <div className="flex-1 min-w-0 flex items-center gap-4 overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                         {unit.events.length === 0 ? (
                            <div className="text-slate-500 text-sm flex items-center gap-2">
                               <Package className="w-4 h-4 opacity-50" />
                               En stock. Sin historial de movimientos.
                            </div>
                         ) : (
                            unit.events.map((ev, i) => (
                               <div key={i} className="flex-shrink-0 flex items-center gap-4">
                                  <div className="flex flex-col bg-white/5 rounded-xl p-3 border border-white/5 relative min-w-[200px]">
                                     <div className="flex items-center gap-2 mb-2">
                                        {ev.type === 'Venta' ? <User className="w-4 h-4 text-purple-400" /> : <Wrench className="w-4 h-4 text-amber-400" />}
                                        <span className="text-xs font-bold text-white">{ev.type}</span>
                                     </div>
                                     <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(ev.date), "dd MMM yyyy", { locale: es })}
                                     </span>
                                     <span className="text-sm font-medium text-slate-200 truncate">{ev.clientName}</span>
                                     <span className="text-xs text-slate-500 mt-1 truncate">{ev.info}</span>
                                  </div>
                                  {i < unit.events.length - 1 && (
                                     <div className="w-8 h-[2px] bg-white/10 flex-shrink-0" />
                                  )}
                               </div>
                            ))
                         )}
                      </div>
                   </div>
                ))}
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
