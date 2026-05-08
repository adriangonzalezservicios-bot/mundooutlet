import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Package, ShoppingCart, Wrench, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

type SearchResultItem = {
  id: string;
  type: 'client' | 'product' | 'sale' | 'workshopJob';
  title: string;
  subtitle: string;
  url: string;
  icon: React.ElementType;
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { clients, products, sales, workshopJobs } = useStore();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const newResults: SearchResultItem[] = [];

    // Search Clients
    clients.forEach(client => {
      if (client.name.toLowerCase().includes(q) || client.email?.toLowerCase().includes(q) || client.phone?.includes(q)) {
        newResults.push({
          id: `client-${client.id}`,
          type: 'client',
          title: client.name,
          subtitle: `Cliente ${client.type} ${client.phone ? `- ${client.phone}` : ''}`,
          url: '/directorio', // Modify if you have a specific client details page
          icon: User
        });
      }
    });

    // Search Products
    products.forEach(product => {
      if (product.brand.toLowerCase().includes(q) || product.model.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q)) {
        newResults.push({
          id: `product-${product.sku}`,
          type: 'product',
          title: `${product.brand} ${product.model}`,
          subtitle: `SKU: ${product.sku} - Stock: ${product.stock}`,
          url: '/stock', // Modify if you have a specific product details page
          icon: Package
        });
      }
    });

    // Search Sales
    sales.forEach(sale => {
      if (sale.id.toLowerCase().includes(q)) {
        newResults.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          title: `Venta #${sale.id.substring(0, 6)}`,
          subtitle: `Fecha: ${new Date(sale.date).toLocaleDateString()} - Total: $${sale.total}`,
          url: '/ventas', // Modify if you have a specific sale details page
          icon: ShoppingCart
        });
      }
    });

    // Search Workshop Jobs
    workshopJobs.forEach(job => {
      if (job.device.toLowerCase().includes(q) || job.issue.toLowerCase().includes(q) || job.id.toLowerCase().includes(q)) {
        newResults.push({
          id: `job-${job.id}`,
          type: 'workshopJob',
          title: `Taller: ${job.device}`,
          subtitle: `Estado: ${job.status} - Problema: ${job.issue}`,
          url: '/taller', // Modify if you have a specific job details page
          icon: Wrench
        });
      }
    });

    // setResults(newResults.slice(0, 10)); Limit to top 10 results
    setIsOpen(true);
  }, [query, clients, products, sales, workshopJobs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (url: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  return (
    <div className="relative z-50 flex-1 max-w-sm hidden md:block" ref={containerRef}>
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 w-4 h-4 text-[#38bdf8]/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value) setIsOpen(true);
          }}
          onFocus={() => { if (query) setIsOpen(true); }}
          placeholder="Buscar clientes, productos, ventas..."
          className="w-full bg-[#38bdf8]/5 border border-[#38bdf8]/20 rounded-md py-1.5 pl-9 pr-8 text-sm text-[#38bdf8] placeholder:text-[#38bdf8]/40 focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-2 text-[#38bdf8]/50 hover:text-[#38bdf8] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#09090b] border border-[#38bdf8]/20 rounded-md shadow-[0_4px_24px_-8px_currentColor] shadow-[#38bdf8]/20 overflow-hidden"
          >
            {results.length > 0 ? (
              <ul className="max-h-[60vh] overflow-y-auto py-1 custom-scrollbar">
                {results.map((result) => {
                  const Icon = result.icon;
                  return (
                    <li key={result.id}>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-[#38bdf8]/10 flex items-start gap-3 transition-colors"
                        onClick={() => handleResultClick(result.url)}
                      >
                        <div className="mt-0.5 p-1.5 bg-[#38bdf8]/10 rounded-md text-[#38bdf8]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{result.title}</p>
                          <p className="text-xs text-[#38bdf8]/60 truncate font-mono">{result.subtitle}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-[#38bdf8]/60">
                No se encontraron resultados para "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
