import { useState, useEffect } from "react";
import { isFirebaseConfigured, auth } from "../lib/firebase";
import { signOut, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { Database, ShieldCheck, Save, LogOut, TerminalSquare, Cpu, Activity, Server, ActivitySquare, RefreshCw, Clock, LogIn, Brain, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { useStore } from "../store/useStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Mock telemetry data
const telemetryData = Array.from({ length: 30 }).map((_, i) => ({
  time: i,
  cpu: 40 + Math.random() * 40,
  ram: 60 + Math.random() * 20,
  net: 20 + Math.random() * 60
}));

export function Configuracion() {
  const [companyName, setCompanyName] = useState(localStorage.getItem('COMPANY_NAME') || "Mundo Outlet");
  const [companyLogo, setCompanyLogo] = useState(localStorage.getItem('COMPANY_LOGO') || "");
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const { fetchData, lastSyncTime, isSyncing, uiConfig, updateUIConfig } = useStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleSaveGeneral = () => {
    setIsSaving(true);
    localStorage.setItem('COMPANY_NAME', companyName);
    localStorage.setItem('COMPANY_LOGO', companyLogo);
    setTimeout(() => {
      setIsSaving(false);
      window.location.reload();
    }, 500);
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login error:", error);
      alert("Error al iniciar sesión: " + error.message + ". Asegúrate de que el acceso con Google esté habilitado en la consola de Firebase.");
    }
  };

  const isSupabaseReady = isFirebaseConfigured;

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-5xl mx-auto pb-20 mt-4">
      <motion.div variants={itemAnim} className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2 text-[#38bdf8]/60">
          <TerminalSquare className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-70">Integraciones & Sistemas</span>
        </div>
        <h1 className="text-2xl font-display font-medium text-white tracking-[0.1em] uppercase" >Configuración</h1>
      </motion.div>

      {/* Telemetry Module */}
      <motion.div variants={itemAnim} className="crystal-card border border-[#38bdf8]/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#38bdf8]/5 rounded-bl-[100px] pointer-events-none blur-[40px]" />
        
        <div className="p-6 md:p-8 border-b border-[#38bdf8]/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#38bdf8]/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] rounded-sm flex items-center justify-center">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-[0.1em] uppercase" >System Telemetry</h3>
              <p className="text-[10px] font-mono font-bold text-[#38bdf8]/60 uppercase tracking-[0.2em]">Node Status monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[#10b981] font-mono text-[10px] tracking-widest font-bold">
            <div className="flex items-center gap-2 bg-[#10b981]/10 px-3 py-1.5 rounded-sm border border-[#10b981]/30">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              STATUS: NOMINAL
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid gap-8 md:grid-cols-3">
          <div className="col-span-1 md:col-span-2 h-[200px] relative">
            <p className="text-[9px] font-mono font-bold text-[#f8fafc]/50 uppercase tracking-[0.3em] absolute top-[-10px] left-0">Real-Time Processing</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData}>
                <XAxis dataKey="time" hide />
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "rgba(0, 243, 255, 0.3)", borderRadius: "2px", fontFamily: "monospace", fontSize: "10px", color: "#38bdf8" }}
                  itemStyle={{ color: "#38bdf8" }}
                />
                <Line type="monotone" dataKey="cpu" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black)]" />
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div className="bg-[#38bdf8]/5 border border-[#38bdf8]/10 rounded-sm p-4 hover:border-[#38bdf8]/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-widest"><Cpu className="w-3 h-3 inline mr-1"/> Neural Core</span>
                <span className="text-[10px] font-mono font-bold text-white">45%</span>
              </div>
              <div className="h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-[#38bdf8] w-[45%]" />
              </div>
            </div>
            <div className="bg-[#8b5cf6]/5 border border-[#8b5cf6]/10 rounded-sm p-4 hover:border-[#8b5cf6]/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-[#8b5cf6]/70 uppercase tracking-widest"><Database className="w-3 h-3 inline mr-1"/> Memory Matrix</span>
                <span className="text-[10px] font-mono font-bold text-white">78%</span>
              </div>
              <div className="h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-[#8b5cf6] w-[78%]" />
              </div>
            </div>
            <div className="bg-[#10b981]/5 border border-[#10b981]/10 rounded-sm p-4 hover:border-[#10b981]/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-[#10b981]/70 uppercase tracking-widest"><Server className="w-3 h-3 inline mr-1"/> Network Link</span>
                <span className="text-[10px] font-mono font-bold text-white">99%</span>
              </div>
              <div className="h-1 bg-black rounded-full overflow-hidden">
                <div className="h-full bg-[#10b981] w-[99%]" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8">
        {/* General Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="crystal-card p-8 md:p-10 border border-[#38bdf8]/10 relative overflow-hidden group"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-sm flex items-center justify-center transition-all group-hover:border-[#38bdf8]/30 group-hover:text-[#38bdf8]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-display font-medium text-white tracking-[0.1em] uppercase" >General</h3>
              <p className="text-[10px] font-mono font-bold text-[#f8fafc]/50 tracking-[0.2em] uppercase">Información del holograma</p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em]">Nombre de la Empresa</label>
              <input 
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full crystal-input font-mono font-bold px-4 py-3 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em]">URL del Logo (Opcional)</label>
              <input 
                type="text"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                placeholder="https://..."
                className="w-full crystal-input font-mono font-bold px-4 py-3 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-8 border-t border-[#38bdf8]/10">
            <button 
              onClick={handleSaveGeneral}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 crystal-button whitespace-nowrap active:scale-95 disabled:opacity-20"
            >
              {isSaving ? <ActivitySquare className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Aplicar Cambios
            </button>
          </div>
        </motion.div>

        {/* UI Configuration Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="crystal-card p-8 md:p-10 border border-[#38bdf8]/10 relative overflow-hidden group"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-sm flex items-center justify-center transition-all group-hover:border-[#38bdf8]/30 group-hover:text-[#38bdf8]">
              <ActivitySquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-display font-medium text-white tracking-[0.1em] uppercase" >Interfaz & Experiencia</h3>
              <p className="text-[10px] font-mono font-bold text-[#f8fafc]/50 tracking-[0.2em] uppercase">Personalización del sistema</p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em]">Tema Visual</label>
              <select 
                value={uiConfig.theme}
                onChange={(e) => updateUIConfig({ theme: e.target.value as any })}
                className="w-full crystal-input font-mono font-bold px-4 py-3 text-xs appearance-none bg-black"
              >
                <option value="cyber">Cyberpunk (Neon)</option>
                <option value="minimal">Minimalista (Dark)</option>
                <option value="glass">Glassmorphism</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em]">Densidad de Layout</label>
              <select 
                value={uiConfig.layoutDensity}
                onChange={(e) => updateUIConfig({ layoutDensity: e.target.value as any })}
                className="w-full crystal-input font-mono font-bold px-4 py-3 text-xs appearance-none bg-black"
              >
                <option value="standard">Estándar</option>
                <option value="compact">Compacto</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em]">Color Primario</label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={uiConfig.primaryColor}
                  onChange={(e) => updateUIConfig({ primaryColor: e.target.value })}
                  className="w-12 h-10 bg-transparent border border-white/10 rounded-sm cursor-pointer"
                />
                <input 
                  type="text"
                  value={uiConfig.primaryColor}
                  onChange={(e) => updateUIConfig({ primaryColor: e.target.value })}
                  className="flex-1 crystal-input font-mono font-bold px-4 py-3 text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#38bdf8]/70 uppercase tracking-[0.2em]">Color Secundario</label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={uiConfig.secondaryColor}
                  onChange={(e) => updateUIConfig({ secondaryColor: e.target.value })}
                  className="w-12 h-10 bg-transparent border border-white/10 rounded-sm cursor-pointer"
                />
                <input 
                  type="text"
                  value={uiConfig.secondaryColor}
                  onChange={(e) => updateUIConfig({ secondaryColor: e.target.value })}
                  className="flex-1 crystal-input font-mono font-bold px-4 py-3 text-xs"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Backup & Restore Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="crystal-card p-8 md:p-10 border border-amber-500/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] pointer-events-none blur-[20px]" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-sm flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-display font-medium text-white tracking-[0.1em] uppercase">Respaldo de Datos</h3>
              <p className="text-[10px] font-mono font-bold text-[#f8fafc]/50 tracking-[0.2em] uppercase">Gestión de backups locales</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <button 
              onClick={() => {
                const { exportBackup } = useStore.getState();
                const data = exportBackup();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-mundo-outlet-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                toast.success("Backup descargado correctamente");
              }}
              className="flex items-center justify-center gap-3 p-6 bg-amber-500/5 border border-amber-500/10 rounded-sm hover:bg-amber-500/10 transition-all group"
            >
              <Download className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Generar Backup</p>
                <p className="text-[9px] font-mono text-amber-500/50 uppercase">Descargar JSON completo</p>
              </div>
            </button>

            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const content = event.target?.result as string;
                    if (window.confirm("¿Está seguro? Esta acción reemplazará los datos locales actuales.")) {
                      const { importBackup } = useStore.getState();
                      const success = await importBackup(content);
                      if (success) {
                        toast.success("Datos restaurados correctamente");
                        window.location.reload();
                      } else {
                        toast.error("Error al importar backup");
                      }
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <div className="flex items-center justify-center gap-3 p-6 bg-blue-500/5 border border-blue-500/10 rounded-sm hover:bg-blue-500/10 transition-all group">
                <Upload className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Restaurar Datos</p>
                  <p className="text-[9px] font-mono text-blue-500/50 uppercase">Subir archivo .json</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Database Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="crystal-card p-8 md:p-10 border border-[#10b981]/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-bl-[100px] pointer-events-none blur-[20px]" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 z-10">
              <div className="w-12 h-12 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] rounded-sm flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-display font-medium text-white tracking-[0.1em] uppercase" >Base de Datos Cloud</h3>
                <p className="text-[10px] font-mono font-bold text-[#f8fafc]/50 tracking-[0.2em] uppercase mt-0.5">Firestore Sync Node</p>
                <div className="mt-2 text-[8px] font-mono text-[#38bdf8]/40">
                  PROJECT_ID: gen-lang-client-0344454559
                </div>
              </div>
            </div>
            {isSupabaseReady ? (
              <div className="flex flex-col md:flex-row items-end md:items-center gap-4 z-10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
                  </span>
                  <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-[9px] font-mono font-bold rounded-sm border border-[#10b981]/30 uppercase tracking-[0.2em]">Enlace Establecido</span>
                </div>
                <button 
                  onClick={() => fetchData()}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-[#10b981]/20 text-[#10b981] text-[9px] font-mono font-bold rounded-sm hover:bg-[#10b981]/10 transition-all uppercase tracking-widest disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sincronizar Ahora
                </button>
              </div>
            ) : (
              <span className="px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] text-[9px] font-mono font-bold rounded-sm border border-[#ef4444]/30 uppercase tracking-[0.2em] z-10">Desconectado</span>
            )}
          </div>

          {lastSyncTime && (
            <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-white/40 uppercase tracking-widest pl-16">
              <Clock className="w-3 h-3" />
              Última Sincronización: {format(new Date(lastSyncTime), "HH:mm:ss 'del' dd/MM/yy", { locale: es })}
            </div>
          )}
          
          <div className="mt-8 pt-8 border-t border-[#38bdf8]/10">
            <h4 className="text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-[0.2em] mb-4">Estado de Autenticación</h4>
            <div className="grid gap-4 sm:grid-cols-2 text-[10px] font-mono">
               <div className="bg-black/20 p-3 rounded-sm border border-[#38bdf8]/10">
                 <p className="text-[#38bdf8]/40 mb-1">USUARIO ACTUAL:</p>
                 <p className="text-white break-all">info@mundooutlet.com.ar</p>
               </div>
               <div className="bg-black/20 p-3 rounded-sm border border-[#38bdf8]/10">
                 <p className="text-[#38bdf8]/40 mb-1">UUID:</p>
                 <p className="text-white break-all">{auth.currentUser?.uid || "ADMIN_HUB_01"}</p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
