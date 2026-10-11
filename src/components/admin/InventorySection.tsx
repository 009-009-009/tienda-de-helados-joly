import React, { useState, useMemo } from 'react';
import { PRODUCTS, CatalogProduct } from '../../data/catalog';
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
  X
} from 'lucide-react';
import { formatCLP } from '../../utils/format';

export function InventorySection() {
  // Pestaña activa dentro de Inventario
  const [subTab, setSubTab] = useState<'stock' | 'factura' | 'manual' | 'movimientos'>('stock');

  // Estado del inventario (almacenado en sesión para persistencia temporal)
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

  // Guardar en sessionStorage para persistencia
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
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string; tamano: string; base64?: string; mimeType?: string } | null>(null);
  const [itemsFactura, setItemsFactura] = useState<ItemRecepcionFactura[]>([]);
  const [mensajeExitoFactura, setMensajeExitoFactura] = useState<string | null>(null);
  const [escaneandoFactura, setEscaneandoFactura] = useState(false);
  const [errorEscaneo, setErrorEscaneo] = useState<string | null>(null);
  const [modoPruebaReconocimiento, setModoPruebaReconocimiento] = useState(false);

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
  const [itemsApertura, setItemsApertura] = useState<{ productId: string; cajas: number }[]>(() => 
    PRODUCTS.slice(0, 5).map(p => ({ productId: p.id, cajas: 20 }))
  );

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
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
      });
    };
    reader.readAsDataURL(file);
  };

  const handleEscanearFactura = async () => {
    if (!archivoAdjunto?.base64) {
      alert('Por favor selecciona primero un archivo de factura (PDF o imagen).');
      return;
    }

    setEscaneandoFactura(true);
    setErrorEscaneo(null);

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

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No fue posible interpretar la factura');
      }

      const extracted = json.data;

      // Autocompletar datos de cabecera si vienen en el documento
      if (extracted.numeroFactura) {
        setNumFactura(extracted.numeroFactura);
      }
      if (extracted.proveedor) {
        // Cotejar si coincide con alguno de la lista o marcar como personalizado
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
      } else {
        setErrorEscaneo('El lector no detectó líneas de productos claras. Puedes agregar los productos manualmente con el botón inferior.');
      }
    } catch (err: any) {
      console.error('Error al escanear factura:', err);
      setErrorEscaneo(`Aviso de lectura: ${err.message || 'No se pudo interpretar el archivo'}. Recuerda que puedes usar el ingreso manual directo.`);
    } finally {
      setEscaneandoFactura(false);
    }
  };

  // Simulación de factura antigua con productos descontinuados para pruebas
  const handleCargarFacturaAntiguaPrueba = () => {
    setNumFactura('FAC-ANTIGUA-2023-884');
    setProveedorSeleccionado('Helados San Francisco de Lonquén S.A.');
    setFechaRecepcion('2023-11-15');
    setResponsableFactura('Control Calidad JOLY (Prueba)');
    setModoPruebaReconocimiento(true);
    setArchivoAdjunto({
      nombre: 'Factura_Historica_SanFrancisco_2023.pdf',
      tamano: '1.20 MB'
    });

    const mockOldItems = [
      { codigoProveedor: 'SKU-010', descripcion: 'Paleta Mora Mora', cantidadCajas: 15, precioUnitario: 9642 },
      { codigoProveedor: 'SKU-024', descripcion: 'Cassata Frambuesa 1L', cantidadCajas: 10, precioUnitario: 14536 },
      { codigoProveedor: 'SKU-OLD-01', descripcion: 'Paleta Naranjita Especial (Línea Antigua)', cantidadCajas: 8, precioUnitario: 6500 },
      { codigoProveedor: 'SKU-005', descripcion: 'Choco Panda Paleta', cantidadCajas: 12, precioUnitario: 13711 },
      { codigoProveedor: 'SKU-OLD-02', descripcion: 'Cassata Lúcuma Familiar 1.5L (Descontinuada)', cantidadCajas: 5, precioUnitario: 11000 }
    ];

    const processed = mockOldItems.map(it => buildItemFromExtraction(it));
    setItemsFactura(processed);
  };

  // Cambiar producto asociado de una fila de factura
  const handleCambiarProductoItemFactura = (index: number, nuevoProdId: string) => {
    const prod = PRODUCTS.find(p => p.id === nuevoProdId);
    if (!prod) return;

    setItemsFactura(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        productId: prod.id,
        productName: prod.name,
        categoryName: prod.categoryName,
        unitsPerBox: prod.unitsPerBox,
        precioUnitarioCaja: prod.boxPrice,
        matchStatus: 'manual',
        descartado: false,
        observaciones: `Asignado manualmente al catálogo: ${prod.name}`
      };
    }));
  };

  // Modificar cajas físicas contadas
  const handleActualizarCajasFisicasItem = (index: number, valor: number) => {
    setItemsFactura(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, cajasRecibidasFisicas: Math.max(0, valor) };
    }));
  };

  // Conmutar si se descarta o excluye de la recepción (por ejemplo si está descontinuado)
  const handleToggleDescartarItem = (index: number) => {
    setItemsFactura(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, descartado: !item.descartado };
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

    // SI ESTÁ EN MODO PRUEBA DE RECONOCIMIENTO: NO MODIFICAR STOCK REAL
    if (modoPruebaReconocimiento) {
      const docPrueba: RecepcionFacturaDoc = {
        id: `PRUEBA-REC-${Date.now()}`,
        numeroFactura: numLimpio,
        proveedor: proveedorFinal,
        fechaRecepcion,
        responsableRecepcion: responsableFactura,
        archivoNombre: archivoAdjunto?.nombre || 'Factura_Prueba_Reconocimiento.pdf',
        estado: 'modo_prueba_sin_stock',
        items: itemsFactura,
        totalCajasFacturadas: itemsFactura.reduce((s, it) => s + it.cajasFacturadas, 0),
        totalCajasRecibidas: itemsValidos.reduce((s, it) => s + it.cajasRecibidasFisicas, 0),
        esDemo: true,
        esModoPrueba: true
      };

      setMensajeExitoFactura(`✓ Modo Prueba Exitoso: Se verificó la extracción de ${itemsFactura.length} líneas y el filtro de productos descontinuados. No se alteró el stock.`);
      setFacturas([docPrueba, ...facturas]);
      setTimeout(() => {
        setMensajeExitoFactura(null);
        setModoPruebaReconocimiento(false);
        setItemsFactura([]);
        setNumFactura('');
        setArchivoAdjunto(null);
      }, 3500);
      return;
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
      totalCajasFacturadas: totalFacturadas,
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

  // a) Confirmar Inventario Inicial de Apertura Multilínea
  const handleConfirmarAperturaInicial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoManual.trim()) {
      alert('Es obligatorio ingresar el motivo o justificativo (ej: Conteo físico inicial de apertura JOLY).');
      return;
    }

    const itemsValidos = itemsApertura.filter(it => it.cajas > 0);
    if (itemsValidos.length === 0) {
      alert('Debes indicar al menos una cantidad mayor a 0 para el inventario inicial.');
      return;
    }

    // Actualizar el stock de Bodega con las cajas físicas iniciales
    const nuevoStock = stockList.map(stockItem => {
      const itemApertura = itemsApertura.find(it => it.productId === stockItem.productId);
      if (itemApertura) {
        const cajasFisicas = Math.max(0, itemApertura.cajas);
        return {
          ...stockItem,
          cajasBodega: cajasFisicas,
          totalEmpresa: cajasFisicas + stockItem.cajasAsignadasFurgon1 + stockItem.cajasAsignadasFurgon2,
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
    setMotivoManual('');
    setTimeout(() => {
      setMensajeExitoManual(null);
      setSubTab('stock');
    }, 2800);
  };

  // b) Confirmar Ajuste por Conteo Físico
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

  // c, d, e) Confirmar Movimiento Simple (Ingreso extraordinario, Devolución externa o Merma de bodega)
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

  // ----------------------------------------------------
  // MANEJADOR: REINICIO SEGURO DE DEMOSTRACIÓN
  // ----------------------------------------------------
  const handleEjecutarReinicioSeguro = () => {
    if (confirmacionTextoReinicio.trim().toUpperCase() !== 'REINICIAR') {
      alert('Debes escribir la palabra REINICIAR en mayúsculas para confirmar.');
      return;
    }

    // 1. Limpiar inventario central a estado base operativo: 0 cajas en bodega y furgones
    persistStock(STOCK_BASE_INICIAL_LIMPIO);

    // 2. Vaciar movimientos ficticios y pruebas
    persistMovimientos([]);

    // 3. Vaciar facturas de prueba
    persistFacturas([]);

    setMostrarModalReinicio(false);
    setConfirmacionTextoReinicio('');
    alert('✓ Reinicio Seguro Completado: El historial de pruebas ha sido limpiado y los saldos están listos para la carga del conteo físico real. Los 31 productos del catálogo y los módulos de ventas y pedidos permanecen intactos.');
  };

  return (
    <div className="space-y-6">
      {/* Banner de Estado y Control de Reinicio Seguro */}
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

          {/* Filtros de la Tabla */}
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

          {/* Tabla de Stock */}
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
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{mensajeExitoFactura}</span>
            </div>
          )}

          {errorEscaneo && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>{errorEscaneo}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-800" />
                  <span>Recepción con Factura: Lector Inteligente y Cotejo Físico</span>
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Carga el documento (PDF o foto) para extraer datos automáticamente. Compara los productos contra el catálogo de 31 y ajusta las cajas físicas contadas antes de ingresar a bodega.
                </p>
              </div>

              {/* Botón de prueba rápida con factura antigua */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCargarFacturaAntiguaPrueba}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Cargar factura de prueba con productos vigentes y descontinuados para probar el lector"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>Cargar Factura Antigua de Prueba</span>
                </button>
              </div>
            </div>

            {/* Aviso de Modo de Prueba si está activo */}
            {modoPruebaReconocimiento && (
              <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>
                    <strong>Modo Prueba de Reconocimiento Activo:</strong> Esta factura contiene productos antiguos. Servirá para verificar el reconocimiento de nombres y detección de descontinuados sin sumar cajas al inventario real.
                  </span>
                </div>
                <button
                  onClick={() => setModoPruebaReconocimiento(false)}
                  className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded font-semibold text-[11px]"
                >
                  Desactivar Modo Prueba
                </button>
              </div>
            )}

            {/* Zona de Carga y Lector OCR */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {archivoAdjunto ? archivoAdjunto.nombre : 'Cargar Factura o Guía (PDF / Imagen JPG / PNG)'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {archivoAdjunto ? `${archivoAdjunto.tamano} • Listo para analizar` : 'Lector integrado a costo cero sin APIs de pago'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <label className="cursor-pointer">
                    <span className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-all inline-block">
                      {archivoAdjunto ? 'Cambiar archivo' : 'Seleccionar PDF o Foto'}
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
                      className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
                    >
                      {escaneandoFactura ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Analizando factura...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Escanear y Extraer Datos</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cabecera del Documento (Editable) */}
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

            {/* Tabla de Productos Cotejados */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                  <span>Productos Detectados en Factura ({itemsFactura.length})</span>
                  {itemsFactura.some(it => it.matchStatus === 'descontinuado') && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      Contiene productos no vigentes
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-500">
                    Cajas Facturadas: <strong className="text-slate-900">{itemsFactura.reduce((s, it) => s + it.cajasFacturadas, 0)} cj</strong>
                  </span>
                  <span className="text-slate-500">
                    Físicas a Ingresar: <strong className="text-emerald-700">{itemsFactura.filter(it => !it.descartado && it.productId).reduce((s, it) => s + it.cajasRecibidasFisicas, 0)} cj</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarAgregarManualFactura(!mostrarAgregarManualFactura)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar manual</span>
                  </button>
                </div>
              </div>

              {/* Formulario desplegable para agregar producto manual si el lector no lo reconoció */}
              {mostrarAgregarManualFactura && (
                <div className="p-4 mb-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
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

              {/* Tabla de items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Nombre en Factura & SKU</th>
                      <th className="py-2.5 px-3">Producto en Catálogo JOLY (31)</th>
                      <th className="py-2.5 px-3 text-center">Estado Cotejo</th>
                      <th className="py-2.5 px-3 text-right">Cajas Factura</th>
                      <th className="py-2.5 px-3 text-right font-bold text-emerald-900 bg-emerald-50/50">
                        Cajas Físicas
                      </th>
                      <th className="py-2.5 px-3 text-center">Diferencia</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsFactura.map((it, idx) => {
                      const diff = it.cajasRecibidasFisicas - it.cajasFacturadas;
                      const esDescontinuado = it.matchStatus === 'descontinuado';
                      const requiereConfirmacion = it.matchStatus === 'requiere_confirmacion';

                      return (
                        <tr 
                          key={idx} 
                          className={`transition-colors ${
                            it.descartado 
                              ? 'bg-slate-50/70 opacity-60' 
                              : esDescontinuado 
                              ? 'bg-amber-50/40' 
                              : 'hover:bg-slate-50/50'
                          }`}
                        >
                          {/* Columna 1: Descripción original de factura */}
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">
                              {it.nombreFacturaOriginal || it.productName}
                            </div>
                            {it.codigoProveedor && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                Código: {it.codigoProveedor}
                              </div>
                            )}
                          </td>

                          {/* Columna 2: Mapeo al Catálogo de 31 productos */}
                          <td className="py-2.5 px-3">
                            {esDescontinuado && !it.productId ? (
                              <div className="space-y-1">
                                <span className="text-xs text-rose-700 font-medium">
                                  No existe en catálogo vigente
                                </span>
                                <select
                                  value=""
                                  onChange={(e) => handleCambiarProductoItemFactura(idx, e.target.value)}
                                  className="w-full text-xs px-2 py-1 bg-white border border-amber-300 rounded text-slate-700"
                                >
                                  <option value="">¿Asociar a un producto del catálogo?</option>
                                  {PRODUCTS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <select
                                  value={it.productId}
                                  onChange={(e) => handleCambiarProductoItemFactura(idx, e.target.value)}
                                  className={`w-full text-xs px-2 py-1 bg-white border rounded font-medium ${
                                    requiereConfirmacion 
                                      ? 'border-amber-400 bg-amber-50/30' 
                                      : 'border-slate-200'
                                  }`}
                                >
                                  {PRODUCTS.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} ({p.unitsPerBox} un/cj)
                                    </option>
                                  ))}
                                </select>
                                {it.unitsPerBox > 0 && (
                                  <div className="text-[11px] text-slate-500">
                                    {it.categoryName} • {it.unitsPerBox} un/caja
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Columna 3: Estado del Reconocimiento */}
                          <td className="py-2.5 px-3 text-center">
                            {it.descartado ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
                                Excluido
                              </span>
                            ) : it.matchStatus === 'coincidencia_exacta' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                ✓ Catálogo JOLY
                              </span>
                            ) : it.matchStatus === 'requiere_confirmacion' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                                🔍 Confirmar
                              </span>
                            ) : esDescontinuado ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                                ⚠️ Descontinuado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                                Manual
                              </span>
                            )}
                          </td>

                          {/* Columna 4: Cajas Facturadas */}
                          <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                            {it.cajasFacturadas} cj
                          </td>

                          {/* Columna 5: Cajas Físicas Contadas (Editable) */}
                          <td className="py-2.5 px-3 text-right bg-emerald-50/20">
                            {it.descartado ? (
                              <span className="text-xs text-slate-400 font-mono">0 cj</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={it.cajasRecibidasFisicas}
                                onChange={(e) => handleActualizarCajasFisicasItem(idx, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-xs border border-emerald-400 rounded text-right font-bold text-emerald-900 bg-white"
                              />
                            )}
                          </td>

                          {/* Columna 6: Diferencia */}
                          <td className="py-2.5 px-3 text-center text-xs">
                            {it.descartado ? (
                              <span className="text-slate-400">—</span>
                            ) : diff === 0 ? (
                              <span className="text-slate-400 font-mono">Exacto</span>
                            ) : diff < 0 ? (
                              <span className="text-rose-600 font-bold font-mono">{diff} cj (Faltante)</span>
                            ) : (
                              <span className="text-emerald-600 font-bold font-mono">+{diff} cj</span>
                            )}
                          </td>

                          {/* Columna 7: Acciones */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleToggleDescartarItem(idx)}
                                className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
                                  it.descartado 
                                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                title={it.descartado ? 'Incluir en recepción' : 'Excluir esta línea'}
                              >
                                {it.descartado ? 'Restaurar' : 'Excluir'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarItemFactura(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {itemsFactura.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No hay productos en la lista. Carga un archivo de factura arriba o presiona &quot;Agregar manual&quot;.
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
                <strong>Seguridad de Inventario:</strong> Los productos marcados como &quot;Descontinuados&quot; quedan excluidos por defecto para no contaminar el catálogo de 31 productos. El stock en Bodega Central solo se incrementará cuando pulses el botón de confirmación inferior.
              </div>
            </div>

            {/* Botón de Confirmación Definitiva */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              {modoPruebaReconocimiento ? (
                <button
                  type="button"
                  onClick={handleConfirmarRecepcionFactura}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>Finalizar Prueba de Reconocimiento (Sin Modificar Stock)</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={itemsFactura.filter(it => !it.descartado && it.productId).length === 0}
                  onClick={handleConfirmarRecepcionFactura}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Ingresar a Bodega Central</span>
                </button>
              )}
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
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Inventario Inicial de Apertura:</strong> Utiliza esta opción para registrar por única vez el stock físico que JOLY tiene físicamente en sus cámaras antes de comenzar las operaciones diarias. Permite ingresar múltiples productos en una misma operación.
                  </div>
                </div>

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
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <span>Productos y Cajas Físicas en Bodega ({itemsApertura.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Cargar todos los 31 productos del catálogo
                        setItemsApertura(PRODUCTS.map(p => ({ productId: p.id, cajas: 0 })));
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                    >
                      Pre-cargar los 31 productos con 0 cajas
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Producto JOLY</th>
                          <th className="py-2.5 px-3">Categoría</th>
                          <th className="py-2.5 px-3 text-right">Cajas Contadas</th>
                          <th className="py-2.5 px-3 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {itemsApertura.map((it, idx) => {
                          const prod = PRODUCTS.find(p => p.id === it.productId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                <select
                                  value={it.productId}
                                  onChange={(e) => {
                                    const nuevoId = e.target.value;
                                    setItemsApertura(prev => prev.map((item, i) => i === idx ? { ...item, productId: nuevoId } : item));
                                  }}
                                  className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded"
                                >
                                  {PRODUCTS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3 text-xs text-slate-500">
                                {prod?.categoryName}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={it.cajas}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setItemsApertura(prev => prev.map((item, i) => i === idx ? { ...item, cajas: val } : item));
                                  }}
                                  className="w-24 px-2 py-1 text-xs border border-slate-300 rounded text-right font-bold text-slate-900 bg-white"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setItemsApertura(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const disponible = PRODUCTS.find(p => !itemsApertura.some(it => it.productId === p.id));
                      if (disponible) {
                        setItemsApertura(prev => [...prev, { productId: disponible.id, cajas: 0 }]);
                      }
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otra fila de producto</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Inventario Inicial de Apertura</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-formulario 2: AJUSTE POR CONTEO FÍSICO (DIFERENCIA +/-) */}
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

                {/* Comparación visual Stock Sistema vs Conteo Real */}
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
