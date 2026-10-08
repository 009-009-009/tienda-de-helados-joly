import React, { useState, useEffect } from 'react';
import { CatalogProduct } from '../data/catalog';
import { formatCLP } from '../utils/format';
import { autoCenterAndCropImage } from '../utils/imageCentering';
import { CASSATA_IMAGES } from '../assets/cassataImages';
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

  const cassataDirectImg = CASSATA_IMAGES[product.imageFileName];
  const showImage = !imgError && (product.hasPreservedPhoto || !!localImagePreview || !!cassataDirectImg);
  const baseImgSrc = localImagePreview || cassataDirectImg || `/imagenes/${product.imageFileName}`;
  const imgSrc = localImagePreview
    ? localImagePreview
    : (cassataDirectImg
        ? cassataDirectImg
        : (cacheBust ? `${baseImgSrc}?v=${cacheBust}` : `${baseImgSrc}?v=v5-cassatas-reales-100`));

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
    <div className="bg-gradient-to-b from-[#004B87] via-[#003865] to-[#002444] rounded-xl sm:rounded-2xl border border-sky-400/40 sm:border-2 overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 flex flex-col h-full group text-white">
      
      {/* --- VITRINA (Paletas y Cassatas sobre fondo azul oficial Panda con altura compacta para móvil) --- */}
      <div className="relative h-28 xs:h-32 sm:h-44 md:h-52 w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#38bdf8] via-[#1aa4e3] to-[#0284c7] p-1.5 sm:p-3 border-b border-sky-300/40 sm:border-b-2">
        
        {/* Imagen cargada reposando sobre el fondo azul del catálogo oficial */}
        {showImage ? (
          <img
            src={centeredImgSrc || imgSrc}
            alt={product.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.5))_drop-shadow(0_6px_12px_rgba(0,0,0,0.3))]"
          />
        ) : (
          /* Placeholder estilizado sobre fondo azul */
          <div className="flex flex-col items-center justify-center text-center p-2 text-white w-full h-full">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center mb-1 shadow-xs text-white">
              <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-950/80 text-[#EEFF00] px-1.5 sm:px-2 py-0.5 rounded-full mb-0.5 sm:mb-1">
              Foto Pendiente
            </span>

            <p className="text-[8px] sm:text-[10px] text-sky-100 font-medium max-w-[160px] mb-1 sm:mb-2 leading-tight hidden xs:block">
              {product.categoryName}
            </p>

            <div className="flex items-center gap-1">
              <label className="cursor-pointer inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-0.5 sm:py-1 rounded shadow-xs transition-colors">
                <Upload className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#EEFF00]" />
                <span>{isUploading ? '...' : 'Subir'}</span>
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
                className="text-[9px] sm:text-[11px] text-sky-100 hover:text-white underline underline-offset-2 flex items-center gap-0.5"
                title="Ver nombre de archivo para Vercel"
              >
                <Folder className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Ruta</span>
              </button>
            </div>
          </div>
        )}

        {/* Badge superior izquierdo: Presentación en caja */}
        <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 z-10 flex flex-col gap-0.5 sm:gap-1 pointer-events-none">
          <span className="px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-[11px] font-black rounded sm:rounded-md bg-slate-950/90 text-[#EEFF00] border border-black/30 shadow-xs">
            Caja {product.unitsPerBox} un.
          </span>
          {localImagePreview && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold rounded bg-emerald-600 text-white shadow-xs">
              <Check className="w-2 h-2" />
              Previa
            </span>
          )}
        </div>

        {/* Badge superior derecho: Categoría */}
        <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 z-10 pointer-events-none">
          <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-extrabold rounded sm:rounded-md bg-slate-950/70 backdrop-blur-xs text-white border border-white/20 shadow-xs truncate max-w-[75px] sm:max-w-none block">
            {product.categoryName}
          </span>
        </div>
      </div>

      {/* --- CUERPO INFORMATIVO DE LA TARJETA COMPACTO --- */}
      <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Título con altura mínima para que las 2 tarjetas de cada fila cuadren a la perfección */}
          <h3 className="font-extrabold text-white text-xs sm:text-base leading-tight mb-1 sm:mb-1.5 drop-shadow-xs line-clamp-2 min-h-[1.75rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="mb-1.5 sm:mb-3">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-sm sm:text-2xl font-black text-[#EEFF00] drop-shadow-xs tracking-tight leading-none">
                {formatCLP(product.boxPrice)}
              </span>
              <span className="text-[10px] sm:text-xs text-sky-200 font-semibold leading-none">
                caja
              </span>
            </div>
            <span className="text-[9px] sm:text-[11px] text-sky-300/90 font-medium block mt-0.5 leading-none">
              Ref: {formatCLP(product.unitRefPrice)} c/u
            </span>
          </div>
        </div>

        {/* --- SELECTOR DE CAJAS / BOTÓN VERDE AGREGAR --- */}
        <div className="pt-1.5 sm:pt-2.5 border-t border-sky-400/20 mt-auto">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-black/50 border border-sky-400/40 rounded-lg sm:rounded-xl p-1 sm:p-1.5 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => onUpdateQuantity(-1)}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-white/20 hover:bg-white/30 text-white font-black flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Quitar una caja"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>

              <div className="text-center px-0.5">
                <span className="block text-[10px] sm:text-xs font-black text-[#EEFF00] leading-none mb-0.5">
                  {quantity} {quantity === 1 ? 'caja' : 'cajas'}
                </span>
                <span className="block text-[9px] sm:text-[11px] text-white font-bold leading-none">
                  {formatCLP(quantity * product.boxPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateQuantity(1)}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
                title="Agregar otra caja"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateQuantity(1)}
              className="w-full py-1.5 sm:py-2.5 px-2 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3]" />
              <span className="tracking-wide">AGREGAR CAJA</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};


