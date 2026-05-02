import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingUp, Package, ShoppingCart, Users, ArrowUpRight, ArrowDownRight, ChevronRight, LayoutDashboard, Truck, Building2, Wrench, DollarSign, Settings, X, Check } from "lucide-react";
import { Area, AreaChart, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useStore } from "../store/useStore";
import { formatCurrency } from "../lib/format";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

type DashboardRole = "Admin" | "Ventas" | "Inventario" | "Taller";

interface DashboardPreferences {
  role: DashboardRole;
  showKpiVentas: boolean;
  showKpiStock: boolean;
  showKpiOrdenes: boolean;
  showKpiClientes: boolean;
  showChartVentas: boolean;
  showChartStatus: boolean;
  showAlertBanners: boolean;
  showAlertsPanel: boolean;
  showOrdersTable: boolean;
}

const defaultPreferences: DashboardPreferences = {
  role: "Admin",
  showKpiVentas: true,
  showKpiStock: true,
  showKpiOrdenes: true,
  showKpiClientes: true,
  showChartVentas: true,
  showChartStatus: true,
  showAlertBanners: true,
  showAlertsPanel: true,
  showOrdersTable: true,
};

export function Dashboard() {
  const { products, sales, workshopJobs, clients } = useStore();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState<DashboardPreferences>(() => {
    const saved = localStorage.getItem("mundo_outlet_dashboard_prefs");
    return saved ? JSON.parse(saved) : defaultPreferences;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem("mundo_outlet_dashboard_prefs", JSON.stringify(prefs));
  }, [prefs]);

  const applyRolePreset = (role: DashboardRole) => {
    switch (role) {
      case "Ventas":
        setPrefs({ ...prefs, role, showKpiVentas: true, showKpiStock: false, showKpiOrdenes: true, showKpiClientes: true, showChartVentas: true, showChartStatus: true, showAlertBanners: false, showAlertsPanel: false, showOrdersTable: true });
        break;
      case "Inventario":
        setPrefs({ ...prefs, role, showKpiVentas: false, showKpiStock: true, showKpiOrdenes: false, showKpiClientes: false, showChartVentas: false, showChartStatus: false, showAlertBanners: true, showAlertsPanel: true, showOrdersTable: false });
        break;
      case "Taller":
        setPrefs({ ...prefs, role, showKpiVentas: false, showKpiStock: false, showKpiOrdenes: false, showKpiClientes: true, showChartVentas: false, showChartStatus: false, showAlertBanners: true, showAlertsPanel: false, showOrdersTable: false });
        break;
      case "Admin":
      default:
        setPrefs({ ...defaultPreferences, role });
        break;
    }
  };

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalClients = clients.length;
  
  const today = new Date();
  const salesToday = sales.filter(s => isSameDay(new Date(s.date), today)).reduce((sum, s) => sum + s.total, 0);

  // Mock past data for KPI differences
  const salesYesterday = salesToday * 0.88; // dummy for +12.4%
  const salesTrend = salesYesterday === 0 ? 0 : ((salesToday - salesYesterday) / salesYesterday) * 100;

  // Chart Data: Ventas mensuales del año actual
  const currentYear = today.getFullYear();
  const monthlySalesData = Array.from({ length: 12 }).map((_, i) => {
    const startOfMonth = new Date(currentYear, i, 1);
    const endOfMonth = new Date(currentYear, i + 1, 0, 23, 59, 59, 999);
    
    const salesInMonth = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startOfMonth && saleDate <= endOfMonth;
    }).reduce((sum, s) => sum + s.total, 0);

    return {
      name: format(startOfMonth, "MMM", { locale: es }).substring(0, 3).toUpperCase(),
      ventas: salesInMonth
    };
  });

  const statusDataRaw = [
    { name: 'Completada', value: sales.filter(s => s.status === 'Completada').length, color: '#10B981' }, 
    { name: 'Pendiente', value: sales.filter(s => s.status === 'Pendiente').length, color: '#F59E0B' },
    { name: 'Cancelada', value: sales.filter(s => s.status === 'Cancelada').length, color: '#EF4444' }
  ];
  const chartStatusData = statusDataRaw.filter(d => d.value > 0);

  const lowStockProducts = products.filter(p => p.stock < 5).slice(0, 5);

  const recentOrders = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Completada':
        return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">Completado</span>;
      case 'Pendiente':
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold">Pendiente</span>;
      case 'Cancelada':
        return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold">Cancelado</span>;
      default:
        return <span className="px-2 py-1 bg-[#1E293B]0/10 text-slate-400 border border-slate-500/20 rounded-md text-[10px] font-bold">{status}</span>;
    }
  };

  const modules = [
    { name: "Ventas", icon: ShoppingCart, color: "text-[#38bdf8]", bg: "bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20", path: "/ventas" },
    { name: "Compras", icon: Truck, color: "text-purple-400", bg: "bg-purple-400/10 hover:bg-purple-400/20", path: "/compras" },
    { name: "Inventario", icon: Package, color: "text-amber-400", bg: "bg-amber-400/10 hover:bg-amber-400/20", path: "/stock" },
    { name: "Taller", icon: Wrench, color: "text-red-400", bg: "bg-red-400/10 hover:bg-red-400/20", path: "/taller" },
    { name: "Contabilidad", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10 hover:bg-emerald-400/20", path: "/contabilidad" },
    { name: "Contactos", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10 hover:bg-blue-400/20", path: "/clientes" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 md:p-6 w-full pb-20">
      
      {/* Header & Customization */}
      <motion.div variants={itemAnim} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Inicio</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">// Rol Actual: {prefs.role}</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 transition-colors border border-slate-700/50 rounded-lg text-sm font-medium text-slate-300"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Personalizar</span>
        </button>
      </motion.div>

      {/* Odoo-style App Launcher Grid */}
      <motion.div variants={itemAnim} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {modules.map((mod) => (
          <button 
            key={mod.name}
            onClick={() => navigate(mod.path)}
            className="crystal-card p-4 flex flex-col items-center justify-center gap-3 transition-transform hover:-translate-y-1 group"
          >
            <div className={cn("p-4 rounded-2xl transition-colors", mod.bg)}>
              <mod.icon className={cn("w-8 h-8", mod.color)} />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white">{mod.name}</span>
          </button>
        ))}
      </motion.div>

      {/* Alert Banners */}
      {prefs.showAlertBanners && (
        <div className="flex flex-col gap-3">
          {lowStockProducts.length > 0 && (
            <motion.div variants={itemAnim} className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Hay {lowStockProducts.length} productos con stock mínimo. Debes reponer inventario.</span>
              </div>
              <Link to="/stock" className="px-4 py-1.5 bg-amber-900/40 hover:bg-amber-900/60 transition-colors border border-amber-800/50 rounded-lg text-xs font-bold text-amber-300">
                Ver Stock
              </Link>
            </motion.div>
          )}
          <motion.div variants={itemAnim} className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-300">
              <AlertTriangle className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-medium">Equipos en taller pendientes de diagnóstico: {workshopJobs.filter(j => j.status === 'Pendiente').length}</span>
            </div>
            <Link to="/taller" className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600 rounded-lg text-xs font-bold text-slate-300">
              Ir al Taller
            </Link>
          </motion.div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: "ventas", show: prefs.showKpiVentas, title: "VENTAS HOY", value: formatCurrency(salesToday), trend: `+${salesTrend.toFixed(1)}%`, trendUp: salesTrend >= 0, icon: TrendingUp, compare: "ayer", color: "text-[#38bdf8]", bg: "bg-[#38bdf8]/10" },
          { id: "stock", show: prefs.showKpiStock, title: "STOCK TOTAL", value: totalStock.toString(), trend: "-2 unid.", trendUp: false, icon: Package, compare: "ayer", color: "text-amber-400", bg: "bg-amber-400/10" },
          { id: "ordenes", show: prefs.showKpiOrdenes, title: "ÓRDENES", value: sales.length.toString(), trend: `+${sales.filter(s => isSameDay(new Date(s.date), today)).length} nuevas`, trendUp: true, icon: ShoppingCart, compare: "hoy", color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { id: "clientes", show: prefs.showKpiClientes, title: "CLIENTES", value: totalClients.toString(), trend: "+5.2%", trendUp: true, icon: Users, compare: "vs mes ant.", color: "text-slate-400", bg: "bg-slate-800" },
        ].filter(kpi => kpi.show).map((kpi) => (
          <motion.div key={kpi.id} variants={itemAnim} className="crystal-card p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.title}</span>
                <div className={cn("p-1.5 rounded-lg border border-white/5", kpi.bg)}>
                  <kpi.icon className={cn("w-3.5 h-3.5", kpi.color)} />
                </div>
              </div>
            </div>
            <div className="mb-2">
              <span className="text-2xl font-display font-bold text-white">{kpi.value}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className={cn("flex items-center font-bold", kpi.trendUp ? "text-emerald-400" : "text-red-400")}>
                {kpi.trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {kpi.trend}
              </span>
              <span className="text-slate-500">vs {kpi.compare}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:p-6">
        {/* Main Chart */}
        {prefs.showChartVentas && (
          <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Tendencia de Ventas</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">// Año actual ({currentYear}) · ARS</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#38bdf8]" />
                  <span className="text-xs text-slate-400">Ventas Totales</span>
                </div>
              </div>
            </div>
            
            <div className="h-[240px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} tickFormatter={(val) => `$${(val/1000000).toLocaleString()}M`} />
                  <Tooltip 
                    cursor={{ fill: '#1E293B' }}
                    contentStyle={{ backgroundColor: "#131B2F", border: "1px solid #1E293B", borderRadius: "8px", color: "#F8FAFC", fontSize: "12px", fontFamily: "monospace" }}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  />
                  <Bar dataKey="ventas" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-4 lg:col-span-1">
          {prefs.showChartStatus && (
            <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col flex-1 min-h-[200px]">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white tracking-tight">Estados de Órdenes</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">// Histórico global</p>
              </div>
              <div className="flex-1 w-full relative min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#131B2F", border: "1px solid #1E293B", borderRadius: "8px", color: "#F8FAFC", fontSize: "12px", fontFamily: "monospace" }}
                      formatter={(value: number) => [value, 'Órdenes']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: '#8A93A6' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Realtime Alerts / Side Panel */}
          {prefs.showAlertsPanel && (
            <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col flex-1">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight">Alertas de Stock</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">// {lowStockProducts.length} productos críticos</p>
              </div>
              
              <div className="space-y-4 flex-1">
                {lowStockProducts.map(p => (
                  <div key={p.sku} className="flex items-start gap-3">
                    <div className="mt-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{p.brand} {p.model}</p>
                      <p className="text-xs font-mono text-slate-500">{p.stock} unid. (mínimo 5)</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No hay alertas de stock bajo</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Orders List */}
      {prefs.showOrdersTable && (
        <motion.div variants={itemAnim} className="flex flex-col gap-4">
          <div className="p-2 md:p-4 border-b border-white/5 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Últimas Órdenes</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">// Actualizando en tiempo real</p>
            </div>
            <button className="text-xs text-slate-400 hover:text-white transition-colors flex items-center font-medium">
              Ver todas <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {recentOrders.map(order => (
              <motion.div 
                key={order.id} 
                className="crystal-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-4 min-w-[140px]">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-blue-400">#ORD-{order.id.slice(0,4)}</span>
                    <span className="text-xs font-mono text-slate-500">{format(new Date(order.date), "HH:mm")}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-[150px]">
                  <span className="text-sm font-medium text-slate-200">{order.clientId}</span>
                  <span className="text-xs text-slate-500 truncate" title={order.items[0]?.name || 'Varios artículos'}>
                    {order.items[0]?.name || 'Varios artículos'} {order.items.length > 1 && `(+${order.items.length - 1} más)`}
                  </span>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 min-w-[200px]">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold font-mono text-white tracking-tight w-24 text-right">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </motion.div>
            ))}
            {recentOrders.length === 0 && (
               <div className="crystal-card p-8 text-center text-slate-500 text-sm">
                 No hay órdenes recientes
               </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Customization Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0A111E]/80 backdrop-blur-sm z-50"
              onClick={() => setShowSettings(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#131B2F] border border-[#1E293B] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 md:p-6 border-b border-[#1E293B] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Personalizar Dashboard</h3>
                  <p className="text-xs text-slate-400 mt-1">Configura las vistas según tu rol</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto space-y-6">
                {/* Roles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rol Preconfigurado</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Admin", "Ventas", "Inventario", "Taller"] as DashboardRole[]).map(role => (
                      <button
                        key={role}
                        onClick={() => applyRolePreset(role)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                          prefs.role === role 
                            ? "bg-[#38bdf8]/10 border-[#38bdf8]/50 text-[#38bdf8]"
                            : "bg-[#1E293B] border-slate-700/50 text-slate-300 hover:bg-slate-800"
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visibilidad de Widgets</h4>
                  <div className="grid gap-2">
                    {[
                      { key: 'showKpiVentas', label: 'KPI - Ventas Hoy' },
                      { key: 'showKpiStock', label: 'KPI - Stock Total' },
                      { key: 'showKpiOrdenes', label: 'KPI - Órdenes' },
                      { key: 'showKpiClientes', label: 'KPI - Clientes' },
                      { key: 'showAlertBanners', label: 'Banners de Alertas Generales' },
                      { key: 'showChartVentas', label: 'Gráfico - Ventas Mensuales' },
                      { key: 'showAlertsPanel', label: 'Panel - Alertas de Stock Bajo' },
                      { key: 'showOrdersTable', label: 'Tabla - Últimas Órdenes' },
                    ].map(toggle => (
                      <label key={toggle.key} className="flex items-center justify-between p-3 rounded-lg border border-[#1E293B] bg-[#0A111E]/50 cursor-pointer hover:bg-slate-800/30 transition-colors">
                        <span className="text-sm font-medium text-slate-300">{toggle.label}</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={prefs[toggle.key as keyof DashboardPreferences] as boolean}
                            onChange={(e) => setPrefs({ ...prefs, [toggle.key]: e.target.checked, role: 'Admin' })}
                          />
                          <div className={cn(
                            "w-10 h-6 rounded-full transition-colors",
                            prefs[toggle.key as keyof DashboardPreferences] ? "bg-[#38bdf8]" : "bg-slate-700"
                          )}>
                            <div className={cn(
                              "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                              prefs[toggle.key as keyof DashboardPreferences] ? "translate-x-4" : "translate-x-0"
                            )}></div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-[#1E293B] bg-[#0A111E]/50">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-2.5 bg-[#38bdf8] hover:bg-[#0284c7] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Listo
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
