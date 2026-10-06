import React, { useState } from 'react';
import { ShoppingBag, Search, Sparkles, FolderCheck, Truck, Phone, IceCream, Share2, Check, Copy } from 'lucide-react';
import { CATEGORIES } from '../data/catalog';
import { formatCLP } from '../utils/format';
import { JOLY_OFFICIAL_LOGO } from '../assets/officialLogo';

interface HeaderProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalBoxes: number;
  totalAmount: number;
  onOpenCart: () => void;
  onOpenGuide: () => void;
  onOpenVendorPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalBoxes,
  totalAmount,
  onOpenCart,
  onOpenGuide,
  onOpenVendorPanel
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const OFFICIAL_STORE_URL = 'https://tienda-de-helados-joly-4z5x.vercel.app';

  const handleCopyLink = async () => {
    // Si estamos en Vercel, usamos el origen actual; si no, aseguramos su URL oficial de Vercel
    const currentOrigin = window.location.origin;
    const isVercel = currentOrigin.includes('vercel.app');
    const urlToShare = isVercel ? currentOrigin : OFFICIAL_STORE_URL;

    // Si el cliente está en teléfono móvil, abrir el menú nativo de WhatsApp / Compartir
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Distribuidora Mayorista Joly - Helados Panda Temuco',
          text: '🍦 Revisa nuestro catálogo mayorista oficial de Helados Panda para Temuco y prepara tu pedido con anticipación:',
          url: urlToShare
        });
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
        return;
      } catch (e) {
        // Si el usuario cancela la ventana de compartir o no es compatible, continúa a copiar al portapapeles
      }
    }

    try {
      await navigator.clipboard.writeText(urlToShare);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.warn('Error al copiar link:', e);
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-900/10 shadow-xs">
      
      {/* Barra superior de despacho / aviso urgente con punto parpadeante */}
      <div className="bg-slate-950 text-white text-[11px] sm:text-xs py-1.5 px-3 font-medium text-center tracking-tight flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-[#EEFF00] shrink-0 animate-pulse" />
          <span className="truncate">
            🚚 <strong>Reparto Temuco</strong>: <span className="text-[#EEFF00] font-bold">Miércoles y Jueves</span>
          </span>
        </div>
        {onOpenVendorPanel && (
          <button
            type="button"
            onClick={onOpenVendorPanel}
            className="text-[10px] sm:text-xs font-black bg-[#EEFF00] text-slate-950 px-2.5 py-0.5 rounded-full shrink-0 hover:bg-yellow-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>👤</span>
            <span>Panel Vendedor →</span>
          </button>
        )}
      </div>

      {/* Franja de Marca Principal: JOLY & HELADOS PANDA */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        
        {/* Logo Oficial Distribuidora Joly + HELADOS PANDA */}
        <div 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          onClick={() => onSelectCategory('all')}
        >
          <img
            src={JOLY_OFFICIAL_LOGO}
            alt="Distribuidora Mayorista Joly"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full shadow-xs border-2 border-sky-400/50 bg-white"
          />
          
          <div className="flex flex-col leading-tight">
            <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight">
              Distribuidora Joly
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-sky-700">
              Mayorista Helados Panda
            </span>
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

          {onOpenVendorPanel && (
            <button
              type="button"
              onClick={onOpenVendorPanel}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer border border-amber-400/40"
              title="Abrir Panel del Vendedor (Pedidos, Carga Extra y Cierre de Ruta)"
            >
              <Truck className="w-4 h-4 text-[#EEFF00] shrink-0" />
              <span className="text-[11px] sm:text-xs">Vendedor</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 text-[#EEFF00]" />
            <div className="text-left leading-tight">
              <span className="block text-xs font-black text-[#EEFF00]">
                {totalBoxes} {totalBoxes === 1 ? 'Caja' : 'Cajas'}
              </span>
              <span className="block text-[11px] text-emerald-100 font-bold">
                {formatCLP(totalAmount)}
              </span>
            </div>
          </button>
        </div>

      </div>

    </header>
  );
};
