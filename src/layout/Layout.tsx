import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalSearch } from "../components/GlobalSearch";
import { useStore } from "../store/useStore";

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
  const { uiConfig } = useStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Dynamic Theme Application
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', uiConfig.primaryColor);
    root.style.setProperty('--secondary-color', uiConfig.secondaryColor);
    
    // Derived colors for hover/overlay
    // root.style.setProperty('--primary-hover', `${uiConfig.primaryColor}cc`);
    // root.style.setProperty('--border-color', `${uiConfig.primaryColor}33`);
    
    // Apply theme-specific tweaks
    if (uiConfig.theme === 'minimal') {
      root.style.setProperty('--bg-start', '#ffffff');
      root.style.setProperty('--bg-end', '#f8fafc');
    } else {
      root.style.setProperty('--bg-start', '#09090b');
      root.style.setProperty('--bg-end', '#030816');
    }

    // Inject custom AI-generated CSS
    const styleId = 'ai-custom-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = uiConfig.customCss || '';
  }, [uiConfig]);

  return (
    <div className={cn(
      "flex min-h-screen text-[#f8fafc] font-sans selection:bg-[#38bdf8]/30 overflow-hidden relative transition-colors duration-500",
      uiConfig.theme === 'minimal' ? 'bg-slate-50 text-slate-900' : 'bg-[#09090b] text-[#f8fafc]'
    )}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-inherit">
        {/* Deep background mesh gradients */}
        <div 
          className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: uiConfig.primaryColor }}
        />
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[130px] opacity-10"
          style={{ backgroundColor: uiConfig.secondaryColor }}
        />
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
        {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-300 min-w-0 relative z-10 w-full overflow-x-hidden">
        
        <header className="h-16 md:h-20 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-20 flex items-center px-4 md:px-8 gap-4 md:gap-6 shrink-0 transition-all">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white transition-colors lg:hidden focus:outline-none"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-lg md:text-xl font-display font-medium leading-tight text-white tracking-wide truncate">{title}</h1>
            {subtitle && <p className="hidden md:block text-[12px] text-zinc-400 font-sans mt-0.5 truncate tracking-wide">{subtitle}</p>}
          </div>
          
          <div className="ml-auto flex items-center gap-2 md:gap-4 flex-1 justify-end">
            <GlobalSearch />
            <button 
              onClick={() => navigate('/ventas?action=new')}
              className="flex items-center gap-2 px-3 md:px-4 py-2 crystal-button active:scale-95 group text-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva venta</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1700px] mx-auto w-full relative">
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
