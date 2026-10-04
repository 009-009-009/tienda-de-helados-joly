import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface Slot {
  id: string;
  category: 'cassatas' | 'paletas';
  title: string;
  sub: string;
  fileName: string;
  targets: string[];
}

const SLOTS: Slot[] = [
  // --- CASSATAS OFICIALES ---
  {
    id: 'cas-pina',
    category: 'cassatas',
    title: '1. Cassata Piña',
    sub: 'Sirve para 1 Litro y 1.8 Litros',
    fileName: 'cassata-pina.png',
    targets: ['Cassata 1 L - Piña', 'Cassata 1,8 L - Piña']
  },
  {
    id: 'cas-tradicional',
    category: 'cassatas',
    title: '2. Cassata Tradicional',
    sub: 'Tricolor (sirve para 1 L y 1.8 L)',
    fileName: 'cassata-tradicional.png',
    targets: ['Cassata 1 L - Tradicional', 'Cassata 1,8 L - Cassata']
  },
  {
    id: 'cas-trisabor',
    category: 'cassatas',
    title: '3. Cassata Trisabor',
    sub: 'Galleta/chips (sirve para 1 L y 1.8 L)',
    fileName: 'cassata-trisabor.png',
    targets: ['Cassata 1 L - Trisabor', 'Cassata 1,8 L - Trisabor']
  },
  {
    id: 'cas-choco-menta',
    category: 'cassatas',
    title: '4. Choco Menta / 3 Leches',
    sub: 'Para Cassata 1.8 Litros',
    fileName: 'cassata-1-8l-choco-menta-3leches.png',
    targets: ['Cassata 1,8 L - Chocolate/Menta Chips/3 Leches']
  },
  {
    id: 'cas-crema-frambuesa',
    category: 'cassatas',
    title: '5. Crema Frambuesa 1L',
    sub: 'Para Cassata 1 Litro',
    fileName: 'cassata-crema-frambuesa.png',
    targets: ['Cassata 1 L - Crema Frambuesa']
  },
  {
    id: 'cas-frutos-bosque',
    category: 'cassatas',
    title: '6. Frutos del Bosque 1L',
    sub: 'Para Cassata 1 Litro',
    fileName: 'cassata-frutos-del-bosque.png',
    targets: ['Cassata 1 L - Frutos del Bosque']
  },
  {
    id: 'cas-chirimoya',
    category: 'cassatas',
    title: '7. Chirimoya Alegre 1L',
    sub: 'Para Cassata 1 Litro',
    fileName: 'cassata-chirimoya-alegre.png',
    targets: ['Cassata 1 L - Chirimoya Alegre']
  },

  // --- PALETAS Y HELADOS INDIVIDUALES ---
  {
    id: 'lyn',
    category: 'paletas',
    title: '8. Helados Lyn',
    sub: 'Para Lyn Naranja y Lyn Frutilla',
    fileName: 'lyn-frutilla.png',
    targets: ['Lyn Naranja', 'Lyn Frutilla']
  },
  {
    id: 'yiro',
    category: 'paletas',
    title: '9. Super Yiro',
    sub: 'Para los 3 sabores de Yiro',
    fileName: 'yiro-uva-berries.png',
    targets: ['Yiro Papaya/Frambuesa', 'Yiro Uva/Berries', 'Yiro Limón/Manzana']
  },
  {
    id: 'chocante',
    category: 'paletas',
    title: '10. Línea Chocante',
    sub: 'Para los 3 sabores Chocante',
    fileName: 'chocante-crema.frambuesa.png',
    targets: ['Chocante Tres Leches', 'Chocante Frambuesa', 'Chocante Macchiato']
  },
  {
    id: 'colocolo',
    category: 'paletas',
    title: '11. Colo-Colo y U. de Chile',
    sub: 'Para Colo Colo Piña y U. de Chile Piña',
    fileName: 'colo-colo-pina.png',
    targets: ['Colo Colo Piña', 'U. de Chile Piña']
  },
  {
    id: 'cono-crema',
    category: 'paletas',
    title: '12. Cono y Copa Crema',
    sub: 'Para Cono Crema y Copa Crema Frambuesa',
    fileName: 'cono-crema-frambuesa.png',
    targets: ['Cono Crema / Frambuesa', 'Copa Crema / Frambuesa']
  },
  {
    id: 'choco-manjar',
    category: 'paletas',
    title: '13. Manjar Crocante',
    sub: 'Paleta Manjar Crocante',
    fileName: 'manjar-crocante.png',
    targets: ['Manjar Crocante']
  },
  {
    id: 'paleta-cassata',
    category: 'paletas',
    title: '14. Paleta Cassatta',
    sub: 'Paleta 3 sabores en palo',
    fileName: 'paleta-cassata.png',
    targets: ['Paleta Cassatta']
  },
  {
    id: 'paleta-tunga',
    category: 'paletas',
    title: '15. Paleta Tunga',
    sub: 'Paleta Vainilla y Chocolate',
    fileName: 'paleta-tunga.png',
    targets: ['Paleta Tunga']
  },
  {
    id: 'chirimoya-alegre',
    category: 'paletas',
    title: '16. Paleta Chirimoya Alegre',
    sub: 'Paleta Chirimoya Alegre',
    fileName: 'paleta-chirimoya-alegre.png',
    targets: ['Chirimoya Alegre']
  },
  {
    id: 'paleta-crema',
    category: 'paletas',
    title: '17. Paleta Crema',
    sub: 'Paleta de Leche Crema',
    fileName: 'paleta-crema.png',
    targets: ['Paleta Crema']
  },
  {
    id: 'choco-panda',
    category: 'paletas',
    title: '18. Choco Panda',
    sub: 'Paleta Choco Panda',
    fileName: 'choco-panda.png',
    targets: ['Choco Panda']
  },
  {
    id: 'crema-frambuesa',
    category: 'paletas',
    title: '19. Paleta Crema Frambuesa',
    sub: 'Paleta Crema Frambuesa',
    fileName: 'crema-frambuesa.png',
    targets: ['Crema Frambuesa']
  },
  {
    id: 'mora-mora',
    category: 'paletas',
    title: '20. Paleta Mora Mora',
    sub: 'Paleta Mora Mora',
    fileName: 'paleta-mora-mora.png',
    targets: ['Mora Mora']
  },
  {
    id: '2-palos-frambuesa',
    category: 'paletas',
    title: '21. 2 Palos Frambuesa',
    sub: 'Helado doble de frambuesa',
    fileName: '2-palos-frambuesa.png',
    targets: ['2 Palos Frambuesa']
  }
];

export const ImageSyncBar: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'cassatas' | 'paletas'>('cassatas');

  const handleUpload = async (slot: Slot, file: File) => {
    setUploadStatus((prev) => ({ ...prev, [slot.id]: 'uploading' }));
    setMessages((prev) => ({ ...prev, [slot.id]: 'Guardando en servidor...' }));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;

          const res = await fetch('/api/save-catalog-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: slot.fileName,
              base64Data
            })
          });

          if (!res.ok) {
            throw new Error(`Error en servidor: ${res.statusText}`);
          }

          const data = await res.json();
          if (data.success) {
            setUploadStatus((prev) => ({ ...prev, [slot.id]: 'success' }));
            setMessages((prev) => ({
              ...prev,
              [slot.id]: `¡Guardada! Activada en ${slot.targets.length} producto(s).`
            }));

            // Notificar a la app para refrescar imágenes en vivo
            window.dispatchEvent(new CustomEvent('catalog-image-updated', {
              detail: { fileName: slot.fileName }
            }));
          } else {
            throw new Error(data.error || 'No se pudo guardar la imagen');
          }
        } catch (err: any) {
          setUploadStatus((prev) => ({ ...prev, [slot.id]: 'error' }));
          setMessages((prev) => ({ ...prev, [slot.id]: err.message || 'Error al guardar' }));
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadStatus((prev) => ({ ...prev, [slot.id]: 'error' }));
      setMessages((prev) => ({ ...prev, [slot.id]: err.message || 'Error de lectura' }));
    }
  };

  const currentSlots = SLOTS.filter((s) => s.category === activeTab);

  return (
    <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border-2 border-sky-400/40 mb-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#EEFF00] text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
            📸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white">
                Panel de Carga Rápida de Fotos Reales
              </h3>
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Directo a Disco
              </span>
            </div>
            <p className="text-xs text-sky-200">
              Selecciona cualquier foto desde tu computador o celular: se guarda al instante y actualiza la tienda.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-sky-200 hover:text-white transition-colors cursor-pointer self-start sm:self-auto border border-white/20"
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Ocultar panel</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Abrir panel de carga</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="pt-2 border-t border-white/15 mt-3">
          {/* Pestañas para elegir categoría */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('cassatas')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'cassatas'
                  ? 'bg-[#EEFF00] text-slate-950 shadow-md scale-102'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <span>🍨</span>
              <span>Cassatas 1L y 1.8L ({SLOTS.filter((s) => s.category === 'cassatas').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paletas')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paletas'
                  ? 'bg-[#EEFF00] text-slate-950 shadow-md scale-102'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <span>🍦</span>
              <span>Paletas y Helados ({SLOTS.filter((s) => s.category === 'paletas').length})</span>
            </button>
          </div>

          {/* Grilla de slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {currentSlots.map((slot) => {
              const status = uploadStatus[slot.id] || 'idle';
              const msg = messages[slot.id];

              return (
                <div
                  key={slot.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex flex-col justify-between hover:bg-white/15 transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-[#EEFF00]">
                        {slot.title}
                      </span>
                      {status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-sky-100 font-medium leading-tight mb-2">
                      {slot.sub}
                    </p>
                    <p className="text-[10px] text-sky-300 font-mono mb-3">
                      Archivo: {slot.fileName}
                    </p>
                  </div>

                  <div>
                    {status === 'success' ? (
                      <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-lg p-2 text-center text-xs text-emerald-200 font-bold mb-2">
                        ✅ {msg}
                      </div>
                    ) : null}

                    <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl text-xs font-black bg-[#EEFF00] hover:bg-yellow-300 text-slate-950 transition-transform active:scale-98 shadow-md">
                      <Upload className="w-4 h-4 text-slate-950" />
                      <span>{status === 'uploading' ? 'Subiendo...' : 'Seleccionar archivo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={status === 'uploading'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(slot, file);
                        }}
                        className="hidden"
                      />
                    </label>

                    {status === 'error' && (
                      <p className="text-[10px] text-red-300 font-bold mt-1.5 text-center">
                        ⚠️ {msg}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
