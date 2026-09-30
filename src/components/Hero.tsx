import React from 'react';
import { Sparkles, ShieldCheck, FolderHeart, ArrowRight } from 'lucide-react';
import { ProductCategory } from '../types';

interface HeroProps {
  onSelectCategory: (cat: ProductCategory) => void;
  onOpenGuide: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectCategory, onOpenGuide }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#090f24] via-[#0c183a] to-[#090f24] py-12 px-4 sm:px-6 lg:px-8 border-b border-blue-900/40">
      {/* Luces y brillos de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-xs font-semibold text-cyan-300 mb-6">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Catálogo Web Optimizado para Despliegue en Vercel</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight mb-4">
          Tradición Heladera Italiana & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-300">
            Cassatas Artesanales
          </span>
        </h1>

        <p className="text-sm sm:text-base text-blue-200/90 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          Diseño visual conservado con fondo azul en cada tarjeta. Las fotos de las Cassatas se mantienen intactas y los productos individuales/especiales cuentan con rutas relativas permanentes limpias sin Base64.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onSelectCategory('cassatas')}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ver Cassatas (Fotos Conservadas)</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="px-5 py-3 rounded-2xl bg-blue-900/80 hover:bg-blue-800 border border-blue-500/50 text-cyan-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
          >
            <FolderHeart className="w-4 h-4 text-cyan-400" />
            <span>Guía de Fotos para Vercel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
