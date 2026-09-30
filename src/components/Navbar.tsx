import React from 'react';
import { ShoppingBag, Search, Sparkles, FolderCheck, IceCreamCone } from 'lucide-react';
import { ProductCategory } from '../types';

interface NavbarProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onOpenGuide
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090f24]/90 backdrop-blur-md border-b border-blue-600/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Marca */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectCategory('todas')}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#090f24] rounded-[14px] flex items-center justify-center">
                <IceCreamCone className="w-6 h-6 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  IL GELATO
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  Artesanal
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium">
                Cassatas & Helados Italianos
              </p>
            </div>
          </div>

          {/* Buscador central */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar cassatas, conos, copas..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-blue-950/70 border border-blue-700/50 text-white placeholder-blue-300/50 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Acciones: Guía Vercel + Carrito */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenGuide}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/80 border border-blue-500/40 text-xs font-semibold text-cyan-200 hover:text-white transition-all shadow-sm"
              title="Ver guía para subir fotos a Vercel sin Base64"
            >
              <FolderCheck className="w-4 h-4 text-cyan-400" />
              <span>Fotos para Vercel</span>
            </button>

            <button
              onClick={onOpenCart}
              className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Pedido</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-blue-950 text-xs font-extrabold flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Buscador móvil */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-blue-950/70 border border-blue-700/50 text-white placeholder-blue-300/50 text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Pestañas de categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar">
          <button
            onClick={() => onSelectCategory('todas')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'todas'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-blue-950/60 text-blue-200 hover:bg-blue-900/60 border border-blue-800/60'
            }`}
          >
            Todos los Productos
          </button>

          <button
            onClick={() => onSelectCategory('cassatas')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'cassatas'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'bg-blue-950/60 text-amber-200 hover:bg-blue-900/60 border border-amber-500/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Cassatas (Fotos Conservadas)
          </button>

          <button
            onClick={() => onSelectCategory('individuales')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'individuales'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-blue-950/60 text-blue-200 hover:bg-blue-900/60 border border-blue-800/60'
            }`}
          >
            Helados Individuales
          </button>

          <button
            onClick={() => onSelectCategory('especiales')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'especiales'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-blue-950/60 text-blue-200 hover:bg-blue-900/60 border border-blue-800/60'
            }`}
          >
            Especialidades de la Casa
          </button>
        </div>

      </div>
    </header>
  );
};
