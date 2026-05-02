import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Map routes to titles
const getPageInfo = (pathname: string) => {
  switch (pathname) {
    case "/": return { title: "Dashboard", subtitle: "Vista general del negocio" };
    case "/ventas": return { title: "Ventas", subtitle: "Control por número de serie" };
    case "/compras": return { title: "Compras", subtitle: "Gestión de adquisiciones" };
    case "/clientes": return { title: "Clientes", subtitle: "Directorio de clientes" };
    case "/proveedores": return { title: "Proveedores", subtitle: "Asociaciones y proveedores" };
    case "/stock": return { title: "Stock", subtitle: "Historial completo e inventario" };
    case "/taller": return { title: "Taller", subtitle: "Reparaciones y servicio técnico" };
    case "/contabilidad": return { title: "Contabilidad", subtitle: "Finanzas y reportes" };
    case "/configuracion": return { title: "Configuración", subtitle: "Ajustes del sistema" };
    default: return { title: "", subtitle: "" };
  }
};

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { title, subtitle } = getPageInfo(location.pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#0A111E] text-slate-200 font-sans selection:bg-[#38bdf8]/30 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0A111E]">
        {/* Deep background mesh gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#38bdf8]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/10 blur-[130px]" />
        <div className="absolute top-[40%] right-[-20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[100px]" />
        
        {/* High-tech subtle dot/grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_40%,transparent_100%)]" />
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-300 min-w-0 relative z-10 w-full overflow-x-hidden">
        <header className="h-16 md:h-20 border-b border-white/5 bg-transparent backdrop-blur-md sticky top-0 z-20 flex items-center px-4 md:px-8 gap-4 md:gap-6 shrink-0 transition-all">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-[#131B2F] text-slate-400 hover:text-white transition-colors lg:hidden focus:outline-none"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-xl md:text-2xl font-display font-bold leading-tight text-white tracking-tight truncate">{title}</h1>
            {subtitle && <p className="hidden md:block text-[11px] text-slate-500 font-mono mt-1 truncate">// {subtitle}</p>}
          </div>
          
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center bg-[#131B2F] border border-[#1E293B] rounded-lg px-3 py-1.5 w-64">
                <span className="text-slate-400 text-xs">Buscar productos, órdenes...</span>
            </div>
            <button 
              onClick={() => navigate('/ventas?action=new')}
              className="flex items-center gap-2 px-3 md:px-4 py-2 hover:bg-[#131B2F] text-white text-[12px] font-bold transition-all border border-[#1E293B] rounded-lg active:scale-95 group"
            >
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Nueva venta</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1700px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
