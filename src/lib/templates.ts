import * as XLSX from 'xlsx';

export const downloadTemplate = (type: 'inventory' | 'expenses' | 'sales') => {
  let data: any[] = [];
  let fileName = "";

  switch (type) {
    case 'inventory':
      data = [{
        SKU: "HEL-001",
        Marca: "Samsung",
        Modelo: "RT38",
        Categoria: "Heladeras",
        Stock: 10,
        Costo: 50000,
        Precio_Mayorista: 65000,
        Precio_Minorista: 75000
      }];
      fileName = "Plantilla_Inventario.xlsx";
      break;
    case 'expenses':
      data = [{
        Fecha: "2024-05-01",
        Categoria: "Logística",
        Monto: 1500,
        Descripcion: "Flete de mercadería",
        Metodo_Pago: "Efectivo"
      }];
      fileName = "Plantilla_Gastos.xlsx";
      break;
    case 'sales':
      data = [{
        Fecha: "2024-05-01",
        Cliente_Nombre: "Juan Perez",
        SKU_Producto: "HEL-001",
        Cantidad: 1,
        Precio_Unitario: 75000,
        Total: 75000,
        Metodo_Pago: "Transferencia"
      }];
      fileName = "Plantilla_Ventas.xlsx";
      break;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
  XLSX.writeFile(wb, fileName);
};
