import React from 'react';
import { Sparkles, FolderSync, ShieldCheck, HelpCircle } from 'lucide-react';

interface ImageStatusBannerProps {
  onOpenGuide: () => void;
  totalProducts: number;
  cassatasCount: number;
  customPendingCount: number;
}

export const ImageStatusBanner: React.FC<ImageStatusBannerProps> = ({
  onOpenGuide,
  cassatasCount,
  customPendingCount
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-950 border-y border-blue-500/30 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Estado general */}
        <div className="flex flex-wrap items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Condiciones de imágenes aplicadas:</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <Sparkles className="w-3 h-3" />
            <span>{cassatasCount} Cassatas (Fotos conservadas intactas)</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-200">
            <FolderSync className="w-3 h-3 text-cyan-400" />
            <span>{customPendingCount} Productos con rutas limpias /public (Sin IA ni Base64)</span>
          </div>
        </div>

        {/* Botón para ver guía de Vercel */}
        <button
          onClick={onOpenGuide}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/40 hover:bg-blue-600/70 border border-blue-400/40 text-cyan-200 hover:text-white font-medium transition-all shadow-sm flex-shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
          <span>Ver guía de carpetas para Vercel</span>
        </button>

      </div>
    </div>
  );
};
