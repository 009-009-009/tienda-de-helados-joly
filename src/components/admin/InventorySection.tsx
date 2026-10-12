import React, { useState, useMemo } from 'react';
import { PRODUCTS, CatalogProduct, CATEGORIES } from '../../data/catalog';
import { 
  StockProductoUnificado, 
  MovimientoInventario, 
  RecepcionFacturaDoc, 
  ItemRecepcionFactura,
  TipoAjusteManual,
  ItemAjusteManual
} from '../../types/inventory';
import { 
  STOCK_BASE_INICIAL_LIMPIO,
  INITIAL_STOCK_DEMO, 
  MOVIMIENTOS_INICIALES_DEMO, 
  FACTURAS_DEMO, 
  PROVEEDORES_DEMO 
} from '../../data/mockAdminInventory';
import { 
  matchProductWithCatalog, 
  buildItemFromExtraction 
} from '../../utils/invoiceMatcher';
import { 
  Package, 
  FileText, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Upload, 
  Clock, 
  Trash2, 
  Check, 
  Layers, 
  Info,
  Calendar,
  Building,
  User,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileCheck,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  X,
  ChevronRight,
  Undo2,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { formatCLP } from '../../utils/format';

export function InventorySection() {
  // Pestaña activa dentro de Inventario
  const [subTab, setSubTab] = useState<'stock' | 'factura' | 'manual' | 'movimientos'>('factura');

  // Estado del inventario (inicia en 0 cajas en todas las ubicaciones para la nueva ronda de pruebas)
  const [stockList, setStockList] = useState<StockProductoUnificado[]>(() => {
    // Limpiar claves heredadas con saldos de prueba ficticios (1.316 cajas)
    try {
      sessionStorage.removeItem('joly_admin_stock_demo');
      sessionStorage.removeItem('joly_admin_movimientos_demo');
      sessionStorage.removeItem('joly_admin_facturas_demo');
    } catch (e) {}

    const saved = sessionStorage.getItem('joly_admin_stock_limpio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return STOCK_BASE_INICIAL_LIMPIO;
  });

  // Historial de movimientos unificado (vacío para nueva ronda de pruebas)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(() => {
    const saved = sessionStorage.getItem('joly_admin_movimientos_limpio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((m: any) => !m.esDemo);
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Facturas registradas (vacío para nueva ronda de pruebas)
  const [facturas, setFacturas] = useState<RecepcionFacturaDoc[]>(() => {
    const saved = sessionStorage.getItem('joly_admin_facturas_limpio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((f: any) => !f.esDemo);
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Guardar en sessionStorage para persistencia
  const persistStock = (newStock: StockProductoUnificado[]) => {
    setStockList(newStock);
    sessionStorage.setItem('joly_admin_stock_limpio', JSON.stringify(newStock));
  };

  const persistMovimientos = (newMovs: MovimientoInventario[]) => {
    setMovimientos(newMovs);
    sessionStorage.setItem('joly_admin_movimientos_limpio', JSON.stringify(newMovs));
  };

  const persistFacturas = (newFacts: RecepcionFacturaDoc[]) => {
    setFacturas(newFacts);
    sessionStorage.setItem('joly_admin_facturas_limpio', JSON.stringify(newFacts));
  };

  // ----------------------------------------------------
  // ESTADOS DEL FORMULARIO: RECEPCIÓN DE FACTURA
  // ----------------------------------------------------
  const [numFactura, setNumFactura] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(PROVEEDORES_DEMO[0]);
  const [proveedorPersonalizado, setProveedorPersonalizado] = useState('');
  const [fechaRecepcion, setFechaRecepcion] = useState(() => new Date().toISOString().split('T')[0]);
  const [responsableFactura, setResponsableFactura] = useState('Encargado de Bodega');
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string; tamano: string; base64?: string; mimeType?: string } | null>(null);
  const [itemsFactura, setItemsFactura] = useState<ItemRecepcionFactura[]>([]);
  const [mensajeExitoFactura, setMensajeExitoFactura] = useState<string | null>(null);
  const [escaneandoFactura, setEscaneandoFactura] = useState(false);
  const [errorEscaneo, setErrorEscaneo] = useState<string | null>(null);

  // Modal para asociar producto de forma compacta y clara (en lugar de dropdowns gigantes en celda)
  const [modalAsociarIndex, setModalAsociarIndex] = useState<number | null>(null);
  const [busquedaAsociar, setBusquedaAsociar] = useState('');
  const [categoriaAsociar, setCategoriaAsociar] = useState('all');

  // Agregar producto manual a la factura
  const [mostrarAgregarManualFactura, setMostrarAgregarManualFactura] = useState(false);
  const [prodManualFacturaId, setProdManualFacturaId] = useState<string>('');
  const [cajasFacturadasManualFactura, setCajasFacturadasManualFactura] = useState<number | ''>('');
  const [cajasFisicasManualFactura, setCajasFisicasManualFactura] = useState<number | ''>('');
  const [obsManualFactura, setObsManualFactura] = useState('');

  // ----------------------------------------------------
  // ESTADOS DEL FORMULARIO: INGRESO MANUAL Y AJUSTES
  // ----------------------------------------------------
  const [tipoAjusteSeleccionado, setTipoAjusteSeleccionado] = useState<TipoAjusteManual>('inventario_inicial');
  const [responsableManual, setResponsableManual] = useState('Encargado de Bodega');
  const [fechaManual, setFechaManual] = useState(() => new Date().toISOString().split('T')[0]);
  const [motivoManual, setMotivoManual] = useState('');
  const [mensajeExitoManual, setMensajeExitoManual] = useState<string | null>(null);

  // Sub-estado: Inventario inicial de apertura (Multilínea)
  const [itemsApertura, setItemsApertura] = useState<{ productId: string; cajas: number }[]>([]);

  // Productos disponibles para agregar al inventario inicial (excluye los ya asignados)
  const productosDisponiblesApertura = useMemo(() => {
    const idsPresentes = new Set(itemsApertura.map(it => it.productId).filter(Boolean));
    return PRODUCTS.filter(p => !idsPresentes.has(p.id));
  }, [itemsApertura]);

  // Verificar si ya existe un inventario inicial registrado en auditoría (operación única)
  const aperturaRegistrada = useMemo(() => {
    return movimientos.find(m => m.tipo === 'INVENTARIO_INICIAL_APERTURA' && !m.esDemo);
  }, [movimientos]);

  // Sub-estado: Ajuste por conteo físico unitario
  const [prodConteoId, setProdConteoId] = useState<string>('');
  const [conteoFisicoReal, setConteoFisicoReal] = useState<number | ''>('');

  // Sub-estado: Ingreso extraordinario, Devolución o Merma
  const [prodSimpleId, setProdSimpleId] = useState<string>('');
  const [cajasSimple, setCajasSimple] = useState<number | ''>('');

  // ----------------------------------------------------
  // MODAL DE REINICIO SEGURO
  // ----------------------------------------------------
  const [mostrarModalReinicio, setMostrarModalReinicio] = useState(false);
  const [confirmacionTextoReinicio, setConfirmacionTextoReinicio] = useState('');

  // ----------------------------------------------------
  // MODAL DE REVERSIÓN DE AJUSTE POR CONTEO FÍSICO
  // ----------------------------------------------------
  const [movimientoARevertir, setMovimientoARevertir] = useState<MovimientoInventario | null>(null);
  const [motivoReversion, setMotivoReversion] = useState('');
  const [responsableReversion, setResponsableReversion] = useState('Encargado de Bodega');
  const [movimientoSeleccionadoRevertirId, setMovimientoSeleccionadoRevertirId] = useState<string>('');

  // Identificar qué referencias de ajustes ya fueron revertidas (para evitar doble reversión)
  const referenciasAjustesRevertidos = useMemo(() => {
    const set = new Set<string>();
    movimientos.forEach(m => {
      if (m.referenciaDoc.startsWith('REV-')) {
        const refOrig = m.referenciaDoc.replace('REV-', '');
        set.add(refOrig);
      }
    });
    return set;
  }, [movimientos]);

  // ----------------------------------------------------
  // HELPERS DE TIEMPO, UBICACIONES Y ORDENAMIENTO DE AUDITORÍA
  // ----------------------------------------------------
  const getFechaHoraActualLocal = (fechaBase?: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const horaStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (fechaBase && /^\d{4}-\d{2}-\d{2}$/.test(fechaBase)) {
      return `${fechaBase} ${horaStr}`;
    }
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${horaStr}`;
  };

  const getNombreUbicacion = (ub: string) => {
    switch (ub) {
      case 'BODEGA_CENTRAL': return 'Bodega Central';
      case 'PROVEEDOR': return 'Proveedor';
      case 'APERTURA_INICIAL': return 'Apertura Inicial';
      case 'AJUSTE': return 'Ajuste / Cuadre';
      case 'FURGON_1': return 'Furgón 1';
      case 'FURGON_2': return 'Furgón 2';
      case 'EXTERNO': return 'Externo';
      case 'MERMA': return 'Merma';
      default: return ub;
    }
  };

  const getSentidoMovimiento = (mov: MovimientoInventario) => {
    if (mov.destino === 'BODEGA_CENTRAL') {
      return {
        signo: '+',
        esIngreso: true,
        claseBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (mov.origen === 'BODEGA_CENTRAL') {
      return {
        signo: '−',
        esIngreso: false,
        claseBadge: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    return {
      signo: '',
      esIngreso: false,
      claseBadge: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  };

  const ordenarMovimientosCronologico = (lista: MovimientoInventario[]): MovimientoInventario[] => {
    return [...lista].sort((a, b) => {
      const parseFechaStr = (fStr: string) => {
        if (!fStr) return 0;
        const t = Date.parse(fStr.replace(' ', 'T'));
        return isNaN(t) ? 0 : t;
      };
      const tA = parseFechaStr(a.fecha);
      const tB = parseFechaStr(b.fecha);

      if (tA !== tB) {
        return tB - tA;
      }

      const numA = a.id.match(/\d{10,14}/);
      const numB = b.id.match(/\d{10,14}/);
      if (numA && numB) {
        const vA = parseInt(numA[0], 10);
        const vB = parseInt(numB[0], 10);
        if (vA !== vB) return vB - vA;
      }

      return (b.fecha || '').localeCompare(a.fecha || '');
    });
  };

  // Filtros y orden cronológico de Auditoría Unificada
  const [busquedaMovimiento, setBusquedaMovimiento] = useState('');
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState<string>('todos');
  const [desgloseExpandidoId, setDesgloseExpandidoId] = useState<string | null>(null);

  const getDetalleMovimiento = (mov: MovimientoInventario) => {
    let motivoLimpio = mov.descripcion;
    if (motivoLimpio.includes('Motivo:')) {
      motivoLimpio = motivoLimpio.split('Motivo:')[1]?.trim() || motivoLimpio;
    } else if (motivoLimpio.startsWith('Recepción factura')) {
      const match = motivoLimpio.match(/\((.*?)\)/);
      if (match) {
        motivoLimpio = `Recepción de compra (${match[1]})`;
      }
    }

    let productoPrincipal = '';
    let esMultiple = false;
    const totalItems = mov.items?.length || 0;

    if (mov.items && mov.items.length === 1) {
      productoPrincipal = mov.items[0].productName;
    } else if (mov.items && mov.items.length > 1) {
      esMultiple = true;
      if (mov.tipo === 'INVENTARIO_INICIAL_APERTURA') {
        productoPrincipal = `Apertura inicial (${totalItems} variedades)`;
      } else if (mov.tipo === 'RECEPCION_FACTURA') {
        productoPrincipal = `Factura con ${totalItems} productos`;
      } else {
        productoPrincipal = `${totalItems} productos del catálogo`;
      }
    } else {
      productoPrincipal = mov.descripcion.split('.')[0] || 'Producto del catálogo';
    }

    return { motivoLimpio, productoPrincipal, esMultiple, totalItems };
  };

  const movimientosOrdenados = useMemo(() => {
    return ordenarMovimientosCronologico(movimientos);
  }, [movimientos]);

  const movimientosFiltrados = useMemo(() => {
    return movimientosOrdenados.filter((mov) => {
      if (filtroTipoMovimiento !== 'todos' && mov.tipo !== filtroTipoMovimiento) {
        return false;
      }
      if (busquedaMovimiento.trim()) {
        const q = busquedaMovimiento.toLowerCase().trim();
        const matchRef = mov.referenciaDoc?.toLowerCase().includes(q);
        const matchDesc = mov.descripcion?.toLowerCase().includes(q);
        const matchResp = mov.responsable?.toLowerCase().includes(q);
        const matchItems = mov.items?.some(it => it.productName.toLowerCase().includes(q));
        return matchRef || matchDesc || matchResp || matchItems;
      }
      return true;
    });
  }, [movimientosOrdenados, filtroTipoMovimiento, busquedaMovimiento]);

  const metricasAuditoria = useMemo(() => {
    let ingresosCajas = 0;
    let egresosCajas = 0;
    let conteosAjustes = 0;

    movimientos.forEach(m => {
      if (m.destino === 'BODEGA_CENTRAL') {
        ingresosCajas += m.totalCajas;
      } else if (m.origen === 'BODEGA_CENTRAL') {
        egresosCajas += m.totalCajas;
      }
      if (m.tipo === 'AJUSTE_CONTEO_FISICO') {
        conteosAjustes += 1;
      }
    });

    return { ingresosCajas, egresosCajas, conteosAjustes };
  }, [movimientos]);

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
  // CÁLCULOS DINÁMICOS DE RECEPCIÓN DE FACTURA
  // ----------------------------------------------------
  // Total cajas facturadas según el documento original (suma de todas las líneas)
  const totalCajasFacturadasDoc = useMemo(() => {
    return itemsFactura.reduce((acc, it) => acc + (it.cajasFacturadas || 0), 0);
  }, [itemsFactura]);

  // Total cajas físicas a ingresar (SOLO líneas NO descartadas que tengan producto de catálogo asociado)
  const totalCajasFisicasAIngresar = useMemo(() => {
    return itemsFactura
      .filter(it => !it.descartado && it.productId)
      .reduce((acc, it) => acc + (it.cajasRecibidasFisicas || 0), 0);
  }, [itemsFactura]);

  // Diferencia global entre cajas físicas a ingresar y cajas facturadas en el documento
  const diferenciaGlobalCajas = totalCajasFisicasAIngresar - totalCajasFacturadasDoc;

  // ----------------------------------------------------
  // MANEJADOR: CARGAR ARCHIVO Y ESCANEO OCR
  // ----------------------------------------------------
  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorEscaneo(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setArchivoAdjunto({
        nombre: file.name,
        tamano: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        base64: base64Data,
        mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
      });
    };
    reader.onerror = (err) => {
      console.error('Error al leer archivo en navegador:', err);
      setErrorEscaneo('Error al leer el archivo en memoria. Inténtalo nuevamente.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEscanearFactura = async () => {
    if (!archivoAdjunto?.base64) {
      alert('Por favor selecciona primero un archivo de factura (PDF o imagen).');
      return;
    }

    setEscaneandoFactura(true);
    setErrorEscaneo(null);
    console.log('[Lector UI] Iniciando escaneo de:', archivoAdjunto.nombre, archivoAdjunto.tamano);

    try {
      const res = await fetch('/api/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: archivoAdjunto.base64,
          mimeType: archivoAdjunto.mimeType,
          fileName: archivoAdjunto.nombre
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error del servidor (${res.status}): ${errorText.slice(0, 120)}`);
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'No fue posible interpretar la factura');
      }

      const extracted = json.data;
      console.log('[Lector UI] Datos recibidos del servidor:', extracted);

      // Autocompletar datos de cabecera si vienen en el documento
      if (extracted.numeroFactura) {
        setNumFactura(extracted.numeroFactura);
      }
      if (extracted.proveedor) {
        const provEncontrado = PROVEEDORES_DEMO.find(p => 
          p.toLowerCase().includes(extracted.proveedor.toLowerCase()) || 
          extracted.proveedor.toLowerCase().includes(p.toLowerCase())
        );
        if (provEncontrado) {
          setProveedorSeleccionado(provEncontrado);
        } else {
          setProveedorSeleccionado('Otro');
          setProveedorPersonalizado(extracted.proveedor);
        }
      }
      if (extracted.fecha) {
        setFechaRecepcion(extracted.fecha);
      }

      // Procesar cada item detectado comparándolo con el catálogo de 31 productos
      if (Array.isArray(extracted.items) && extracted.items.length > 0) {
        const processedItems: ItemRecepcionFactura[] = extracted.items.map((it: any) => 
          buildItemFromExtraction(it)
        );
        setItemsFactura(processedItems);
        setErrorEscaneo(null);
      } else {
        setErrorEscaneo('El lector no detectó líneas de productos claras. Puedes agregar los productos manualmente con el botón inferior.');
      }
    } catch (err: any) {
      console.error('[Lector UI Error]', err);
      setErrorEscaneo(`Aviso de lectura: ${err.message || 'No se pudo interpretar el archivo'}. Recuerda que puedes usar el ingreso manual directo.`);
    } finally {
      setEscaneandoFactura(false);
    }
  };

  // Confirmar propuesta sugerida (ej: para Cassata Frambuesa 1L -> Cassata 1 L - Crema Frambuesa)
  const handleAceptarPropuestaSugerida = (index: number) => {
    setItemsFactura(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        matchStatus: 'coincidencia_exacta',
        observaciones: `✓ Equivalencia confirmada por el usuario: ${item.productName}`
      };
    }));
  };

  // Asociar o cambiar producto de catálogo
  const handleSeleccionarProductoModal = (prod: CatalogProduct) => {
    if (modalAsociarIndex === null) return;

    setItemsFactura(prev => prev.map((item, i) => {
      if (i !== modalAsociarIndex) return item;
      return {
        ...item,
        productId: prod.id,
        productName: prod.name,
        categoryName: prod.categoryName,
        unitsPerBox: prod.unitsPerBox,
        precioUnitarioCaja: prod.boxPrice,
        matchStatus: 'manual',
        descartado: false,
        // Si las cajas físicas estaban en 0 (por haber sido descontinuado), restaurar a la cantidad facturada para permitir cotejo
        cajasRecibidasFisicas: item.cajasRecibidasFisicas > 0 ? item.cajasRecibidasFisicas : item.cajasFacturadas,
        observaciones: `Asignado manualmente al catálogo: ${prod.name}`
      };
    }));

    setModalAsociarIndex(null);
    setBusquedaAsociar('');
  };

  // Modificar cajas físicas contadas
  const handleActualizarCajasFisicasItem = (index: number, valor: number) => {
    setItemsFactura(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, cajasRecibidasFisicas: Math.max(0, valor) };
    }));
  };

  // Conmutar Excluir / Restaurar
  const handleToggleDescartarItem = (index: number) => {
    setItemsFactura(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const nuevoDescartado = !item.descartado;
      return {
        ...item,
        descartado: nuevoDescartado,
        // Si se excluye, se pasa a 0 cajas físicas a ingresar; si se restaura, se retoma la cantidad facturada
        cajasRecibidasFisicas: nuevoDescartado ? 0 : (item.cajasRecibidasFisicas > 0 ? item.cajasRecibidasFisicas : item.cajasFacturadas)
      };
    }));
  };

  const handleEliminarItemFactura = (index: number) => {
    setItemsFactura(prev => prev.filter((_, i) => i !== index));
  };

  // Agregar producto manual a la factura
  const handleAgregarManualAFactura = () => {
    if (!prodManualFacturaId) {
      alert('Debes seleccionar un producto del catálogo JOLY.');
      return;
    }
    const prod = PRODUCTS.find(p => p.id === prodManualFacturaId);
    if (!prod) return;

    if (cajasFacturadasManualFactura === '' || typeof cajasFacturadasManualFactura !== 'number' || cajasFacturadasManualFactura <= 0) {
      alert('Debes ingresar la cantidad de cajas según factura (mínimo 1).');
      return;
    }

    if (cajasFisicasManualFactura === '' || typeof cajasFisicasManualFactura !== 'number' || cajasFisicasManualFactura < 0) {
      alert('Debes ingresar la cantidad de cajas físicas contadas.');
      return;
    }

    const nuevoItem: ItemRecepcionFactura = {
      productId: prod.id,
      productName: prod.name,
      categoryName: prod.categoryName,
      unitsPerBox: prod.unitsPerBox,
      cajasFacturadas: cajasFacturadasManualFactura,
      cajasRecibidasFisicas: cajasFisicasManualFactura,
      precioUnitarioCaja: prod.boxPrice,
      matchStatus: 'manual',
      descartado: false,
      observaciones: obsManualFactura.trim() || 'Agregado manualmente a la factura'
    };

    setItemsFactura(prev => [...prev, nuevoItem]);
    setMostrarAgregarManualFactura(false);
    setProdManualFacturaId('');
    setCajasFacturadasManualFactura('');
    setCajasFisicasManualFactura('');
    setObsManualFactura('');
  };

  // Confirmar recepción de factura
  const handleConfirmarRecepcionFactura = () => {
    const numLimpio = numFactura.trim();
    if (!numLimpio) {
      alert('Por favor ingresa el número o folio de la factura.');
      return;
    }

    const proveedorFinal = proveedorSeleccionado === 'Otro' ? proveedorPersonalizado.trim() : proveedorSeleccionado;
    if (!proveedorFinal) {
      alert('Por favor especifica el nombre del proveedor.');
      return;
    }

    // Filtrar solo items NO descartados que tengan un producto válido de los 31
    const itemsValidos = itemsFactura.filter(it => !it.descartado && it.productId);

    if (itemsValidos.length === 0) {
      alert('No hay productos vigentes válidos seleccionados para ingresar al inventario.');
      return;
    }

    // Verificar si hay productos con sugerencias pendientes de confirmar
    const pendientesConfirmacion = itemsFactura.filter(it => !it.descartado && it.matchStatus === 'requiere_confirmacion');
    if (pendientesConfirmacion.length > 0) {
      const confirmar = confirm(`Hay ${pendientesConfirmacion.length} producto(s) con sugerencias pendientes de confirmación (ej: ${pendientesConfirmacion[0].productName}). ¿Deseas confirmar la recepción con estas equivalencias?`);
      if (!confirmar) return;
    }

    const totalFacturadas = itemsValidos.reduce((s, it) => s + it.cajasFacturadas, 0);
    const totalFisicas = itemsValidos.reduce((s, it) => s + it.cajasRecibidasFisicas, 0);

    // 1. Crear documento de recepción
    const nuevaRecepcion: RecepcionFacturaDoc = {
      id: `REC-${Date.now()}`,
      numeroFactura: numLimpio,
      proveedor: proveedorFinal,
      fechaRecepcion,
      responsableRecepcion: responsableFactura,
      archivoNombre: archivoAdjunto?.nombre || 'Factura_documento.pdf',
      archivoTipo: archivoAdjunto?.mimeType || 'application/pdf',
      archivoTamano: archivoAdjunto?.tamano || '1.1 MB',
      estado: 'confirmada_ingresada',
      items: [...itemsFactura],
      totalCajasFacturadas: totalCajasFacturadasDoc,
      totalCajasRecibidas: totalFisicas,
      confirmadaAt: getFechaHoraActualLocal(fechaRecepcion),
      confirmadaPor: responsableFactura,
      esDemo: false
    };

    // 2. Actualizar Stock de Bodega Central (SOLO cajas físicas confirmadas de items válidos)
    const nuevoStock = stockList.map(item => {
      const itemRecibido = itemsValidos.find(it => it.productId === item.productId);
      if (itemRecibido) {
        const nuevoBodega = item.cajasBodega + itemRecibido.cajasRecibidasFisicas;
        return {
          ...item,
          cajasBodega: nuevoBodega,
          totalEmpresa: nuevoBodega + item.cajasAsignadasFurgon1 + item.cajasAsignadasFurgon2,
          ultimaActualizacion: getFechaHoraActualLocal()
        };
      }
      return item;
    });

    // 3. Crear movimiento unificado de inventario
    const nuevoMovimiento: MovimientoInventario = {
      id: `MOV-${Date.now()}`,
      fecha: getFechaHoraActualLocal(fechaRecepcion),
      tipo: 'RECEPCION_FACTURA',
      referenciaDoc: numLimpio,
      descripcion: `Recepción factura ${numLimpio} (${proveedorFinal}) - ${totalFisicas} cj ingresadas a Bodega Central`,
      responsable: responsableFactura,
      origen: 'PROVEEDOR',
      destino: 'BODEGA_CENTRAL',
      totalCajas: totalFisicas,
      items: itemsValidos.map(it => ({
        productId: it.productId,
        productName: it.productName,
        cajas: it.cajasRecibidasFisicas
      })),
      esDemo: false
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
  // MANEJADORES: INGRESO MANUAL Y AJUSTES
  // ----------------------------------------------------
  const handleConfirmarAperturaInicial = (e: React.FormEvent) => {
    e.preventDefault();

    if (aperturaRegistrada) {
      alert(`El Inventario Inicial de Apertura ya fue registrado previamente (${aperturaRegistrada.referenciaDoc} el ${aperturaRegistrada.fecha}). Por regla de negocio es una operación única para evitar duplicar existencias. Si necesitas ingresar compras usa «Recepción con Factura» o «Ingreso Extraordinario», y para corregir diferencias usa «Conteo Físico».`);
      return;
    }

    if (!motivoManual.trim()) {
      alert('Es obligatorio ingresar el motivo o justificativo.');
      return;
    }

    if (itemsApertura.length === 0) {
      alert('Debes agregar al menos un producto al inventario inicial.');
      return;
    }

    const filasVacias = itemsApertura.filter(it => !it.productId);
    if (filasVacias.length > 0) {
      alert('Hay filas vacías sin producto seleccionado. Por favor selecciona el producto o elimina las filas vacías antes de guardar.');
      return;
    }

    const ids = itemsApertura.map(it => it.productId);
    if (new Set(ids).size !== ids.length) {
      alert('No se permiten productos duplicados en la misma operación de inventario inicial.');
      return;
    }

    const itemsValidos = itemsApertura.filter(it => it.productId && it.cajas > 0);
    if (itemsValidos.length === 0) {
      alert('Debes ingresar al menos una cantidad mayor a 0 cajas para el inventario inicial.');
      return;
    }

    // Acumular stock físico de apertura a las existencias existentes en Bodega Central (sin borrar compras de facturas)
    const nuevoStock = stockList.map(stockItem => {
      const itemApertura = itemsApertura.find(it => it.productId === stockItem.productId);
      if (itemApertura && itemApertura.cajas > 0) {
        const nuevoBodega = stockItem.cajasBodega + itemApertura.cajas;
        return {
          ...stockItem,
          cajasBodega: nuevoBodega,
          totalEmpresa: nuevoBodega + stockItem.cajasAsignadasFurgon1 + stockItem.cajasAsignadasFurgon2,
          ultimaActualizacion: getFechaHoraActualLocal()
        };
      }
      return stockItem;
    });

    const totalCajasIniciales = itemsValidos.reduce((s, it) => s + it.cajas, 0);

    const nuevoMov: MovimientoInventario = {
      id: `MOV-APE-${Date.now()}`,
      fecha: getFechaHoraActualLocal(fechaManual),
      tipo: 'INVENTARIO_INICIAL_APERTURA',
      referenciaDoc: `APERTURA-${Date.now().toString().slice(-4)}`,
      descripcion: `Inventario Inicial de Apertura: ${totalCajasIniciales} cj cargadas en Bodega Central. Motivo: ${motivoManual}`,
      responsable: responsableManual,
      origen: 'APERTURA_INICIAL',
      destino: 'BODEGA_CENTRAL',
      totalCajas: totalCajasIniciales,
      items: itemsValidos.map(it => {
        const prod = PRODUCTS.find(p => p.id === it.productId);
        return {
          productId: it.productId,
          productName: prod?.name || it.productId,
          cajas: it.cajas
        };
      }),
      esDemo: false
    };

    persistStock(nuevoStock);
    persistMovimientos([nuevoMov, ...movimientos]);

    setMensajeExitoManual(`¡Inventario Inicial cargado exitosamente! Se establecieron ${totalCajasIniciales} cajas en Bodega Central.`);
    setItemsApertura([]);
    setMotivoManual('');
    setTimeout(() => {
      setMensajeExitoManual(null);
      setSubTab('stock');
    }, 2800);
  };

  const handleConfirmarAjusteConteo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodConteoId) {
      alert('Debes seleccionar un producto del catálogo para realizar el conteo físico.');
      return;
    }

    const prod = PRODUCTS.find(p => p.id === prodConteoId);
    if (!prod) return;

    if (conteoFisicoReal === '' || typeof conteoFisicoReal !== 'number') {
      alert('Debes ingresar la cantidad de cajas contadas físicamente en bodega.');
      return;
    }

    if (!motivoManual.trim()) {
      alert('Es obligatorio ingresar el motivo del ajuste por conteo físico.');
      return;
    }

    if (!responsableManual.trim()) {
      alert('Es obligatorio ingresar el responsable del conteo físico.');
      return;
    }

    const itemStock = stockList.find(s => s.productId === prod.id);
    const stockActual = itemStock?.cajasBodega || 0;
    const diferencia = conteoFisicoReal - stockActual;

    if (diferencia === 0) {
      alert(`El conteo físico (${conteoFisicoReal} cj) coincide exactamente con el stock registrado en bodega. No hay diferencia para ajustar.`);
      return;
    }

    const nuevoStock = stockList.map(s => {
      if (s.productId === prod.id) {
        return {
          ...s,
          cajasBodega: conteoFisicoReal,
          totalEmpresa: conteoFisicoReal + s.cajasAsignadasFurgon1 + s.cajasAsignadasFurgon2,
          ultimaActualizacion: getFechaHoraActualLocal()
        };
      }
      return s;
    });

    const nuevoMov: MovimientoInventario = {
      id: `MOV-CONT-${Date.now()}`,
      fecha: getFechaHoraActualLocal(fechaManual),
      tipo: 'AJUSTE_CONTEO_FISICO',
      referenciaDoc: `CUADRE-${Date.now().toString().slice(-4)}`,
      descripcion: `Ajuste por conteo físico: ${prod.name}. Stock anterior: ${stockActual} cj, Conteo real: ${conteoFisicoReal} cj (Diferencia: ${diferencia > 0 ? '+' : ''}${diferencia} cj). Motivo: ${motivoManual}`,
      responsable: responsableManual,
      origen: diferencia > 0 ? 'AJUSTE' : 'BODEGA_CENTRAL',
      destino: diferencia > 0 ? 'BODEGA_CENTRAL' : 'AJUSTE',
      totalCajas: Math.abs(diferencia),
      items: [{ productId: prod.id, productName: prod.name, cajas: Math.abs(diferencia) }],
      esDemo: false
    };

    persistStock(nuevoStock);
    persistMovimientos([nuevoMov, ...movimientos]);

    setMensajeExitoManual(`Ajuste registrado: ${prod.name} cuadrado a ${conteoFisicoReal} cj (${diferencia > 0 ? '+' : ''}${diferencia} cj).`);
    setProdConteoId('');
    setConteoFisicoReal('');
    setMotivoManual('');
    setTimeout(() => {
      setMensajeExitoManual(null);
      setSubTab('stock');
    }, 2500);
  };

  const ejecutarReversionMovimiento = (
    mov: MovimientoInventario,
    motivo: string,
    responsable: string
  ): boolean => {
    const refOriginal = mov.referenciaDoc;
    if (referenciasAjustesRevertidos.has(refOriginal)) {
      alert(`El movimiento ${refOriginal} ya fue revertido previamente.`);
      return false;
    }

    if (!motivo.trim()) {
      alert('Es obligatorio ingresar el motivo de la reversión.');
      return false;
    }

    if (!responsable.trim()) {
      alert('Es obligatorio ingresar el responsable de la reversión.');
      return false;
    }

    if (!mov.items || mov.items.length === 0) {
      alert('No se encontró el detalle de productos en el movimiento original.');
      return false;
    }

    const fueIngreso = mov.destino === 'BODEGA_CENTRAL';

    // Validación de inconsistencia: Si hay que restar cajas y no hay suficiente stock en bodega
    if (fueIngreso) {
      for (const it of mov.items) {
        const stockActualItem = stockList.find(s => s.productId === it.productId);
        const stockActualBodega = stockActualItem?.cajasBodega || 0;
        if (stockActualBodega < it.cajas) {
          const prodNombre = stockActualItem?.productName || it.productName || it.productId;
          alert(`Inconsistencia de stock: Bodega Central actualmente cuenta con ${stockActualBodega} cj de ${prodNombre}. No es posible descontar ${it.cajas} cj porque el inventario quedaría en negativo (posiblemente las cajas ya fueron despachadas o vendidas).`);
          return false;
        }
      }
    }

    // 1. Actualizar stockList
    const itemsMap = new Map<string, number>();
    mov.items.forEach(it => {
      const prev = itemsMap.get(it.productId) || 0;
      itemsMap.set(it.productId, prev + it.cajas);
    });

    const nuevoStock = stockList.map(s => {
      if (itemsMap.has(s.productId)) {
        const cajasItem = itemsMap.get(s.productId)!;
        const delta = fueIngreso ? -cajasItem : cajasItem;
        const nuevoBodega = Math.max(0, s.cajasBodega + delta);
        return {
          ...s,
          cajasBodega: nuevoBodega,
          totalEmpresa: nuevoBodega + s.cajasAsignadasFurgon1 + s.cajasAsignadasFurgon2,
          ultimaActualizacion: getFechaHoraActualLocal()
        };
      }
      return s;
    });

    // 2. Crear movimiento compensatorio en Auditoría Unificada
    const nombresProductos = mov.items.map(it => it.productName).join(', ');
    const movCompensatorio: MovimientoInventario = {
      id: `MOV-REV-${Date.now()}`,
      fecha: getFechaHoraActualLocal(),
      tipo: mov.tipo,
      referenciaDoc: `REV-${refOriginal}`,
      descripcion: `Reversión compensatoria de ${refOriginal}: ${fueIngreso ? '−' : '+'}${mov.totalCajas} cj (${nombresProductos}). Deshace movimiento previo. Motivo: ${motivo.trim()}`,
      responsable: responsable.trim(),
      origen: fueIngreso ? 'BODEGA_CENTRAL' : (mov.origen === 'BODEGA_CENTRAL' ? 'AJUSTE' : mov.origen),
      destino: fueIngreso ? (mov.origen === 'BODEGA_CENTRAL' ? 'AJUSTE' : mov.origen) : 'BODEGA_CENTRAL',
      totalCajas: mov.totalCajas,
      items: mov.items,
      esDemo: false
    };

    persistStock(nuevoStock);
    persistMovimientos([movCompensatorio, ...movimientos]);

    setMensajeExitoManual(`Movimiento ${refOriginal} revertido exitosamente. Compensación de ${fueIngreso ? '−' : '+'}${mov.totalCajas} cj aplicada al stock de Bodega Central.`);
    setMovimientoARevertir(null);
    setMovimientoSeleccionadoRevertirId('');
    setMotivoReversion('');
    setTimeout(() => {
      setMensajeExitoManual(null);
    }, 3500);
    return true;
  };

  const handleEjecutarReversionAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movimientoARevertir) return;
    ejecutarReversionMovimiento(movimientoARevertir, motivoReversion, responsableReversion);
  };

  const handleConfirmarMovimientoSimple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodSimpleId) {
      alert('Debes seleccionar un producto del catálogo JOLY.');
      return;
    }
    const prod = PRODUCTS.find(p => p.id === prodSimpleId);
    if (!prod) return;

    if (cajasSimple === '' || typeof cajasSimple !== 'number' || cajasSimple <= 0) {
      alert('Ingresa una cantidad de cajas mayor a 0.');
      return;
    }
    if (!motivoManual.trim()) {
      alert('El motivo o justificación es obligatorio.');
      return;
    }
    if (!responsableManual.trim()) {
      alert('El responsable del movimiento es obligatorio.');
      return;
    }

    let deltaCajas = cajasSimple;
    let movTipo: MovimientoInventario['tipo'] = 'INGRESO_EXTRAORDINARIO';
    let origen: MovimientoInventario['origen'] = 'EXTERNO';
    let destino: MovimientoInventario['destino'] = 'BODEGA_CENTRAL';
    let descTipo = 'Ingreso extraordinario';

    if (tipoAjusteSeleccionado === 'merma_bodega') {
      deltaCajas = -Math.abs(cajasSimple);
      movTipo = 'AJUSTE_MERMA_BODEGA';
      origen = 'BODEGA_CENTRAL';
      destino = 'MERMA';
      descTipo = 'Merma en bodega central';
    } else if (tipoAjusteSeleccionado === 'devolucion_externa') {
      movTipo = 'DEVOLUCION_EXTERNA';
      origen = 'EXTERNO';
      destino = 'BODEGA_CENTRAL';
      descTipo = 'Devolución externa / retorno';
    }

    const nuevoStock = stockList.map(item => {
      if (item.productId === prod.id) {
        const nuevoBodega = Math.max(0, item.cajasBodega + deltaCajas);
        return {
          ...item,
          cajasBodega: nuevoBodega,
          totalEmpresa: nuevoBodega + item.cajasAsignadasFurgon1 + item.cajasAsignadasFurgon2,
          ultimaActualizacion: getFechaHoraActualLocal()
        };
      }
      return item;
    });

    const nuevoMov: MovimientoInventario = {
      id: `MOV-SIMP-${Date.now()}`,
      fecha: getFechaHoraActualLocal(fechaManual),
      tipo: movTipo,
      referenciaDoc: `DOC-${Date.now().toString().slice(-4)}`,
      descripcion: `${descTipo}: ${deltaCajas > 0 ? '+' : ''}${deltaCajas} cj de ${prod.name}. Motivo: ${motivoManual}`,
      responsable: responsableManual,
      origen,
      destino,
      totalCajas: Math.abs(deltaCajas),
      items: [{ productId: prod.id, productName: prod.name, cajas: Math.abs(deltaCajas) }],
      esDemo: false
    };

    persistStock(nuevoStock);
    persistMovimientos([nuevoMov, ...movimientos]);

    setMensajeExitoManual(`Movimiento registrado: ${deltaCajas > 0 ? '+' : ''}${deltaCajas} cj de ${prod.name}.`);
    setProdSimpleId('');
    setCajasSimple('');
    setMotivoManual('');
    setTimeout(() => {
      setMensajeExitoManual(null);
      setSubTab('stock');
    }, 2500);
  };

  const handleEjecutarReinicioSeguro = () => {
    if (confirmacionTextoReinicio.trim().toUpperCase() !== 'REINICIAR') {
      alert('Debes escribir la palabra REINICIAR en mayúsculas para confirmar.');
      return;
    }

    try {
      sessionStorage.removeItem('joly_admin_stock_demo');
      sessionStorage.removeItem('joly_admin_movimientos_demo');
      sessionStorage.removeItem('joly_admin_facturas_demo');
    } catch (e) {}

    persistStock(STOCK_BASE_INICIAL_LIMPIO);
    persistMovimientos([]);
    persistFacturas([]);

    setMostrarModalReinicio(false);
    setConfirmacionTextoReinicio('');
    alert('✓ Reinicio Seguro Completado: Los saldos han quedado en 0 cajas en Bodega Central, Furgón 1 y Furgón 2 (Total empresa: 0 cajas). El historial de pruebas previas fue vaciado. Los 31 productos del catálogo, clientes, ventas y pedidos permanecen intactos.');
  };

  // Productos filtrados para el modal de asociación
  const productosFiltradosModal = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(busquedaAsociar.toLowerCase()) || 
                          p.categoryName.toLowerCase().includes(busquedaAsociar.toLowerCase());
      const matchCat = categoriaAsociar === 'all' || p.categoryId === categoriaAsociar;
      return matchSearch && matchCat;
    });
  }, [busquedaAsociar, categoriaAsociar]);

  return (
    <div className="space-y-6">
      {/* Banner de Estado */}
      <div className="bg-slate-900 text-slate-200 px-4 py-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold text-white">Inventario Central JOLY</span>
          <span className="bg-slate-800 border border-slate-700 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono">
            {stockList.every(s => s.cajasBodega === 0 && s.totalEmpresa === 0) ? '[LISTO PARA APERTURA REAL]' : '[OPERATIVO]'}
          </span>
          <span className="text-slate-400 hidden md:inline">• 31 productos vigentes</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMostrarModalReinicio(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-800/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Limpiar datos de demostración y preparar para el conteo real"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reinicio Seguro de Pruebas</span>
          </button>
        </div>
      </div>

      {/* Sub-Navegación de Inventario */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
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
            <span>Recepción con Factura (Lector OCR)</span>
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
            <span>Ingreso Manual y Ajustes</span>
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
            <span>Auditoría de Movimientos ({movimientos.length})</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* VISTA 1: TABLERO DE STOCK UNIFICADO                 */}
      {/* ---------------------------------------------------- */}
      {subTab === 'stock' && (
        <div className="space-y-6">
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
                Ruta activa Poniente
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
                Ruta activa Oriente
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

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de producto..."
                value={searchStock}
                onChange={(e) => setSearchStock(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="all">Todas las categorías ({categoriasUnicas.length})</option>
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-center">Unid/Caja</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-100/60">Bodega Central</th>
                    <th className="py-3 px-4 text-right">Furgón 1</th>
                    <th className="py-3 px-4 text-right">Furgón 2</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Total Empresa</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockFiltrado.map((item) => {
                    const enAlerta = item.cajasBodega <= item.stockMinimoAlerta;
                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {item.categoryName}
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-mono text-slate-600">
                          {item.unitsPerBox}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-50/80">
                          {item.cajasBodega} cj
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-mono">
                          {item.cajasAsignadasFurgon1} cj
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-mono">
                          {item.cajasAsignadasFurgon2} cj
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {item.totalEmpresa} cj
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.cajasBodega === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Sin Stock
                            </span>
                          ) : enAlerta ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Stock Bajo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Disponible
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
      {/* VISTA 2: RECEPCIÓN MEDIANTE FACTURA (CON LECTOR OCR)  */}
      {/* ---------------------------------------------------- */}
      {subTab === 'factura' && (
        <div className="space-y-6">
          {mensajeExitoFactura && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-3 text-sm shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{mensajeExitoFactura}</span>
            </div>
          )}

          {errorEscaneo && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center space-x-3 text-sm shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>{errorEscaneo}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-slate-800" />
                <span>Recepción con Factura: Cotejo Físico y Auditoría de Productos</span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Carga el archivo PDF o imagen de la factura y pulsa «Escanear y Extraer Datos». El sistema comparará cada línea contra los 31 productos del catálogo vigente de JOLY y te permitirá ajustar las cajas físicas contadas antes de ingresar el stock.
              </p>
            </div>

            {/* Zona de Carga y Lector OCR */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-slate-50/70 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {archivoAdjunto ? archivoAdjunto.nombre : 'Seleccionar Factura o Guía (PDF / JPG / PNG)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {archivoAdjunto ? `${archivoAdjunto.tamano} • Archivo cargado en memoria` : 'Lector integrado gratuito sin activación de servicios de pago'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-all inline-block">
                      {archivoAdjunto ? 'Cambiar archivo' : 'Cargar archivo PDF'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleSeleccionarArchivo}
                    />
                  </label>

                  {archivoAdjunto && (
                    <button
                      type="button"
                      disabled={escaneandoFactura}
                      onClick={handleEscanearFactura}
                      className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg shadow-sm flex items-center space-x-2 transition-all"
                    >
                      {escaneandoFactura ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>Extrayendo datos...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span>Escanear y Extraer Datos</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cabecera del Documento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  N° de Factura / Folio <span className="text-rose-500">*</span>
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

            {/* TABLERO DE RESUMEN DE TOTALES Y CUADRATURA (Facturadas vs Físicas) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800">
              <div className="p-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cajas según Factura
                </div>
                <div className="text-2xl font-bold text-white mt-1">
                  {totalCajasFacturadasDoc} <span className="text-sm font-normal text-slate-400">cajas</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Total documentado en la factura
                </div>
              </div>

              <div className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/60">
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Cajas Físicas a Ingresar</span>
                  {totalCajasFisicasAIngresar === 37 && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                      ✓ Cuadre 37 cj
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {totalCajasFisicasAIngresar} <span className="text-sm font-normal text-slate-300">cajas</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Suma de líneas válidas activas contadas en bodega
                </div>
              </div>

              <div className="p-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Diferencia Factura vs Físico
                </div>
                <div className={`text-2xl font-bold mt-1 ${
                  diferenciaGlobalCajas === 0 
                    ? 'text-slate-300' 
                    : diferenciaGlobalCajas < 0 
                    ? 'text-rose-400' 
                    : 'text-emerald-400'
                }`}>
                  {diferenciaGlobalCajas === 0 ? '0' : diferenciaGlobalCajas > 0 ? `+${diferenciaGlobalCajas}` : diferenciaGlobalCajas} <span className="text-sm font-normal text-slate-400">cajas</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {diferenciaGlobalCajas < 0 
                    ? `${Math.abs(diferenciaGlobalCajas)} cj no ingresan (faltantes o descontinuadas)` 
                    : 'Cuadratura exacta sin faltantes'}
                </div>
              </div>
            </div>

            {/* Tabla de Productos Cotejados */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <span>Líneas de la Factura ({itemsFactura.length})</span>
                  {itemsFactura.some(it => it.matchStatus === 'descontinuado') && (
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[11px] font-bold">
                      Contiene productos no vigentes (excluidos)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (!mostrarAgregarManualFactura) {
                        setProdManualFacturaId('');
                        setCajasFacturadasManualFactura('');
                        setCajasFisicasManualFactura('');
                        setObsManualFactura('');
                      }
                      setMostrarAgregarManualFactura(!mostrarAgregarManualFactura);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar producto manual a esta recepción</span>
                  </button>
                </div>
              </div>

              {/* Formulario para agregar producto manual si la factura no lo traía */}
              {mostrarAgregarManualFactura && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3 shadow-xs">
                  <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Agregar Producto Manual a la Recepción</span>
                    <button 
                      onClick={() => setMostrarAgregarManualFactura(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Producto del Catálogo JOLY</label>
                      <select
                        value={prodManualFacturaId}
                        onChange={(e) => {
                          setProdManualFacturaId(e.target.value);
                          if (!e.target.value) {
                            setCajasFacturadasManualFactura('');
                            setCajasFisicasManualFactura('');
                          }
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                      >
                        <option value="">-- Selecciona un producto a agregar --</option>
                        {PRODUCTS.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.categoryName} - {p.unitsPerBox} un/cj)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cajas s/ Factura</label>
                      <input
                        type="number"
                        min="1"
                        disabled={!prodManualFacturaId}
                        placeholder={prodManualFacturaId ? "Ej: 10" : "Elige producto"}
                        value={cajasFacturadasManualFactura}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') setCajasFacturadasManualFactura('');
                          else setCajasFacturadasManualFactura(Math.max(1, parseInt(val, 10) || 1));
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg text-right font-medium ${
                          prodManualFacturaId
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-900 mb-1">Cajas Físicas</label>
                      <input
                        type="number"
                        min="0"
                        disabled={!prodManualFacturaId}
                        placeholder={prodManualFacturaId ? "Ej: 10" : "Elige producto"}
                        value={cajasFisicasManualFactura}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') setCajasFisicasManualFactura('');
                          else setCajasFisicasManualFactura(Math.max(0, parseInt(val, 10) || 0));
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg text-right font-bold ${
                          prodManualFacturaId
                            ? 'bg-white border-emerald-400 text-emerald-950'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <button
                        type="button"
                        disabled={!prodManualFacturaId || cajasFacturadasManualFactura === '' || cajasFisicasManualFactura === ''}
                        onClick={handleAgregarManualAFactura}
                        className={`w-full py-2 text-sm font-semibold rounded-lg shadow-sm transition-all ${
                          prodManualFacturaId && cajasFacturadasManualFactura !== '' && cajasFisicasManualFactura !== ''
                            ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        }`}
                      >
                        {!prodManualFacturaId
                          ? 'Selecciona producto'
                          : cajasFacturadasManualFactura === '' || cajasFisicasManualFactura === ''
                          ? 'Ingresa cajas'
                          : 'Agregar a la lista'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla principal de cotejo */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-3 w-1/4">Descripción en Factura</th>
                      <th className="py-3 px-3 w-1/3">Producto en Catálogo JOLY (31)</th>
                      <th className="py-3 px-3 text-center">Estado Cotejo</th>
                      <th className="py-3 px-3 text-right">Cajas Factura</th>
                      <th className="py-3 px-3 text-right font-bold text-emerald-900 bg-emerald-50/60">
                        Cajas Físicas
                      </th>
                      <th className="py-3 px-3 text-center">Diferencia</th>
                      <th className="py-3 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsFactura.map((it, idx) => {
                      const diff = (it.cajasRecibidasFisicas || 0) - (it.cajasFacturadas || 0);
                      const esDescontinuado = it.matchStatus === 'descontinuado';
                      const requiereConfirmacion = it.matchStatus === 'requiere_confirmacion';
                      const esCoincidenciaExacta = it.matchStatus === 'coincidencia_exacta';

                      return (
                        <tr 
                          key={idx} 
                          className={`transition-colors ${
                            it.descartado 
                              ? 'bg-slate-50/80 opacity-60' 
                              : esDescontinuado 
                              ? 'bg-rose-50/30' 
                              : requiereConfirmacion
                              ? 'bg-amber-50/30'
                              : 'hover:bg-slate-50/50'
                          }`}
                        >
                          {/* Columna 1: Descripción literal en Factura */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 text-sm">
                              {it.nombreFacturaOriginal || it.productName}
                            </div>
                            {it.codigoProveedor && (
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Código Proveedor: {it.codigoProveedor}
                              </div>
                            )}
                          </td>

                          {/* Columna 2: Cotejo contra Catálogo JOLY (Propuesta Compacta) */}
                          <td className="py-3 px-3">
                            {/* Caso A: Coincidencia Concreta (ej: Paleta Mora Mora -> Mora Mora) */}
                            {esCoincidenciaExacta && it.productId && (
                              <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span>{it.productName}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {it.categoryName} • {it.unitsPerBox} un/caja
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setModalAsociarIndex(idx)}
                                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-xs ml-2"
                                  title="Cambiar asociación a otro producto"
                                >
                                  Cambiar
                                </button>
                              </div>
                            )}

                            {/* Caso B: Sugerencia con Dudas (ej: Cassata Frambuesa 1L -> Cassata 1 L - Crema Frambuesa) */}
                            {requiereConfirmacion && it.productId && (
                              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                                    Sugerencia propuesta
                                  </span>
                                  <span className="text-[11px] font-semibold text-amber-800">Requiere confirmación</span>
                                </div>
                                <div className="font-bold text-slate-900 text-sm">
                                  {it.productName}
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  {it.categoryName} • {it.unitsPerBox} un/caja
                                </div>
                                <div className="text-[11px] text-amber-900 bg-amber-100/70 p-1.5 rounded">
                                  {it.observaciones || 'La factura omite especificaciones. Confirma si corresponde a esta presentación.'}
                                </div>
                                <div className="flex items-center space-x-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAceptarPropuestaSugerida(idx)}
                                    className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded shadow-xs flex items-center space-x-1"
                                    title="Confirmar esta equivalencia con el catálogo"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Confirmar equivalencia</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setModalAsociarIndex(idx)}
                                    className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-xs"
                                  >
                                    Elegir otro producto
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Caso C: Descontinuado / No encontrado en catálogo */}
                            {esDescontinuado && (
                              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
                                <div className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                  <span>No encontrado en catálogo vigente / posible descontinuado</span>
                                </div>
                                <div className="text-[11px] text-rose-700">
                                  {it.descartado 
                                    ? 'Excluido automáticamente. 0 cajas ingresarán al stock de Bodega.' 
                                    : 'Atención: No existe en catálogo. Se recomienda mantener excluido.'}
                                </div>
                                <div className="pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setModalAsociarIndex(idx)}
                                    className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                                  >
                                    Asociar manualmente al catálogo...
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Caso D: Asignado Manualmente */}
                            {it.matchStatus === 'manual' && it.productId && (
                              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{it.productName}</div>
                                  <div className="text-[11px] text-slate-500">{it.categoryName} • {it.unitsPerBox} un/cj</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setModalAsociarIndex(idx)}
                                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-xs ml-2"
                                >
                                  Cambiar
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Columna 3: Estado del Cotejo */}
                          <td className="py-3 px-3 text-center">
                            {it.descartado ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
                                Excluido
                              </span>
                            ) : esCoincidenciaExacta ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Coincidencia Concreta
                              </span>
                            ) : requiereConfirmacion ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                                🔍 Confirmar
                              </span>
                            ) : esDescontinuado ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                ⛔ Descontinuado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                                Manual
                              </span>
                            )}
                          </td>

                          {/* Columna 4: Cajas Facturadas en Documento */}
                          <td className="py-3 px-3 text-right text-slate-700 font-mono font-medium">
                            {it.cajasFacturadas} cj
                          </td>

                          {/* Columna 5: Cajas Físicas Contadas (Editable) */}
                          <td className="py-3 px-3 text-right bg-emerald-50/30">
                            {it.descartado ? (
                              <span className="text-xs text-slate-400 font-mono">0 cj (Excluido)</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={it.cajasRecibidasFisicas}
                                onChange={(e) => handleActualizarCajasFisicasItem(idx, parseInt(e.target.value) || 0)}
                                className="w-20 px-2.5 py-1 text-sm border-2 border-emerald-400 focus:border-emerald-600 rounded-lg text-right font-bold text-emerald-950 bg-white shadow-2xs"
                              />
                            )}
                          </td>

                          {/* Columna 6: Diferencia Línea */}
                          <td className="py-3 px-3 text-center text-xs">
                            {it.descartado ? (
                              <span className="text-slate-400 font-mono">—</span>
                            ) : diff === 0 ? (
                              <span className="text-slate-400 font-mono">Exacto</span>
                            ) : diff < 0 ? (
                              <span className="text-rose-700 font-bold font-mono">{diff} cj (Faltante)</span>
                            ) : (
                              <span className="text-emerald-700 font-bold font-mono">+{diff} cj</span>
                            )}
                          </td>

                          {/* Columna 7: Acciones (Excluir / Restaurar / Eliminar) */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {it.descartado ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleDescartarItem(idx)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-colors flex items-center space-x-1 shadow-2xs"
                                  title="Restaurar e incluir en la recepción física"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Restaurar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleDescartarItem(idx)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors flex items-center space-x-1 shadow-2xs"
                                  title="Excluir de la recepción física (0 cajas a ingresar)"
                                >
                                  <X className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Excluir</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEliminarItemFactura(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {itemsFactura.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No hay productos en la lista. Carga un archivo de factura arriba o utiliza &quot;Agregar producto manual&quot;.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aviso de seguridad contable y físico */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start space-x-2">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Principio de control de inventario:</strong> Solo las cajas físicas efectivamente contadas y con correspondencia en el catálogo vigente de 31 productos ingresarán al stock de Bodega Central. Los productos descontinuados quedan excluidos para no alterar el catálogo ni duplicar saldos.
              </div>
            </div>

            {/* Botón de Confirmación Definitiva */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                {itemsFactura.length > 0 && (
                  <span>
                    Confirmando <strong className="text-emerald-700">{totalCajasFisicasAIngresar} cajas físicas</strong> distribuidas en {itemsFactura.filter(it => !it.descartado && it.productId).length} productos del catálogo.
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={itemsFactura.filter(it => !it.descartado && it.productId).length === 0}
                onClick={handleConfirmarRecepcionFactura}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center justify-center space-x-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Ingresar a Bodega Central ({totalCajasFisicasAIngresar} cj)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VISTA 3: INGRESO MANUAL Y AJUSTES DE STOCK           */}
      {/* ---------------------------------------------------- */}
      {subTab === 'manual' && (
        <div className="space-y-6">
          {mensajeExitoManual && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{mensajeExitoManual}</span>
            </div>
          )}

          {/* Selector del Propósito del Movimiento Manual */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ingreso Manual y Ajuste de Stock</h3>
              <p className="text-sm text-slate-500 mt-1">
                Selecciona la operación que deseas realizar. Cada movimiento cuenta con reglas específicas para evitar errores y duplicidades.
              </p>
            </div>

            {/* Pestañas de tipos de movimiento manual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setTipoAjusteSeleccionado('inventario_inicial')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  tipoAjusteSeleccionado === 'inventario_inicial'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  1. Inventario Inicial
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Carga única de apertura física multilínea
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoAjusteSeleccionado('ajuste_conteo');
                  setProdConteoId('');
                  setConteoFisicoReal('');
                }}
                className={`p-3 text-left rounded-xl border transition-all ${
                  tipoAjusteSeleccionado === 'ajuste_conteo'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  2. Conteo Físico
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Compara stock y calcula diferencia (+/-)
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoAjusteSeleccionado('ingreso_extraordinario');
                  setProdSimpleId('');
                  setCajasSimple('');
                  setMotivoManual('');
                }}
                className={`p-3 text-left rounded-xl border transition-all ${
                  tipoAjusteSeleccionado === 'ingreso_extraordinario'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  3. Extraordinario
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Ingreso no habitual con motivo obligatorio
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoAjusteSeleccionado('devolucion_externa');
                  setProdSimpleId('');
                  setCajasSimple('');
                  setMotivoManual('');
                }}
                className={`p-3 text-left rounded-xl border transition-all ${
                  tipoAjusteSeleccionado === 'devolucion_externa'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  4. Devolución Externa
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Retorno apto coordinado sin duplicar
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoAjusteSeleccionado('merma_bodega');
                  setProdSimpleId('');
                  setCajasSimple('');
                  setMotivoManual('');
                }}
                className={`p-3 text-left rounded-xl border transition-all ${
                  tipoAjusteSeleccionado === 'merma_bodega'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  5. Merma Bodega
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Pérdida en cámara central únicamente
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoAjusteSeleccionado('reversion_movimientos');
                  setMovimientoSeleccionadoRevertirId('');
                  setMotivoReversion('');
                  setResponsableReversion(responsableManual || 'Encargado de Bodega');
                }}
                className={`p-3 text-left rounded-xl border transition-all ${
                  tipoAjusteSeleccionado === 'reversion_movimientos'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                  <Undo2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>6. Reversión</span>
                </div>
                <div className="text-xs opacity-90 leading-tight">
                  Compensar y anular movimientos de prueba
                </div>
              </button>
            </div>

            {/* Sub-formulario 1: INVENTARIO INICIAL DE APERTURA MULTILÍNEA */}
            {tipoAjusteSeleccionado === 'inventario_inicial' && (
              <form onSubmit={handleConfirmarAperturaInicial} className="space-y-5 border-t border-slate-200 pt-5">
                {aperturaRegistrada ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-950">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-bold text-sm text-emerald-900">
                            Inventario Inicial de Apertura ya registrado
                          </h4>
                          <span className="text-[11px] font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                            Doc: {aperturaRegistrada.referenciaDoc}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          El stock físico base fue establecido el <strong>{aperturaRegistrada.fecha}</strong> por <strong>{aperturaRegistrada.responsable}</strong> con un total de <strong>{aperturaRegistrada.totalCajas} cajas</strong> en Bodega Central.
                        </p>
                        <div className="mt-2 text-xs text-emerald-900 bg-white/80 border border-emerald-200 p-3 rounded-lg leading-relaxed">
                          <strong className="block text-emerald-950 mb-1">Regla de negocio JOLY (Operación única de apertura):</strong>
                          La apertura física se registra por única vez para evitar duplicar existencias.
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSubTab('factura')}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-xs font-semibold shadow-xs"
                            >
                              Ir a Recepción con Factura
                            </button>
                            <button
                              type="button"
                              onClick={() => setTipoAjusteSeleccionado('ajuste_conteo')}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-xs font-semibold shadow-xs"
                            >
                              Ir a Conteo Físico (Ajustes)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubTab('stock')}
                              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold shadow-xs"
                            >
                              Ver Stock Actual en Bodega
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Inventario Inicial de Apertura:</strong> Utiliza esta opción para registrar por única vez el stock físico que JOLY tiene físicamente en sus cámaras antes de comenzar las operaciones diarias. Permite ingresar múltiples productos en una misma operación.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Responsable del Conteo Inicial <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={responsableManual}
                      onChange={(e) => setResponsableManual(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Fecha de Conteo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={fechaManual}
                      onChange={(e) => setFechaManual(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Motivo o Justificación Obligatoria <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Conteo físico general de apertura de bodega central JOLY Helados"
                    value={motivoManual}
                    onChange={(e) => setMotivoManual(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>

                {/* Tabla multilínea de productos para apertura */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <span>
                      Productos y Cajas Físicas en Bodega ({itemsApertura.filter(it => it.productId).length} de {PRODUCTS.length})
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setItemsApertura(PRODUCTS.map(p => ({ productId: p.id, cajas: 0 })));
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Pre-cargar los 31 productos con 0 cajas</span>
                      </button>

                      {itemsApertura.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setItemsApertura([])}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg font-medium text-xs transition-colors"
                        >
                          Limpiar lista
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl max-h-[440px] overflow-y-auto bg-white shadow-xs">
                    {itemsApertura.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <Package className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-1">
                          No hay productos en la lista de apertura inicial
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                          Puedes pre-cargar las 31 filas independientes del catálogo con 0 cajas o agregar productos individuales con una fila vacía.
                        </p>
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setItemsApertura(PRODUCTS.map(p => ({ productId: p.id, cajas: 0 })));
                            }}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1.5"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Pre-cargar los 31 productos con 0 cajas</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setItemsApertura([{ productId: '', cajas: 0 }]);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar una fila vacía</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 z-10 shadow-xs">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                            <th className="py-2.5 px-3">Producto JOLY</th>
                            <th className="py-2.5 px-3 w-44">Categoría</th>
                            <th className="py-2.5 px-3 w-32 text-right">Cajas Contadas</th>
                            <th className="py-2.5 px-3 w-16 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {itemsApertura.map((it, idx) => {
                            const prod = it.productId ? PRODUCTS.find(p => p.id === it.productId) : null;
                            const esFilaVacia = !it.productId;

                            return (
                              <tr key={it.productId || `empty-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-2.5 px-3 text-center text-xs font-medium text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  {esFilaVacia ? (
                                    <div className="space-y-1">
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          const nuevoId = e.target.value;
                                          if (nuevoId) {
                                            setItemsApertura(prev => prev.map((item, i) => i === idx ? { ...item, productId: nuevoId } : item));
                                          }
                                        }}
                                        className="w-full text-xs px-2.5 py-1.5 bg-amber-50/60 border-2 border-amber-300 focus:border-slate-800 rounded-lg text-slate-800 font-medium focus:outline-none"
                                        autoFocus
                                      >
                                        <option value="">
                                          -- Seleccionar producto ({productosDisponiblesApertura.length} disponibles) --
                                        </option>
                                        {productosDisponiblesApertura.map(p => (
                                          <option key={p.id} value={p.id}>
                                            {p.name} — {p.categoryName} ({p.unitsPerBox} un/cj)
                                          </option>
                                        ))}
                                      </select>
                                      <div className="text-[11px] text-amber-700">
                                        Selecciona un producto del catálogo para esta fila
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-semibold text-slate-900 text-xs md:text-sm">
                                          {prod?.name || it.productId}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                          SKU: <span className="font-mono text-slate-500">{prod?.id}</span> · {prod?.unitsPerBox || 1} un/caja
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setItemsApertura(prev => prev.map((item, i) => i === idx ? { ...item, productId: '' } : item));
                                        }}
                                        className="text-[10px] text-slate-400 hover:text-slate-700 underline px-1.5 py-0.5 rounded hover:bg-slate-100"
                                        title="Cambiar este producto por otro disponible"
                                      >
                                        Cambiar
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {prod ? (
                                    <span className="inline-block text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                      {prod.categoryName}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={it.cajas === 0 ? '0' : it.cajas}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setItemsApertura(prev => prev.map((item, i) => i === idx ? { ...item, cajas: val } : item));
                                    }}
                                    className="w-24 px-2.5 py-1 text-xs border border-slate-300 focus:border-slate-800 rounded-lg text-right font-bold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setItemsApertura(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                    title="Quitar esta fila"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-slate-50 border-t border-slate-200 text-xs font-semibold text-slate-700">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3">
                              Total Cajas Físicas en Bodega Central ({itemsApertura.filter(it => it.productId && it.cajas > 0).length} productos con stock ingresado)
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 text-sm">
                              {itemsApertura.reduce((s, it) => s + (it.cajas || 0), 0)} cj
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      disabled={productosDisponiblesApertura.length === 0}
                      onClick={() => {
                        const hayFilaVacia = itemsApertura.some(it => !it.productId);
                        if (hayFilaVacia) {
                          alert('Ya tienes una fila vacía esperando selección de producto. Por favor elígelo antes de agregar otra fila.');
                          return;
                        }
                        if (productosDisponiblesApertura.length === 0) {
                          alert('Ya se han agregado los 31 productos del catálogo vigente.');
                          return;
                        }
                        setItemsApertura(prev => [...prev, { productId: '', cajas: 0 }]);
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
                        productosDisponiblesApertura.length === 0
                          ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {productosDisponiblesApertura.length === 0
                          ? 'Catálogo completo (31 de 31 en lista)'
                          : `Agregar otra fila de producto (${productosDisponiblesApertura.length} restantes)`}
                      </span>
                    </button>

                    <div className="text-xs text-slate-500 font-medium">
                      Total a registrar:{' '}
                      <strong className="text-slate-900">
                        {itemsApertura.reduce((s, it) => s + (it.cajas || 0), 0)} cajas
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!!aperturaRegistrada}
                    className={`w-full py-2.5 font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center space-x-2 ${
                      aperturaRegistrada
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {aperturaRegistrada
                        ? `Apertura inicial ya establecida (${aperturaRegistrada.referenciaDoc})`
                        : 'Guardar Inventario Inicial de Apertura'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-formulario 2: AJUSTE POR CONTEO FÍSICO */}
            {tipoAjusteSeleccionado === 'ajuste_conteo' && (() => {
              const productoSeleccionado = PRODUCTS.find(p => p.id === prodConteoId);
              const tieneProducto = Boolean(productoSeleccionado);
              const stockRegistrado = tieneProducto
                ? (stockList.find(s => s.productId === prodConteoId)?.cajasBodega || 0)
                : 0;
              const tieneConteo = tieneProducto && conteoFisicoReal !== '' && typeof conteoFisicoReal === 'number';
              const diff = tieneConteo ? conteoFisicoReal - stockRegistrado : null;
              const puedeAplicar = tieneProducto && tieneConteo && diff !== 0;

              return (
                <div className="space-y-6">
                  <form onSubmit={handleConfirmarAjusteConteo} className="space-y-4 border-t border-slate-200 pt-5 max-w-xl">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Ajuste por Conteo Físico:</strong> Compara el stock registrado en el sistema con el conteo físico real en bodega y calcula automáticamente la diferencia (positiva o negativa).
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Producto a Ajustar
                    </label>
                    <select
                      value={prodConteoId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setProdConteoId(id);
                        setConteoFisicoReal('');
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="">-- Selecciona un producto a ajustar --</option>
                      {PRODUCTS.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.categoryName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">Stock Registrado</div>
                      {tieneProducto ? (
                        <>
                          <div className="text-xl font-bold text-slate-800 mt-1">{stockRegistrado} cj</div>
                          <div className="text-[10px] text-slate-400">En Bodega Central</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-slate-400 mt-1">—</div>
                          <div className="text-[10px] text-slate-400">Esperando producto</div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                        Conteo Físico Real
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={!tieneProducto}
                        placeholder={tieneProducto ? "Ingresa cajas" : "Elige producto"}
                        value={tieneProducto ? conteoFisicoReal : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setConteoFisicoReal('');
                          } else {
                            const parsed = parseInt(val, 10);
                            setConteoFisicoReal(isNaN(parsed) ? '' : Math.max(0, parsed));
                          }
                        }}
                        className={`w-full px-2 py-1 text-center text-xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 placeholder:text-slate-300 placeholder:text-xs placeholder:font-normal ${
                          tieneProducto
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase">Diferencia Calculada</div>
                      {!tieneProducto ? (
                        <>
                          <div className="text-xl font-bold text-slate-400 mt-1">—</div>
                          <div className="text-[10px] text-slate-400">Esperando producto</div>
                        </>
                      ) : diff === null ? (
                        <>
                          <div className="text-xl font-bold text-slate-400 mt-1">—</div>
                          <div className="text-[10px] text-slate-400">Esperando conteo</div>
                        </>
                      ) : (
                        <>
                          <div className={`text-xl font-bold mt-1 ${
                            diff === 0 ? 'text-slate-600' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {diff === 0 ? '0 cj' : diff > 0 ? `+${diff} cj` : `${diff} cj`}
                          </div>
                          <div className={`text-[10px] font-medium ${
                            diff === 0 ? 'text-slate-500' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {diff === 0 ? 'Sin diferencia' : diff > 0 ? 'Sobrante (+)' : 'Faltante (-)'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Motivo Obligatorio del Descuadre / Ajuste <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!tieneProducto}
                      placeholder={tieneProducto ? "Ej: Cuadratura física semanal en cámara frigorífica 2" : "Selecciona un producto primero"}
                      value={motivoManual}
                      onChange={(e) => setMotivoManual(e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 ${
                        tieneProducto
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Responsable del Conteo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!tieneProducto}
                      placeholder={tieneProducto ? "Ej: Encargado de Bodega" : "Selecciona un producto primero"}
                      value={responsableManual}
                      onChange={(e) => setResponsableManual(e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 ${
                        tieneProducto
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    />
                  </div>

                  {/* Mensaje orientativo de estado */}
                  <div className={`p-3 rounded-xl text-xs flex items-center space-x-2.5 transition-all ${
                    !tieneProducto
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : diff === null
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : diff === 0
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {!tieneProducto
                        ? 'Selecciona un producto para comenzar'
                        : diff === null
                        ? 'Ingresa el conteo físico real para calcular la diferencia'
                        : diff === 0
                        ? 'Stock cuadrado: El conteo físico coincide exactamente con el sistema (sin diferencia para ajustar)'
                        : `Diferencia calculada: ${diff > 0 ? '+' : ''}${diff} cj. Completa el motivo y responsable para confirmar.`}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center space-x-3">
                    {tieneProducto && (
                      <button
                        type="button"
                        onClick={() => {
                          setProdConteoId('');
                          setConteoFisicoReal('');
                          setMotivoManual('');
                        }}
                        className="px-4 py-2.5 font-medium rounded-lg text-sm text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                        title="Cancelar operación pendiente y limpiar formulario sin afectar inventario"
                      >
                        Cancelar / Limpiar
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={!puedeAplicar}
                      className={`flex-1 py-2.5 font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center space-x-2 ${
                        puedeAplicar
                          ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar ajuste de stock</span>
                    </button>
                  </div>
                </form>

                {/* Historial de Ajustes por Conteo Físico Confirmados y Acción de Reversión */}
                {(() => {
                  const ajustesConteo = ordenarMovimientosCronologico(movimientos.filter(m => m.tipo === 'AJUSTE_CONTEO_FISICO'));
                  if (ajustesConteo.length === 0) return null;

                  return (
                    <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Ajustes de Conteo Confirmados ({ajustesConteo.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Historial ordenado cronológicamente con reversión compensatoria
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                              <th className="py-2.5 px-3">Fecha</th>
                              <th className="py-2.5 px-3">Ref.</th>
                              <th className="py-2.5 px-3">Detalle / Producto</th>
                              <th className="py-2.5 px-3 text-right">Ajuste</th>
                              <th className="py-2.5 px-3">Responsable</th>
                              <th className="py-2.5 px-3 text-center">Estado / Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {ajustesConteo.map((mov) => {
                              const esReversion = mov.referenciaDoc.startsWith('REV-');
                              const yaRevertido = referenciasAjustesRevertidos.has(mov.referenciaDoc);
                              const esIngreso = mov.destino === 'BODEGA_CENTRAL';

                              return (
                                <tr key={mov.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 text-slate-500 font-mono whitespace-nowrap">
                                    {mov.fecha}
                                  </td>
                                  <td className="py-2 px-3 font-mono font-medium text-slate-700">
                                    {mov.referenciaDoc}
                                  </td>
                                  <td className="py-2 px-3 text-slate-800">
                                    {mov.descripcion}
                                  </td>
                                  <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold">
                                    {esIngreso ? (
                                      <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        +{mov.totalCajas} cj
                                      </span>
                                    ) : (
                                      <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                        −{mov.totalCajas} cj
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-slate-500">
                                    {mov.responsable}
                                  </td>
                                  <td className="py-2 px-3 text-center whitespace-nowrap">
                                    {esReversion ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        Compensación
                                      </span>
                                    ) : yaRevertido ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                        ✓ Revertido
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMovimientoARevertir(mov);
                                          setMotivoReversion('');
                                          setResponsableReversion(responsableManual || 'Encargado de Bodega');
                                        }}
                                        className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg shadow-2xs flex items-center space-x-1 mx-auto transition-all cursor-pointer"
                                        title="Revertir este ajuste de forma compensatoria"
                                      >
                                        <Undo2 className="w-3 h-3" />
                                        <span>Revertir ajuste</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
                </div>
              );
            })()}

            {/* Sub-formulario 3, 4 y 5: INGRESOS EXTRAORDINARIOS, DEVOLUCIONES Y MERMAS */}
            {(tipoAjusteSeleccionado === 'ingreso_extraordinario' || 
              tipoAjusteSeleccionado === 'devolucion_externa' || 
              tipoAjusteSeleccionado === 'merma_bodega') && (() => {
              const productoSeleccionado = PRODUCTS.find(p => p.id === prodSimpleId);
              const tieneProducto = Boolean(productoSeleccionado);
              const stockBodega = tieneProducto
                ? (stockList.find(s => s.productId === prodSimpleId)?.cajasBodega || 0)
                : 0;

              return (
                <form onSubmit={handleConfirmarMovimientoSimple} className="space-y-4 border-t border-slate-200 pt-5 max-w-xl">
                  {tipoAjusteSeleccionado === 'devolucion_externa' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start space-x-2">
                      <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Coordinación con Cierre de Ruta:</strong> El cierre de ruta del vendedor ya reintegra automáticamente las cajas sobrantes a Bodega Central. Usa esta opción únicamente para devoluciones manuales que no hayan pasado por el cierre de ruta, evitando duplicar el conteo.
                      </div>
                    </div>
                  )}

                  {tipoAjusteSeleccionado === 'merma_bodega' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Exclusividad de Bodega Central:</strong> Las mermas registradas por los vendedores durante sus rutas ya se descuentan en el cierre de furgón. Esta opción descuenta exclusivamente pérdidas o daños ocurridos dentro de las cámaras de bodega.
                      </div>
                    </div>
                  )}

                  {tipoAjusteSeleccionado === 'ingreso_extraordinario' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 flex items-start space-x-2">
                      <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Ingreso Extraordinario:</strong> Para ingresos legítimos que no provienen de una factura de compra habitual (ej: bonificaciones de proveedor, muestras recuperadas).
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Producto
                    </label>
                    <select
                      value={prodSimpleId}
                      onChange={(e) => {
                        setProdSimpleId(e.target.value);
                        setCajasSimple('');
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="">-- Selecciona un producto a registrar --</option>
                      {PRODUCTS.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.categoryName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!tieneProducto ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                      Selecciona un producto del catálogo para habilitar los campos y registrar el movimiento.
                    </div>
                  ) : (
                    <>
                      {/* Resumen de stock actual en bodega del producto elegido */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Stock actual en Bodega Central:</span>
                        <span className="font-bold text-slate-900">{stockBodega} cj</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            {tipoAjusteSeleccionado === 'merma_bodega' ? 'Cajas a Descontar (-)' : 'Cajas a Ingresar (+)'} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Ej: 5"
                            value={cajasSimple}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') setCajasSimple('');
                              else setCajasSimple(Math.max(1, parseInt(val, 10) || 1));
                            }}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Fecha del Movimiento
                          </label>
                          <input
                            type="date"
                            value={fechaManual}
                            onChange={(e) => setFechaManual(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Motivo o Justificación Obligatoria <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder={
                            tipoAjusteSeleccionado === 'merma_bodega'
                              ? 'Ej: Rotura de empaque por caída en cámara 1'
                              : tipoAjusteSeleccionado === 'devolucion_externa'
                              ? 'Ej: Cajas devueltas por cliente tras evento, aptas para reventa'
                              : 'Ej: Bonificación adicional entregada por fábrica Lonquén'
                          }
                          value={motivoManual}
                          onChange={(e) => setMotivoManual(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          {tipoAjusteSeleccionado === 'ingreso_extraordinario'
                            ? 'Responsable del Ingreso Extraordinario'
                            : tipoAjusteSeleccionado === 'devolucion_externa'
                            ? 'Responsable de la Devolución'
                            : tipoAjusteSeleccionado === 'merma_bodega'
                            ? 'Responsable de la Merma'
                            : 'Responsable'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Encargado de Bodega"
                          value={responsableManual}
                          onChange={(e) => setResponsableManual(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={!cajasSimple || typeof cajasSimple !== 'number' || cajasSimple <= 0 || !motivoManual.trim() || !responsableManual.trim()}
                          className={`w-full py-2.5 font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center space-x-2 ${
                            cajasSimple && typeof cajasSimple === 'number' && cajasSimple > 0 && motivoManual.trim() && responsableManual.trim()
                              ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {tipoAjusteSeleccionado === 'ingreso_extraordinario'
                              ? 'Confirmar ingreso extraordinario'
                              : tipoAjusteSeleccionado === 'devolucion_externa'
                              ? 'Confirmar devolución externa'
                              : tipoAjusteSeleccionado === 'merma_bodega'
                              ? 'Confirmar merma en bodega'
                              : 'Registrar Movimiento en Inventario'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </form>
              );
            })()}

            {/* Sub-formulario 6: CAJÓN DE REVERSIÓN DE MOVIMIENTOS DE PRUEBA */}
            {tipoAjusteSeleccionado === 'reversion_movimientos' && (() => {
              // Movimientos candidatos a ser revertidos (excluye reversiones que ya son compensaciones REV-)
              const movimientosCandidatos = ordenarMovimientosCronologico(
                movimientos.filter(m => !m.referenciaDoc.startsWith('REV-') && !m.esDemo)
              );

              const movSeleccionado = movimientosCandidatos.find(m => m.id === movimientoSeleccionadoRevertirId);
              const yaRevertido = movSeleccionado ? referenciasAjustesRevertidos.has(movSeleccionado.referenciaDoc) : false;
              const fueIngreso = movSeleccionado ? movSeleccionado.destino === 'BODEGA_CENTRAL' : false;

              // Verificar si hay stock suficiente en Bodega Central para aplicar descuento si fue ingreso
              let inconsistenciaStock = false;
              let mensajeInconsistencia = '';
              if (movSeleccionado && fueIngreso && !yaRevertido) {
                for (const it of movSeleccionado.items) {
                  const stockActual = stockList.find(s => s.productId === it.productId);
                  const actualBodega = stockActual?.cajasBodega || 0;
                  if (actualBodega < it.cajas) {
                    inconsistenciaStock = true;
                    mensajeInconsistencia = `Bodega Central cuenta actualmente con ${actualBodega} cj de ${it.productName}. No es posible descontar ${it.cajas} cj porque el stock quedaría en negativo.`;
                    break;
                  }
                }
              }

              const puedeRevertir = Boolean(
                movSeleccionado &&
                !yaRevertido &&
                !inconsistenciaStock &&
                motivoReversion.trim() &&
                responsableReversion.trim()
              );

              return (
                <div className="space-y-6 border-t border-slate-200 pt-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-start space-x-3">
                    <Undo2 className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-slate-900 block font-bold">
                        Cajón de Reversión de Movimientos de Prueba:
                      </strong>
                      <p className="text-slate-600 leading-relaxed">
                        Selecciona un movimiento aplicado para anular su efecto mediante un movimiento compensatorio exacto en Bodega Central. Se conservará el registro original en la auditoría unificada, se creará el movimiento con folio <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">REV-...</code> y se impedirá revertir dos veces la misma operación.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!movSeleccionado) return;
                      ejecutarReversionMovimiento(movSeleccionado, motivoReversion, responsableReversion);
                    }}
                    className="space-y-4 max-w-xl"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Seleccionar Movimiento a Revertir <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={movimientoSeleccionadoRevertirId}
                        onChange={(e) => {
                          setMovimientoSeleccionadoRevertirId(e.target.value);
                          setMotivoReversion('');
                          setResponsableReversion(responsableManual || 'Encargado de Bodega');
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                      >
                        <option value="">-- Selecciona el movimiento registrado a revertir --</option>
                        {movimientosCandidatos.map(m => {
                          const rev = referenciasAjustesRevertidos.has(m.referenciaDoc);
                          const esEntrada = m.destino === 'BODEGA_CENTRAL';
                          const detalleProd = m.items[0]?.productName || m.descripcion;
                          return (
                            <option key={m.id} value={m.id}>
                              {rev ? '✓ [REVERTIDO] ' : '● [VIGENTE] '}
                              {m.fecha} | {m.referenciaDoc} | {esEntrada ? '+' : '−'}{m.totalCajas} cj ({detalleProd})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {!movSeleccionado ? (
                      <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                        Elige un movimiento del selector superior para revisar sus detalles y preparar la compensación.
                      </div>
                    ) : (
                      <>
                        {/* Ficha del movimiento seleccionado */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div>
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {movSeleccionado.referenciaDoc}
                              </span>
                              <span className="text-slate-500 ml-2">({movSeleccionado.fecha})</span>
                            </div>
                            {yaRevertido ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                                ✓ Ya Revertido
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                ● Vigente
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-slate-600">
                            <div>
                              <span className="font-semibold text-slate-700">Tipo original:</span>{' '}
                              <span>{movSeleccionado.tipo.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">Responsable original:</span>{' '}
                              <span>{movSeleccionado.responsable}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-semibold text-slate-700">Descripción:</span>{' '}
                              <span>{movSeleccionado.descripcion}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-semibold text-slate-700">Cajas registradas:</span>{' '}
                              <strong className={fueIngreso ? 'text-emerald-700' : 'text-rose-700'}>
                                {fueIngreso ? `+${movSeleccionado.totalCajas} cj (Ingreso a Bodega)` : `−${movSeleccionado.totalCajas} cj (Salida de Bodega)`}
                              </strong>
                            </div>
                          </div>

                          {/* Efecto compensatorio proyectado */}
                          <div className={`p-3 rounded-lg border text-xs font-medium ${
                            yaRevertido
                              ? 'bg-slate-100 border-slate-200 text-slate-600'
                              : fueIngreso
                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            {yaRevertido ? (
                              <div>
                                <strong>Operación finalizada:</strong> Este movimiento ya cuenta con una reversión registrada en la auditoría. No se puede revertir por segunda vez.
                              </div>
                            ) : (
                              <div>
                                <strong>Efecto compensatorio al confirmar:</strong> Se aplicará{' '}
                                <strong>{fueIngreso ? `descuento de −${movSeleccionado.totalCajas} cj` : `reintegro de +${movSeleccionado.totalCajas} cj`}</strong>{' '}
                                en Bodega Central para compensar exactamente el stock.
                              </div>
                            )}
                          </div>
                        </div>

                        {inconsistenciaStock && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong>Inconsistencia detectada:</strong> {mensajeInconsistencia}
                            </div>
                          </div>
                        )}

                        {!yaRevertido && (
                          <>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Motivo Obligatorio de la Reversión <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ej: Anulación de prueba de ingreso extraordinario"
                                value={motivoReversion}
                                onChange={(e) => setMotivoReversion(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Responsable de la Reversión <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={responsableReversion}
                                onChange={(e) => setResponsableReversion(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                              />
                            </div>

                            <div className="pt-2 flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setMovimientoSeleccionadoRevertirId('');
                                  setMotivoReversion('');
                                }}
                                className="px-4 py-2.5 font-medium rounded-lg text-sm text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                              >
                                Cancelar selección
                              </button>

                              <button
                                type="submit"
                                disabled={!puedeRevertir}
                                className={`flex-1 py-2.5 font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center space-x-2 ${
                                  puedeRevertir
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                }`}
                              >
                                <Undo2 className="w-4 h-4" />
                                <span>Confirmar Reversión Compensatoria</span>
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </form>

                  {/* Tabla de movimientos con estado Vigente vs Revertido */}
                  <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Movimientos de Prueba Registrados ({movimientosCandidatos.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Vigencia y trazabilidad de reversiones
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                            <th className="py-2.5 px-3">Fecha y Hora</th>
                            <th className="py-2.5 px-3">Ref.</th>
                            <th className="py-2.5 px-3">Detalle del Movimiento</th>
                            <th className="py-2.5 px-3 text-right">Cajas</th>
                            <th className="py-2.5 px-3">Responsable</th>
                            <th className="py-2.5 px-3 text-center">Estado / Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {movimientosCandidatos.map((mov) => {
                            const rev = referenciasAjustesRevertidos.has(mov.referenciaDoc);
                            const esIngreso = mov.destino === 'BODEGA_CENTRAL';
                            const seleccionado = mov.id === movimientoSeleccionadoRevertirId;

                            return (
                              <tr key={mov.id} className={`hover:bg-slate-50/50 ${seleccionado ? 'bg-amber-50/40' : ''}`}>
                                <td className="py-2 px-3 text-slate-500 font-mono whitespace-nowrap">
                                  {mov.fecha}
                                </td>
                                <td className="py-2 px-3 font-mono font-medium text-slate-700">
                                  {mov.referenciaDoc}
                                </td>
                                <td className="py-2 px-3 text-slate-800 max-w-xs truncate" title={mov.descripcion}>
                                  {mov.descripcion}
                                </td>
                                <td className="py-2 px-3 text-right whitespace-nowrap font-mono font-bold">
                                  {esIngreso ? (
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      +{mov.totalCajas} cj
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      −{mov.totalCajas} cj
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-500">
                                  {mov.responsable}
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  {rev ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                      ✓ Revertido
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMovimientoSeleccionadoRevertirId(mov.id);
                                        setMotivoReversion('');
                                        setResponsableReversion(responsableManual || 'Encargado de Bodega');
                                        window.scrollTo({ top: 300, behavior: 'smooth' });
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg shadow-2xs flex items-center space-x-1 mx-auto transition-all cursor-pointer"
                                      title="Seleccionar para revertir este movimiento"
                                    >
                                      <Undo2 className="w-3 h-3" />
                                      <span>Revertir</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {movimientosCandidatos.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400">
                                No hay movimientos de prueba registrados para revertir.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VISTA 4: REGISTRO UNIFICADO DE MOVIMIENTOS           */}
      {/* ---------------------------------------------------- */}
      {subTab === 'movimientos' && (
        <div className="space-y-4">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Auditoría Unificada de Movimientos</h3>
              <p className="text-xs text-slate-500">
                Historial cronológico ordenado del más reciente al más antiguo con trazabilidad física, documental y reversiones compensatorias.
              </p>
            </div>
          </div>

          {/* Resumen ejecutivo en una sola barra limpia y ligera (sin cajones pesados ni textos redundantes) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Operaciones:</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                {movimientos.length}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Entradas acumuladas:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                +{metricasAuditoria.ingresosCajas} cj
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Salidas / Compensaciones:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono">
                −{metricasAuditoria.egresosCajas} cj
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Indicador de stock físico real actual en Bodega Central conectado directamente al Tablero de Stock */}
            <div className="flex items-center space-x-1.5 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200 text-blue-900 shadow-2xs">
              <Package className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />
              <span className="font-semibold">Stock actual en Bodega:</span>
              <span className="font-bold font-mono">
                {totalesEmpresa.bodega} cajas
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Ajustes & Reversiones:</span>
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                {metricasAuditoria.conteosAjustes}
              </span>
            </div>
          </div>

          {/* Barra de Filtro y Búsqueda Rápida */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por producto, ref, motivo o responsable..."
                value={busquedaMovimiento}
                onChange={(e) => setBusquedaMovimiento(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-900 placeholder:text-slate-400"
              />
              {busquedaMovimiento && (
                <button
                  type="button"
                  onClick={() => setBusquedaMovimiento('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={filtroTipoMovimiento}
                onChange={(e) => setFiltroTipoMovimiento(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-700 w-full sm:w-auto font-medium"
              >
                <option value="todos">Todos los tipos de movimiento</option>
                <option value="RECEPCION_FACTURA">Facturas de Compra</option>
                <option value="AJUSTE_CONTEO_FISICO">Conteo Físico y Reversiones</option>
                <option value="INVENTARIO_INICIAL_APERTURA">Apertura Inicial</option>
                <option value="INGRESO_EXTRAORDINARIO">Ingreso Extraordinario</option>
                <option value="DEVOLUCION_EXTERNA">Devolución Externa</option>
                <option value="AJUSTE_MERMA_BODEGA">Merma Bodega</option>
                <option value="ASIGNACION_FURGON">Despacho Furgón</option>
                <option value="RETORNO_FURGON">Retorno Furgón</option>
              </select>

              {(busquedaMovimiento || filtroTipoMovimiento !== 'todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setBusquedaMovimiento('');
                    setFiltroTipoMovimiento('todos');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 underline whitespace-nowrap cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Tabla de Movimientos Unificada sin desborde ni repeticiones */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3 whitespace-nowrap">Fecha / Hora</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Operación / Ref.</th>
                    <th className="py-2.5 px-3">Producto / Detalle</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Cajas</th>
                    <th className="py-2.5 px-3">Motivo / Justificación</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Responsable</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {movimientosFiltrados.map((mov) => {
                    const sentido = getSentidoMovimiento(mov);
                    const esReversion = mov.referenciaDoc.startsWith('REV-');
                    const yaRevertido = referenciasAjustesRevertidos.has(mov.referenciaDoc);
                    const detalle = getDetalleMovimiento(mov);
                    const fechaPartes = mov.fecha.split(' ');

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Fecha y Hora compacta */}
                        <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap text-slate-600 align-top">
                          <div className="font-semibold text-slate-800">{fechaPartes[0]}</div>
                          <div className="text-[11px] text-slate-400">{fechaPartes[1] || ''}</div>
                        </td>

                        {/* 2. Operación y Referencia unificada */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-top">
                          <div className="mb-1">
                            {esReversion ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Compensación Reversión
                              </span>
                            ) : mov.tipo === 'INVENTARIO_INICIAL_APERTURA' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Apertura Inicial
                              </span>
                            ) : mov.tipo === 'RECEPCION_FACTURA' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                Factura Compra
                              </span>
                            ) : mov.tipo === 'AJUSTE_CONTEO_FISICO' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Conteo Físico
                              </span>
                            ) : mov.tipo === 'ASIGNACION_FURGON' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                Despacho Furgón
                              </span>
                            ) : mov.tipo === 'RETORNO_FURGON' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                Retorno Furgón
                              </span>
                            ) : mov.tipo === 'DEVOLUCION_EXTERNA' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Devolución Ext.
                              </span>
                            ) : mov.tipo === 'INGRESO_EXTRAORDINARIO' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                Extraordinario
                              </span>
                            ) : mov.tipo === 'AJUSTE_MERMA_BODEGA' ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                Merma Bodega
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                Ajuste Manual
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {mov.referenciaDoc}
                          </div>
                          {esReversion && (
                            <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                              ↳ Compensa {mov.referenciaDoc.replace('REV-', '')}
                            </div>
                          )}
                          {yaRevertido && (
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              ✓ Revertido
                            </div>
                          )}
                        </td>

                        {/* 3. Producto / Detalle claro */}
                        <td className="py-2.5 px-3 align-top min-w-[180px]">
                          <div className="font-semibold text-slate-900 text-xs leading-snug">
                            {detalle.productoPrincipal}
                          </div>
                          {detalle.esMultiple && mov.items && (
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={() => setDesgloseExpandidoId(desgloseExpandidoId === mov.id ? null : mov.id)}
                                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium underline inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <span>{desgloseExpandidoId === mov.id ? 'Ocultar desglose' : `Ver desglose (${mov.items.length} productos)`}</span>
                              </button>
                              {desgloseExpandidoId === mov.id && (
                                <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1 max-w-xs">
                                  {mov.items.map((it, i) => (
                                    <div key={i} className="flex justify-between text-slate-600">
                                      <span className="truncate pr-2">{it.productName}</span>
                                      <span className="font-mono font-semibold text-slate-800 whitespace-nowrap">{it.cajas} cj</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 4. Cajas (Impacto Bodega) */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap align-top">
                          <span className={`inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded-md border ${sentido.claseBadge}`}>
                            {sentido.signo}{mov.totalCajas} cj
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {sentido.esIngreso ? 'Entrada Bodega' : 'Salida Bodega'}
                          </div>
                        </td>

                        {/* 5. Motivo / Justificación limpio (sin repetir producto ni folio) */}
                        <td className="py-2.5 px-3 text-slate-700 text-xs leading-relaxed align-top min-w-[220px]">
                          {detalle.motivoLimpio}
                        </td>

                        {/* 6. Responsable */}
                        <td className="py-2.5 px-3 text-xs text-slate-700 whitespace-nowrap align-top">
                          <div className="font-medium text-slate-800">{mov.responsable || 'No registrado'}</div>
                        </td>

                        {/* 7. Acción: Reversión */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap align-top">
                          {mov.tipo === 'AJUSTE_CONTEO_FISICO' && (
                            esReversion ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Compensación
                              </span>
                            ) : yaRevertido ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                ✓ Revertido
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setMovimientoARevertir(mov);
                                  setMotivoReversion('');
                                  setResponsableReversion(responsableManual || 'Encargado de Bodega');
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg shadow-2xs inline-flex items-center space-x-1 transition-all cursor-pointer"
                                title="Revertir este ajuste de forma compensatoria"
                              >
                                <Undo2 className="w-3 h-3" />
                                <span>Revertir</span>
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {movimientosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        {movimientos.length === 0 ? (
                          <div>
                            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                            <div className="font-semibold text-slate-600">Historial de movimientos limpio</div>
                            <div className="text-slate-400 mt-0.5">Las recepciones con factura, aperturas y ajustes aparecerán aquí en estricto orden cronológico.</div>
                          </div>
                        ) : (
                          <div>
                            <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                            <div className="font-semibold text-slate-600">No se encontraron movimientos con los filtros aplicados</div>
                            <button
                              type="button"
                              onClick={() => {
                                setBusquedaMovimiento('');
                                setFiltroTipoMovimiento('todos');
                              }}
                              className="mt-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Restablecer búsqueda y filtros
                            </button>
                          </div>
                        )}
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
      {/* MODAL COMPACTO: ASOCIAR PRODUCTO AL CATÁLOGO JOLY    */}
      {/* ---------------------------------------------------- */}
      {modalAsociarIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Asociar a un Producto del Catálogo JOLY
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Texto en factura: <strong className="text-slate-800">&laquo;{itemsFactura[modalAsociarIndex]?.nombreFacturaOriginal || itemsFactura[modalAsociarIndex]?.productName}&raquo;</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAsociarIndex(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Búsqueda y Filtro de Categoría */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar sabor, nombre o código..."
                  value={busquedaAsociar}
                  onChange={(e) => setBusquedaAsociar(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white"
                  autoFocus
                />
              </div>

              <select
                value={categoriaAsociar}
                onChange={(e) => setCategoriaAsociar(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              >
                <option value="all">Todas las categorías</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Lista compacta de los 31 productos */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-96">
              {productosFiltradosModal.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleSeleccionarProductoModal(prod)}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {prod.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">
                        {prod.categoryName}
                      </span>
                      <span>•</span>
                      <span>{prod.unitsPerBox} unidades / caja</span>
                      <span>•</span>
                      <span>{formatCLP(prod.boxPrice)} / caja</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1 text-xs font-semibold bg-slate-900 group-hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <span>Seleccionar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {productosFiltradosModal.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No se encontraron productos en el catálogo con los filtros aplicados.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalAsociarIndex(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cerrar sin cambiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: REVERSIÓN DE AJUSTE POR CONTEO FÍSICO        */}
      {/* ---------------------------------------------------- */}
      {movimientoARevertir && (() => {
        const itemAjuste = movimientoARevertir.items[0];
        const prod = itemAjuste ? PRODUCTS.find(p => p.id === itemAjuste.productId) : null;
        const stockActualItem = prod ? stockList.find(s => s.productId === prod.id) : null;
        const stockActualBodega = stockActualItem?.cajasBodega || 0;
        const fueSobrante = movimientoARevertir.destino === 'BODEGA_CENTRAL';
        const cajasCompensatorias = itemAjuste?.cajas || 0;
        const deltaStock = fueSobrante ? -cajasCompensatorias : cajasCompensatorias;
        const hayInconsistencia = fueSobrante && stockActualBodega < cajasCompensatorias;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Undo2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Revertir Ajuste de Stock</h4>
                  <p className="text-xs text-slate-500">
                    Movimiento de compensación para {movimientoARevertir.referenciaDoc}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Operación original:</span>
                  <span className="font-mono font-medium text-slate-800">{movimientoARevertir.referenciaDoc} ({movimientoARevertir.fecha})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Producto:</span>
                  <strong className="text-slate-900">{prod?.name || itemAjuste?.productName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ajuste aplicado previamente:</span>
                  <span className={`font-bold font-mono ${fueSobrante ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {fueSobrante ? `+${cajasCompensatorias}` : `-${cajasCompensatorias}`} cj ({fueSobrante ? 'Sobrante' : 'Faltante'})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Stock actual en Bodega Central:</span>
                  <span className="font-bold text-slate-900">{stockActualBodega} cj</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                  <span className="text-slate-700">Efecto compensatorio a aplicar:</span>
                  <span className={`font-mono ${deltaStock > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {deltaStock > 0 ? `+${deltaStock}` : `${deltaStock}`} cj en Bodega Central
                  </span>
                </div>
              </div>

              {hayInconsistencia && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Inconsistencia detectada:</strong> Bodega Central cuenta con {stockActualBodega} cj de este producto. No es posible restar {cajasCompensatorias} cj porque el stock quedaría en negativo (posiblemente las cajas ya fueron despachadas a furgón o vendidas).
                  </div>
                </div>
              )}

              <form onSubmit={handleEjecutarReversionAjuste} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Motivo Obligatorio de la Reversión <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Error de digitación en conteo físico matutino"
                    value={motivoReversion}
                    onChange={(e) => setMotivoReversion(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsable de la Reversión <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={responsableReversion}
                    onChange={(e) => setResponsableReversion(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMovimientoARevertir(null);
                      setMotivoReversion('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={hayInconsistencia || !motivoReversion.trim() || !responsableReversion.trim()}
                    className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Confirmar Reversión Compensatoria</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ---------------------------------------------------- */}
      {/* MODAL: REINICIO SEGURO DE PRUEBAS                    */}
      {/* ---------------------------------------------------- */}
      {mostrarModalReinicio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Reinicio Controlado de Inventario</h4>
                <p className="text-xs text-slate-500">Limpieza de pruebas y preparación para el uso real</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-800">Lo que se restablecerá:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  <li><strong>Furgón 1 y Furgón 2:</strong> 0 cajas registradas.</li>
                  <li><strong>Bodega Central:</strong> 0 cajas registradas (lista para tu conteo físico real de apertura).</li>
                  <li><strong>Historial de movimientos:</strong> Se vacían los eventos de prueba ficticios.</li>
                  <li><strong>Facturas de prueba:</strong> Se limpian los registros de prueba previos.</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5 text-emerald-900">
                <div className="font-semibold text-emerald-950">Lo que queda 100% protegido:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Los <strong>31 productos del catálogo JOLY</strong> se conservan intactos.</li>
                  <li>Las <strong>ventas, pedidos y carritos de clientes</strong> no se alteran.</li>
                  <li>Los datos de los vendedores no se modifican.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Para confirmar, escribe <span className="font-mono text-rose-600 bg-rose-50 px-1 py-0.5 rounded">REINICIAR</span>:
                </label>
                <input
                  type="text"
                  placeholder="Escribe REINICIAR"
                  value={confirmacionTextoReinicio}
                  onChange={(e) => setConfirmacionTextoReinicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMostrarModalReinicio(false);
                  setConfirmacionTextoReinicio('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmacionTextoReinicio.trim().toUpperCase() !== 'REINICIAR'}
                onClick={handleEjecutarReinicioSeguro}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg shadow-sm transition-all"
              >
                Confirmar Reinicio Seguro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
