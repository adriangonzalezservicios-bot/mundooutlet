/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Ventas } from "./pages/Ventas";
import { Stock } from "./pages/Stock";
import { Contabilidad } from "./pages/Contabilidad";
import { Taller } from "./pages/Taller";
import { Directorio } from "./pages/Directorio";
import { Compras } from "./pages/Compras";
import { Configuracion } from "./pages/Configuracion";

import { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ShieldCheck, Download, Upload } from "lucide-react";

function Login() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Cuenta creada correctamente");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Bienvenido al sistema");
      }
    } catch (err: any) {
      setError(err.message);
      setAttempts(prev => prev + 1);
      if (attempts >= 4) {
        setIsLocked(true);
        toast.error("Demasiados intentos fallidos. Acceso bloqueado temporalmente.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#010409] flex flex-col items-center justify-center text-red-500 p-4">
        <h1 className="text-4xl font-display font-bold mb-4 uppercase">Terminal Bloqueada</h1>
        <p className="font-mono text-sm">Contacte al administrador del sistema.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010409] flex flex-col items-center justify-center text-[#00f3ff] p-4 text-center">
      <div className="crystal-card p-8 flex flex-col items-center max-w-sm w-full gap-6 border-[#00f3ff]/20">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#00f3ff]/10 border border-[#00f3ff]/30 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl mb-2 font-bold uppercase tracking-widest text-white text-shadow-glow">Mundo Outlet ERP</h1>
          <p className="font-mono text-[10px] opacity-70 tracking-[0.3em] uppercase">Auth Protection: v2.4.0</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-50 ml-1">Terminal ID (Email)</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-[#00f3ff]/20 rounded-sm px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#00f3ff] transition-colors" 
              placeholder="admin@mundooutlet.com.ar"
            />
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-50 ml-1">Access Protocol (Contraseña)</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-[#00f3ff]/20 rounded-sm px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#00f3ff] transition-colors" 
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-500 font-mono text-[10px] text-center bg-red-500/10 p-2 border border-red-500/20">{error}</p>}

          <button 
            type="submit"
            className="w-full py-4 bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] font-bold uppercase tracking-widest text-xs hover:bg-[#00f3ff]/20 transition-all active:scale-95"
          >
            {isRegistering ? "Crear Código de Acceso" : "Validar Credenciales"}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 py-2">
          <div className="flex-1 h-[1px] bg-[#00f3ff]/10" />
          <span className="text-[9px] font-mono opacity-30 uppercase">U O</span>
          <div className="flex-1 h-[1px] bg-[#00f3ff]/10" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 font-mono text-[10px] uppercase border border-white/5 text-white/50 flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
        >
          Acceso Biométrico Google
        </button>

        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-[9px] font-mono uppercase tracking-widest text-[#00f3ff]/40 hover:text-[#00f3ff] transition-colors"
        >
          {isRegistering ? "¿Ya tienes acceso? Validar" : "¿Nuevo Usuario? Solicitar Acceso"}
        </button>
      </div>
    </div>
  );
}

import { Toaster, toast } from "sonner";

export default function App() {
  const { fetchData } = useStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (usr) {
        fetchData();
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010409] flex flex-col items-center justify-center text-[#00f3ff]">
        <div className="w-16 h-16 border-4 border-[#00f3ff]/20 border-t-[#00f3ff] rounded-sm animate-spin mb-4" />
        <p className="font-mono text-sm tracking-[0.3em] font-bold uppercase animate-pulse">Iniciando Sistemas...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Toaster position="top-right" theme="dark" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="compras" element={<Compras />} />
          <Route path="clientes" element={<Directorio />} />
          <Route path="proveedores" element={<Directorio />} />
          <Route path="stock" element={<Stock />} />
          <Route path="taller" element={<Taller />} />
          <Route path="contabilidad" element={<Contabilidad />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
