import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, Send, Check } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleWhatsAppOrder = () => {
    const header = '¡Hola! Quisiera realizar el siguiente pedido de su catálogo:%0A%0A';
    const itemsList = items
      .map(
        (item) =>
          `• ${item.quantity}x ${item.product.name} - $${(
            item.product.price * item.quantity
          ).toFixed(2)}`
      )
      .join('%0A');
    const total = `%0A%0A*Total Estimado:* $${totalAmount.toFixed(2)}`;
    const url = `https://wa.me/?text=${header}${itemsList}${total}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div 
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-[#0a1128] border-l border-blue-500/30 text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-900 to-[#0e1a38] border-b border-blue-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Tu Pedido</h2>
                <p className="text-xs text-blue-200">
                  {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'} en la cesta
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mb-4">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  Tu cesta está vacía
                </h3>
                <p className="text-xs text-blue-200/70 max-w-xs mb-4">
                  Explora las Cassatas y nuestras especialidades artesanales para comenzar tu pedido.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-950/70 to-[#0d1836] border border-blue-800/50 flex items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-blue-900 flex-shrink-0 relative">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback simple si la imagen local aún no está colocada
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-cyan-300 font-bold">
                      ${item.product.price.toFixed(2)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center rounded-lg bg-blue-900/60 border border-blue-700/50 text-xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-blue-800 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-blue-200" />
                        </button>
                        <span className="px-2 font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-blue-800 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-200" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-red-400 hover:text-red-300 p-1 text-xs"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con Total y Checkout */}
          {items.length > 0 && (
            <div className="p-5 bg-[#090f24] border-t border-blue-800/40 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Subtotal</span>
                <span className="font-semibold text-white">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold">
                <span className="text-white">Total Estimado</span>
                <span className="text-cyan-300 text-xl font-extrabold">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={onClearCart}
                  className="py-2.5 px-3 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs font-medium transition-colors"
                >
                  Vaciar
                </button>
                <button
                  onClick={handleWhatsAppOrder}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Pedir por WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
