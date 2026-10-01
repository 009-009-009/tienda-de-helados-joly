import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

interface Slot {
  id: string;
  title: string;
  sub: string;
  fileName: string;
  targets: string[];
}

const SLOTS: Slot[] = [
  {
    id: 'lyn',
    title: '1. Helados Lyn',
    sub: 'Para Lyn Naranja y Lyn Frutilla',
    fileName: 'lyn-frutilla.png',
    targets: ['Lyn Naranja', 'Lyn Frutilla']
  },
  {
    id: 'yiro',
    title: '2. Super Yiro',
    sub: 'Para los 3 sabores de Yiro',
    fileName: 'yiro-uva-berries.png',
    targets: ['Yiro Papaya/Frambuesa', 'Yiro Uva/Berries', 'Yiro Limón/Manzana']
  },
  {
    id: 'chocante',
    title: '3. Línea Chocante',
    sub: 'Para los 3 sabores Chocante',
    fileName: 'chocante-crema.frambuesa.png',
    targets: ['Chocante Tres Leches', 'Chocante Frambuesa', 'Chocante Chocolate']
  },
  {
    id: 'colocolo',
    title: '4. Colo-Colo y U. de Chile',
    sub: 'Para Colo Colo Piña y U. de Chile Piña',
    fileName: 'colo-colo-pina.png',
    targets: ['Colo Colo Piña', 'U. de Chile Piña']
  },
  {
    id: 'cono-crema',
    title: '5. Cono y Copa Crema',
    sub: 'Para Cono Crema y Copa Crema Frambuesa',
    fileName: 'cono-crema-frambuesa.png',
    targets: ['Cono Crema / Frambuesa', 'Copa Crema / Frambuesa']
  },
  {
    id: 'choco-manjar',
    title: '6. Choco Manjar',
    sub: 'Para Manjar Crocante',
    fileName: 'manjar-crocante.png',
    targets: ['Manjar Crocante (Choco Manjar)']
  },
  {
    id: 'paleta-cassata',
    title: '7. Paleta Cassatta',
    sub: 'Paleta 3 sabores en palo',
    fileName: 'paleta-cassata.png',
    targets: ['Paleta Cassatta']
  },
  {
    id: 'paleta-tunga',
    title: '8. Paleta Tunga',
    sub: 'Paleta Vainilla y Chocolate',
    fileName: 'paleta-tunga.png',
    targets: ['Paleta Tunga']
  },
  {
    id: 'chirimoya-alegre',
    title: '9. Chirimoya Alegre',
    sub: 'Paleta Chirimoya Alegre',
    fileName: 'paleta-chirimoya-alegre.png',
    targets: ['Chirimoya Alegre']
  },
  {
    id: 'paleta-crema',
    title: '10. Paleta Crema',
    sub: 'Paleta de Leche Crema',
    fileName: 'paleta-crema.png',
    targets: ['Paleta Crema']
  },
  {
    id: 'choco-panda',
    title: '11. Choco Panda',
    sub: 'Paleta Choco Panda',
    fileName: 'choco-panda.png',
    targets: ['Choco Panda']
  },
  {
    id: 'crema-frambuesa',
    title: '12. Crema Frambuesa',
    sub: 'Paleta Crema Frambuesa',
    fileName: 'crema-frambuesa.png',
    targets: ['Crema Frambuesa']
  },
  {
    id: 'mora-mora',
    title: '13. Mora Mora',
    sub: 'Paleta Mora Mora',
    fileName: 'paleta-mora-mora.png',
    targets: ['Mora Mora']
  },
  {
    id: '2-palos-frambuesa',
    title: '14. 2 Palos Frambuesa',
    sub: 'Helado doble de frambuesa',
    fileName: '2-palos-frambuesa.png',
    targets: ['2 Palos Frambuesa']
  },
  {
    id: 'logo-joly',
    title: '⭐ Logo Oficial Joly',
    sub: 'Logo circular para cabecera',
    fileName: 'logo_joly_recortado.png',
    targets: ['Cabecera y Barra de Tienda']
  }
];

export const ImageSyncBar: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(true);

  const handleUpload = async (slot: Slot, file: File) => {
    setUploadStatus((prev) => ({ ...prev, [slot.id]: 'uploading' }));
    setMessages((prev) => ({ ...prev, [slot.id]: 'Guardando imagen...' }));

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
              [slot.id]: `¡Guardada! Activada en ${slot.targets.length} productos.`
            }));

            // Notificar a la app para refrescar imágenes
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

  return (
    <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-sky-400/30 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EEFF00] text-slate-950 flex items-center justify-center font-black shadow-xs">
            📸
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              <span>Carga Rápida de tus Fotos Reales</span>
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                100% Permanente
              </span>
            </h3>
            <p className="text-xs text-sky-200">
              Toca el botón amarillo de cada casilla para elegir su foto (quedará centrada automáticamente):
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-sky-200 hover:text-white underline self-start sm:self-auto cursor-pointer"
        >
          {isOpen ? 'Ocultar panel' : 'Mostrar panel de carga'}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 pt-2">
          {SLOTS.map((slot) => {
            const status = uploadStatus[slot.id] || 'idle';
            const msg = messages[slot.id];

            return (
              <div
                key={slot.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 flex flex-col justify-between hover:bg-white/15 transition-all"
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
                    <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-lg p-2 text-center text-xs text-emerald-200 font-bold">
                      ✅ {msg}
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg text-xs font-bold bg-[#EEFF00] hover:bg-yellow-300 text-slate-950 transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-slate-950" />
                      <span>{status === 'uploading' ? 'Subiendo...' : 'Seleccionar foto'}</span>
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
                  )}

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
      )}
    </div>
  );
};
