import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingUp, Package, ShoppingCart, Users, ArrowUpRight, ArrowDownRight, ChevronRight, LayoutDashboard, Truck, Building2, Wrench, DollarSign, Settings, X, Check } from "lucide-react";
import { Area, AreaChart, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useStore } from "../store/useStore";
import { formatCurrency } from "../lib/format";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
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
  showChartStock: boolean;
  showChartProyeccion: boolean;
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
  showChartStock: true,
  showChartProyeccion: true,
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
        setPrefs({ ...prefs, role, showKpiVentas: true, showKpiStock: false, showKpiOrdenes: true, showKpiClientes: true, showChartVentas: true, showChartStatus: true, showChartStock: false, showChartProyeccion: true, showAlertBanners: false, showAlertsPanel: false, showOrdersTable: true });
        break;
      case "Inventario":
        setPrefs({ ...prefs, role, showKpiVentas: false, showKpiStock: true, showKpiOrdenes: false, showKpiClientes: false, showChartVentas: false, showChartStatus: false, showChartStock: true, showChartProyeccion: false, showAlertBanners: true, showAlertsPanel: true, showOrdersTable: false });
        break;
      case "Taller":
        setPrefs({ ...prefs, role, showKpiVentas: false, showKpiStock: false, showKpiOrdenes: false, showKpiClientes: true, showChartVentas: false, showChartStatus: false, showChartStock: false, showChartProyeccion: false, showAlertBanners: true, showAlertsPanel: false, showOrdersTable: false });
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
  let monthlySalesData = Array.from({ length: 12 }).map((_, i) => {
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
  
  if (totalSales === 0) {
    // Elegant dummy data for professional empty state
    monthlySalesData = Array.from({ length: 12 }).map((_, i) => ({
      name: format(new Date(currentYear, i, 1), "MMM", { locale: es }).substring(0, 3).toUpperCase(),
      ventas: Math.floor(Math.random() * 5000000) + 2000000 + (i * 500000)
    }));
  }

  const statusDataRaw = [
    { name: 'Completada', value: sales.filter(s => s.status === 'Completada').length, color: '#10B981' }, 
    { name: 'Pendiente', value: sales.filter(s => s.status === 'Pendiente').length, color: '#F59E0B' },
    { name: 'Cancelada', value: sales.filter(s => s.status === 'Cancelada').length, color: '#EF4444' }
  ];
  let chartStatusData = statusDataRaw.filter(d => d.value > 0);
  if (chartStatusData.length === 0) {
    chartStatusData = [
      { name: 'Completada', value: 85, color: '#10B981' },
      { name: 'Pendiente', value: 12, color: '#F59E0B' },
      { name: 'Cancelada', value: 3, color: '#EF4444' }
    ];
  }

  const lowStockProducts = products.filter(p => p.stock < 5).slice(0, 5);

  const recentOrders = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  // Chart Data: Stock por Categoría
  const categoryStock = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.stock;
    return acc;
  }, {} as Record<string, number>);
  let chartStockData = Object.entries(categoryStock).map(([name, stock]) => ({ name, stock })).sort((a, b) => b.stock - a.stock);
  if (chartStockData.length === 0) {
    chartStockData = [
      { name: 'Heladera', stock: 145 },
      { name: 'Lavarropas', stock: 89 },
      { name: 'Microondas', stock: 45 },
      { name: 'Cocina', stock: 32 }
    ];
  }

  // Chart Data: Proyección Trimestral (Linear projection based on the whole year so far)
  const currentMonthIdx = today.getMonth();
  const last3MonthsSales = [
    monthlySalesData[(currentMonthIdx - 2 + 12) % 12]?.ventas || 0,
    monthlySalesData[(currentMonthIdx - 1 + 12) % 12]?.ventas || 0,
    monthlySalesData[currentMonthIdx]?.ventas || 0,
  ];
  let avgSales = last3MonthsSales.reduce((a, b) => a + b, 0) / 3;
  if (avgSales === 0) avgSales = 100000; // Dummy baseline if 0
  const growthRate = 1.05; // 5% monthly growth
  const chartProyeccionData = [
    { name: format(new Date(currentYear, currentMonthIdx + 1, 1), "MMM", { locale: es }).toUpperCase(), estimado: avgSales * growthRate },
    { name: format(new Date(currentYear, currentMonthIdx + 2, 1), "MMM", { locale: es }).toUpperCase(), estimado: avgSales * Math.pow(growthRate, 2) },
    { name: format(new Date(currentYear, currentMonthIdx + 3, 1), "MMM", { locale: es }).toUpperCase(), estimado: avgSales * Math.pow(growthRate, 3) },
  ];

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
        return <span className="px-2 py-1 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/50 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest">Completado</span>;
      case 'Pendiente':
        return <span className="px-2 py-1 bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/50 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse">Pendiente</span>;
      case 'Cancelada':
        return <span className="px-2 py-1 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/50 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest">Cancelado</span>;
      default:
        return <span className="px-2 py-1 bg-white/5 text-slate-400 border border-slate-500/50 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest">{status}</span>;
    }
  };

  const modules = [
    { name: "Ventas", icon: ShoppingCart, color: "text-[#38bdf8]", bg: "bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20", path: "/ventas" },
    { name: "Compras", icon: Truck, color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20", path: "/compras" },
    { name: "Inventario", icon: Package, color: "text-[#ffaa00]", bg: "bg-[#ffaa00]/10 hover:bg-[#ffaa00]/20", path: "/stock" },
    { name: "Taller", icon: Wrench, color: "text-[#ef4444]", bg: "bg-[#ef4444]/10 hover:bg-[#ef4444]/20", path: "/taller" },
    { name: "Contabilidad", icon: DollarSign, color: "text-[#10b981]", bg: "bg-[#10b981]/10 hover:bg-[#10b981]/20", path: "/contabilidad" },
    { name: "Contactos", icon: Users, color: "text-[#00c3cc]", bg: "bg-[#00c3cc]/10 hover:bg-[#00c3cc]/20", path: "/clientes" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6 md:p-6 w-full pb-20 relative z-10">
      
      {/* Header & Customization */}
      <motion.div variants={itemAnim} className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-white tracking-[0.2em] uppercase" >Inicio</h2>
          <p className="text-[10px] text-[#38bdf8] font-mono mt-0.5 uppercase tracking-widest">Rol Actual: {prefs.role}</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 crystal-button active:scale-95 group text-xs text-[#38bdf8]"
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
            className="crystal-card p-4 flex flex-col items-center justify-center gap-3 hover:bg-[rgba(0,243,255,0.05)] transition-all group"
          >
            <div className={cn("p-4 rounded-sm border border-transparent group-hover:border-[#38bdf8]/30 transition-all", mod.bg)}>
              <mod.icon strokeWidth={1.5} className={cn("w-8 h-8", mod.color, " group-hover:scale-110 transition-transform")} />
            </div>
            <span className="text-xs font-mono font-bold text-[#38bdf8]/70 group-hover:text-[#38bdf8] uppercase tracking-widest">{mod.name}</span>
          </button>
        ))}
      </motion.div>

      {/* Alert Banners */}
      {prefs.showAlertBanners && (
        <div className="flex flex-col gap-3">
          {lowStockProducts.length > 0 && (
            <motion.div variants={itemAnim} className="bg-[#ffaa00]/10 border border-[#ffaa00]/50 rounded-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#ffaa00]">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-xs font-mono uppercase tracking-widest font-bold">Hay {lowStockProducts.length} productos con stock mínimo. Debes reponer inventario.</span>
              </div>
              <Link to="/stock" className="px-4 py-1.5 bg-[#ffaa00]/20 hover:bg-[#ffaa00]/30 transition-colors border border-[#ffaa00] rounded-sm text-[10px] font-mono font-bold tracking-widest uppercase text-[#ffaa00]">
                Ver Stock
              </Link>
            </motion.div>
          )}
          <motion.div variants={itemAnim} className="bg-[#ef4444]/10 border border-[#ef4444]/50 rounded-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[#ef4444]">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">Equipos pendientes diagnóstico: {workshopJobs.filter(j => j.status === 'Pendiente').length}</span>
            </div>
            <Link to="/taller" className="px-4 py-1.5 bg-[#ef4444]/20 hover:bg-[#ef4444]/30 transition-colors border border-[#ef4444] rounded-sm text-[10px] font-mono font-bold tracking-widest uppercase text-[#ef4444]">
              Ir al Taller
            </Link>
          </motion.div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: "ventas", show: prefs.showKpiVentas, title: "VENTAS HOY", value: formatCurrency(salesToday), trend: `+${salesTrend.toFixed(1)}%`, trendUp: salesTrend >= 0, icon: TrendingUp, compare: "ayer", color: "text-[#38bdf8]", borderAccent: "border-b-[3px] border-b-[#38bdf8]", dropShadow: "" },
          { id: "stock", show: prefs.showKpiStock, title: "STOCK TOTAL", value: totalStock.toString(), trend: "-2 unid.", trendUp: false, icon: Package, compare: "ayer", color: "text-[#ffaa00]", borderAccent: "border-b-[3px] border-b-[#ffaa00]", dropShadow: "" },
          { id: "ordenes", show: prefs.showKpiOrdenes, title: "ÓRDENES", value: sales.length.toString(), trend: `+${sales.filter(s => isSameDay(new Date(s.date), today)).length} nuevas`, trendUp: true, icon: ShoppingCart, compare: "hoy", color: "text-[#10b981]", borderAccent: "border-b-[3px] border-b-[#10b981]", dropShadow: "" },
          { id: "clientes", show: prefs.showKpiClientes, title: "CLIENTES", value: totalClients.toString(), trend: "+5.2%", trendUp: true, icon: Users, compare: "vs mes ant.", color: "text-[#8b5cf6]", borderAccent: "border-b-[3px] border-b-[#8b5cf6]", dropShadow: "" },
        ].filter(kpi => kpi.show).map((kpi, idx) => (
          <motion.div key={kpi.id} variants={itemAnim} className={cn("crystal-card p-5 relative overflow-hidden flex flex-col justify-between group", kpi.borderAccent)}>
            {/* Technical Header Bar */}
            <div className="absolute top-0 right-10 px-2 py-0.5 bg-[#38bdf8]/10 border-x border-b border-[#38bdf8]/20 text-[7px] font-mono text-[#38bdf8] z-20">
               KPI_NODE_{idx + 10}
            </div>
            
            {/* HUD Scanning Line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent animate-[pan_3s_infinite] pointer-events-none" />

            <div className="flex items-start justify-between mb-2 z-10">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest", kpi.color)}>{kpi.title}</span>
              </div>
              <div className={cn("p-1.5 rounded-sm bg-white/5 border border-white/10")}>
                  <kpi.icon strokeWidth={1.5} className={cn("w-4 h-4", kpi.color, kpi.dropShadow)} />
              </div>
            </div>
            <div className="mb-2 mt-4 z-10">
              <span className="text-2xl font-display font-medium text-white tracking-widest" >{kpi.value}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono z-10">
              <span className={cn("flex items-center font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest bg-black/40 border", kpi.trendUp ? "text-[#10b981] border-[#10b981]/30" : "text-[#ef4444] border-[#ef4444]/30")}>
                {kpi.trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {kpi.trend}
              </span>
              <span className="text-[#38bdf8]/50 uppercase tracking-widest">VS {kpi.compare}</span>
            </div>
            {/* Background glowing orb relative to KPI */}
            <div className={cn("absolute right-[-20%] top-[-20%] w-32 h-32 rounded-full blur-2xl opacity-20", kpi.color.replace('text-', 'bg-'))} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:p-6">
        {/* Main Chart */}
        {prefs.showChartVentas && (
          <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col lg:col-span-2 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="flex items-center justify-between mb-8 z-10">
              <div>
                <h3 className="text-base font-display font-medium text-white tracking-[0.1em] uppercase">Tendencia de Ventas</h3>
                <p className="text-xs text-[#38bdf8]/50 font-mono mt-1">AÑO ACTUAL ({currentYear}) · ARS</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#38bdf8]" />
                  <span className="text-xs text-[#38bdf8]/70 font-mono uppercase tracking-widest">Ventas Totales</span>
                </div>
              </div>
            </div>
            
            <div className="h-[280px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySalesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,243,255,0.5)', fontSize: 11, fontFamily: 'monospace'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(0,243,255,0.5)', fontSize: 11, fontFamily: 'monospace'}} tickFormatter={(val) => `$${(val/1000000).toLocaleString()}M`} dx={-10} />
                  <Tooltip 
                    cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }}
                    contentStyle={{ backgroundColor: "rgba(1, 4, 9, 0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(0, 243, 255, 0.3)", borderRadius: "4px", color: "#38bdf8", fontSize: "13px", fontFamily: "monospace", textTransform: 'uppercase', boxShadow: "0 0 15px rgba(0, 243, 255, 0.2)", padding: "12px" }}
                    formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  />
                  <Area type="monotone" dataKey="ventas" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorVentas)" activeDot={{ r: 6, fill: "#38bdf8", stroke: "#09090b", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-4 lg:col-span-1">
          {prefs.showChartStatus && (
            <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col flex-1 min-h-[200px]">
              <div className="mb-4">
                <h3 className="text-base font-display font-medium text-white tracking-[0.1em] uppercase">Estados de Órdenes</h3>
                <p className="text-xs text-[#38bdf8]/50 font-mono mt-1">HISTÓRICO GLOBAL</p>
              </div>
              <div className="flex-1 w-full relative min-h-[150px]">
                {/* HUD Scanner Graphics */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#38bdf8]/10 rounded-full animate-pulse pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-dashed border-[#38bdf8]/5 rounded-full pointer-events-none" />
                
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
                      {chartStatusData.map((entry, index) => {
                        let HUDColor = '#38bdf8';
                        if (entry.name === 'Completada') HUDColor = '#10b981';
                        else if (entry.name === 'Pendiente') HUDColor = '#ffaa00';
                        else if (entry.name === 'Cancelada') HUDColor = '#ef4444';
                        
                        return <Cell key={`cell-${index}`} fill={HUDColor} style={{ filter: `drop-shadow(0px 0px 5px ${HUDColor})` }} />
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "rgba(1, 4, 9, 0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(0, 243, 255, 0.3)", borderRadius: "4px", color: "#38bdf8", fontSize: "13px", fontFamily: "monospace", textTransform: 'uppercase', boxShadow: "0 0 15px rgba(0, 243, 255, 0.2)", padding: "12px" }}
                      formatter={(value: number) => [value, 'Órdenes']}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(0,243,255,0.7)', textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Realtime Alerts / Side Panel */}
          {prefs.showAlertsPanel && (
            <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col flex-1">
              <div className="mb-6">
                <h3 className="text-base font-display font-medium text-white tracking-[0.1em] uppercase">Alertas de Stock</h3>
                <p className="text-xs text-[#38bdf8]/50 font-mono mt-1 uppercase">{lowStockProducts.length} productos críticos</p>
              </div>
              
              <div className="space-y-4 flex-1 custom-scrollbar overflow-y-auto max-h-[200px]">
                {lowStockProducts.map(p => (
                  <div key={p.sku} className="flex items-start gap-3 border-b border-[#38bdf8]/10 pb-3 last:border-0">
                    <div className="mt-1">
                      <AlertTriangle className="w-4 h-4 text-[#ef4444] animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-mono font-bold text-[#f8fafc] uppercase">{p.brand} {p.model}</p>
                      <p className="text-[10px] font-mono text-[#ffaa00] mt-1">{p.stock} UNID. (MÍNIMO 5)</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <p className="text-sm font-mono text-[#38bdf8]/50 uppercase tracking-widest text-center">Sin anomalías</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:p-6 pb-0 pt-0">
        {prefs.showChartStock && (
          <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col min-h-[280px]">
            <div className="mb-6">
              <h3 className="text-base font-display font-medium text-white tracking-[0.1em] uppercase">Stock por Categoría</h3>
              <p className="text-xs text-[#38bdf8]/50 font-mono mt-1">ANÁLISIS DE INVENTARIO</p>
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartStockData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,243,255,0.1)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,243,255,0.5)', fontSize: 11, fontFamily: 'monospace'}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,243,255,0.7)', fontSize: 10, fontFamily: 'monospace'}} width={90} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 243, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: "rgba(1, 4, 9, 0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(0, 243, 255, 0.3)", borderRadius: "4px", color: "#38bdf8", fontSize: "13px", fontFamily: "monospace", textTransform: 'uppercase', boxShadow: "0 0 15px rgba(0, 243, 255, 0.2)", padding: "12px" }}
                    formatter={(value: number) => [`${value} unid.`, 'Stock']}
                  />
                  <Bar dataKey="stock" fill="#38bdf8" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {prefs.showChartProyeccion && (
          <motion.div variants={itemAnim} className="crystal-card p-4 md:p-6 flex flex-col min-h-[280px]">
            <div className="mb-6">
              <h3 className="text-base font-display font-medium text-white tracking-[0.1em] uppercase">Proyección Trimestral</h3>
              <p className="text-xs text-[#38bdf8]/50 font-mono mt-1">BASE ALGORÍTMICA (+5% CREC.)</p>
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartProyeccionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEstimado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,255,102,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,255,102,0.5)', fontSize: 11, fontFamily: 'monospace'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(0,255,102,0.5)', fontSize: 11, fontFamily: 'monospace'}} tickFormatter={(val) => `$${(val/1000000).toLocaleString()}M`} dx={-10} />
                  <Tooltip 
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4', fill: 'transparent' }}
                    contentStyle={{ backgroundColor: "rgba(1, 4, 9, 0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(0, 255, 102, 0.3)", borderRadius: "4px", color: "#10b981", fontSize: "13px", fontFamily: 'monospace', textTransform: 'uppercase', boxShadow: "0 0 15px rgba(0, 255, 102, 0.2)", padding: "12px" }}
                    formatter={(value: number) => [formatCurrency(value), 'Proyección']}
                  />
                  <Area type="monotone" dataKey="estimado" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEstimado)" activeDot={{ r: 6, fill: "#10b981", stroke: "#09090b", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Orders List */}
      {prefs.showOrdersTable && (
        <motion.div variants={itemAnim} className="flex flex-col gap-4">
          <div className="p-2 md:p-4 border-b border-[#38bdf8]/20 flex items-end justify-between">
            <div>
              <h3 className="text-base font-display font-medium text-white tracking-[0.1em] uppercase">Últimas Órdenes</h3>
              <p className="text-xs text-[#38bdf8]/50 font-mono mt-1">ACTUALIZACIÓN EN TIEMPO REAL</p>
            </div>
            <button className="text-[10px] font-mono tracking-widest uppercase text-[#38bdf8]/60 hover:text-[#38bdf8] transition-colors flex items-center font-bold">
              Ver todas <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {recentOrders.map(order => (
              <motion.div 
                key={order.id} 
                className="crystal-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:bg-[#38bdf8]/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-[140px]">
                  <div className="w-10 h-10 rounded-sm bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8] border border-[#38bdf8]/30">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-[#38bdf8] uppercase tracking-widest">#ORD-{order.id.slice(0,4)}</span>
                    <span className="text-[10px] font-mono text-[#38bdf8]/50">{format(new Date(order.date), "HH:mm")}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center min-w-[150px]">
                  <span className="text-xs font-mono font-bold text-[#f8fafc] uppercase tracking-wider">{order.clientId}</span>
                  <span className="text-[10px] text-[#38bdf8]/60 font-mono uppercase tracking-widest truncate" title={order.items[0]?.name || 'Varios artículos'}>
                    {order.items[0]?.name || 'Varios artículos'} {order.items.length > 1 && `(+${order.items.length - 1} MÁS)`}
                  </span>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 min-w-[200px]">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold font-mono text-[#38bdf8] tracking-widest w-24 text-right" >
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </motion.div>
            ))}
            {recentOrders.length === 0 && (
               <div className="crystal-card p-8 text-center text-[#38bdf8]/50 text-sm font-mono tracking-widest uppercase">
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
                      { key: 'showChartVentas', label: 'Gráfico - Ventas Totales' },
                      { key: 'showChartStock', label: 'Gráfico - Stock por Categoría' },
                      { key: 'showChartProyeccion', label: 'Gráfico - Proyección Trimestral' },
                      { key: 'showAlertsPanel', label: 'Panel - Alertas de Stock Bajo' },
                      { key: 'showOrdersTable', label: 'Tabla - Últimas Órdenes' },
                    ].map(toggle => (
                      <label key={toggle.key} className="flex items-center justify-between p-3 rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/5 cursor-pointer hover:bg-[#38bdf8]/10 transition-colors">
                        <span className="text-sm font-medium text-[#38bdf8]">{toggle.label}</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={prefs[toggle.key as keyof DashboardPreferences] as boolean}
                            onChange={(e) => setPrefs({ ...prefs, [toggle.key]: e.target.checked, role: 'Admin' })}
                          />
                          <div className={cn(
                            "w-10 h-6 rounded-sm transition-colors border border-[#38bdf8]/50",
                            prefs[toggle.key as keyof DashboardPreferences] ? "bg-[#38bdf8]" : "bg-transparent"
                          )}>
                            <div className={cn(
                              "absolute top-1 left-1 bg-white w-4 h-4 rounded-sm transition-transform",
                              prefs[toggle.key as keyof DashboardPreferences] ? "translate-x-4" : "translate-x-0"
                            )}></div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-[#38bdf8]/20 bg-[#38bdf8]/5">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-2.5 bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] border border-[#38bdf8]/50 rounded-sm font-display font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 active:scale-95"
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
