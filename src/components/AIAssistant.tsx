import { useState, useRef } from "react";
import { Bot, Paperclip, Send, X, Loader2, Sparkles, User } from "lucide-react";
import { chatWithGemini, processFileWithGemini } from "../lib/gemini";

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: '¡Hola! Soy el asistente de Mundo Outlet. Puedo ayudarte a subir facturas, actualizar precios, registrar ventas o consultar el inventario. ¿En qué puedo ayudarte hoy?' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !prompt.trim()) return;

    // Check for API Key
    const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '⚠️ API Key de Gemini no configurada. Por favor, ve a Configuración y guarda tu API Key para activar la IA.' 
      }]);
      return;
    }

    const userMessage = prompt || (file ? `Subí un archivo: ${file.name}` : "");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setPrompt("");
    setIsLoading(true);
    scrollToBottom();

    try {
      let aiResponse = "";
      if (file) {
        const result = await processFileWithGemini(file, prompt || "Procesa este archivo");
        aiResponse = result.message;
        setFile(null);
      } else {
        aiResponse = await chatWithGemini(userMessage);
      }
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      const errorMessage = error?.message?.includes('API_KEY_INVALID') 
        ? 'La API Key de Gemini parece ser inválida. Verifícala en Configuración.'
        : 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.';
      setMessages(prev => [...prev, { role: 'ai', content: `❌ ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-[#7BA4BD] hover:bg-orange-600 text-black rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Assistant Panel */}
      <div 
        className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-80 md:w-96 crystal-card rounded-t-[2rem] sm:rounded-[2rem] flex flex-col overflow-hidden z-50 transition-all duration-300 origin-bottom sm:origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 sm:translate-y-0 pointer-events-none'}`}
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        {/* Header */}
        <div className="bg-[#1E293B] border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7BA4BD]/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Asistente GEMINI</h3>
              <p className="text-[10px] text-slate-600">Automatización de carga de datos</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-[2rem] px-5 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#7BA4BD] text-white rounded-tr-none' : 'bg-[#1E293B] text-slate-300 border border-white/5 rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1E293B] border border-white/5 rounded-[2rem] rounded-tl-none px-5 py-4 flex items-center gap-3 shadow-sm">
                <Loader2 className="w-4 h-4 text-[#7BA4BD] animate-spin" />
                <span className="text-xs font-medium text-slate-500 italic">Analizando datos y aplicando cambios...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#1E293B]">
          {file && (
            <div className="mb-3 flex items-center justify-between bg-[#1E293B] px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 border border-white/5">
              <span className="truncate max-w-[200px] flex items-center gap-2">
                <Paperclip className="w-3 h-3 text-[#7BA4BD]" />
                {file.name}
              </span>
              <button type="button" onClick={clearFile} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
              accept=".pdf,image/*,.csv,.json,.txt,.xlsx,.xls"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-[#1E293B] hover:bg-slate-100 text-slate-400 hover:text-[#7BA4BD] rounded-2xl transition-all shrink-0 border border-white/5"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={file ? "Instrucciones adicionales..." : "Pregúntale algo a la IA..."}
              className="flex-1 bg-[#1E293B] border border-white/5 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7BA4BD]/20 placeholder:text-slate-400 font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!prompt.trim() && !file)}
              className="p-3 bg-[#7BA4BD] hover:bg-[#6c93ab] disabled:opacity-20 text-white rounded-2xl transition-all shrink-0 shadow-lg shadow-[#7BA4BD]/20 active:scale-90"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
