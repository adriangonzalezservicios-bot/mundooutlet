import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { useStore, Product } from "../store/useStore";
import * as XLSX from 'xlsx';

// Initialize the Gemini client lazily
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada. Por favor, ve a Configuración para cargarla.");
    }
    aiClient = new GoogleGenAI(apiKey);
  }
  return aiClient;
}

// Define the tools for Function Calling
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_clients",
    description: "Obtiene la lista de clientes para buscar sus IDs por nombre.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "get_products",
    description: "Obtiene el catálogo de productos completo para ver SKUs y precios.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "add_batch",
    description: "Registra la compra de un lote de productos. Calcula el costo prorrateado por unidad.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Nombre descriptivo del lote (ej: Lote Heladeras Abril)" },
        providerId: { type: Type.STRING, description: "ID del proveedor" },
        date: { type: Type.STRING, description: "Fecha de compra ISO" },
        totalCost: { type: Type.NUMBER, description: "Costo total pagado por el lote" },
        quantity: { type: Type.NUMBER, description: "Cantidad de unidades en el lote" }
      },
      required: ["name", "totalCost", "quantity"]
    }
  },
  {
    name: "add_workshop_expense",
    description: "Vincula un gasto de repuesto o reparación a un producto específico para sumar al costo total.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: "SKU o ID del producto/unidad" },
        description: { type: Type.STRING, description: "Detalle del gasto (ej: Cambio de motor)" },
        cost: { type: Type.NUMBER, description: "Monto del gasto" },
        date: { type: Type.STRING, description: "Fecha del gasto ISO" }
      },
      required: ["productId", "description", "cost"]
    }
  },
  {
    name: "add_transaction",
    description: "Registra un movimiento contable (Ingreso o Egreso) en el sistema.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "Fecha en formato ISO (opcional, por defecto ahora)" },
        type: { type: Type.STRING, enum: ["Ingreso", "Egreso"] },
        category: { type: Type.STRING, enum: ["Venta", "Compra Proveedor", "Logística", "Operativo", "Sueldo", "Repuestos", "Otro"] },
        amount: { type: Type.NUMBER },
        description: { type: Type.STRING },
        paymentMethod: { type: Type.STRING }
      },
      required: ["type", "category", "amount", "description"]
    }
  },
  {
    name: "add_workshop_job",
    description: "Registra un ingreso al taller para reparación.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dateIn: { type: Type.STRING, description: "Fecha de ingreso ISO" },
        device: { type: Type.STRING, description: "Marca y modelo del equipo" },
        issue: { type: Type.STRING, description: "Problema reportado" },
        clientId: { type: Type.STRING, description: "ID del cliente (opcional)" },
        cost: { type: Type.NUMBER, description: "Costo estimado o final" },
        status: { type: Type.STRING, enum: ["Pendiente", "En diagnóstico", "Esperando repuesto", "Reparando", "Completado", "Entregado"] }
      },
      required: ["device", "issue", "cost"]
    }
  },
  {
    name: "get_all_data",
    description: "Obtiene todo el estado actual del sistema (productos, clientes, ventas, etc.) para que la IA tenga contexto.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: "update_product",
    description: "Actualiza los datos de un producto (precio, stock, etc.) por su SKU.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sku: { type: Type.STRING, description: "El SKU del producto a actualizar" },
        updates: { 
          type: Type.OBJECT, 
          properties: {
            wholesalePrice: { type: Type.NUMBER },
            retailPrice: { type: Type.NUMBER },
            stock: { type: Type.NUMBER },
            model: { type: Type.STRING },
            brand: { type: Type.STRING },
            cost: { type: Type.NUMBER }
          }
        }
      },
      required: ["sku", "updates"]
    }
  },
  {
    name: "add_product",
    description: "Agrega un nuevo producto al catálogo.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sku: { type: Type.STRING },
        brand: { type: Type.STRING },
        model: { type: Type.STRING },
        category: { type: Type.STRING },
        stock: { type: Type.NUMBER },
        cost: { type: Type.NUMBER },
        wholesalePrice: { type: Type.NUMBER },
        retailPrice: { type: Type.NUMBER }
      },
      required: ["sku", "brand", "model", "category", "stock", "cost", "wholesalePrice", "retailPrice"]
    }
  },
  {
    name: "add_sale",
    description: "Registra una nueva venta en el sistema.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "Fecha en formato ISO" },
        clientId: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sku: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              quantity: { type: Type.NUMBER }
            }
          }
        },
        total: { type: Type.NUMBER },
        paymentMethod: { type: Type.STRING }
      },
      required: ["clientId", "items", "total"]
    }
  },
  {
    name: "add_client",
    description: "Agrega un nuevo cliente al directorio.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ["Mayorista", "Consumidor Final"] },
        phone: { type: Type.STRING },
        email: { type: Type.STRING },
        address: { type: Type.STRING }
      },
      required: ["name", "type"]
    }
  }
];

const tools = [{ functionDeclarations }];

async function handleTools(calls: any[]) {
  const store = useStore.getState();
  const results = [];

  for (const call of calls) {
    let functionResult;
    try {
      switch (call.name) {
        case "get_clients":
          functionResult = { clients: store.clients.map(c => ({ id: c.id, name: c.name, type: c.type })) };
          break;
        case "get_products":
          functionResult = { products: store.products.map(p => ({ sku: p.sku, model: p.model, stock: p.stock, brand: p.brand })) };
          break;
        case "get_all_data":
          functionResult = {
            products: store.products.map(p => ({ sku: p.sku, model: p.model, stock: p.stock, brand: p.brand })),
            clients: store.clients.map(c => ({ id: c.id, name: c.name, type: c.type })),
            sales: store.sales.slice(0, 5).map(s => ({ id: s.id, total: s.total, date: s.date })),
            inventory_summary: "Estado actual cargado (vista resumida)."
          };
          break;
        case "update_product":
          if (!(call.args as any).sku || !(call.args as any).updates) throw new Error("Falta SKU o campos a actualizar");
          await store.updateProduct((call.args as any).sku, (call.args as any).updates);
          functionResult = { success: true, message: `Producto ${(call.args as any).sku} actualizado.` };
          break;
        case "add_sale":
          if (!(call.args as any).clientId || !(call.args as any).total) throw new Error("Falta ID de cliente o total");
          await store.addSale({
            date: (call.args as any).date || new Date().toISOString(),
            status: 'Completada',
            shippingCost: 0,
            subtotal: (call.args as any).total,
            items: (call.args as any).items || [],
            paymentMethod: (call.args as any).paymentMethod || "Efectivo",
            total: (call.args as any).total,
            clientId: (call.args as any).clientId
          });
          functionResult = { success: true, message: "Venta registrada exitosamente." };
          break;
        case "add_client":
          if (!(call.args as any).name || !(call.args as any).type) throw new Error("Falta nombre o tipo de cliente");
          await store.addClient({ debt: 0, ...call.args as any });
          functionResult = { success: true, message: `Cliente ${(call.args as any).name} agregado exitosamente.` };
          break;
        case "add_batch":
          if (!(call.args as any).totalCost || !(call.args as any).quantity) throw new Error("Faltan datos financieros del lote");
          await store.addBatch({
            name: (call.args as any).name || "Lote sin nombre",
            providerId: (call.args as any).providerId || "Desconocido",
            date: (call.args as any).date || new Date().toISOString(),
            totalCost: (call.args as any).totalCost,
            quantity: (call.args as any).quantity
          });
          functionResult = { success: true, message: "Lote registrado y costo prorrateado correctamente." };
          break;
        case "add_workshop_expense":
          if (!(call.args as any).productId || !(call.args as any).cost) throw new Error("Falta producto o costo");
          await store.addWorkshopExpense({
            productId: (call.args as any).productId,
            description: (call.args as any).description || "Gasto sin descripción",
            cost: (call.args as any).cost,
            date: (call.args as any).date || new Date().toISOString()
          });
          functionResult = { success: true, message: `Gasto de taller vinculado al producto ${(call.args as any).productId}.` };
          break;
        case "add_transaction":
          if (!(call.args as any).amount || !(call.args as any).description) throw new Error("Falta monto o descripción de la transacción");
          await store.addTransaction({
            date: (call.args as any).date || new Date().toISOString(),
            type: (call.args as any).type || "Egreso",
            category: (call.args as any).category || "Otro",
            amount: (call.args as any).amount,
            description: (call.args as any).description,
            paymentMethod: (call.args as any).paymentMethod || "Efectivo"
          });
          functionResult = { success: true, message: "Movimiento contable registrado." };
          break;
        case "add_workshop_job":
          if (!(call.args as any).device || !(call.args as any).issue) throw new Error("Falta dispositivo o problema");
          await store.addWorkshopJob({
            dateIn: (call.args as any).dateIn || new Date().toISOString(),
            status: "Pendiente",
            device: (call.args as any).device,
            issue: (call.args as any).issue,
            cost: (call.args as any).cost || 0,
            clientId: (call.args as any).clientId || null
          });
          functionResult = { success: true, message: "Ingreso a taller registrado." };
          break;
        case "add_product":
          if (!(call.args as any).sku || !(call.args as any).model) throw new Error("Falta SKU o modelo");
          await store.addProduct({
            sku: (call.args as any).sku,
            brand: (call.args as any).brand || "Genérico",
            model: (call.args as any).model,
            category: (call.args as any).category || "Otro",
            stock: (call.args as any).stock || 0,
            cost: (call.args as any).cost || 0,
            wholesalePrice: (call.args as any).wholesalePrice || 0,
            retailPrice: (call.args as any).retailPrice || 0,
            status: "Disponible",
            series: []
          });
          functionResult = { success: true, message: `Producto ${(call.args as any).sku} agregado.` };
          break;
        default:
          functionResult = { error: "Función no implementada." };
      }
    } catch (e: any) {
      functionResult = { error: e.message };
    }
    results.push({ 
      functionResponse: { 
        name: call.name, 
        response: functionResult,
        id: call.id 
      } 
    });
  }
  return results;
}

export async function chatWithGemini(userMessage: string) {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: systemPrompt,
      tools: tools as any
    });
    
    let history: any[] = [
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const result = await model.generateContent({
      contents: history
    });
    
    let currentResponse = result.response;
    
    // Handle function calls
    let loopCount = 0;
    while (currentResponse.functionCalls() && currentResponse.functionCalls().length > 0 && loopCount < 8) {
      loopCount++;
      const toolResults = await handleTools(currentResponse.functionCalls());
      
      const modelOutput = { role: 'model', parts: currentResponse.candidates[0].content.parts };
      history.push(modelOutput);
      history.push({ role: 'user', parts: toolResults.map(r => ({ functionResponse: r.functionResponse })) });

      const nextResult = await model.generateContent({
        contents: history
      });
      currentResponse = nextResult.response;
    }

    return currentResponse.text() || "No pude generar una respuesta.";
  } catch (err: any) {
    console.error("Gemini Assistant Error:", err);
    return `Error: ${err.message || "Problema de conexión con la IA"}. Revisa tu API Key en Configuración.`;
  }
}

export async function processFileWithGemini(file: File, prompt: string): Promise<{ success: boolean; message: string }> {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: systemPrompt,
      tools: tools as any
    });
    const customTraining = localStorage.getItem('AI_TRAINING') || "";
    
    const systemPrompt = `Eres el asistente inteligente de "Mundo Outlet". Extrae datos de archivos (facturas, listas) e impúltalos al sistema usando las herramientas disponibles.
    Debes mapear los campos del archivo a los parámetros de las herramientas (add_product, update_product, etc).
    
    LÓGICA DE CUENTAS:
    - Todo movimiento que provenga de "Jonathan Yamil Borina" o "Nara Celeste Albornoz" (Celeste) se registra como "Egreso" (Gasto) si es un pago a un tercero.
    
    INSTRUCCIONES ADICIONALES DE ENTRENAMIENTO:
    ${customTraining}`;

    const parts: any[] = [];

    // Valid inlineData types for Gemini are mostly image, PDF, and audio/video.
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (isImage || isPDF) {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          } else {
            reject(new Error("Error al leer el archivo"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      parts.push({ inlineData: { data: base64Data, mimeType: file.type } });
    } else {
      // Parse file as text or arrayBuffer depending on type
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
      if (isExcel) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        let extractedText = "";
        workbook.SheetNames.forEach(sheetName => {
            const rowObject = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            extractedText += `\n--- HOJA: ${sheetName} ---\n${rowObject}`;
        });
        parts.push({ text: `Archivo adjunto (${file.name}):\n\n${extractedText}` });
      } else {
        const textData = await file.text();
        parts.push({ text: `Archivo adjunto (${file.name}):\n\n${textData}` });
      }
    }

    parts.push({ text: prompt || "Analiza este archivo y aplica los cambios necesarios al sistema." });

    let history: any[] = [{ role: 'user', parts }];

    let currentResponse = result.response;
    let totalActions = 0;
    let loopCount = 0;
    
    while (currentResponse.functionCalls() && currentResponse.functionCalls().length > 0 && loopCount < 8) {
      totalActions += currentResponse.functionCalls().length;
      loopCount++;
      const toolResults = await handleTools(currentResponse.functionCalls());
      
      const modelOutput = { role: 'model', parts: currentResponse.candidates[0].content.parts };
      history.push(modelOutput);
      history.push({ role: 'user', parts: toolResults.map(r => ({ functionResponse: r.functionResponse })) });

      const nextResult = await model.generateContent({
        contents: history
      });
      currentResponse = nextResult.response;
    }

    if (totalActions > 0) {
      return { success: true, message: `Se procesó el archivo y se realizaron ${totalActions} acciones en el sistema. ${currentResponse.text() || ""}` };
    }

    return { success: true, message: currentResponse.text() || "El archivo fue analizado pero no se detectaron acciones automáticas." };
  } catch (err: any) {
    console.error("File Processing Error:", err);
    return { success: false, message: `Error al procesar: ${err.message || "Falla técnica"}` };
  }
}
