import React, { useState } from 'react';
import { CatalogProduct, PRODUCTS } from '../data/catalog';
import { 
  X, 
  FolderCheck, 
  Copy, 
  Check, 
  FileImage, 
  AlertTriangle, 
  Server, 
  Terminal, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface VercelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: CatalogProduct;
}

export const VercelGuideModal: React.FC<VercelGuideModalProps> = ({
  isOpen,
  onClose,
  selectedProduct
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'cassatas' | 'pending'>('all');

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const cassatas = PRODUCTS.filter((p) => p.hasPreservedPhoto);
  const pendingProducts = PRODUCTS.filter((p) => !p.hasPreservedPhoto);

  const displayedProducts =
    filter === 'all'
      ? PRODUCTS
      : filter === 'cassatas'
      ? cassatas
      : pendingProducts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200 text-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 sm:p-6 bg-slate-950 text-white flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#28AEE4]/20 border border-[#28AEE4]/40 flex items-center justify-center text-[#EEFF00]">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#EEFF00] bg-[#EEFF00]/10 px-2 py-0.5 rounded border border-[#EEFF00]/30">
                  Solución Definitiva para Vercel
                </span>
                <span className="text-xs text-sky-300">Sin Base64 · Sin IA Inventada</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Gestión de Fotos Oficiales — JOLY &amp; HELADOS PANDA
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-sm">

          {/* Explicación del problema que ocurrió con el agente anterior */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0284c7] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  ¿Qué causó el colapso del agente anterior y cómo lo solucionamos?
                </h3>
                <p className="text-slate-600 leading-relaxed mb-2 text-xs">
                  El agente anterior intentó guardar imágenes en formato <strong>Base64</strong> dentro de la memoria interna del navegador (IndexedDB) e intentó generar imágenes sintéticas con IA que deformaron los productos reales. Al subir el código a Vercel, esas imágenes no existían como archivos reales o sobrecargaban la memoria, haciendo colapsar el sitio.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                  <div className="p-2.5 rounded-xl bg-white border border-sky-100 flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>11 Cassatas:</strong> Fotos conservadas intactas y activas en el proyecto.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-sky-100 flex items-center gap-2 text-sky-900">
                    <CheckCircle2 className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
                    <span><strong>21 Productos restantes:</strong> Sin IA. Rutas limpias preparadas en <code className="bg-sky-100 px-1 py-0.2 rounded font-mono">public/imagenes/</code>.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dónde colocar las fotos */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5">
            <h4 className="font-bold text-[#EEFF00] text-sm mb-1.5 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#28AEE4]" />
              La regla de oro en Vite + Vercel: Carpeta <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">public/imagenes/</code>
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              Cualquier archivo de foto (.png o .jpg) que guardes dentro de <code className="text-[#EEFF00] font-mono">public/imagenes/</code> se publica automáticamente en Vercel en la ruta web <code className="text-sky-300 font-mono">/imagenes/nombre.png</code> con la máxima velocidad de CDN y sin tocar código.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">📁 Carpeta en tu proyecto:</span>
                <span className="text-emerald-400 font-bold break-all">
                  public/imagenes/lyn-naranja.png
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">🌐 Enlace directo en Vercel:</span>
                <span className="text-sky-300 font-bold break-all">
                  /imagenes/lyn-naranja.png
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Archivos de Productos */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileImage className="w-4 h-4 text-[#0284c7]" />
                Nombres exactos de archivo configurados en el catálogo:
              </h3>

              {/* Filtros */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Todos ({PRODUCTS.length})
                </button>
                <button
                  onClick={() => setFilter('cassatas')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filter === 'cassatas' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cassatas ({cassatas.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filter === 'pending' ? 'bg-white text-[#0284c7] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Para tus fotos ({pendingProducts.length})
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
              {displayedProducts.map((p) => {
                const isSelected = selectedProduct?.id === p.id;

                return (
                  <div 
                    key={p.id}
                    className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                      isSelected ? 'bg-sky-50 border-l-4 border-[#28AEE4]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {p.categoryName}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                        public/imagenes/{p.imageFileName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.hasPreservedPhoto ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Foto Oficial Activa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                          Esperando archivo
                        </span>
                      )}

                      <button
                        onClick={() => handleCopy(`public/imagenes/${p.imageFileName}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1 text-[11px] transition-colors"
                        title="Copiar ruta de archivo"
                      >
                        {copiedText === `public/imagenes/${p.imageFileName}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar nombre</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pasos rápidos para Vercel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-600" />
              Pasos para actualizar en Vercel:
            </h4>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Cuando tengas las fotos reales de tus helados (Lyn, Yiro, Manjar Crocante, etc.), guárdalas en la carpeta <code className="text-slate-900 font-mono">public/imagenes/</code> con el nombre correspondiente (ej. <code className="text-slate-900 font-mono">lyn-naranja.png</code>).</li>
              <li>Sube tus cambios a GitHub (<code className="text-slate-900 font-mono">git add . && git commit -m &quot;fotos oficiales&quot; && git push</code>).</li>
              <li>Vercel actualizará tu sitio web en segundos con las fotos reales y sin errores.</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Diseño original con tarjetas azules y amarillo característico totalmente conservado.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
