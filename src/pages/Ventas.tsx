import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../lib/format";
import { Search, Plus, Calendar, Trash2, Edit2, Check, X, Filter, Download, FileText, MessageCircle, FileDown, Sparkles, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore, Sale, Client } from "../store/useStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NuevaVenta } from "./NuevaVenta";
import { motion, AnimatePresence } from "motion/react";
import { exportToExcel } from "../lib/excel";
import { generateSalePDF } from "../lib/pdf";
import { useSearchParams } from "react-router-dom";
import { processFileWithGemini } from "../lib/gemini";
import { downloadTemplate } from "../lib/templates";

import { ShoppingCart } from "lucide-react";

export function Ventas() {
  const { sales, clients, deleteSale, updateSale } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleExport = () => {
    const data = sales.map(s => ({
      Fecha: format(new Date(s.date), "dd/MM/yyyy HH:mm"),
      Cliente: clients.find(c => c.id === s.clientId)?.name || 'N/A',
      Total: s.total,
      Metodo_Pago: s.paymentMethod,
      Estado: s.status,
      Articulos: s.items.map(i => `${i.quantity}x ${i.name}`).join(", ")
    }));
    exportToExcel(data, "Ventas_Mundo_Outlet");
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await processFileWithGemini(file, "Extrae la lista de ventas de este archivo. Para cada venta necesito: Fecha, Cliente (Nombre), SKU del Producto, Cantidad, Precio Unitario, Total y Método de Pago.");
      alert(result.message);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo con la IA.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsCreating(true);
      // Clean up the param so it doesn't open again on reload if they go back
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Sale>>({});

  const handleWhatsAppShare = (sale: Sale, client?: Client) => {
    let message = `*Mundo Outlet - Recibo de Venta*\n\n`;
    message += `ID: #${sale.id.slice(0, 8)}\n`;
    message += `Fecha: ${format(new Date(sale.date), "dd/MM/yyyy HH:mm")}\n`;
    if (client) message += `Cliente: ${client.name}\n`;
    message += `\n*Detalles:*\n`;
    sale.items.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (${formatCurrency(item.price, false)})\n`;
    });
    message += `\n*TOTAL: ${formatCurrency(sale.total, false)}*\n`;
    message += `Gracias por su compra!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = client?.phone ? client.phone.replace(/\D/g, '') : '';
    const wsUrl = phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(wsUrl, '_blank');
  };

  const filteredSales = sales.filter(s => {
    const client = clients.find(c => c.id === s.clientId);
    const searchLower = searchQuery.toLowerCase();
    
    return client?.name.toLowerCase().includes(searchLower) || 
           s.items.some(item => 
             item.name.toLowerCase().includes(searchLower) ||
             item.sku.toLowerCase().includes(searchLower) ||
             (item.serie && item.serie.toLowerCase().includes(searchLower))
           ) ||
           s.id.toLowerCase().includes(searchLower);
  });

  const handleDelete = (id: string) => {
    deleteSale(id);
    setEditingSaleId(null);
  };

  const handleEditClick = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setEditForm(sale);
  };

  const handleCancelEdit = () => {
    setEditingSaleId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingSaleId && editForm) {
      updateSale(editingSaleId, editForm);
      setEditingSaleId(null);
      setEditForm({});
    }
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

  if (isCreating) {
    return <NuevaVenta onBack={() => setIsCreating(false)} />;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 md:p-8 w-full max-w-[1400px] mx-auto pb-20"
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:p-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Registro Comercial</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Ventas</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente o artículo..." 
              className="w-full pl-10 pr-4 py-2 crystal-input rounded-lg text-xs transition-all placeholder:text-slate-500"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".csv,.xlsx,.xls,.pdf,image/*"
            />
            
            <button 
              onClick={() => downloadTemplate('sales')}
              className="p-2.5 crystal-panel rounded-lg text-slate-400 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
              title="Descargar Plantilla Excel"
            >
              <FileDown className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase hidden lg:inline">Plantilla</span>
            </button>

            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className="p-2.5 crystal-panel rounded-lg text-[#38bdf8] hover:text-[#0ea5e9] transition-all shadow-sm active:scale-95 flex items-center gap-2"
              title="Importar con IA"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase hidden lg:inline">Importar IA</span>
            </button>

            <button 
              onClick={handleExport}
              className="p-2.5 crystal-panel rounded-lg text-slate-400 hover:text-white transition-all shadow-sm active:scale-95"
              title="Exportar Excel"
            >
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2.5 crystal-panel rounded-lg text-slate-400 hover:text-white transition-all shadow-sm active:scale-95">
              <Filter className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#38bdf8] text-[#0A111E] rounded-lg font-bold text-xs shadow-lg shadow-[#38bdf8]/20 hover:bg-[#0ea5e9] transition-all active:scale-95 whitespace-nowrap ml-auto sm:ml-0 uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Nueva Venta
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredSales.map((sale) => {
            const client = clients.find(c => c.id === sale.clientId);
            const isEditing = editingSaleId === sale.id;

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={sale.id} 
                className={cn(
                  "crystal-card p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300",
                  isEditing && "border-blue-500/30 bg-blue-500/5"
                )}
              >
                {/* Left: Date & Time */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400">
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
                        {format(new Date(sale.date), "dd MMM yyyy", { locale: es })}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {format(new Date(sale.date), "HH:mm")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Center: Client Name & Type */}
                <div className="flex-1 min-w-[200px]">
                  {isEditing ? (
                    <select 
                      value={editForm.clientId || ''}
                      onChange={(e) => setEditForm({...editForm, clientId: e.target.value})}
                      className="crystal-input px-4 py-2 w-full"
                    >
                      <option value="">Selecciona cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  ) : client ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-[15px] text-white">
                        {client.name}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        client.type === 'Mayorista' 
                          ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                          : "bg-slate-500/15 text-slate-400 border border-slate-500/20"
                      )}>
                        {client.type === 'Mayorista' ? 'Mayorista' : 'Consumidor Final'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic text-sm">No Registrado</span>
                  )}
                </div>

                {/* Right/Middle: Articles */}
                <div className="flex flex-col gap-2 max-w-[200px]">
                  {sale.items.slice(0, 2).map((item, idx) => (
                     <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300 whitespace-nowrap">
                        {item.quantity}x
                      </span>
                      <span className="text-sm font-medium text-slate-200 truncate" title={item.name}>
                        {item.name}
                      </span>
                     </div>
                  ))}
                  {sale.items.length > 2 && (
                    <span className="text-xs text-slate-500 italic">+{sale.items.length - 2} artículos...</span>
                  )}
                </div>

                {/* Status & Total */}
                <div className="flex items-center gap-6 justify-between md:justify-end ml-auto">
                   {isEditing ? (
                    <div className="flex flex-col gap-2">
                       <select 
                        value={editForm.status || sale.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value as Sale['status']})}
                        className="crystal-input px-3 py-1 text-sm w-32"
                      >
                        <option value="Completada">Completada</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                      <input 
                        type="number" 
                        value={editForm.total || 0} 
                        onChange={(e) => setEditForm({...editForm, total: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-sm w-32 text-right text-emerald-400 font-bold"
                      />
                    </div>
                   ) : (
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5",
                          sale.status === 'Completada' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          sale.status === 'Pendiente' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            sale.status === 'Completada' ? "bg-emerald-400" :
                            sale.status === 'Pendiente' ? "animate-pulse bg-amber-400" : "bg-red-400"
                          )} />
                          {sale.status}
                        </div>
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(sale.total)}
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
                      <button onClick={() => generateSalePDF(sale, client)} className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-full transition-all" title="Descargar PDF">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleWhatsAppShare(sale, client)} className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-full transition-all" title="Compartir WhatsApp">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(sale)} className="p-2 text-slate-400 hover:text-[#38bdf8] hover:bg-white/5 rounded-full transition-all" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sale.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-all" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                   )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredSales.length === 0 && (
           <div className="crystal-card p-12 flex flex-col items-center justify-center text-center mt-4">
             <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4">
               <ShoppingCart className="w-8 h-8" />
             </div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
               No se registraron transacciones recientes.
             </p>
           </div>
        )}
      </div>
    </motion.div>
  );
}
