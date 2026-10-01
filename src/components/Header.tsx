import React, { useState } from 'react';
import { ShoppingBag, Search, Sparkles, FolderCheck, Truck, Phone, IceCream, Share2, Check, Copy } from 'lucide-react';
import { CATEGORIES } from '../data/catalog';
import { formatCLP } from '../utils/format';

interface HeaderProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalBoxes: number;
  totalAmount: number;
  onOpenCart: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalBoxes,
  totalAmount,
  onOpenCart,
  onOpenGuide
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const publicUrl = 'https://ais-pre-6uweitrm2le5rxrbr3sy4u-399415437505.us-east1.run.app';

  const handleCopyLink = () => {
    const urlToCopy = window.location.hostname.includes('run.app') 
      ? window.location.href.split('?')[0] 
      : publicUrl;

    navigator.clipboard.writeText(urlToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-900/10 shadow-xs">
      
      {/* Barra superior de despacho / aviso urgente con punto parpadeante */}
      <div className="bg-slate-950 text-white text-[11px] sm:text-xs py-1.5 px-3 font-medium text-center tracking-tight flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#EEFF00] shrink-0 animate-pulse" />
        <span className="truncate">
          🍦 <strong>Catálogo mayorista online con despacho tempranito</strong> · ¡Haz tu pedido antes de las <span className="text-[#EEFF00] font-bold">11:00 AM</span>!
        </span>
      </div>

      {/* Franja de Marca Principal: JOLY & HELADOS PANDA */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        
        {/* Logo JOLY + HELADOS PANDA */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          onClick={() => onSelectCategory('all')}
        >
          <img
            src="/imagenes/logo_joly_recortado.png"
            alt="Logo Joly"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full shadow-xs border border-blue-400/40"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex items-baseline">
            <span className="font-black text-2xl sm:text-3xl tracking-tighter text-[#28AEE4]">JO</span>
            <span className="font-black text-2xl sm:text-3xl tracking-tighter text-[#E31B23]">LY</span>
          </div>

          <div className="hidden sm:inline-block text-xs font-bold text-slate-700 pl-2.5 border-l-2 border-slate-300 leading-tight">
            <span>Mayorista</span>
            <span className="block text-slate-950 font-black text-xs sm:text-sm">HELADOS PANDA</span>
          </div>
        </div>

        {/* Acciones: Compartir Tienda + Guía Fotos + Carrito */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Botón para copiar y compartir enlace de la tienda */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              copiedLink
                ? 'bg-emerald-600 text-white scale-105'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
            }`}
            title="Copiar enlace para enviar a tus clientes"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#EEFF00]" />
                <span>¡Link copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline">Compartir Tienda</span>
                <span className="sm:hidden">Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            title="Ver guía para fotos oficiales"
          >
            <FolderCheck className="w-4 h-4 text-[#0284c7]" />
            <span className="hidden md:inline">Fotos Oficiales</span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-[#EEFF00]" />
            <div className="text-left leading-tight">
              <span className="block text-xs font-black text-[#EEFF00]">
                {totalBoxes} {totalBoxes === 1 ? 'Caja' : 'Cajas'}
              </span>
              <span className="block text-[11px] text-slate-200 font-semibold">
                {formatCLP(totalAmount)}
              </span>
            </div>
          </button>
        </div>

      </div>

    </header>
  );
};
