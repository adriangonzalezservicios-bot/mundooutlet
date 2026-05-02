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

export default function App() {
  return (
    <HashRouter>
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
