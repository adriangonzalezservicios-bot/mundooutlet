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
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

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
          "fixed inset-y-0 left-0 z-40 w-72 bg-[#09090b]/95 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col items-stretch overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-20 flex items-center px-8 border-b border-white/5 shrink-0 relative z-10">
          <div className="w-10 h-10 shrink-0 mr-4 relative">
             <div className="w-full h-full border border-white/10 rounded-xl flex items-center justify-center text-white text-sm font-display font-medium relative z-10 bg-white/5">MO</div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[15px] font-display font-bold text-white tracking-wide">Mundo Outlet</p>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5 tracking-wider">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 mb-4 text-[10px] uppercase tracking-widest font-sans font-bold text-zinc-500 mt-2">Principal</p>
          {navItems.map((item, index) => (
            <div key={item.href}>
              {index === 6 && <p className="px-4 mb-4 mt-8 text-[10px] uppercase tracking-widest font-sans font-bold text-zinc-500">Servicios</p>}
              <NavLink
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "group relative flex items-center justify-between px-4 py-2.5 rounded-md text-[13px] font-sans transition-all duration-200 tracking-wide font-medium",
                  isActive 
                    ? "text-white bg-white/5" 
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 z-10">
                      <item.icon strokeWidth={2} className={cn(
                        "w-[18px] h-[18px] transition-all",
                        isActive ? "text-[#38bdf8]" : "text-zinc-500 group-hover:text-zinc-300"
                      )} />
                      {item.text}
                    </div>
                    {item.text === "Taller" && (
                      <div className="w-5 h-5 rounded-md bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-center justify-center text-[10px] font-mono font-bold text-[#ef4444] z-10">3</div>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          ))}
          
          <div className="pt-6 mt-6 border-t border-white/5">
            <NavLink
              to="/configuracion"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "group relative flex items-center gap-3 px-4 py-2.5 rounded-md text-[13px] font-sans transition-all duration-200 tracking-wide font-medium",
                isActive 
                  ? "text-white bg-white/5" 
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              {({ isActive }) => (
                <>
                  <Settings strokeWidth={2} className={cn("w-[18px] h-[18px] transition-colors z-10", isActive ? "text-[#38bdf8]" : "text-zinc-500 group-hover:text-zinc-300")} />
                  <span className="z-10">Configuración</span>
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Minimal Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
          <span>v2.0.4-CRYSTAL</span>
          <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full" />
        </div>
      </div>
    </>
  );
}
