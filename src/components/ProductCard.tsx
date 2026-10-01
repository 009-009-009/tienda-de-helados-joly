import React, { useState, useEffect } from 'react';
import { CatalogProduct } from '../data/catalog';
import { formatCLP } from '../utils/format';
import { autoCenterAndCropImage } from '../utils/imageCentering';
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
  const [centeredImgSrc, setCenteredImgSrc] = useState<string | null>(null);

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

  // Auto-centrar y recortar espacios en blanco a la derecha para que la paleta quede centrada
  useEffect(() => {
    if (!showImage) {
      setCenteredImgSrc(null);
      return;
    }
    const cancel = autoCenterAndCropImage(imgSrc, (processed) => {
      setCenteredImgSrc(processed);
    });
    return cancel;
  }, [imgSrc, showImage]);

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
    <div className="bg-gradient-to-b from-[#02568f] via-[#01416e] to-[#012d4d] rounded-2xl border-2 border-[#38bdf8]/40 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col h-full group text-white p-2.5 sm:p-3">
      
      {/* --- CONTENEDOR SUPERIOR CON FONDO BLANCO LIMPIO PARA QUE LAS PALETAS CON FONDO BLANCO RESALTEN --- */}
      <div className="relative aspect-[4/3] w-full flex items-center justify-center overflow-hidden bg-white rounded-xl p-2 shadow-inner border border-sky-100">
        
        {/* Imagen cargada con centrado perfecto y tamaño destacado */}
        {showImage ? (
          <img
            src={centeredImgSrc || imgSrc}
            alt={product.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105 [filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.18))]"
          />
        ) : (
          /* Placeholder estilizado sobre fondo suave */
          <div className="flex flex-col items-center justify-center text-center p-3 text-slate-700 w-full h-full bg-sky-50/80 rounded-lg">
            <div className="w-12 h-12 rounded-2xl bg-[#0284c7]/10 border border-[#0284c7]/30 flex items-center justify-center mb-1.5 shadow-xs text-[#0284c7]">
              <ImageIcon className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-[#EEFF00] px-2.5 py-0.5 rounded-full mb-1">
              Foto Oficial Pendiente
            </span>

            <p className="text-[10px] text-slate-500 font-medium max-w-[200px] mb-2 leading-tight">
              Catálogo de Calle ({product.categoryName})
            </p>

            <div className="flex items-center gap-1.5">
              <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#0284c7] hover:bg-[#026aa0] px-2.5 py-1 rounded-lg shadow-xs transition-colors">
                <Upload className="w-3 h-3 text-[#EEFF00]" />
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
                className="text-[11px] text-slate-600 hover:text-slate-900 underline underline-offset-2 flex items-center gap-1"
                title="Ver nombre de archivo para Vercel"
              >
                <Folder className="w-3 h-3" />
                <span>Ruta</span>
              </button>
            </div>
          </div>
        )}

        {/* Badge superior izquierdo: Presentación en caja */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
          <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-slate-950/90 text-[#EEFF00] border border-black/30 shadow-xs">
            Caja {product.unitsPerBox} un.
          </span>
          {localImagePreview && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-600 text-white shadow-xs">
              <Check className="w-2.5 h-2.5" />
              Vista Previa
            </span>
          )}
        </div>

        {/* Badge superior derecho: Categoría */}
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-800 shadow-xs border border-slate-200">
            {product.categoryName}
          </span>
        </div>
      </div>

      {/* --- CUERPO INFORMATIVO DE LA TARJETA EN AZUL JOLY --- */}
      <div className="pt-3 pb-1 px-1 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-white text-base sm:text-lg leading-snug mb-1 drop-shadow-xs line-clamp-2">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-black text-[#EEFF00] drop-shadow-xs tracking-tight">
              {formatCLP(product.boxPrice)}
            </span>
            <span className="text-xs text-sky-200 font-medium">
              caja ({formatCLP(product.unitRefPrice)} c/u)
            </span>
          </div>
        </div>

        {/* --- SELECTOR DE CAJAS / AGREGAR --- */}
        <div className="pt-2 border-t border-white/15 mt-auto">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-black/40 border border-sky-400/30 rounded-xl p-1.5 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => onUpdateQuantity(-1)}
                className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
                title="Quitar una caja"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="block text-xs font-black text-[#EEFF00] leading-tight">
                  {quantity} {quantity === 1 ? 'caja' : 'cajas'}
                </span>
                <span className="block text-[11px] text-white font-bold">
                  {formatCLP(quantity * product.boxPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateQuantity(1)}
                className="w-8 h-8 rounded-lg bg-[#EEFF00] hover:bg-yellow-300 text-slate-950 font-black flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="Agregar otra caja"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateQuantity(1)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#EEFF00] hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>AGREGAR CAJA</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
