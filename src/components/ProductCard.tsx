import React, { useState, useEffect } from 'react';
import { CatalogProduct } from '../data/catalog';
import { formatCLP } from '../utils/format';
import { Plus, Minus, Check, Image as ImageIcon, Upload, Folder, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: CatalogProduct;
  quantity: number;
  onUpdateQuantity: (delta: number) => void;
  onOpenGuide: (product: CatalogProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onUpdateQuantity,
  onOpenGuide
}) => {
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [cacheBust, setCacheBust] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handleImageUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ fileName: string }>;
      if (customEvent.detail?.fileName === product.imageFileName) {
        setImgError(false);
        setCacheBust(Date.now());
      }
    };

    window.addEventListener('catalog-image-updated', handleImageUpdate);
    return () => window.removeEventListener('catalog-image-updated', handleImageUpdate);
  }, [product.imageFileName]);

  const showImage = !imgError && (product.hasPreservedPhoto || !!localImagePreview);
  const baseImgSrc = localImagePreview || `/imagenes/${product.imageFileName}`;
  const imgSrc = cacheBust ? `${baseImgSrc}?v=${cacheBust}` : baseImgSrc;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vista previa instantánea
    const url = URL.createObjectURL(file);
    setLocalImagePreview(url);
    setImgError(false);

    // Guardar permanentemente en servidor
    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          await fetch('/api/save-catalog-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: product.imageFileName,
              base64Data
            })
          });
          // Notificar a productos que compartan este archivo
          window.dispatchEvent(new CustomEvent('catalog-image-updated', {
            detail: { fileName: product.imageFileName }
          }));
        } catch (err) {
          console.error('Error guardando en servidor:', err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full group">
      
      {/* --- CONTENEDOR SUPERIOR CON FONDO AZUL CONSERVADO --- */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#38bdf8] via-[#1aa4e3] to-[#0284c7] p-2">
        
        {/* Imagen cargada con centrado perfecto y tamaño destacado */}
        {showImage ? (
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105 [filter:drop-shadow(0_3px_8px_rgba(0,0,0,0.35))_drop-shadow(0_1px_3px_rgba(0,0,0,0.2))]"
          />
        ) : (
          /* Placeholder estilizado sobre fondo azul (Sin fotos de IA) */
          <div className="flex flex-col items-center justify-center text-center p-3 text-white w-full h-full">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center mb-2 shadow-inner text-white">
              <ImageIcon className="w-6 h-6 text-white drop-shadow-sm" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950/70 backdrop-blur-xs text-[#EEFF00] px-2.5 py-0.5 rounded-full border border-white/20 mb-1">
              Foto Oficial Pendiente
            </span>

            <p className="text-[10px] text-sky-100 font-medium max-w-[200px] mb-2 leading-tight">
              Catálogo de Calle ({product.categoryName})
            </p>

            <div className="flex items-center gap-1.5">
              <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-slate-950 bg-white hover:bg-sky-50 px-2.5 py-1 rounded-lg shadow-xs transition-colors">
                <Upload className="w-3 h-3 text-[#0284c7]" />
                <span>{isUploading ? 'Guardando...' : 'Cargar foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => onOpenGuide(product)}
                className="text-[11px] text-white/90 hover:text-white underline underline-offset-2 flex items-center gap-1"
                title="Ver nombre de archivo para Vercel"
              >
                <Folder className="w-3 h-3" />
                <span>Ruta</span>
              </button>
            </div>
          </div>
        )}

        {/* Badge superior izquierdo: Presentación en caja */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-900/80 backdrop-blur-xs text-[#EEFF00] border border-black/20 shadow-xs">
            Caja {product.unitsPerBox} un.
          </span>
          {localImagePreview && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500 text-white shadow-xs">
              <Check className="w-2.5 h-2.5" />
              Vista Previa
            </span>
          )}
        </div>

        {/* Badge superior derecho: Categoría */}
        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
            {product.categoryName}
          </span>
        </div>
      </div>

      {/* --- CUERPO INFORMATIVO DE LA TARJETA --- */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-extrabold text-[#0284c7]">
              {formatCLP(product.boxPrice)}
            </span>
            <span className="text-xs text-slate-500">
              caja ({formatCLP(product.unitRefPrice)} c/u)
            </span>
          </div>
        </div>

        {/* --- SELECTOR DE CAJAS / AGREGAR --- */}
        <div className="pt-2 border-t border-slate-100 mt-auto">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() => onUpdateQuantity(-1)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center shadow-xs transition-colors"
                title="Quitar una caja"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {quantity} {quantity === 1 ? 'caja' : 'cajas'}
                </span>
                <span className="block text-[10px] text-[#0284c7] font-semibold">
                  {formatCLP(quantity * product.boxPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateQuantity(1)}
                className="w-8 h-8 rounded-lg bg-[#28AEE4] hover:bg-[#209bcc] text-white font-bold flex items-center justify-center shadow-xs transition-colors"
                title="Agregar otra caja"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateQuantity(1)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#EEFF00]" />
              <span>Agregar Caja</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
