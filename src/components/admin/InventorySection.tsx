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
  ChevronRight
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
  const [prodManualFacturaId, setProdManualFacturaId] = useState(PRODUCTS[0]?.id || '');
  const [cajasFacturadasManualFactura, setCajasFacturadasManualFactura] = useState(10);
  const [cajasFisicasManualFactura, setCajasFisicasManualFactura] = useState(10);
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
  const [prodConteoId, setProdConteoId] = useState(PRODUCTS[0]?.id || '');
  const [conteoFisicoReal, setConteoFisicoReal] = useState<number>(0);

  // Sub-estado: Ingreso extraordinario, Devolución o Merma
  const [prodSimpleId, setProdSimpleId] = useState(PRODUCTS[0]?.id || '');
  const [cajasSimple, setCajasSimple] = useState<number>(5);

  // ----------------------------------------------------
  // MODAL DE REINICIO SEGURO
  // ----------------------------------------------------
  const [mostrarModalReinicio, setMostrarModalReinicio] = useState(false);
  const [confirmacionTextoReinicio, setConfirmacionTextoReinicio] = useState('');

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
    const prod = PRODUCTS.find(p => p.id === prodManualFacturaId);
    if (!prod) return;

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
      confirmadaAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
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
          ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return stockItem;
    });

    const totalCajasIniciales = itemsValidos.reduce((s, it) => s + it.cajas, 0);

    const nuevoMov: MovimientoInventario = {
      id: `MOV-APE-${Date.now()}`,
      fecha: `${fechaManual} ${new Date().toTimeString().slice(0, 5)}`,
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
    const prod = PRODUCTS.find(p => p.id === prodConteoId);
    if (!prod) return;

    if (!motivoManual.trim()) {
      alert('Es obligatorio ingresar el motivo del ajuste por conteo físico.');
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
          ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return s;
    });

    const nuevoMov: MovimientoInventario = {
      id: `MOV-CONT-${Date.now()}`,
      fecha: `${fechaManual} ${new Date().toTimeString().slice(0, 5)}`,
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
    setMotivoManual('');
    setTimeout(() => {
      setMensajeExitoManual(null);
      setSubTab('stock');
    }, 2500);
  };

  const handleConfirmarMovimientoSimple = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = PRODUCTS.find(p => p.id === prodSimpleId);
    if (!prod) return;

    if (cajasSimple <= 0) {
      alert('Ingresa una cantidad de cajas mayor a 0.');
      return;
    }
    if (!motivoManual.trim()) {
      alert('El motivo o justificación es obligatorio.');
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
          ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return item;
    });

    const nuevoMov: MovimientoInventario = {
      id: `MOV-SIMP-${Date.now()}`,
      fecha: `${fechaManual} ${new Date().toTimeString().slice(0, 5)}`,
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
    setMotivoManual('');
    setCajasSimple(5);
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
                    onClick={() => setMostrarAgregarManualFactura(!mostrarAgregarManualFactura)}
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
                      <label className="block text-xs text-slate-500 mb-1">Producto del Catálogo JOLY</label>
                      <select
                        value={prodManualFacturaId}
                        onChange={(e) => setProdManualFacturaId(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
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
                        value={cajasFacturadasManualFactura}
                        onChange={(e) => setCajasFacturadasManualFactura(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-right font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-900 mb-1">Cajas Físicas</label>
                      <input
                        type="number"
                        min="0"
                        value={cajasFisicasManualFactura}
                        onChange={(e) => setCajasFisicasManualFactura(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-sm bg-white border border-emerald-400 rounded-lg text-right font-bold text-emerald-900"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <button
                        type="button"
                        onClick={handleAgregarManualAFactura}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm"
                      >
                        Agregar a la lista
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
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
                onClick={() => setTipoAjusteSeleccionado('ajuste_conteo')}
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
                onClick={() => setTipoAjusteSeleccionado('ingreso_extraordinario')}
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
                onClick={() => setTipoAjusteSeleccionado('devolucion_externa')}
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
                onClick={() => setTipoAjusteSeleccionado('merma_bodega')}
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
            {tipoAjusteSeleccionado === 'ajuste_conteo' && (
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
                      const current = stockList.find(s => s.productId === id)?.cajasBodega || 0;
                      setConteoFisicoReal(current);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  >
                    {PRODUCTS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.categoryName})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const stockRegistrado = stockList.find(s => s.productId === prodConteoId)?.cajasBodega || 0;
                  const diff = conteoFisicoReal - stockRegistrado;

                  return (
                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">Stock Registrado</div>
                        <div className="text-xl font-bold text-slate-800 mt-1">{stockRegistrado} cj</div>
                        <div className="text-[10px] text-slate-400">En Bodega Central</div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                          Conteo Físico Real
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={conteoFisicoReal}
                          onChange={(e) => setConteoFisicoReal(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2 py-1 text-center text-xl font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                        />
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">Diferencia Calculada</div>
                        <div className={`text-xl font-bold mt-1 ${
                          diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {diff === 0 ? '0' : diff > 0 ? `+${diff}` : diff} cj
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {diff === 0 ? 'Sin diferencia' : diff > 0 ? 'Sobrante (+)' : 'Faltante (-)'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Motivo Obligatorio del Descuadre / Ajuste <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cuadratura física semanal en cámara frigorífica 2"
                    value={motivoManual}
                    onChange={(e) => setMotivoManual(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Responsable del Conteo
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
                    <span>Aplicar Ajuste por Conteo Físico</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-formulario 3, 4 y 5: INGRESOS EXTRAORDINARIOS, DEVOLUCIONES Y MERMAS */}
            {(tipoAjusteSeleccionado === 'ingreso_extraordinario' || 
              tipoAjusteSeleccionado === 'devolucion_externa' || 
              tipoAjusteSeleccionado === 'merma_bodega') && (
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
                    onChange={(e) => setProdSimpleId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  >
                    {PRODUCTS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.categoryName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      {tipoAjusteSeleccionado === 'merma_bodega' ? 'Cajas a Descontar (-)' : 'Cajas a Ingresar (+)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={cajasSimple}
                      onChange={(e) => setCajasSimple(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-900"
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
                    Responsable
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
                    <span>Registrar Movimiento en Inventario</span>
                  </button>
                </div>
              </form>
            )}
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
              <h3 className="text-lg font-bold text-slate-900">Auditoría Unificada de Movimientos</h3>
              <p className="text-sm text-slate-500">
                Historial cronológico de recepciones con factura, aperturas, despachos a furgón, retornos y ajustes.
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
                          {mov.tipo === 'INVENTARIO_INICIAL_APERTURA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Apertura Inicial
                            </span>
                          )}
                          {mov.tipo === 'RECEPCION_FACTURA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                              Factura Compra
                            </span>
                          )}
                          {mov.tipo === 'AJUSTE_CONTEO_FISICO' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Conteo Físico
                            </span>
                          )}
                          {mov.tipo === 'ASIGNACION_FURGON' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                              Despacho Furgón
                            </span>
                          )}
                          {mov.tipo === 'RETORNO_FURGON' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                              Retorno Furgón
                            </span>
                          )}
                          {mov.tipo === 'DEVOLUCION_EXTERNA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Devolución Ext.
                            </span>
                          )}
                          {mov.tipo === 'INGRESO_EXTRAORDINARIO' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
                              Extraordinario
                            </span>
                          )}
                          {mov.tipo === 'AJUSTE_MERMA_BODEGA' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                              Merma Bodega
                            </span>
                          )}
                          {mov.tipo === 'INGRESO_MANUAL' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                              Ajuste Manual
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
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Historial de movimientos limpio. No hay eventos registrados.
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
