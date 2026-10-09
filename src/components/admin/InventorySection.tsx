import React, { useState, useMemo } from 'react';
import { PRODUCTS, CatalogProduct } from '../../data/catalog';
import { 
  StockProductoUnificado, 
  MovimientoInventario, 
  RecepcionFacturaDoc, 
  ItemRecepcionFactura 
} from '../../types/inventory';
import { 
  INITIAL_STOCK_DEMO, 
  MOVIMIENTOS_INICIALES_DEMO, 
  FACTURAS_DEMO, 
  PROVEEDORES_DEMO 
} from '../../data/mockAdminInventory';
import { 
  Package, 
  FileText, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Upload, 
  Clock, 
  Trash2, 
  Check, 
  Layers, 
  Info,
  Calendar,
  Building,
  User,
  ShieldCheck
} from 'lucide-react';
import { formatCLP } from '../../utils/format';

export function InventorySection() {
  // Pestaña activa dentro de Inventario
  const [subTab, setSubTab] = useState<'stock' | 'factura' | 'manual' | 'movimientos'>('stock');

  // Estado del inventario (almacenado en sesión para persistencia temporal demo)
  const [stockList, setStockList] = useState<StockProductoUnificado[]>(() => {
    const saved = sessionStorage.getItem('joly_admin_stock_demo');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_STOCK_DEMO;
  });

  // Historial de movimientos unificado
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(() => {
    const saved = sessionStorage.getItem('joly_admin_movimientos_demo');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return MOVIMIENTOS_INICIALES_DEMO;
  });

  // Facturas registradas
  const [facturas, setFacturas] = useState<RecepcionFacturaDoc[]>(() => {
    const saved = sessionStorage.getItem('joly_admin_facturas_demo');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return FACTURAS_DEMO;
  });

  // Guardar en sessionStorage para no perder cambios durante navegación
  const persistStock = (newStock: StockProductoUnificado[]) => {
    setStockList(newStock);
    sessionStorage.setItem('joly_admin_stock_demo', JSON.stringify(newStock));
  };

  const persistMovimientos = (newMovs: MovimientoInventario[]) => {
    setMovimientos(newMovs);
    sessionStorage.setItem('joly_admin_movimientos_demo', JSON.stringify(newMovs));
  };

  const persistFacturas = (newFacts: RecepcionFacturaDoc[]) => {
    setFacturas(newFacts);
    sessionStorage.setItem('joly_admin_facturas_demo', JSON.stringify(newFacts));
  };

  // ----------------------------------------------------
  // ESTADOS DEL FORMULARIO: RECEPCIÓN DE FACTURA
  // ----------------------------------------------------
  const [numFactura, setNumFactura] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(PROVEEDORES_DEMO[0]);
  const [proveedorPersonalizado, setProveedorPersonalizado] = useState('');
  const [fechaRecepcion, setFechaRecepcion] = useState(() => new Date().toISOString().split('T')[0]);
  const [responsableFactura, setResponsableFactura] = useState('Encargado de Bodega');
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string; tamano: string } | null>(null);
  const [itemsFactura, setItemsFactura] = useState<ItemRecepcionFactura[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(PRODUCTS[0]?.id || '');
  const [cajasFacturadasInput, setCajasFacturadasInput] = useState<number>(10);
  const [cajasFisicasInput, setCajasFisicasInput] = useState<number>(10);
  const [observacionItem, setObservacionItem] = useState('');
  const [mensajeExitoFactura, setMensajeExitoFactura] = useState<string | null>(null);

  // ----------------------------------------------------
  // ESTADOS DEL FORMULARIO: INGRESO MANUAL
  // ----------------------------------------------------
  const [prodManualId, setProdManualId] = useState(PRODUCTS[0]?.id || '');
  const [cajasManual, setCajasManual] = useState<number>(5);
  const [tipoAjusteManual, setTipoAjusteManual] = useState<'ingreso_extraordinario' | 'ajuste_conteo' | 'devolucion_cliente' | 'merma_bodega'>('ajuste_conteo');
  const [motivoManual, setMotivoManual] = useState('');
  const [responsableManual, setResponsableManual] = useState('Encargado de Bodega');
  const [mensajeExitoManual, setMensajeExitoManual] = useState<string | null>(null);

  // ----------------------------------------------------
  // FILTROS EN TABLA DE STOCK
  // ----------------------------------------------------
  const [searchStock, setSearchStock] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('all');

  const stockFiltrado = useMemo(() => {
    return stockList.filter(item => {
      const matchSearch = item.productName.toLowerCase().includes(searchStock.toLowerCase());
      const matchCat = filtroCategoria === 'all' || item.categoryName === filtroCategoria;
      return matchSearch && matchCat;
    });
  }, [stockList, searchStock, filtroCategoria]);

  // Totales consolidados de la empresa
  const totalesEmpresa = useMemo(() => {
    return stockList.reduce((acc, curr) => ({
      bodega: acc.bodega + curr.cajasBodega,
      furgon1: acc.furgon1 + curr.cajasAsignadasFurgon1,
      furgon2: acc.furgon2 + curr.cajasAsignadasFurgon2,
      total: acc.total + curr.totalEmpresa
    }), { bodega: 0, furgon1: 0, furgon2: 0, total: 0 });
  }, [stockList]);

  // Categorías únicas para filtro
  const categoriasUnicas = useMemo(() => {
    return Array.from(new Set(stockList.map(s => s.categoryName)));
  }, [stockList]);

  // ----------------------------------------------------
  // FUNCIONES DE RECEPCIÓN DE FACTURA
  // ----------------------------------------------------
  const handleAgregarItemFactura = () => {
    const prod = PRODUCTS.find(p => p.id === productoSeleccionadoId);
    if (!prod) return;

    if (cajasFacturadasInput <= 0 && cajasFisicasInput <= 0) {
      alert('La cantidad de cajas debe ser mayor a 0');
      return;
    }

    const nuevoItem: ItemRecepcionFactura = {
      productId: prod.id,
      productName: prod.name,
      categoryName: prod.categoryName,
      unitsPerBox: prod.unitsPerBox,
      cajasFacturadas: cajasFacturadasInput,
      cajasRecibidasFisicas: cajasFisicasInput,
      precioUnitarioCaja: prod.boxPrice,
      observaciones: observacionItem.trim() || undefined
    };

    setItemsFactura(prev => [...prev, nuevoItem]);
    setObservacionItem('');
    setCajasFacturadasInput(10);
    setCajasFisicasInput(10);
  };

  const handleEliminarItemFactura = (index: number) => {
    setItemsFactura(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmarRecepcionFactura = () => {
    const numLimpio = numFactura.trim();
    if (!numLimpio) {
      alert('Por favor ingresa el número de la factura.');
      return;
    }
    if (itemsFactura.length === 0) {
      alert('Debes agregar al menos un producto a la recepción.');
      return;
    }

    const proveedorFinal = proveedorSeleccionado === 'Otro' ? proveedorPersonalizado.trim() : proveedorSeleccionado;
    if (!proveedorFinal) {
      alert('Por favor especifica el nombre del proveedor.');
      return;
    }

    const totalFacturadas = itemsFactura.reduce((s, it) => s + it.cajasFacturadas, 0);
    const totalFisicas = itemsFactura.reduce((s, it) => s + it.cajasRecibidasFisicas, 0);

    // 1. Crear documento de recepción
    const nuevaRecepcion: RecepcionFacturaDoc = {
      id: `REC-DEMO-${Date.now()}`,
      numeroFactura: numLimpio,
      proveedor: proveedorFinal,
      fechaRecepcion,
      responsableRecepcion: responsableFactura,
      archivoNombre: archivoAdjunto?.nombre || 'Factura_documento.pdf',
      archivoTipo: 'application/pdf',
      archivoTamano: archivoAdjunto?.tamano || '1.1 MB',
      estado: 'confirmada_ingresada',
      items: [...itemsFactura],
      totalCajasFacturadas: totalFacturadas,
      totalCajasRecibidas: totalFisicas,
      confirmadaAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      confirmadaPor: responsableFactura,
      esDemo: true
    };

    // 2. Actualizar Stock de Bodega Central (SOLO cajas físicas confirmadas)
    const nuevoStock = stockList.map(item => {
      const itemRecibido = itemsFactura.find(it => it.productId === item.productId);
      if (itemRecibido) {
        const nuevoBodega = item.cajasBodega + itemRecibido.cajasRecibidasFisicas;
        return {
          ...item,
          cajasBodega: nuevoBodega,
          totalEmpresa: nuevoBodega + item.cajasAsignadasFurgon1 + item.cajasAsignadasFurgon2,
          ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return item;
    });

    // 3. Crear movimiento unificado de inventario
    const nuevoMovimiento: MovimientoInventario = {
      id: `MOV-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      tipo: 'RECEPCION_FACTURA',
      referenciaDoc: numLimpio,
      descripcion: `Recepción factura ${numLimpio} (${proveedorFinal}) - ${totalFisicas} cj ingresadas a Bodega`,
      responsable: responsableFactura,
      origen: 'PROVEEDOR',
      destino: 'BODEGA_CENTRAL',
      totalCajas: totalFisicas,
      items: itemsFactura.map(it => ({
        productId: it.productId,
        productName: it.productName,
        cajas: it.cajasRecibidasFisicas
      })),
      esDemo: true
    };

    // Persistir
    persistStock(nuevoStock);
    persistMovimientos([nuevoMovimiento, ...movimientos]);
    persistFacturas([nuevaRecepcion, ...facturas]);

    // Limpiar formulario
    setNumFactura('');
    setItemsFactura([]);
    setArchivoAdjunto(null);
    setMensajeExitoFactura(`¡Recepción de Factura ${numLimpio} confirmada exitosamente! Se ingresaron ${totalFisicas} cajas a Bodega Central.`);
    
    setTimeout(() => {
      setMensajeExitoFactura(null);
      setSubTab('stock');
    }, 2800);
  };

  // ----------------------------------------------------
  // FUNCIONES DE INGRESO MANUAL
  // ----------------------------------------------------
  const handleConfirmarIngresoManual = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = PRODUCTS.find(p => p.id === prodManualId);
    if (!prod) return;

    if (cajasManual === 0) {
      alert('Ingresa una cantidad de cajas distinta de cero.');
      return;
    }
    if (!motivoManual.trim()) {
      alert('Es obligatorio ingresar un motivo o justificación para este movimiento.');
      return;
    }

    const deltaCajas = tipoAjusteManual === 'merma_bodega' ? -Math.abs(cajasManual) : Math.abs(cajasManual);

    // 1. Actualizar Stock
    const nuevoStock = stockList.map(item => {
      if (item.productId === prod.id) {
        const nuevoBodega = Math.max(0, item.cajasBodega + deltaCajas);
        return {
          ...item,
          cajasBodega: nuevoBodega,
          totalEmpresa: nuevoBodega + item.cajasAsignadasFurgon1 + item.cajasAsignadasFurgon2,
          ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return item;
    });

    // 2. Registrar movimiento unificado
    const nuevoMov: MovimientoInventario = {
      id: `MOV-MAN-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
      tipo: tipoAjusteManual === 'merma_bodega' ? 'AJUSTE_MERMA_BODEGA' : 'INGRESO_MANUAL',
      referenciaDoc: `MANUAL-${Date.now().toString().slice(-4)}`,
      descripcion: `Ajuste manual: ${tipoAjusteManual} (${deltaCajas > 0 ? '+' : ''}${deltaCajas} cj de ${prod.name}) - Motivo: ${motivoManual}`,
      responsable: responsableManual,
      origen: deltaCajas > 0 ? 'AJUSTE' : 'BODEGA_CENTRAL',
      destino: deltaCajas > 0 ? 'BODEGA_CENTRAL' : 'MERMA',
      totalCajas: Math.abs(deltaCajas),
      items: [{ productId: prod.id, productName: prod.name, cajas: Math.abs(deltaCajas) }],
      esDemo: true
    };

    persistStock(nuevoStock);
    persistMovimientos([nuevoMov, ...movimientos]);

    setMensajeExitoManual(`Movimiento registrado correctamente: ${deltaCajas > 0 ? '+' : ''}${deltaCajas} cj de ${prod.name}.`);
    setMotivoManual('');
    setCajasManual(5);

    setTimeout(() => {
      setMensajeExitoManual(null);
      setSubTab('stock');
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Identificación Demo */}
      <div className="bg-slate-800 text-slate-200 px-4 py-2.5 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Módulo de Administración • Inventario Central</span>
          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">[DEMOSTRACIÓN AISLADA]</span>
        </div>
        <div className="text-slate-400">
          No altera las cajas ni ventas de los furgones activos
        </div>
      </div>

      {/* Sub-Navegación de Inventario */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSubTab('stock')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              subTab === 'stock'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tablero de Stock ({stockList.length} productos)
          </button>
          <button
            onClick={() => setSubTab('factura')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              subTab === 'factura'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Recepción con Factura</span>
          </button>
          <button
            onClick={() => setSubTab('manual')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              subTab === 'manual'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Ingreso Manual</span>
          </button>
          <button
            onClick={() => setSubTab('movimientos')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center space-x-2 ${
              subTab === 'movimientos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Registro de Movimientos ({movimientos.length})</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* VISTA 1: TABLERO DE STOCK UNIFICADO                 */}
      {/* ---------------------------------------------------- */}
      {subTab === 'stock' && (
        <div className="space-y-6">
          {/* Tarjetas de Resumen Consolidado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Stock Bodega Central
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {totalesEmpresa.bodega} <span className="text-sm font-normal text-slate-500">cajas</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>En cámaras de congelado</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Cajas en Furgón 1
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {totalesEmpresa.furgon1} <span className="text-sm font-normal text-slate-500">cajas</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Asignadas para ruta activa
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Cajas en Furgón 2
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {totalesEmpresa.furgon2} <span className="text-sm font-normal text-slate-500">cajas</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Asignadas para ruta activa
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl text-white shadow-sm border border-slate-800">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Total Inventario Empresa
              </div>
              <div className="text-3xl font-bold text-white">
                {totalesEmpresa.total} <span className="text-sm font-normal text-slate-300">cajas</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Bodega + Furgones en tránsito
              </div>
            </div>
          </div>

          {/* Filtros de la Tabla */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de producto..."
                value={searchStock}
                onChange={(e) => setSearchStock(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="all">Todas las categorías</option>
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Stock Detallada */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Producto JOLY</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">Formato</th>
                    <th className="py-3 px-4 text-right bg-blue-50/50 text-slate-900 font-bold border-x border-slate-200">
                      Bodega Central
                    </th>
                    <th className="py-3 px-4 text-right">Furgón 1</th>
                    <th className="py-3 px-4 text-right">Furgón 2</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Total Empresa</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockFiltrado.map((item) => {
                    const esStockBajo = item.cajasBodega <= item.stockMinimoAlerta;
                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {item.categoryName}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 text-xs">
                          {item.unitsPerBox} un/caja
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 bg-blue-50/30 border-x border-slate-200">
                          {item.cajasBodega} cj
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {item.cajasAsignadasFurgon1 > 0 ? `${item.cajasAsignadasFurgon1} cj` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {item.cajasAsignadasFurgon2 > 0 ? `${item.cajasAsignadasFurgon2} cj` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {item.totalEmpresa} cj
                        </td>
                        <td className="py-3 px-4 text-center">
                          {esStockBajo ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Stock Mínimo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {stockFiltrado.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No se encontraron productos con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VISTA 2: RECEPCIÓN MEDIANTE FACTURA DE COMPRA        */}
      {/* ---------------------------------------------------- */}
      {subTab === 'factura' && (
        <div className="space-y-6">
          {mensajeExitoFactura && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{mensajeExitoFactura}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recepción mediante Factura de Compra</h3>
              <p className="text-sm text-slate-500 mt-1">
                Registra la llegada de mercadería desde fábrica o proveedor. El inventario solo se sumará tras confirmar las cajas físicas efectivamente contadas.
              </p>
            </div>

            {/* Cabecera del Documento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  N° de Factura <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: FAC-98402"
                  value={numFactura}
                  onChange={(e) => setNumFactura(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Proveedor
                </label>
                <select
                  value={proveedorSeleccionado}
                  onChange={(e) => setProveedorSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                >
                  {PROVEEDORES_DEMO.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                  <option value="Otro">Otro proveedor...</option>
                </select>
                {proveedorSeleccionado === 'Otro' && (
                  <input
                    type="text"
                    placeholder="Escribe el nombre del proveedor"
                    value={proveedorPersonalizado}
                    onChange={(e) => setProveedorPersonalizado(e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Recepción
                </label>
                <input
                  type="date"
                  value={fechaRecepcion}
                  onChange={(e) => setFechaRecepcion(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Responsable en Bodega
                </label>
                <input
                  type="text"
                  value={responsableFactura}
                  onChange={(e) => setResponsableFactura(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            {/* Zona de Adjunto de Factura (PDF / Imagen) */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50">
              {archivoAdjunto ? (
                <div className="flex items-center justify-between max-w-md mx-auto p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3 text-left">
                    <FileText className="w-6 h-6 text-slate-700" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{archivoAdjunto.nombre}</div>
                      <div className="text-xs text-slate-500">{archivoAdjunto.tamano} • Factura cargada</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setArchivoAdjunto(null)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm text-slate-700 font-medium">
                    Adjuntar documento de factura (PDF, JPG, PNG)
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Permite cotejar visualmente las cantidades de la factura contra el conteo físico en bodega.
                  </p>
                  <label className="inline-block cursor-pointer">
                    <span className="px-4 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
                      Seleccionar archivo
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setArchivoAdjunto({
                            nombre: file.name,
                            tamano: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Sección para Agregar Productos */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Agregar Producto del Catálogo JOLY
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label className="block text-xs text-slate-500 mb-1">Producto</label>
                  <select
                    value={productoSeleccionadoId}
                    onChange={(e) => setProductoSeleccionadoId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  >
                    {PRODUCTS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.categoryName} - {p.unitsPerBox} un/cj)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Cajas s/ Factura</label>
                  <input
                    type="number"
                    min="1"
                    value={cajasFacturadasInput}
                    onChange={(e) => setCajasFacturadasInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-right font-medium"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-900 mb-1">Cajas Físicas Recibidas</label>
                  <input
                    type="number"
                    min="0"
                    value={cajasFisicasInput}
                    onChange={(e) => setCajasFisicasInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm bg-white border border-emerald-400 rounded-lg text-right font-bold text-emerald-900"
                  />
                </div>

                <div className="md:col-span-3 flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAgregarItemFactura}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center space-x-1 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar a la lista</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de Productos a Ingresar */}
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Productos a Ingresar ({itemsFactura.length})</span>
                <span className="text-xs font-normal text-slate-500">
                  Total Cajas a Ingresar: <strong className="text-slate-900">{itemsFactura.reduce((s, it) => s + it.cajasRecibidasFisicas, 0)} cj</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Formato</th>
                      <th className="py-2.5 px-3 text-right">Cajas Facturadas</th>
                      <th className="py-2.5 px-3 text-right text-emerald-900 font-bold bg-emerald-50/50">
                        Cajas Recibidas (Físicas)
                      </th>
                      <th className="py-2.5 px-3 text-center">Diferencia</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsFactura.map((it, idx) => {
                      const diff = it.cajasRecibidasFisicas - it.cajasFacturadas;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{it.productName}</td>
                          <td className="py-2.5 px-3 text-center text-xs text-slate-500">{it.unitsPerBox} un/cj</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">{it.cajasFacturadas} cj</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 bg-emerald-50/20">
                            {it.cajasRecibidasFisicas} cj
                          </td>
                          <td className="py-2.5 px-3 text-center text-xs">
                            {diff === 0 ? (
                              <span className="text-slate-400">Exacto</span>
                            ) : diff < 0 ? (
                              <span className="text-rose-600 font-medium">{diff} cj (Faltante)</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">+{diff} cj (Excedente)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleEliminarItemFactura(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {itemsFactura.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Aún no has agregado productos. Selecciona arriba un producto y sus cajas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aviso de seguridad contable */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Principio de recepción física:</strong> Solo las cajas efectivamente contadas ingresarán al stock de Bodega Central. Las cajas faltantes no se sumarán al inventario y quedarán registradas en la auditoría como merma o descuento de transporte del proveedor.
              </div>
            </div>

            {/* Botón de Confirmación Definitiva */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={itemsFactura.length === 0}
                onClick={handleConfirmarRecepcionFactura}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center space-x-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Ingresar a Bodega Central</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VISTA 3: INGRESO MANUAL DE STOCK                     */}
      {/* ---------------------------------------------------- */}
      {subTab === 'manual' && (
        <div className="space-y-6">
          {mensajeExitoManual && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{mensajeExitoManual}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ingreso Manual y Ajuste de Stock</h3>
              <p className="text-sm text-slate-500 mt-1">
                Utiliza esta opción para ajustes por conteo físico en cámaras, devoluciones externas o mermas internas de bodega.
              </p>
            </div>

            <form onSubmit={handleConfirmarIngresoManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Producto a Ajustar
                </label>
                <select
                  value={prodManualId}
                  onChange={(e) => setProdManualId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                >
                  {PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.categoryName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Ajuste
                  </label>
                  <select
                    value={tipoAjusteManual}
                    onChange={(e: any) => setTipoAjusteManual(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  >
                    <option value="ajuste_conteo">Ajuste por conteo físico (+)</option>
                    <option value="ingreso_extraordinario">Ingreso extraordinario (+)</option>
                    <option value="devolucion_cliente">Devolución externa (+)</option>
                    <option value="merma_bodega">Merma o daño en cámara (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cantidad de Cajas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cajasManual}
                    onChange={(e) => setCajasManual(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Motivo o Justificación Obligatoria <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Cuadratura física fin de mes en cámara 2..."
                  value={motivoManual}
                  onChange={(e) => setMotivoManual(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Responsable del Movimiento
                </label>
                <input
                  type="text"
                  value={responsableManual}
                  onChange={(e) => setResponsableManual(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar Movimiento al Inventario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VISTA 4: REGISTRO UNIFICADO DE MOVIMIENTOS           */}
      {/* ---------------------------------------------------- */}
      {subTab === 'movimientos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Historial Unificado de Movimientos</h3>
              <p className="text-sm text-slate-500">
                Auditoría cronológica de recepciones de fábrica, despachos a furgón, retornos y ajustes manuales.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {movimientos.length} eventos registrados
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4">Descripción y Detalle</th>
                    <th className="py-3 px-4 text-center">Origen $\rightarrow$ Destino</th>
                    <th className="py-3 px-4 text-right">Cajas</th>
                    <th className="py-3 px-4">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimientos.map((mov) => {
                    const esIngreso = mov.destino === 'BODEGA_CENTRAL';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                          {mov.fecha}
                        </td>
                        <td className="py-3 px-4">
                          {mov.tipo === 'RECEPCION_FACTURA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                              Factura Compra
                            </span>
                          )}
                          {mov.tipo === 'ASIGNACION_FURGON' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                              Despacho Furgón
                            </span>
                          )}
                          {mov.tipo === 'RETORNO_FURGON' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Retorno Ruta
                            </span>
                          )}
                          {mov.tipo === 'INGRESO_MANUAL' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                              Ajuste Manual
                            </span>
                          )}
                          {mov.tipo === 'AJUSTE_MERMA_BODEGA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                              Merma Bodega
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {mov.referenciaDoc}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          {mov.descripcion}
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-mono text-slate-500">
                          {mov.origen} $\rightarrow$ {mov.destino}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${esIngreso ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {esIngreso ? `+${mov.totalCajas}` : mov.totalCajas} cj
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {mov.responsable}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
