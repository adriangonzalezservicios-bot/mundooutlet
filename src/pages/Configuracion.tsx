import { useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { Database, Cpu, ShieldCheck, Save, RefreshCw, Key } from "lucide-react";
import { motion } from "motion/react";

export function Configuracion() {
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('SUPABASE_URL') || "");
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('SUPABASE_ANON_KEY') || "");
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || "");
  const [companyName, setCompanyName] = useState(localStorage.getItem('COMPANY_NAME') || "Mundo Outlet");
  const [companyLogo, setCompanyLogo] = useState(localStorage.getItem('COMPANY_LOGO') || "");
  const [aiTraining, setAiTraining] = useState(localStorage.getItem('AI_TRAINING') || 
    `Eres el asistente inteligente de "Mundo Outlet". 
1. IDENTIFICACIÓN DE CUENTAS: Todo movimiento que provenga de "Jonathan Yamil Borina" o "Nara Celeste Albornoz" (o "Celeste") hacia proveedores o terceros se debe registrar SIEMPRE como "Egreso" (Gasto).
2. VENTAS: Al registrar una venta, calcula el margen real (Precio Venta - (Costo Lote + Gastos Taller)).
3. STOCK: Busca siempre el SKU si no te lo dan.
4. CLIENTES: Si no existe, crea el perfil de cliente.`
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveGeneral = () => {
    setIsSaving(true);
    localStorage.setItem('COMPANY_NAME', companyName);
    localStorage.setItem('COMPANY_LOGO', companyLogo);
    setTimeout(() => {
      setIsSaving(false);
      window.location.reload();
    }, 500);
  };

  const handleSaveSupabase = () => {
    setIsSaving(true);
    localStorage.setItem('SUPABASE_URL', supabaseUrl);
    localStorage.setItem('SUPABASE_ANON_KEY', supabaseKey);
    setTimeout(() => {
      setIsSaving(false);
      window.location.reload(); // Reload to re-initialize clients
    }, 500);
  };

  const handleSaveGemini = () => {
    setIsSaving(true);
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
    localStorage.setItem('AI_TRAINING', aiTraining);
    setTimeout(() => {
      setIsSaving(false);
      window.location.reload();
    }, 500);
  };

  const isSupabaseReady = isSupabaseConfigured;

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 max-w-4xl mx-auto pb-20">
      <motion.div variants={itemAnim} className="flex flex-col gap-2">
        <h1 className="text-5xl font-display font-bold text-white tracking-tight">Configuración</h1>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-[0.2em]">Ajustes del sistema e integraciones</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-10">
        {/* General Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="crystal-card p-10 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-6 mb-10">
            <div className="w-14 h-14 bg-white/5 border border-white/10 text-emerald-400 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-white tracking-tight">General</h3>
              <p className="text-sm font-semibold text-slate-500 tracking-wide">Información del negocio</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre de la Empresa</label>
              <input 
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full crystal-input rounded-xl px-5 py-3.5 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">URL del Logo (Opcional)</label>
              <input 
                type="text"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                placeholder="https://..."
                className="w-full crystal-input rounded-xl px-5 py-3.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-8 border-t border-white/5">
            <button 
              onClick={handleSaveGeneral}
              disabled={isSaving}
              className="flex items-center gap-3 px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all text-xs font-bold uppercase tracking-widest shadow-xl disabled:opacity-20"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Generales
            </button>
          </div>
        </motion.div>

        {/* Supabase Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="crystal-card p-10 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A4BE9D]/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/5 border border-white/10 text-[#A4BE9D] rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-white tracking-tight">Base de Datos (Supabase)</h3>
                <p className="text-sm font-semibold text-slate-500 tracking-wide">Persistencia de datos en la nube</p>
              </div>
            </div>
            {isSupabaseReady ? (
              <span className="px-4 py-1.5 bg-[#A4BE9D]/10 text-[#A4BE9D] text-[10px] font-bold rounded-full border border-[#A4BE9D]/20 uppercase tracking-widest backdrop-blur-sm">Conectado</span>
            ) : (
              <span className="px-4 py-1.5 bg-white/5 text-slate-500 text-[10px] font-bold rounded-full border border-white/5 uppercase tracking-widest">No configurado</span>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="grid gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">URL del Proyecto</label>
                <input 
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full crystal-input rounded-xl px-5 py-3.5 text-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Anon Key / API Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input 
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full crystal-input rounded-xl pl-12 pr-5 py-3.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
              <p className="text-[10px] text-slate-500 max-w-[60%] font-bold uppercase tracking-wider leading-relaxed">
                Al guardar, la página se recargará para aplicar los cambios y conectar con la nueva instancia.
              </p>
              <button 
                onClick={handleSaveSupabase}
                disabled={isSaving}
                className="flex items-center gap-3 px-8 py-3.5 primary-cta text-xs uppercase tracking-widest disabled:opacity-30"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Actualizar Motor
              </button>
            </div>
          </div>
        </motion.div>

        {/* Gemini Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="crystal-card p-10 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ECA99E]/5 rounded-bl-[100px] pointer-events-none" />

          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white/5 border border-white/10 text-[#ECA99E] rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-white tracking-tight">IA Inteligente (Gemini)</h3>
                <p className="text-sm font-semibold text-slate-500 tracking-wide">Asistente de gestión y análisis</p>
              </div>
            </div>
            <span className="px-4 py-1.5 bg-[#ECA99E]/10 text-[#ECA99E] text-[10px] font-bold rounded-full border border-[#ECA99E]/20 uppercase tracking-widest backdrop-blur-sm">Activo</span>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Gemini API Key</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full crystal-input rounded-xl pl-12 pr-5 py-3.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-white/5">
              <p className="text-[10px] text-slate-500 max-w-[60%] font-bold uppercase tracking-wider leading-relaxed">
                Esta llave es necesaria para que el sistema pueda interpretar facturas y asistirte por voz/chat.
              </p>
            </div>

            <div className="space-y-6 pt-10 mt-6 border-t border-white/5">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Entrenamiento y Personalidad</label>
                <textarea 
                  value={aiTraining}
                  onChange={(e) => setAiTraining(e.target.value)}
                  placeholder="Ej: Eres un vendedor amable, siempre ofreces descuentos por pago en efectivo y conoces bien las heladeras Samsung..."
                  className="w-full crystal-input rounded-2xl px-5 py-4 text-sm font-medium h-40 resize-none"
                />
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">Estas instrucciones definen como el asistente se comportará y que información priorizará.</p>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleSaveGemini}
                  disabled={isSaving}
                  className="flex items-center gap-3 px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl transition-all text-xs font-bold uppercase tracking-widest shadow-xl disabled:opacity-20"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Finalizar Entrenamiento
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
