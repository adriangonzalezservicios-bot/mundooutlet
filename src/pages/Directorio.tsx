import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../lib/format";
import { User, Truck, Phone, Plus, Search, Mail, MapPin, Edit2, Check, X, Trash2, Download, Users } from "lucide-react";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { exportToExcel, importFromExcel } from "../lib/excel";
import { GeometricLoader } from "../components/GeometricLoader";

export function Directorio() {
  const { clients, providers, updateClient, updateProvider, addClient, addProvider, deleteClient, deleteProvider } = useStore();

  const handleExport = () => {
    if (activeTab === 'clientes') {
      exportToExcel(clients, "Clientes_Mundo_Outlet");
    } else {
      exportToExcel(providers, "Proveedores_Mundo_Outlet");
    }
  };
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'clientes' | 'proveedores'>(
    location.pathname.includes('proveedores') ? 'proveedores' : 'clientes'
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAdding(true);
      if (activeTab === 'clientes') {
        setAddForm({ name: '', type: 'Mayorista', debt: 0, phone: '', email: '', address: '' });
      } else {
        setAddForm({ name: '', contact: '', balance: 0, phone: '', email: '', address: '' });
      }
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: 'clientes' | 'proveedores') => {
    setActiveTab(tab);
    setSearchQuery("");
    setIsAdding(false);
    setEditingId(null);
    navigate(`/${tab}`);
  }

  const [searchQuery, setSearchQuery] = useState("");
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
      data.forEach((row: any) => {
        if (row.Nombre) {
          if (activeTab === 'clientes') {
            addClient({
              name: row.Nombre,
              type: row.Tipo || 'Consumidor Final',
              debt: Number(row.Deuda) || 0,
              phone: String(row.Telefono || ''),
              email: row.Email || '',
              address: row.Direccion || ''
            });
          } else {
            addProvider({
              name: row.Nombre,
              contact: row.Contacto || '',
              balance: Number(row.Saldo) || 0,
              phone: String(row.Telefono || ''),
              email: row.Email || '',
              address: row.Direccion || ''
            });
          }
        }
      });
      alert(`Se han importado ${data.length} registros exitosamente.`);
    } catch (error) {
      console.error(error);
      alert("Error al procesar el archivo Excel.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<any>({});

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProviders = providers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setEditForm(item);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (activeTab === 'clientes') deleteClient(id);
    else deleteProvider(id);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (activeTab === 'clientes') updateClient(editingId!, editForm);
    else updateProvider(editingId!, editForm);
    setEditingId(null);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    if (activeTab === 'clientes') {
      setAddForm({ name: '', type: 'Mayorista', debt: 0, phone: '', email: '', address: '' });
    } else {
      setAddForm({ name: '', contact: '', balance: 0, phone: '', email: '', address: '' });
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setAddForm({});
  };

  const handleSaveAdd = () => {
    if (!addForm.name) return;
    if (activeTab === 'clientes') addClient(addForm);
    else addProvider(addForm);
    setIsAdding(false);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <GeometricLoader size={60} color="#38bdf8" />
        <p className="text-sm font-mono font-bold text-[#38bdf8]/50 uppercase tracking-[0.4em] animate-pulse">
          Cargando {activeTab}...
        </p>
      </div>
    );
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
          <div className="flex items-center gap-2 text-[#38bdf8]/60 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-70">Contactos & Entidades</span>
          </div>
          <h1 className="text-xl font-display font-medium text-white tracking-[0.1em] uppercase" >Directorio</h1>
          
          <div className="flex crystal-panel p-1 rounded-sm w-fit mt-6 border border-[#38bdf8]/20">
            <button 
              onClick={() => handleTabChange('clientes')}
              className={cn(
                "px-6 py-2.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all relative overflow-hidden", 
                activeTab === 'clientes' ? "bg-[#38bdf8]/10 text-[#38bdf8]" : "text-[#38bdf8]/40 hover:text-[#38bdf8]/80"
              )}
            >
              Clientes
              {activeTab === 'clientes' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38bdf8]" />
              )}
            </button>
            <button 
              onClick={() => handleTabChange('proveedores')}
              className={cn(
                "px-6 py-2.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all relative overflow-hidden", 
                activeTab === 'proveedores' ? "bg-[#38bdf8]/10 text-[#38bdf8]" : "text-[#38bdf8]/40 hover:text-[#38bdf8]/80"
              )}
            >
              Proveedores
              {activeTab === 'proveedores' && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38bdf8]" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38bdf8]/50" />
            <input 
              type="text" 
              placeholder={`BUSCAR ${activeTab.toUpperCase()}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 crystal-input text-xs font-mono transition-all placeholder:text-[#38bdf8]/30 focus:ring-[#38bdf8]/50"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".csv,.xlsx,.xls"
            />
            <button 
              onClick={handleImportClick}
              disabled={isImporting}
              className="p-2.5 crystal-panel rounded-sm border border-[#8b5cf6]/30 text-[#8b5cf6] hover:text-[#8b5cf6] transition-all flex items-center justify-center gap-2 hover:bg-[#8b5cf6]/10 hover: active:scale-95 disabled:opacity-50"
              title="Importar Excel"
            >
              <Download className="w-4 h-4 rotate-180" />
            </button>
            <button 
              onClick={handleExport}
              className="p-2.5 crystal-panel rounded-sm border border-[#10b981]/30 text-[#10b981] hover:text-[#10b981] transition-all flex items-center justify-center gap-2 hover:bg-[#10b981]/10 hover: active:scale-95"
              title="Descargar Excel"
            >
              <Download className="w-4 h-4" />
            </button>
            {!isAdding && (
              <button 
                onClick={handleAddClick}
                className="flex items-center gap-2 px-6 py-2.5 crystal-button whitespace-nowrap active:scale-95 ml-auto sm:ml-0"
              >
                <Plus className="w-4 h-4" />
                Nuevo {activeTab === 'clientes' ? 'Cliente' : 'Proveedor'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:p-6">
        <AnimatePresence mode="popLayout">
          {isAdding && (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="crystal-card p-4 md:p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#7BA4BD]/5 rounded-bl-[100px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-[#7BA4BD]/10 text-[#7BA4BD] rounded-xl">
                    <Plus className="w-5 h-5" />
                  </div>
                  Crear Registro
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre / Razón Social</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Identificación del contacto"
                      value={addForm.name}
                      onChange={e => setAddForm({...addForm, name: e.target.value})}
                      className="crystal-input rounded-xl px-4 py-3 font-bold w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{activeTab === 'clientes' ? 'Segmento' : 'Persona de Contacto'}</label>
                    {activeTab === 'clientes' ? (
                      <select
                        value={addForm.type}
                        onChange={e => setAddForm({...addForm, type: e.target.value})}
                        className="crystal-input border-transparent rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-[#7BA4BD]/20 outline-none w-full"
                      >
                        <option value="Mayorista">Mayorista (Gremi)</option>
                        <option value="Consumidor Final">Consumidor Final</option>
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Nombre completo"
                        value={addForm.contact}
                        onChange={e => setAddForm({...addForm, contact: e.target.value})}
                        className="crystal-input border-transparent rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-[#7BA4BD]/20 outline-none w-full"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                   {[
                    { icon: Phone, key: 'phone', placeholder: 'Teléfono de contacto' },
                    { icon: Mail, key: 'email', placeholder: 'Correo electrónico' },
                    { icon: MapPin, key: 'address', placeholder: 'Domicilio fiscal/entrega' }
                  ].map((field) => (
                    <div key={field.key} className="flex items-center gap-4 text-slate-600">
                      <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                        <field.icon className="w-5 h-5 text-slate-400" />
                      </div>
                      <input 
                        type={field.key === 'email' ? 'email' : 'text'} 
                        placeholder={field.placeholder}
                        value={addForm[field.key] || ''}
                        onChange={e => setAddForm({...addForm, [field.key]: e.target.value})}
                        className="crystal-input rounded-xl px-4 py-2 text-sm font-medium w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-[#1E293B] p-4 md:p-6 rounded-3xl border border-white/5 mt-6">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    {activeTab === 'clientes' ? 'Deuda Consolidada' : 'Saldo Acreedor'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">$</span>
                    <input 
                      type="number" 
                      value={activeTab === 'clientes' ? addForm.debt : addForm.balance}
                      onChange={e => {
                        let v = Number(e.target.value);
                        if (activeTab === 'clientes') setAddForm({...addForm, debt: v});
                        else setAddForm({...addForm, balance: v});
                      }}
                      className="bg-transparent text-3xl font-display font-bold text-white pl-10 w-full outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-50">
                  <button onClick={handleCancelAdd} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                    Descartar
                  </button>
                  <button onClick={handleSaveAdd} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95">
                    Guardar Nuevo
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {(activeTab === 'clientes' ? filteredClients : filteredProviders).map((item: any) => {
            const isEditing = editingId === item.id;
            const isClient = activeTab === 'clientes';
            
            return (
              <motion.div 
                layout
                variants={itemAnim}
                key={item.id} 
                className={cn(
                  "group crystal-card p-6 md:p-8 rounded-[2rem] transition-all relative overflow-hidden flex flex-col border border-white/5",
                  isEditing ? "border-[#38bdf8]/50 bg-[#38bdf8]/10 ring-0" : "hover:shadow-md hover:border-[#38bdf8]/20 bg-[#09090b]"
                )}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                       <div className="space-y-4 w-full pr-4">
                          <input 
                            autoFocus
                            type="text" 
                            value={editForm.name}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="crystal-input rounded-sm px-4 py-2 font-mono font-bold w-full text-xs"
                          />
                          {isClient ? (
                            <select
                              value={editForm.type}
                              onChange={e => setEditForm({...editForm, type: e.target.value})}
                              className="crystal-input border-transparent rounded-sm px-4 py-2 text-xs font-mono font-bold text-white w-full bg-[#09090b]"
                            >
                              <option value="Mayorista">Mayorista</option>
                              <option value="Consumidor Final">Consumidor Final</option>
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={editForm.contact}
                              onChange={e => setEditForm({...editForm, contact: e.target.value})}
                              className="crystal-input border-transparent rounded-sm px-4 py-2 text-xs font-mono font-bold text-white w-full"
                            />
                          )}
                       </div>
                    ) : (
                      <div className="space-y-2">
                        <h3 className="text-lg font-display font-medium text-white truncate pr-4 tracking-[0.1em] uppercase" title={item.name} >{item.name}</h3>
                        <div className="flex items-center gap-3">
                           {isClient ? (
                            <span className={cn(
                              "text-[9px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 border rounded-sm",
                              item.type === 'Mayorista' ? "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30" : "bg-white/5 text-[#f8fafc]/50 border-white/10"
                            )}>
                              {item.type}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-[#8b5cf6]/70 uppercase tracking-[0.2em] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-sm border border-[#8b5cf6]/20">
                              <User className="w-3 h-3" />
                              {item.contact}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {isEditing ? (
                       <div className="flex gap-2">
                         <button onClick={handleSaveEdit} className="p-3 bg-[#A4BE9D]/10 text-[#A4BE9D] rounded-2xl hover:bg-[#A4BE9D]/20 transition-all active:scale-90">
                           <Check className="w-5 h-5" />
                         </button>
                         <button onClick={handleCancelEdit} className="p-3 bg-[#1E293B] text-slate-400 rounded-2xl hover:bg-slate-200 transition-all active:scale-90">
                           <X className="w-5 h-5" />
                         </button>
                       </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditClick(item)} className="p-2.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded-xl transition-all">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-300 hover:text-[#ECA99E] hover:bg-[#ECA99E]/5 rounded-xl transition-all">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  {[
                    { icon: Phone, key: 'phone', label: 'Teléfono' },
                    { icon: Mail, key: 'email', label: 'Email' },
                    { icon: MapPin, key: 'address', label: 'Dirección' }
                  ].map((field) => (
                    (isEditing || item[field.key]) && (
                      <div key={field.key} className="flex items-center gap-4 group/field">
                        <div className="p-2 bg-[#1E293B] text-slate-400 rounded-xl group-hover/field:bg-[#7BA4BD]/10 group-hover/field:text-[#7BA4BD] transition-colors">
                          <field.icon className="w-4 h-4" />
                        </div>
                        {isEditing ? (
                          <input 
                            type={field.key === 'email' ? 'email' : 'text'} 
                            placeholder={field.label}
                            value={editForm[field.key] || ''}
                            onChange={e => setEditForm({...editForm, [field.key]: e.target.value})}
                            className="crystal-input rounded-xl px-4 py-2 text-sm font-bold w-full"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-600 truncate">{item[field.key]}</span>
                        )}
                      </div>
                    )
                  ))}
                </div>

                <div className="mt-auto pt-8 border-t border-[#38bdf8]/10 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-mono font-bold text-[#f8fafc]/40 uppercase tracking-[0.2em] mb-1">{isClient ? 'Saldo Pendiente' : 'Balance Actual'}</p>
                    {isEditing ? (
                       <div className="relative w-32">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#38bdf8] font-bold">$</span>
                         <input 
                            type="number" 
                            value={isClient ? editForm.debt : editForm.balance}
                            onChange={e => {
                              let v = Number(e.target.value);
                              if (isClient) setEditForm({...editForm, debt: v});
                              else setEditForm({...editForm, balance: v});
                            }}
                            className="crystal-input border-transparent rounded-sm pl-8 pr-4 py-2 text-xs font-mono font-bold text-white w-full shadow-inner"
                          />
                       </div>
                    ) : (
                      <span className={cn(
                        "text-2xl font-display font-medium", 
                        (isClient ? item.debt : item.balance) > 0 ? "text-[#ef4444]" : "text-[#10b981]"
                      )} >
                        {isClient 
                          ? (item.debt > 0 ? `-${formatCurrency(item.debt)}` : "$0")
                          : formatCurrency(item.balance)
                        }
                      </span>
                    )}
                  </div>
                  
                  {!isEditing && isClient && item.type === "Mayorista" && (
                    <div className="flex flex-col items-end">
                       <span className="px-2 py-0.5 bg-[#38bdf8]/10 text-[#38bdf8] text-[9px] font-mono font-bold rounded-sm uppercase tracking-[0.2em] border border-[#38bdf8]/30">Mayorista</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {((activeTab === 'clientes' && filteredClients.length === 0 && !isAdding) || (activeTab === 'proveedores' && filteredProviders.length === 0 && !isAdding)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-32 text-center crystal-card flex flex-col items-center justify-center p-12"
          >
            <div className="w-20 h-20 bg-[#1E293B] rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Sin Resultados</h3>
            <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto">
              No se encontraron {activeTab} que coincidan con tu búsqueda. Intenta con otros términos.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
