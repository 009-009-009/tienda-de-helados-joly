import React, { useState, useMemo } from 'react';
import { PRODUCTS, CATEGORIES, CatalogProduct, CartItem, WHATSAPP_DISPLAY, WHATSAPP_PHONE } from './data/catalog';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { CheckoutModal } from './components/CheckoutModal';
import { VercelGuideModal } from './components/VercelGuideModal';
import { ImageSyncBar } from './components/ImageSyncBar';
import { VendorPanel } from './components/VendorPanel';
import { Sparkles, ShieldCheck, HelpCircle, Phone, Search, IceCream, Truck, AlertCircle, Clock } from 'lucide-react';
import { formatCLP } from './utils/format';
import { JOLY_OFFICIAL_LOGO } from './assets/officialLogo';

export default function App() {
  const [vistaActiva, setVistaActiva] = useState<'tienda' | 'vendedor'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('vendedor') || window.location.hash.includes('vendedor')) {
        return 'vendedor';
      }
      const saved = sessionStorage.getItem('joly_vista_activa');
      if (saved === 'vendedor') return 'vendedor';
    }
    return 'tienda';
  });

  // Modal de clave de acceso para vendedores
  const [mostrarModalClave, setMostrarModalClave] = useState<boolean>(false);
  const [pinIngresado, setPinIngresado] = useState<string>('');
  const [errorPin, setErrorPin] = useState<string>('');

  const handleSolicitarAccesoVendedor = () => {
    // Si ya está autenticado en la sesión, entra directo
    if (typeof window !== 'undefined' && sessionStorage.getItem('joly_vendedor_autenticado') === 'true') {
      handleCambiarVista('vendedor');
      return;
    }
    setPinIngresado('');
    setErrorPin('');
    setMostrarModalClave(true);
  };

  const handleVerificarPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pinLimpio = pinIngresado.trim();
    // Claves válidas operativas: 1234 (fácil para vendedores) o 2026
    if (pinLimpio === '1234' || pinLimpio === '2026' || pinLimpio === '7788') {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('joly_vendedor_autenticado', 'true');
      }
      setMostrarModalClave(false);
      handleCambiarVista('vendedor');
    } else {
      setErrorPin('PIN incorrecto. Ingresa el código asignado a tu furgón (Ej: 1234).');
    }
  };

  const handleCambiarVista = (nuevaVista: 'tienda' | 'vendedor') => {
    setVistaActiva(nuevaVista);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('joly_vista_activa', nuevaVista);
      window.location.hash = nuevaVista === 'vendedor' ? 'vendedor' : '';
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [guideSelectedProduct, setGuideSelectedProduct] = useState<CatalogProduct | undefined>(undefined);

  // Filtrado de productos por categoría y búsqueda
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.categoryId === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Manejo de cantidades de cajas
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing && delta > 0) {
        const prod = PRODUCTS.find((p) => p.id === productId);
        if (!prod) return prev;
        return [...prev, { product: prod, quantity: delta }];
      }
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOpenGuide = (product?: CatalogProduct) => {
    setGuideSelectedProduct(product);
    setIsGuideOpen(true);
  };

  // Totales
  const totalBoxes = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.product.boxPrice, 0);

  // Si la vista activa es el Panel del Vendedor, renderizamos el panel operativo
  if (vistaActiva === 'vendedor') {
    return <VendorPanel onBackToStore={() => handleCambiarVista('tienda')} />;
  }

  return (
    <div className="min-h-screen bg-[#EEFF00] bg-gradient-to-b from-[#F8FF00] via-[#EEFF00] to-[#E2F700] text-slate-900 flex flex-col selection:bg-slate-900 selection:text-[#EEFF00]">
      
      {/* Header con marca original JOLY & HELADOS PANDA */}
      <Header
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalBoxes={totalBoxes}
        totalAmount={totalAmount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenGuide={() => handleOpenGuide()}
        onOpenVendorPanel={handleSolicitarAccesoVendedor}
      />

      {/* Franja superior blanca con el banner amigable original */}
      <section className="bg-white/95 backdrop-blur-md border-b border-slate-900/10 pt-5 pb-6 px-4 sm:px-6 shadow-xs">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Banner Oficial de Distribuidora Mayorista Joly con aviso de reparto en Temuco */}
          <div className="bg-gradient-to-r from-[#003865] via-[#02568f] to-[#012d4d] text-white rounded-2xl p-3.5 sm:p-4.5 shadow-md border-2 border-[#38bdf8]/40 flex flex-col md:flex-row items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4 w-full md:w-auto">
              {/* Logo Joly Circular Oficial intacto */}
              <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/90 shadow-md bg-white flex items-center justify-center p-0.5">
                <img
                  src={JOLY_OFFICIAL_LOGO}
                  alt="Distribuidora Mayorista Joly"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Título de la tienda y aviso de reparto en Temuco */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                    Distribuidora Mayorista Joly
                  </h2>
                  <span className="bg-[#EEFF00] text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                    Catálogo Oficial
                  </span>
                </div>
                <p className="text-xs text-sky-200 mt-0.5 font-medium">
                  Confites, Abarrotes y Helados Panda al por Mayor
                </p>
                <div className="inline-flex items-center gap-2 mt-2 text-xs font-bold text-[#EEFF00] bg-black/40 px-3 py-1.5 rounded-xl border border-amber-400/40">
                  <span className="text-base">🚚</span>
                  <span>
                    Prepara tu pedido con anticipación: <strong className="text-white">Miércoles y Jueves reparto en todo Temuco</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Cuadro destacado de reparto en desktop */}
            <div className="hidden md:flex flex-col items-center shrink-0 bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-xs">
              <span className="text-[10px] font-extrabold text-sky-200 uppercase tracking-wider">
                Días de Reparto
              </span>
              <span className="text-sm font-black text-[#EEFF00]">
                Miércoles y Jueves
              </span>
              <span className="text-[10px] font-bold text-white/90">
                Todo Temuco
              </span>
            </div>
          </div>

          {/* Caja Amarilla: Aviso de Venta Exclusiva por Caja */}
          <div className="bg-amber-50/95 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-4.5 text-amber-950 shadow-xs flex items-center gap-3.5 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400/25 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-800">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  Venta por Caja
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-950">
                  Aviso Importante para Compradores
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                <strong className="text-amber-950 font-bold">Todos los productos se venden exclusivamente por caja cerrada.</strong> El valor por unidad mostrado en cada helado es solo una referencia sugerida para el cálculo de su negocio.
              </p>
            </div>
          </div>

          {/* Panel de Carga Rápida reservado para administración privada (?admin=true) */}
          {typeof window !== 'undefined' && window.location.search.includes('admin=true') && (
            <ImageSyncBar />
          )}

          {/* Buscador de Helados */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar helado, cassata, paleta o sabor..."
                className="w-full h-11 pl-10 pr-9 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-[#28AEE4] focus:ring-2 focus:ring-[#28AEE4]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cuadros de Buscador en Detalle (Categorías) adaptados a pantalla de celular */}
          <div className="mt-4 pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Filtrar por categoría:
              </span>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] font-bold text-[#0284c7] hover:underline cursor-pointer"
                >
                  Ver todos los helados ({PRODUCTS.length})
                </button>
              )}
            </div>

            {/* Grid de 2 columnas en celular para que NUNCA se salga de la pantalla */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`col-span-2 sm:col-span-1 min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-2 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-950 text-white shadow-xs ring-2 ring-slate-950/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <span>🍦 Todos ({PRODUCTS.length})</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    selectedCategory === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Completo
                </span>
              </button>

              {CATEGORIES.map((cat) => {
                const count = PRODUCTS.filter((p) => p.categoryId === cat.id).length;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#0284c7] text-white shadow-xs ring-2 ring-sky-400/40'
                        : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat.shortName}</span>
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Contenido Principal / Catálogo en la cuadrícula de tarjetas azules */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Barra de conteo de productos */}
        <div className="flex items-center justify-between mb-4 text-xs text-slate-800 font-medium bg-white/60 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-xs">
          <span>
            Mostrando <strong className="text-slate-950 font-bold">{filteredProducts.length}</strong> de {PRODUCTS.length} productos
          </span>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-[#0284c7] font-bold hover:underline cursor-pointer"
            >
              Mostrar catálogo completo ({PRODUCTS.length})
            </button>
          )}
        </div>

        {/* Cuadrícula de Productos */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white/95 rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Search className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto mb-4">
              No hay productos que coincidan con &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
            {filteredProducts.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id);
              const quantity = inCart ? inCart.quantity : 0;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={quantity}
                  onUpdateQuantity={(delta) => handleUpdateQuantity(product.id, delta)}
                  onOpenGuide={handleOpenGuide}
                />
              );
            })}
          </div>
        )}

      </main>

      {/* Barra flotante inferior de pedido cuando hay items en el carrito */}
      {totalBoxes > 0 && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-slate-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="block text-xs font-bold text-[#EEFF00]">
                {totalBoxes} {totalBoxes === 1 ? 'Caja agregada' : 'Cajas agregadas'}
              </span>
              <span className="block text-base font-extrabold text-white">
                {formatCLP(totalAmount)}
              </span>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#28AEE4] hover:bg-[#209bcc] text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Revisar Pedido →
            </button>
          </div>
        </div>
      )}

      {/* Footer original con branding JOLY & HELADOS PANDA */}
      <footer className="mt-auto border-t border-slate-900/10 bg-white/95 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <img
              src={JOLY_OFFICIAL_LOGO}
              alt="Distribuidora Joly"
              className="w-7 h-7 object-contain rounded-full shadow-xs border border-sky-300 bg-white"
            />
            <span className="font-extrabold text-slate-900 tracking-wide">
              Distribuidora Joly · HELADOS PANDA
            </span>
            <span className="font-medium text-slate-600">
              · Venta al por Mayor para Negocios
            </span>
          </div>

          <p className="text-slate-500 font-semibold">
            Despachos Tempranito · WhatsApp: {WHATSAPP_DISPLAY}
          </p>
        </div>
      </footer>

      {/* Modal de Pedido y Checkout Mayorista */}
      <CheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Modal Guía Vercel */}
      <VercelGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        selectedProduct={guideSelectedProduct}
      />

      {/* Modal de Clave / PIN de Seguridad para Vendedores */}
      {mostrarModalClave && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-slate-900 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700 text-xl font-bold">
              🔒
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Acceso Exclusivo a Vendedores
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tu PIN de ruta para ingresar al Panel del Vendedor (Pedidos, Carga Extra y Cierre).
              </p>
            </div>

            <form onSubmit={handleVerificarPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="PIN de acceso..."
                  value={pinIngresado}
                  onChange={(e) => {
                    setPinIngresado(e.target.value);
                    setErrorPin('');
                  }}
                  autoFocus
                  className="w-full text-center text-xl tracking-widest font-black py-2.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
                />
                {errorPin && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1.5">{errorPin}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalClave(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer shadow-md"
                >
                  Ingresar →
                </button>
              </div>

              <p className="text-[10px] text-slate-400">
                💡 Clave de prueba vendedor: <strong className="text-slate-600">1234</strong>
              </p>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
