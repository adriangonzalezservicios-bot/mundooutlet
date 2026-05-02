import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  Users, 
  Building2, 
  Package, 
  Wrench, 
  DollarSign, 
  Settings 
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const navItems = [
  { text: "Dashboard", href: "/", icon: LayoutDashboard },
  { text: "Ventas", href: "/ventas", icon: ShoppingCart },
  { text: "Compras", href: "/compras", icon: Truck },
  { text: "Clientes", href: "/clientes", icon: Users },
  { text: "Proveedores", href: "/proveedores", icon: Building2 },
  { text: "Stock", href: "/stock", icon: Package },
  { text: "Taller", href: "/taller", icon: Wrench },
  { text: "Contabilidad", href: "/contabilidad", icon: DollarSign },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {/* Mobile Backdrop */}
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-[#0A111E]/70 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col items-stretch",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-20 flex items-center px-8 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 shrink-0 mr-4">
             <div className="w-full h-full bg-[#38bdf8] rounded-xl flex items-center justify-center text-[#0A111E] text-sm font-bold shadow-[0_0_20px_rgba(56,189,248,0.3)]">MO</div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xl font-display font-bold text-white tracking-tight">Mundo Outlet</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">v2.4.1 · ERP</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 mb-4 text-[10px] uppercase tracking-widest font-bold text-[#38bdf8]/80 mt-2">Principal</p>
          {navItems.map((item, index) => (
            <div key={item.href}>
              {index === 6 && <p className="px-4 mb-4 mt-8 text-[10px] uppercase tracking-widest font-bold text-[#38bdf8]/80">Servicios</p>}
              <NavLink
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "group relative flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "text-white" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-4">
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-[#38bdf8]" : "text-slate-500 group-hover:text-slate-300"
                      )} />
                      {item.text}
                    </div>
                    {item.text === "Taller" && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">3</div>
                    )}
                    
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute inset-0 bg-[#38bdf8]/10 rounded-lg border border-[#38bdf8]/20"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </div>
          ))}
          
          <div className="pt-6 mt-6 border-t border-[#1E293B]">
            <NavLink
              to="/configuracion"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "group relative flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "text-white" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  <Settings className={cn("w-5 h-5 transition-colors", isActive ? "text-[#38bdf8]" : "text-slate-500")} />
                  Configuración
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-[#38bdf8]/10 rounded-lg border border-[#38bdf8]/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Footer Area */}
        <div className="p-6 border-t border-white/5 bg-black/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#38bdf8] flex items-center justify-center text-sm font-bold text-[#0A111E]">AA</div>
               <div className="flex flex-col min-w-0">
                 <p className="text-sm font-bold text-white truncate">Admin</p>
                 <p className="text-[11px] text-slate-500 font-mono truncate">Administrador</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
