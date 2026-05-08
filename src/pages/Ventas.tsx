import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../lib/format";
import { Search, Plus, Calendar, Trash2, Edit2, Check, X, Filter, Download, FileText, MessageCircle, FileDown, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore, Sale, Client } from "../store/useStore";
import { format } from "date-fns";
import { generateId } from "../lib/id";
import { es } from "date-fns/locale";
import { NuevaVenta } from "./NuevaVenta";
import { motion, AnimatePresence } from "framer-motion";
import { exportToExcel, importFromExcel } from "../lib/excel";
import { GeometricLoader } from "../components/GeometricLoader";
import { generateSalePDF } from "../lib/pdf";
import { useSearchParams } from "react-router-dom";
import { downloadTemplate } from "../lib/templates";

import { ShoppingCart } from "lucide-react";

export function Ventas() {
  const { sales, clients, deleteSale, updateSale, addSale } = useStore();
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
  const [statusFilter, setStatusFilter] = useState<string>("Todas");
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
      const data = await importFromExcel(file);
      // Process sequentially just in case
      for (const row of data) {
        if (row.Total !== undefined || row.Precio_Unitario !== undefined) {
           // Find client by name (case insensitive)
           const clientName = row.Cliente_Nombre || row.Cliente || '';
           let foundClient = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase())?.id;
           
           const total = Number(row.Total) || (Number(row.Precio_Unitario) * Number(row.Cantidad)) || 0;
           
           addSale({
             date: row.Fecha ? new Date(row.Fecha).toISOString() : new Date().toISOString(),
             clientId: foundClient || 'c5', // Fallback to 'Consumidor Final'
             items: row.SKU_Producto ? [{
               id: generateId(),
               sku: String(row.SKU_Producto),
               name: `Importado: ${row.SKU_Producto}`,
               price: Number(row.Precio_Unitario) || total,
               quantity: Number(row.Cantidad) || 1
             }] : [],
             subtotal: total,
             shippingCost: 0,
             total: total,
             paymentMethod: row.Metodo_Pago || row.MedioPago || 'Efectivo',
             status: row.Estado || 'Completada',
           });
        }
      }
      alert(`Se han importado ${data.length} ventas exitosamente. Nota: Se asignó a "Consumidor Final" si el cliente no existía.`);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo Excel.");
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
    
    const matchesSearch = client?.name.toLowerCase().includes(searchLower) || 
           s.items.some(item => 
             item.name.toLowerCase().includes(searchLower) ||
             item.sku.toLowerCase().includes(searchLower) ||
             (item.serie && item.serie.toLowerCase().includes(searchLower))
           ) ||
           s.id.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "Todas" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
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
          <div className="flex items-center gap-2 text-[#38bdf8]/60">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-70">Registro Comercial</span>
          </div>
          <h1 className="text-xl font-display font-medium text-white tracking-[0.1em] uppercase" >Ventas</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 text-[#38bdf8]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR CLIENTE O ARTÍCULO..." 
              className="w-full pl-10 pr-4 py-2 crystal-input text-xs transition-all placeholder:text-[#38bdf8]/30 font-mono"
            />
          </div>

          <div className="relative w-full sm:w-[200px]">
             <Filter className="w-4 h-4 text-[#38bdf8]/50 absolute left-4 top-1/2 -translate-y-1/2" />
             <select
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full pl-10 pr-8 py-2 crystal-input text-[10px] transition-all appearance-none bg-transparent font-mono font-bold uppercase tracking-widest text-[#38bdf8]"
             >
               <option value="Todas" className="bg-[#09090b]">Todos los Estados</option>
               <option value="Completada" className="bg-[#09090b]">Completada</option>
               <option value="Pendiente" className="bg-[#09090b]">Pendiente</option>
               <option value="Cancelada" className="bg-[#09090b]">Cancelada</option>
             </select>
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
              className="p-2.5 crystal-panel rounded-sm border border-[#38bdf8]/20 text-[#38bdf8]/60 hover:text-[#38bdf8] transition-all flex items-center gap-2 hover:bg-[#38bdf8]/10 hover:"
              title="Descargar Plantilla Excel"
            >
              <FileDown className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold uppercase hidden lg:inline tracking-widest">Plantilla</span>
            </button>

            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className="p-2.5 crystal-panel rounded-sm border border-[#8b5cf6]/30 text-[#8b5cf6] hover:text-[#8b5cf6] transition-all flex items-center gap-2 hover:bg-[#8b5cf6]/10 hover:"
              title="Importar Excel"
            >
              {isImporting ? <GeometricLoader size={16} color="#8b5cf6" /> : <Download className="w-4 h-4 rotate-180" />}
              <span className="text-[10px] font-mono font-bold uppercase hidden lg:inline tracking-widest text-[#8b5cf6]">Importar</span>
            </button>

            <button 
              onClick={handleExport}
              className="p-2.5 crystal-panel rounded-sm border border-[#10b981]/30 text-[#10b981] hover:text-[#10b981] transition-all hover:bg-[#10b981]/10 hover:"
              title="Exportar Excel"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-6 py-2.5 crystal-button whitespace-nowrap ml-auto sm:ml-0"
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
                  isEditing && "border-[#38bdf8]/50 bg-[#38bdf8]/10"
                )}
              >
                {/* Left: Date & Time */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#38bdf8]/10 rounded-sm flex items-center justify-center border border-[#38bdf8]/30 text-[#38bdf8] group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  {isEditing ? (
                    <input 
                      type="datetime-local" 
                      value={editForm.date ? editForm.date.slice(0, 16) : ''}
                      onChange={(e) => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                      className="crystal-input px-4 py-2 w-full font-mono text-xs"
                    />
                  ) : (
                     <div className="flex flex-col">
                      <span className="font-mono font-bold text-[#f8fafc] text-[10px] uppercase tracking-widest">
                        {format(new Date(sale.date), "dd MMM yyyy", { locale: es })}
                      </span>
                      <span className="text-[10px] font-mono text-[#38bdf8]/60 uppercase mt-0.5">
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
                      className="crystal-input px-4 py-2 w-full font-mono text-xs text-white"
                    >
                      <option value="" className="bg-[#09090b]">Selecciona cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#09090b]">{c.name} ({c.type})</option>
                      ))}
                    </select>
                  ) : client ? (
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-sans font-medium tracking-[0.1em] text-[11px] text-white uppercase" >
                        {client.name}
                      </span>
                      <span className={cn(
                        "text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase tracking-[0.2em]",
                        client.type === 'Mayorista' 
                          ? "bg-[#00c3cc]/10 text-[#00c3cc] border border-[#00c3cc]/30"
                          : "bg-white/5 text-[#f8fafc]/70 border border-white/20"
                      )}>
                        {client.type === 'Mayorista' ? 'Mayorista' : 'Consumidor Final'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#ef4444] italic font-mono text-xs font-bold uppercase tracking-widest bg-[#ef4444]/5 border border-[#ef4444]/20 px-2 py-0.5 rounded-sm">No Registrado</span>
                  )}
                </div>

                {/* Right/Middle: Articles */}
                <div className="flex flex-col gap-2 max-w-[200px]">
                  {sale.items.slice(0, 2).map((item, idx) => (
                     <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] rounded-sm whitespace-nowrap">
                        {item.quantity}X
                      </span>
                      <span className="text-[11px] font-mono text-[#f8fafc]/80 truncate uppercase tracking-widest" title={item.name}>
                        {item.name}
                      </span>
                     </div>
                  ))}
                  {sale.items.length > 2 && (
                    <span className="text-[9px] font-mono text-[#38bdf8]/50 uppercase tracking-[0.2em] mt-1">+{sale.items.length - 2} items...</span>
                  )}
                </div>

                {/* Status & Total */}
                <div className="flex items-center gap-6 justify-between md:justify-end ml-auto">
                   {isEditing ? (
                    <div className="flex flex-col gap-2">
                       <select 
                        value={editForm.status || sale.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value as Sale['status']})}
                        className="crystal-input px-3 py-1 text-xs w-32 font-mono uppercase font-bold text-[#38bdf8]"
                      >
                        <option value="Completada" className="bg-[#09090b]">Completada</option>
                        <option value="Pendiente" className="bg-[#09090b]">Pendiente</option>
                        <option value="Cancelada" className="bg-[#09090b]">Cancelada</option>
                      </select>
                      <input 
                        type="number" 
                        value={editForm.total || 0} 
                        onChange={(e) => setEditForm({...editForm, total: Number(e.target.value)})}
                        className="crystal-input px-3 py-1 text-xs w-32 text-right text-[#10b981] font-mono font-bold"
                      />
                    </div>
                   ) : (
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-2 py-1 rounded-sm text-[9px] font-mono font-bold uppercase tracking-[0.2em] border flex items-center gap-1.5",
                          sale.status === 'Completada' ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/40" :
                          sale.status === 'Pendiente' ? "bg-[#ffaa00]/10 text-[#ffaa00] border-[#ffaa00]/40" : 
                          "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/40"
                        )}>
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            sale.status === 'Completada' ? "bg-[#10b981]" :
                            sale.status === 'Pendiente' ? "animate-pulse bg-[#ffaa00]" : "bg-[#ef4444]"
                          )} />
                          {sale.status}
                        </div>
                        <span className="text-lg font-display font-medium text-white tracking-widest" >
                          {formatCurrency(sale.total)}
                        </span>
                     </div>
                   )}

                   {/* Actions */}
                   {isEditing ? (
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button onClick={handleSaveEdit} className="p-2.5 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] rounded-sm hover:bg-[#10b981]/20 transition-all">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-2.5 bg-white/5 border border-white/10 text-[#f8fafc]/70 rounded-sm hover:bg-white/10 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                   ) : (
                    <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => generateSalePDF(sale, client)} className="p-2 text-[#38bdf8]/50 hover:text-[#10b981] hover:bg-[#10b981]/10 rounded-sm transition-all focus:outline-none" title="Descargar PDF">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleWhatsAppShare(sale, client)} className="p-2 text-[#38bdf8]/50 hover:text-[#10b981] hover:bg-[#10b981]/10 rounded-sm transition-all focus:outline-none" title="Compartir WhatsApp">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(sale)} className="p-2 text-[#38bdf8]/50 hover:text-[#38bdf8] hover:bg-[#38bdf8]/10 rounded-sm transition-all focus:outline-none" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sale.id)} className="p-2 text-[#38bdf8]/50 hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-sm transition-all focus:outline-none" title="Eliminar">
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
             <div className="w-16 h-16 rounded-sm bg-[#38bdf8]/5 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]/50 mb-4">
               <ShoppingCart className="w-8 h-8" />
             </div>
             <p className="text-[11px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em] leading-relaxed">
               NO SE REGISTRARON<br/>TRANSACCIONES RECIENTES.
             </p>
           </div>
        )}
      </div>
    </motion.div>
  );
}
