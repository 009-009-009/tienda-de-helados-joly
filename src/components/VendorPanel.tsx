import React, { useState, useEffect, useMemo } from 'react';
import { PRODUCTS } from '../data/catalog';
import {
  VendedorId,
  VENDEDORES_DISPONIBLES,
  PedidoPP,
  OrigenRegistro,
  VentaRealizada,
  MovimientoDestino,
  CierreRutaRecord
} from '../types/vendor';
import {
  PEDIDOS_INICIALES_VENDEDOR_1,
  PEDIDOS_INICIALES_VENDEDOR_2
} from '../data/vendorMockOrders';
import {
  formatChileanPhone,
  formatChileanRut,
  formatCLP
} from '../utils/format';
import { JOLY_OFFICIAL_LOGO } from '../assets/officialLogo';

interface VendorPanelProps {
  onBackToStore: () => void;
}

export const VendorPanel: React.FC<VendorPanelProps> = ({ onBackToStore }) => {
  // Selector de vendedor (Vendedor 1 vs Vendedor 2)
  const [vendedorActivo, setVendedorActivo] = useState<VendedorId>('vendedor-1');
  const [seccion, setSeccion] = useState<'portada' | 'pedidos' | 'venta' | 'cierre'>('portada');

  // Clave de almacenamiento por vendedor para no mezclar rutas
  const storageKey = `joly_vendor_state_${vendedorActivo}`;

  // Estado operativo del furgón
  const [pedidos, setPedidos] = useState<PedidoPP[]>(() => {
    return vendedorActivo === 'vendedor-1'
      ? JSON.parse(JSON.stringify(PEDIDOS_INICIALES_VENDEDOR_1))
      : JSON.parse(JSON.stringify(PEDIDOS_INICIALES_VENDEDOR_2));
  });

  const [pedidosInicialesCount, setPedidosInicialesCount] = useState<number>(4);
  const [pedidosInicialesCajas, setPedidosInicialesCajas] = useState<number>(0);

  const [cargaExtra, setCargaExtra] = useState<Record<string, number>>({});
  const [productosDisponibles, setProductosDisponibles] = useState<Record<string, number>>({});
  const [origenProductosDisponibles, setOrigenProductosDisponibles] = useState<Record<string, OrigenRegistro[]>>({});
  const [ventasRealizadas, setVentasRealizadas] = useState<VentaRealizada[]>([]);
  const [movimientosDestino, setMovimientosDestino] = useState<MovimientoDestino[]>([]);

  // Destino temporal antes de confirmar
  const [cantidadesDestino, setCantidadesDestino] = useState<Record<string, number>>({});
  const [destinosEnProceso, setDestinosEnProceso] = useState<Record<string, {
    destino: 'sobrante' | 'merma' | 'compensacion' | '';
    motivo: string;
    nombreComp: string;
    comunaComp: string;
    rutComp: string;
    telefonoComp: string;
  }>>({});

  // Carga inicial y totales
  const [cajasCargaExtraRuta, setCajasCargaExtraRuta] = useState<number>(0);

  // Venta Directa: selección para vender
  const [mostrarFormCargaExtra, setMostrarFormCargaExtra] = useState<boolean>(false);
  const [productosSeleccionadosPD, setProductosSeleccionadosPD] = useState<string[]>([]);
  const [cantidadesPD, setCantidadesPD] = useState<Record<string, number>>({});
  const [cantidadesVentaSelector, setCantidadesVentaSelector] = useState<Record<string, number>>({});
  const [enModoVenta, setEnModoVenta] = useState<boolean>(false);

  // Formulario de venta directa
  const [clienteVenta, setClienteVenta] = useState({
    nombre: '',
    apellido: '',
    negocio: '',
    sector: '',
    direccion: '',
    celular: ''
  });
  const [pagoVenta, setPagoVenta] = useState<string>('');
  const [montoEfectivoVenta, setMontoEfectivoVenta] = useState<string>('');
  const [facturaVenta, setFacturaVenta] = useState<string>('No');
  const [rutFacturaVenta, setRutFacturaVenta] = useState<string>('');
  const [estadoFacturaVenta, setEstadoFacturaVenta] = useState<string>('Entregada');

  // Observaciones y cierre
  const [observacionesCierre, setObservacionesCierre] = useState<string>('');
  const [rutaCerrada, setRutaCerrada] = useState<boolean>(false);
  const [cierreGenerado, setCierreGenerado] = useState<CierreRutaRecord | null>(null);

  // Toggle de precio visible en líneas de pedido / venta
  const [preciosVisibles, setPreciosVisibles] = useState<Record<string, boolean>>({});

  // Pedidos pendientes y estados de entrega
  const [detallesAbiertos, setDetallesAbiertos] = useState<Record<string, boolean>>({});
  const [cantidadesEntrega, setCantidadesEntrega] = useState<Record<string, Record<string, number>>>({});
  const [estadosEntrega, setEstadosEntrega] = useState<Record<string, {
    estado: 'Entregado' | 'Parcial' | 'Cancelado';
    pago: string;
    montoEfectivo: string;
    factura: string;
  }>>({});

  // Cargar estado guardado en localStorage o inicial al montar / cambiar de vendedor
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(`jolyRutaActiva_${vendedorActivo}`);
      if (guardado) {
        const data = JSON.parse(guardado);
        if (data && data.pedidosInicialesCajas !== undefined) {
          setPedidos(data.pedidos || []);
          setPedidosInicialesCount(data.pedidosInicialesCount || 4);
          setPedidosInicialesCajas(data.pedidosInicialesCajas || 0);
          setCargaExtra(data.cargaExtra || {});
          setProductosDisponibles(data.productosDisponibles || {});
          setOrigenProductosDisponibles(data.origenProductosDisponibles || {});
          setVentasRealizadas(data.ventasRealizadas || []);
          setMovimientosDestino(data.movimientosDestino || []);
          setCajasCargaExtraRuta(data.cajasCargaExtraRuta || 0);
          setCantidadesEntrega(data.cantidadesEntrega || {});
          setEstadosEntrega(data.estadosEntrega || {});
          setProductosSeleccionadosPD(data.productosSeleccionadosPD || []);
          setCantidadesPD(data.cantidadesPD || {});
          setCantidadesVentaSelector(data.cantidadesVentaSelector || {});
          setEnModoVenta(data.enModoVenta || false);
          setRutaCerrada(data.rutaCerrada || false);
          setCierreGenerado(data.cierreGenerado || null);
          return;
        }
      }
    } catch (e) {
      console.error('Error restaurando ruta guardada:', e);
    }

    // Si no había datos guardados, cargamos la ruta de prueba estándar
    const defaultPedidos = vendedorActivo === 'vendedor-1'
      ? JSON.parse(JSON.stringify(PEDIDOS_INICIALES_VENDEDOR_1))
      : JSON.parse(JSON.stringify(PEDIDOS_INICIALES_VENDEDOR_2));

    const totalCajas = defaultPedidos.reduce((sum: number, ped: PedidoPP) => {
      return sum + ped.productos.reduce((s, it) => s + it.cajas, 0);
    }, 0);

    setPedidos(defaultPedidos);
    setPedidosInicialesCount(defaultPedidos.length);
    setPedidosInicialesCajas(totalCajas);
    setCargaExtra({});
    setProductosDisponibles({});
    setOrigenProductosDisponibles({});
    setVentasRealizadas([]);
    setMovimientosDestino([]);
    setCajasCargaExtraRuta(0);
    setCantidadesEntrega({});
    setEstadosEntrega({});
    setCantidadesVentaSelector({});
    setProductosSeleccionadosPD([]);
    setCantidadesPD({});
    setEnModoVenta(false);
    setRutaCerrada(false);
    setCierreGenerado(null);
    setSeccion('portada');
  }, [vendedorActivo]);

  // Guardar automáticamente cada cambio de la ruta activa en localStorage
  useEffect(() => {
    if (pedidosInicialesCajas > 0 || Object.keys(productosDisponibles).length > 0 || ventasRealizadas.length > 0) {
      const estadoRuta = {
        pedidos,
        pedidosInicialesCount,
        pedidosInicialesCajas,
        cargaExtra,
        productosDisponibles,
        origenProductosDisponibles,
        ventasRealizadas,
        movimientosDestino,
        cajasCargaExtraRuta,
        cantidadesEntrega,
        estadosEntrega,
        productosSeleccionadosPD,
        cantidadesPD,
        cantidadesVentaSelector,
        enModoVenta,
        rutaCerrada,
        cierreGenerado
      };
      localStorage.setItem(`jolyRutaActiva_${vendedorActivo}`, JSON.stringify(estadoRuta));
    }
  }, [
    vendedorActivo,
    pedidos,
    pedidosInicialesCount,
    pedidosInicialesCajas,
    cargaExtra,
    productosDisponibles,
    origenProductosDisponibles,
    ventasRealizadas,
    movimientosDestino,
    cajasCargaExtraRuta,
    cantidadesEntrega,
    estadosEntrega,
    productosSeleccionadosPD,
    cantidadesPD,
    cantidadesVentaSelector,
    enModoVenta,
    rutaCerrada,
    cierreGenerado
  ]);

  // Reiniciar la ruta activa a su estado inicial
  const handleReiniciarRuta = () => {
    const confirmar = window.confirm(
      `¿Deseas reiniciar la ruta de ${vendedorActivo === 'vendedor-1' ? 'Vendedor 1' : 'Vendedor 2'} desde cero?\n\nSe restablecerán los pedidos pendientes y el stock del furgón para comenzar una nueva prueba.`
    );
    if (!confirmar) return;

    localStorage.removeItem(`jolyRutaActiva_${vendedorActivo}`);

    const defaultPedidos = vendedorActivo === 'vendedor-1'
      ? JSON.parse(JSON.stringify(PEDIDOS_INICIALES_VENDEDOR_1))
      : JSON.parse(JSON.stringify(PEDIDOS_INICIALES_VENDEDOR_2));

    const totalCajas = defaultPedidos.reduce((sum: number, ped: PedidoPP) => {
      return sum + ped.productos.reduce((s, it) => s + it.cajas, 0);
    }, 0);

    setPedidos(defaultPedidos);
    setPedidosInicialesCount(defaultPedidos.length);
    setPedidosInicialesCajas(totalCajas);
    setCargaExtra({});
    setProductosDisponibles({});
    setOrigenProductosDisponibles({});
    setVentasRealizadas([]);
    setMovimientosDestino([]);
    setCajasCargaExtraRuta(0);
    setCantidadesEntrega({});
    setEstadosEntrega({});
    setCantidadesVentaSelector({});
    setProductosSeleccionadosPD([]);
    setCantidadesPD({});
    setEnModoVenta(false);
    setRutaCerrada(false);
    setCierreGenerado(null);
    setSeccion('portada');

    alert('🔄 Ruta reiniciada con éxito.');
  };

  // Cajas totales que salieron = Cajas de pedidos PP iniciales + Carga extra cargada
  const cajasInicialesRuta = pedidosInicialesCajas + cajasCargaExtraRuta;

  // Helper universal de producto: NUNCA retorna undefined ni oculta cajas del furgón
  const getProductInfo = (prodId: string) => {
    // 1. Coincidencia exacta de ID
    const direct = PRODUCTS.find(p => p.id === prodId);
    if (direct) return direct;

    // 2. Coincidencia agregando o quitando prefijos 'ind-' o 'postre-'
    const prefijos = ['ind-', 'postre-'];
    for (const pref of prefijos) {
      const conPref = PRODUCTS.find(p => p.id === `${pref}${prodId}`);
      if (conPref) return conPref;
      if (prodId.startsWith(pref)) {
        const sinPref = PRODUCTS.find(p => p.id === prodId.replace(pref, ''));
        if (sinPref) return sinPref;
      }
    }

    // 3. Normalización de formato (ej: cas-1-8l vs cas-18l o cassata vs cassatta)
    const normId = prodId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const fuzzy = PRODUCTS.find(p => {
      const pNorm = p.id.replace(/[^a-z0-9]/gi, '').toLowerCase();
      return pNorm === normId || pNorm.includes(normId) || normId.includes(pNorm);
    });
    if (fuzzy) return fuzzy;

    // 4. Buscar en la lista de mock orders
    const todosLosMockItems = [
      ...PEDIDOS_INICIALES_VENDEDOR_1.flatMap(p => p.productos),
      ...PEDIDOS_INICIALES_VENDEDOR_2.flatMap(p => p.productos)
    ];
    const mockItem = todosLosMockItems.find(it => it.id === prodId);
    if (mockItem) {
      return {
        id: prodId,
        name: `${mockItem.producto}${mockItem.sabor ? ' - ' + mockItem.sabor : ''}`,
        boxPrice: mockItem.precio,
        unitsPerBox: 42,
        categoryId: 'helados',
        categoryName: 'Helados',
        imageFileName: '',
        hasPreservedPhoto: false
      };
    }

    // 5. Fallback seguro garantizado (nunca retorna null)
    return {
      id: prodId,
      name: prodId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      boxPrice: 9916,
      unitsPerBox: 42,
      categoryId: 'helados',
      categoryName: 'Helados',
      imageFileName: '',
      hasPreservedPhoto: false
    };
  };

  // Toggle vista precio
  const togglePrecioVisible = (key: string) => {
    setPreciosVisibles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDetallePedido = (pedidoId: string) => {
    setDetallesAbiertos(prev => ({ ...prev, [pedidoId]: !prev[pedidoId] }));
  };

  // Inicializar selector de cantidades de entrega para un pedido si no existe
  const getCantidadEntrega = (pedidoId: string, productoId: string, max: number): number => {
    if (cantidadesEntrega[pedidoId] && cantidadesEntrega[pedidoId][productoId] !== undefined) {
      return cantidadesEntrega[pedidoId][productoId];
    }
    return max;
  };

  const setCantidadEntregaItem = (pedidoId: string, productoId: string, cambio: number, max: number) => {
    const actual = getCantidadEntrega(pedidoId, productoId, max);
    let nuevo = actual + cambio;
    if (nuevo < 0) nuevo = 0;
    if (nuevo > max) nuevo = max;

    const nuevasCantidades = {
      ...(cantidadesEntrega[pedidoId] || {}),
      [productoId]: nuevo
    };

    setCantidadesEntrega(prev => ({
      ...prev,
      [pedidoId]: nuevasCantidades
    }));

    // Auto-determinar si el pedido pasa a Parcial, Cancelado o Entregado
    const ped = pedidos.find(p => p.id === pedidoId);
    if (ped) {
      let ent = 0;
      let pedidas = 0;
      ped.productos.forEach(it => {
        const c = it.id === productoId ? nuevo : (nuevasCantidades[it.id] !== undefined ? nuevasCantidades[it.id] : it.cajas);
        ent += c;
        pedidas += it.cajas;
      });

      const nuevoEstado: 'Entregado' | 'Parcial' | 'Cancelado' =
        ent === 0
          ? 'Cancelado'
          : ent === pedidas
            ? 'Entregado'
            : 'Parcial';

      setEstadosEntrega(prev => {
        const actualEstado = prev[pedidoId] || {
          estado: 'Entregado',
          pago: '',
          montoEfectivo: '',
          factura: ped.factura === 'SÍ' ? 'Entregada' : '—'
        };

        return {
          ...prev,
          [pedidoId]: {
            ...actualEstado,
            estado: nuevoEstado,
            pago: nuevoEstado === 'Cancelado' ? '—' : (actualEstado.pago === '—' ? '' : actualEstado.pago),
            factura: nuevoEstado === 'Cancelado' ? '—' : actualEstado.factura
          }
        };
      });
    }
  };

  const handleCambiarEstadoPedidoDropdown = (pedidoId: string, val: 'Entregado' | 'Parcial' | 'Cancelado') => {
    const ped = pedidos.find(p => p.id === pedidoId);
    if (!ped) return;

    if (val === 'Cancelado') {
      const ceroCantidades: Record<string, number> = {};
      ped.productos.forEach(it => {
        ceroCantidades[it.id] = 0;
      });
      setCantidadesEntrega(prev => ({
        ...prev,
        [pedidoId]: ceroCantidades
      }));

      setEstadosEntrega(prev => ({
        ...prev,
        [pedidoId]: {
          ...(prev[pedidoId] || {}),
          estado: 'Cancelado',
          pago: '—',
          montoEfectivo: '',
          factura: '—'
        }
      }));
    } else if (val === 'Entregado') {
      const maxCantidades: Record<string, number> = {};
      ped.productos.forEach(it => {
        maxCantidades[it.id] = it.cajas;
      });
      setCantidadesEntrega(prev => ({
        ...prev,
        [pedidoId]: maxCantidades
      }));

      setEstadosEntrega(prev => ({
        ...prev,
        [pedidoId]: {
          ...(prev[pedidoId] || {}),
          estado: 'Entregado',
          pago: prev[pedidoId]?.pago === '—' ? '' : (prev[pedidoId]?.pago || ''),
          factura: prev[pedidoId]?.factura === '—' ? (ped.factura === 'SÍ' ? 'Entregada' : '—') : (prev[pedidoId]?.factura || (ped.factura === 'SÍ' ? 'Entregada' : '—'))
        }
      }));
    } else {
      setEstadosEntrega(prev => ({
        ...prev,
        [pedidoId]: {
          ...(prev[pedidoId] || {}),
          estado: 'Parcial',
          pago: prev[pedidoId]?.pago === '—' ? '' : (prev[pedidoId]?.pago || ''),
          factura: prev[pedidoId]?.factura === '—' ? (ped.factura === 'SÍ' ? 'Entregada' : '—') : (prev[pedidoId]?.factura || (ped.factura === 'SÍ' ? 'Entregada' : '—'))
        }
      }));
    }
  };

  // Calcular totales en vivo para un pedido
  const calcularTotalesPedido = (pedido: PedidoPP) => {
    let cajasEntregadas = 0;
    let cajasPedidas = 0;
    let totalPesos = 0;

    pedido.productos.forEach(item => {
      const cant = getCantidadEntrega(pedido.id, item.id, item.cajas);
      cajasEntregadas += cant;
      cajasPedidas += item.cajas;
      totalPesos += cant * item.precio;
    });

    const estadoCalculado: 'Entregado' | 'Parcial' | 'Cancelado' =
      cajasEntregadas === 0
        ? 'Cancelado'
        : cajasEntregadas === cajasPedidas
          ? 'Entregado'
          : 'Parcial';

    return { cajasEntregadas, cajasPedidas, totalPesos, estadoCalculado };
  };

  // Guardar Pedido (PP)
  const handleGuardarPedido = (pedido: PedidoPP) => {
    const { cajasEntregadas, cajasPedidas, totalPesos, estadoCalculado } = calcularTotalesPedido(pedido);
    const estadoForm = estadosEntrega[pedido.id] || {
      estado: estadoCalculado,
      pago: '',
      montoEfectivo: '',
      factura: pedido.factura === 'SÍ' ? 'Entregada' : '—'
    };

    const estadoFinal = estadoForm.estado || estadoCalculado;
    const pagoFinal = estadoFinal === 'Cancelado' ? '—' : estadoForm.pago;

    if (estadoFinal !== 'Cancelado' && (!pagoFinal || pagoFinal === '—')) {
      alert('Selecciona una forma de pago antes de guardar.');
      return;
    }

    // 1. Si el pedido fue Cancelado o Parcial, liberamos las cajas no entregadas al cajón PD
    if (estadoFinal === 'Cancelado' || estadoFinal === 'Parcial') {
      const nuevasDisponibles = { ...productosDisponibles };
      const nuevosOrigenes = { ...origenProductosDisponibles };

      pedido.productos.forEach(item => {
        const cantEntregada = estadoFinal === 'Cancelado' ? 0 : getCantidadEntrega(pedido.id, item.id, item.cajas);
        const cantNoEntregada = item.cajas - cantEntregada;

        if (cantNoEntregada > 0) {
          nuevasDisponibles[item.id] = (nuevasDisponibles[item.id] || 0) + cantNoEntregada;

          if (!nuevosOrigenes[item.id]) {
            nuevosOrigenes[item.id] = [];
          }
          nuevosOrigenes[item.id].push({
            cantidad: cantNoEntregada,
            origen: estadoFinal === 'Cancelado' ? 'pedido-cancelado' : 'pedido-parcial',
            pedidoId: pedido.id
          });
        }
      });

      setProductosDisponibles(nuevasDisponibles);
      setOrigenProductosDisponibles(nuevosOrigenes);
    }

    // 2. Si fue Entregado o Parcial, registramos la venta de lo efectivamente entregado
    if (estadoFinal === 'Entregado' || estadoFinal === 'Parcial') {
      const productosEntregados = pedido.productos
        .map(item => {
          const cant = getCantidadEntrega(pedido.id, item.id, item.cajas);
          if (cant > 0) {
            return {
              id: item.id,
              producto: item.producto,
              sabor: item.sabor,
              cantidad: cant,
              precio: item.precio
            };
          }
          return null;
        })
        .filter(Boolean) as { id: string; producto: string; sabor: string; cantidad: number; precio: number }[];

      const efectivoNum = pagoFinal === 'Efectivo'
        ? totalPesos
        : pagoFinal === 'Efectivo + Transferencia'
          ? Number((estadoForm.montoEfectivo || '').replace(/\D/g, '')) || 0
          : 0;

      const transferenciaNum = pagoFinal === 'Transferencia'
        ? totalPesos
        : pagoFinal === 'Efectivo + Transferencia'
          ? Math.max(totalPesos - efectivoNum, 0)
          : 0;

      const nuevaVenta: VentaRealizada = {
        pedidoId: pedido.id,
        cliente: pedido.cliente,
        total: totalPesos,
        pago: pagoFinal,
        montoEfectivo: efectivoNum,
        montoTransferencia: transferenciaNum,
        factura: estadoForm.factura,
        productos: productosEntregados,
        fechaHora: new Date().toLocaleTimeString('es-CL')
      };

      setVentasRealizadas(prev => [...prev, nuevaVenta]);
    }

    // 3. Marcamos el pedido con su estado y lo removemos de la lista de pendientes
    const pedidoActualizado = {
      ...pedido,
      estadoPedido: estadoFinal,
      estadoPago: pagoFinal,
      estadoFactura: estadoForm.factura
    };

    // Actualizamos el historial de pedidos completados para auditoría
    setPedidos(prev => prev.filter(p => p.id !== pedido.id));
  };

  // Progreso de ruta de pedidos
  const pedidosPendientesCount = pedidos.length;
  const progresoPedidosPct = pedidosInicialesCount > 0
    ? Math.round(((pedidosInicialesCount - pedidosPendientesCount) / pedidosInicialesCount) * 100)
    : 0;

  // --- SECCIÓN VENTA DIRECTA (PD) ---
  const handleCambiarCargaExtra = (prodId: string, delta: number) => {
    setCargaExtra(prev => {
      const actual = prev[prodId] || 0;
      const nuevo = Math.max(0, actual + delta);
      return { ...prev, [prodId]: nuevo };
    });
  };

  const handleConfirmarCargaExtra = () => {
    let agregadas = 0;
    const nuevasDisponibles = { ...productosDisponibles };
    const nuevosOrigenes = { ...origenProductosDisponibles };

    Object.entries(cargaExtra).forEach(([prodId, cant]) => {
      if (cant > 0) {
        agregadas += cant;
        nuevasDisponibles[prodId] = (nuevasDisponibles[prodId] || 0) + cant;

        if (!nuevosOrigenes[prodId]) {
          nuevosOrigenes[prodId] = [];
        }
        nuevosOrigenes[prodId].push({
          cantidad: cant,
          origen: 'carga-extra'
        });
      }
    });

    setCajasCargaExtraRuta(prev => prev + agregadas);
    setProductosDisponibles(nuevasDisponibles);
    setOrigenProductosDisponibles(nuevosOrigenes);
    setCargaExtra({});
    setMostrarFormCargaExtra(false);
  };

  const handleQuitarCargaExtra = (prodId: string) => {
    const cant = productosDisponibles[prodId] || 0;
    if (cant <= 0) return;

    // Reducimos las cajas de carga extra
    setCajasCargaExtraRuta(prev => Math.max(0, prev - cant));

    setProductosDisponibles(prev => {
      const copia = { ...prev };
      delete copia[prodId];
      return copia;
    });

    setOrigenProductosDisponibles(prev => {
      const copia = { ...prev };
      delete copia[prodId];
      return copia;
    });

    // Limpiamos selecciones
    setProductosSeleccionadosPD(prev => prev.filter(id => id !== prodId));
    setCantidadesPD(prev => {
      const c = { ...prev };
      delete c[prodId];
      return c;
    });
  };

  const handleToggleSeleccionVenta = (prodId: string, disponible: number) => {
    if (productosSeleccionadosPD.includes(prodId)) {
      setProductosSeleccionadosPD(prev => prev.filter(id => id !== prodId));
      setCantidadesPD(prev => {
        const c = { ...prev };
        delete c[prodId];
        return c;
      });
    } else {
      setProductosSeleccionadosPD(prev => [...prev, prodId]);
      setCantidadesPD(prev => ({ ...prev, [prodId]: 1 }));
    }
  };

  const handleCambiarCantidadVentaSelector = (prodId: string, delta: number, disponible: number) => {
    setCantidadesVentaSelector(prev => {
      const actual = prev[prodId] || 1;
      let nuevo = actual + delta;
      if (nuevo < 1) nuevo = 1;
      if (nuevo > disponible) nuevo = disponible;
      return { ...prev, [prodId]: nuevo };
    });
  };

  // Cantidad de destino selector
  const handleCambiarCantidadDestino = (prodId: string, delta: number, disponible: number) => {
    setCantidadesDestino(prev => {
      const actual = prev[prodId] || 0;
      let nuevo = actual + delta;
      if (nuevo < 0) nuevo = 0;
      if (nuevo > disponible) nuevo = disponible;
      return { ...prev, [prodId]: nuevo };
    });
  };

  // Enviar a Destino (mover de Disponibles al panel de Destino)
  const handleEnviarADestino = (prodId: string) => {
    const aEnviar = cantidadesDestino[prodId] || 0;
    const disponible = productosDisponibles[prodId] || 0;

    if (aEnviar <= 0) {
      alert('Elige una cantidad mayor a 0 con los botones + y - para enviar a destino.');
      return;
    }
    if (aEnviar > disponible) {
      alert('La cantidad supera el stock disponible.');
      return;
    }

    const prod = getProductInfo(prodId);

    // Descontamos de productos disponibles
    setProductosDisponibles(prev => ({
      ...prev,
      [prodId]: prev[prodId] - aEnviar
    }));

    // Agregamos a la lista de destinos en proceso
    setDestinosEnProceso(prev => ({
      ...prev,
      [`${prodId}_${Date.now()}`]: {
        destino: '',
        motivo: '',
        nombreComp: '',
        comunaComp: '',
        rutComp: '',
        telefonoComp: ''
      }
    }));

    // Reset contador selector
    setCantidadesDestino(prev => ({ ...prev, [prodId]: 0 }));
  };

  // Deshacer destino (devolver a disponibles)
  const handleDeshacerDestinoEnProceso = (key: string, prodId: string, cantidad: number) => {
    setProductosDisponibles(prev => ({
      ...prev,
      [prodId]: (prev[prodId] || 0) + cantidad
    }));

    setDestinosEnProceso(prev => {
      const c = { ...prev };
      delete c[key];
      return c;
    });
  };

  // Confirmar Destino
  const handleConfirmarDestinoItem = (
    key: string,
    prodId: string,
    cantidad: number,
    precio: number,
    nombre: string
  ) => {
    const config = destinosEnProceso[key];
    if (!config || !config.destino) {
      alert('Selecciona un destino antes de enviar.');
      return;
    }

    if (config.destino === 'merma' && !config.motivo) {
      alert('Debes indicar el motivo de la merma antes de guardar.');
      return;
    }

    if (config.destino === 'compensacion') {
      if (!config.motivo) {
        alert('Debes indicar el tipo de compensación.');
        return;
      }
      if (!config.nombreComp.trim()) {
        alert('Debes ingresar el nombre y apellido para la compensación.');
        return;
      }
      if (!config.comunaComp.trim()) {
        alert('Debes ingresar la comuna para la compensación.');
        return;
      }
      if (!config.rutComp.trim()) {
        alert('Debes ingresar el RUT para la compensación.');
        return;
      }
      if (!config.telefonoComp.trim()) {
        alert('Debes ingresar el teléfono para la compensación.');
        return;
      }
    }

    const nuevoMov: MovimientoDestino = {
      id: prodId,
      nombre: nombre,
      cantidad: cantidad,
      precio: precio,
      destino: config.destino,
      motivo: config.motivo,
      aptoReventa: config.destino === 'sobrante',
      nombreCompensacion: config.nombreComp,
      comunaCompensacion: config.comunaComp,
      rutCompensacion: config.rutComp,
      telefonoCompensacion: config.telefonoComp
    };

    setMovimientosDestino(prev => [...prev, nuevoMov]);

    // Quitamos de destinos en proceso
    setDestinosEnProceso(prev => {
      const c = { ...prev };
      delete c[key];
      return c;
    });
  };

  // Preparar Venta Directa: sumar producto y cantidad al cajón de venta directa
  const handleVenderProductoDirecto = (prodId: string) => {
    const stockActual = productosDisponibles[prodId] || 0;
    if (stockActual <= 0) {
      alert('No quedan cajas disponibles de este producto.');
      return;
    }

    const cantidadDeseada = cantidadesVentaSelector[prodId] || 1;
    const aDescontar = Math.min(cantidadDeseada, stockActual);

    // 1. Descontar inmediatamente de productos disponibles (como en destino)
    setProductosDisponibles(prev => ({
      ...prev,
      [prodId]: prev[prodId] - aDescontar
    }));

    // 2. Sumar al cajón de venta directa (acumula si ya existía o agrega si es nuevo)
    setProductosSeleccionadosPD(prev => {
      if (prev.includes(prodId)) return prev;
      return [...prev, prodId];
    });

    setCantidadesPD(prev => ({
      ...prev,
      [prodId]: (prev[prodId] || 0) + aDescontar
    }));

    // 3. Reset selector en la tarjeta
    setCantidadesVentaSelector(prev => ({ ...prev, [prodId]: 1 }));

    // 4. Abrir y mantener visible el cajón de venta directa
    setEnModoVenta(true);
  };

  // Devolver un producto específico desde el cajón de venta a productos disponibles
  const handleDeshacerProductoVenta = (prodId: string) => {
    const cantADevolver = cantidadesPD[prodId] || 0;
    if (cantADevolver <= 0) return;

    // 1. Devolver cajas a productosDisponibles
    setProductosDisponibles(prev => ({
      ...prev,
      [prodId]: (prev[prodId] || 0) + cantADevolver
    }));

    // 2. Quitar del cajón de venta
    setProductosSeleccionadosPD(prev => prev.filter(id => id !== prodId));
    setCantidadesPD(prev => {
      const c = { ...prev };
      delete c[prodId];
      return c;
    });

    // Si ya no quedan productos en el cajón de venta, cerramos el formulario
    if (productosSeleccionadosPD.length <= 1) {
      setEnModoVenta(false);
    }
  };

  // Cancelar toda la venta (devuelve todos los productos acumulados a productos disponibles)
  const handleDeshacerVenta = () => {
    setProductosDisponibles(prev => {
      const copia = { ...prev };
      productosSeleccionadosPD.forEach(prodId => {
        const cant = cantidadesPD[prodId] || 0;
        copia[prodId] = (copia[prodId] || 0) + cant;
      });
      return copia;
    });

    setProductosSeleccionadosPD([]);
    setCantidadesPD({});
    setEnModoVenta(false);
  };

  const handlePrepararVenta = () => {
    if (productosSeleccionadosPD.length === 0) {
      alert('Selecciona al menos un producto disponible para vender.');
      return;
    }
    setEnModoVenta(true);
  };

  const handleRegistrarVentaDirecta = () => {
    if (!pagoVenta) {
      alert('Selecciona un medio de pago antes de registrar la venta.');
      return;
    }

    if (pagoVenta === 'Pendiente') {
      if (!clienteVenta.nombre.trim() || !clienteVenta.apellido.trim() || !clienteVenta.celular.trim()) {
        alert('Para registrar un pago pendiente debes ingresar nombre, apellido y celular del cliente.');
        return;
      }
    }

    let totalVentaPesos = 0;
    const productosVendidos = productosSeleccionadosPD.map(prodId => {
      const prod = getProductInfo(prodId);
      const cant = cantidadesPD[prodId] || 1;
      const precio = prod?.boxPrice || 0;
      totalVentaPesos += cant * precio;
      return {
        id: prodId,
        producto: prod?.name || prodId,
        sabor: '',
        cantidad: cant,
        precio: precio
      };
    });

    const tieneCliente = Boolean(
      clienteVenta.nombre || clienteVenta.apellido || clienteVenta.negocio || clienteVenta.sector || clienteVenta.direccion || clienteVenta.celular
    );

    const efNum = pagoVenta === 'Efectivo'
      ? totalVentaPesos
      : pagoVenta === 'Efectivo + Transferencia'
        ? Number((montoEfectivoVenta || '').replace(/\D/g, '')) || 0
        : 0;

    const trNum = pagoVenta === 'Transferencia'
      ? totalVentaPesos
      : pagoVenta === 'Efectivo + Transferencia'
        ? Math.max(totalVentaPesos - efNum, 0)
        : 0;

    const nuevaVenta: VentaRealizada = {
      cliente: tieneCliente
        ? { ...clienteVenta }
        : 'Venta al paso (sin registro)',
      tipoVenta: tieneCliente ? 'Venta con cliente' : 'Venta sin registro',
      total: totalVentaPesos,
      pago: pagoVenta,
      montoEfectivo: efNum,
      montoTransferencia: trNum,
      factura: facturaVenta,
      rut: rutFacturaVenta,
      estadoFactura: facturaVenta === 'Sí' ? estadoFacturaVenta : '—',
      productos: productosVendidos,
      fechaHora: new Date().toLocaleTimeString('es-CL')
    };

    // Registrar venta realizada (las cajas ya fueron descontadas de PD al agregarlas)
    setVentasRealizadas(prev => [...prev, nuevaVenta]);

    // Limpiar estado de venta
    setProductosSeleccionadosPD([]);
    setCantidadesPD({});
    setClienteVenta({ nombre: '', apellido: '', negocio: '', sector: '', direccion: '', celular: '' });
    setPagoVenta('');
    setMontoEfectivoVenta('');
    setFacturaVenta('No');
    setRutFacturaVenta('');
    setEnModoVenta(false);

    alert(`✅ Venta directa registrada por ${formatCLP(totalVentaPesos)}.`);
  };

  // Cajas disponibles totales actuales
  const totalCajasDisponibles = Object.values(productosDisponibles).reduce((a, b) => a + b, 0);

  // --- AUDITORÍA Y CIERRE DE RUTA (Tu función validarCierreRuta exacta) ---
  const validacionCierre = useMemo(() => {
    const errores: string[] = [];

    // 1. Cajas sin resolver
    let cajasVendidas = 0;
    ventasRealizadas.forEach(v => {
      v.productos.forEach(p => {
        cajasVendidas += Number(p.cantidad) || 0;
      });
    });

    let cajasDestino = 0;
    movimientosDestino.forEach(m => {
      cajasDestino += Number(m.cantidad) || 0;
    });

    const cajasResueltas = cajasVendidas + cajasDestino;
    const cajasSinResolver = cajasInicialesRuta - cajasResueltas;

    if (cajasSinResolver > 0) {
      errores.push(`Quedan ${cajasSinResolver} caja(s) sin resolver (sin destino asignado).`);
    }

    // 2. Destinos pendientes en proceso sin confirmar
    const destinosSinConfirmar = Object.keys(destinosEnProceso).length;
    if (destinosSinConfirmar > 0) {
      errores.push(`Tienes ${destinosSinConfirmar} movimiento(s) de destino en proceso sin presionar "ENVIAR".`);
    }

    // 3. Revisar movimientos de destino completados
    movimientosDestino.forEach((mov, idx) => {
      if (!mov.destino) errores.push(`Movimiento ${idx + 1}: falta el destino.`);
      if (mov.destino === 'merma' && !mov.motivo) errores.push(`Merma ${idx + 1}: falta el motivo.`);
      if (mov.destino === 'compensacion') {
        if (!mov.nombreCompensacion) errores.push(`Compensación ${idx + 1}: falta nombre y apellido.`);
        if (!mov.comunaCompensacion) errores.push(`Compensación ${idx + 1}: falta comuna.`);
        if (!mov.rutCompensacion) errores.push(`Compensación ${idx + 1}: falta RUT.`);
        if (!mov.telefonoCompensacion) errores.push(`Compensación ${idx + 1}: falta teléfono.`);
      }
    });

    // 4. Pedidos pendientes de visita sin atender
    if (pedidos.length > 0) {
      errores.push(`Aún quedan ${pedidos.length} pedido(s) pendientes de visitar en la lista de PP.`);
    }

    return {
      puedeCerrar: errores.length === 0,
      errores: errores,
      cajasVendidas,
      cajasDestino,
      cajasSinResolver: Math.max(0, cajasSinResolver)
    };
  }, [cajasInicialesRuta, ventasRealizadas, movimientosDestino, destinosEnProceso, pedidos]);

  // Cuadre de cajas para la vista de cierre
  const cajasSobrantesTotal = movimientosDestino.filter(m => m.destino === 'sobrante').reduce((s, m) => s + m.cantidad, 0);
  const cajasMermasTotal = movimientosDestino.filter(m => m.destino === 'merma').reduce((s, m) => s + m.cantidad, 0);
  const cajasCompensacionesTotal = movimientosDestino.filter(m => m.destino === 'compensacion').reduce((s, m) => s + m.cantidad, 0);

  // Recaudación
  const totalPedidosPesos = ventasRealizadas.filter(v => v.pedidoId).reduce((s, v) => s + v.total, 0);
  const totalVentaDirectaPesos = ventasRealizadas.filter(v => !v.pedidoId).reduce((s, v) => s + v.total, 0);
  const totalVendidoGeneral = totalPedidosPesos + totalVentaDirectaPesos;

  const totalEfectivo = ventasRealizadas.reduce((s, v) => s + v.montoEfectivo, 0);
  const totalTransferencia = ventasRealizadas.reduce((s, v) => s + v.montoTransferencia, 0);
  const totalRecaudadoReal = totalEfectivo + totalTransferencia;

  const totalCuentasPorCobrar = ventasRealizadas.filter(v => v.pago === 'Pendiente').reduce((s, v) => s + v.total, 0);
  const pendientesCobroCount = ventasRealizadas.filter(v => v.pago === 'Pendiente').length;

  const pctCajasResueltas = cajasInicialesRuta > 0
    ? Math.round(((cajasInicialesRuta - validacionCierre.cajasSinResolver) / cajasInicialesRuta) * 100)
    : 100;

  // Confirmar Cierre de Ruta
  const handleConfirmarCierreRuta = () => {
    if (!validacionCierre.puedeCerrar) {
      alert('La ruta aún no está lista para cerrar. Revisa las advertencias en pantalla.');
      return;
    }

    const confirmar = window.confirm('¿Estás segura de que quieres cerrar la ruta y enviarla a Administración?');
    if (!confirmar) return;

    const ahora = new Date();
    const idCierre = `CIERRE-${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}-${vendedorActivo.toUpperCase()}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}`;

    const registro: CierreRutaRecord = {
      idCierre,
      fecha: ahora.toLocaleDateString('es-CL'),
      hora: ahora.toLocaleTimeString('es-CL'),
      vendedor: vendedorActivo === 'vendedor-1' ? 'VENDEDOR 1' : 'VENDEDOR 2',
      vendedorId: vendedorActivo,
      resumen: {
        cajasIniciales: cajasInicialesRuta,
        cajasPedidosPP: pedidosInicialesCajas,
        cajasCargaExtra: cajasCargaExtraRuta,
        cajasVendidas: validacionCierre.cajasVendidas,
        sobrantes: cajasSobrantesTotal,
        mermas: cajasMermasTotal,
        compensaciones: cajasCompensacionesTotal,
        pendientesCobro: totalCuentasPorCobrar,
        totalVendido: totalVendidoGeneral,
        efectivo: totalEfectivo,
        transferencia: totalTransferencia
      },
      pedidos: [],
      ventasRealizadas: [...ventasRealizadas],
      productosDisponibles: { ...productosDisponibles },
      movimientosDestino: [...movimientosDestino],
      origenProductosDisponibles: { ...origenProductosDisponibles },
      cargaExtra: { ...cargaExtra },
      observaciones: observacionesCierre,
      auditoria: {
        puedeCerrar: true,
        errores: []
      }
    };

    // Guardar en localStorage
    const cierresExistentes = JSON.parse(localStorage.getItem('jolyCierresRuta') || '[]');
    cierresExistentes.push(registro);
    localStorage.setItem('jolyCierresRuta', JSON.stringify(cierresExistentes));

    setRutaCerrada(true);
    setCierreGenerado(registro);
    alert(`🎉 ¡Ruta cerrada y sellada con éxito!\n\nID de Cierre: ${idCierre}\nRegistrado para Administración.`);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-slate-800 pb-20 font-sans">
      {/* Barra superior institucional y selector de vendedor */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍦</span>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none">JOLY MAYORISTA</h1>
              <span className="text-[10px] font-bold text-sky-700 tracking-wider">PANEL DEL VENDEDOR</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch de Vendedor 1 y Vendedor 2 */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setVendedorActivo('vendedor-1')}
                className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  vendedorActivo === 'vendedor-1'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vendedor 1
              </button>
              <button
                type="button"
                onClick={() => setVendedorActivo('vendedor-2')}
                className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  vendedorActivo === 'vendedor-2'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vendedor 2
              </button>
            </div>

            <button
              type="button"
              onClick={handleReiniciarRuta}
              className="px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-200"
              title="Reiniciar ruta activa desde cero para una nueva prueba"
            >
              🔄 Reiniciar
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Volver a la tienda pública"
            >
              🏪 Tienda
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-xl mx-auto p-4">
        {/* LOGO CIRCULAR INSTITUCIONAL OFICIAL JOLY */}
        <div className="text-center my-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-white p-1 shadow-md border-2 border-sky-400 flex items-center justify-center overflow-hidden">
            <img
              src={JOLY_OFFICIAL_LOGO}
              alt="Distribuidora Mayorista Joly"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-wide">Panel del vendedor</p>
          <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-0.5 rounded-full bg-slate-200/80 text-slate-800 text-xs font-black">
            <span>👤</span>
            <span>{vendedorActivo === 'vendedor-1' ? 'VENDEDOR 1' : 'VENDEDOR 2'}</span>
          </div>
          <div className="block mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span>💾</span> Tu avance en ruta se guarda automáticamente
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VISTA 1: PORTADA / MENÚ HUB                                     */}
        {/* ============================================================== */}
        {seccion === 'portada' && (
          <div className="space-y-3 mt-6">
            <button
              type="button"
              onClick={() => setSeccion('pedidos')}
              className="w-full p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Pedidos pendientes</h3>
                  <p className="text-xs text-slate-500">
                    {pedidosPendientesCount === 1 ? '1 pedido pendiente' : `${pedidosPendientesCount} pedidos pendientes`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  {progresoPedidosPct}%
                </span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSeccion('venta')}
              className="w-full p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Venta directa</h3>
                  <p className="text-xs text-slate-500">
                    {totalCajasDisponibles === 1 ? '1 caja disponible' : `${totalCajasDisponibles} cajas disponibles`} (PD)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {totalCajasDisponibles} cajas
                </span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSeccion('cierre')}
              className="w-full p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏁</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Cierre de ruta</h3>
                  <p className="text-xs text-slate-500">
                    {validacionCierre.puedeCerrar ? '🟢 Lista para cerrar' : `⚠️ ${validacionCierre.cajasSinResolver} cajas sin resolver`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  validacionCierre.puedeCerrar ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {pctCajasResueltas}%
                </span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 2: PEDIDOS PENDIENTES (PP)                               */}
        {/* ============================================================== */}
        {seccion === 'pedidos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>📋</span> Pedidos pendientes
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {pedidosPendientesCount === 1 ? '1 pendiente' : `${pedidosPendientesCount} pendientes`}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>{pedidosPendientesCount} pedidos pendientes</span>
                <span>{progresoPedidosPct}% completado</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progresoPedidosPct}%` }}
                />
              </div>
            </div>

            {/* Encabezado # | CLIENTE | PEDIDO */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider">
              <span className="w-6">#</span>
              <span className="flex-1">Cliente</span>
              <span className="w-24 text-right">Pedido</span>
            </div>

            {/* Lista de pedidos */}
            {pedidos.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs space-y-2">
                <span className="text-3xl">🎉</span>
                <h4 className="font-extrabold text-slate-800">¡Todos los pedidos fueron visitados!</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Excelente trabajo en ruta. Revisa la Venta Directa si te quedaron cajas o ve directo al Cierre de Ruta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidos.map((pedido, index) => {
                  const estaAbierto = Boolean(detallesAbiertos[pedido.id]);
                  const { cajasEntregadas, cajasPedidas, totalPesos, estadoCalculado } = calcularTotalesPedido(pedido);
                  const estadoForm = estadosEntrega[pedido.id] || {
                    estado: estadoCalculado,
                    pago: '',
                    montoEfectivo: '',
                    factura: pedido.factura === 'SÍ' ? 'Entregada' : '—'
                  };

                  return (
                    <div key={pedido.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                      {/* Fila principal */}
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-sm font-black text-slate-400">{index + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <strong className="block text-sm font-bold text-slate-900 truncate">
                            👤 {pedido.cliente}
                          </strong>
                          <span className="text-xs text-slate-500 block truncate">
                            📍 {pedido.direccion}{pedido.sector ? `, ${pedido.sector}` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <strong className="block text-sm font-black text-slate-900">
                            {formatCLP(totalPesos)}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-semibold">Pedido</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleDetallePedido(pedido.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          {estaAbierto ? 'Ocultar detalle ▴' : 'Ver detalle ▾'}
                        </button>
                      </div>

                      {/* Detalle desplegable */}
                      {estaAbierto && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CLIENTE</span>
                              <strong className="text-slate-800">{pedido.cliente}</strong>
                              {pedido.negocio && <span className="block text-[11px] text-slate-500">🏪 {pedido.negocio}</span>}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DIRECCIÓN</span>
                              <span className="text-slate-700">📍 {pedido.direccion}</span>
                            </div>
                          </div>

                          {/* Tabla de productos en el pedido */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                              PRODUCTOS SOLICITADOS
                            </span>

                            <div className="space-y-2">
                              {pedido.productos.map(item => {
                                const cantActual = getCantidadEntrega(pedido.id, item.id, item.cajas);
                                const esEntregadoTotal = cantActual === item.cajas;
                                const esPrecioVisible = Boolean(preciosVisibles[`${pedido.id}_${item.id}`]);

                                return (
                                  <div key={item.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200">
                                    <input
                                      type="checkbox"
                                      checked={esEntregadoTotal}
                                      onChange={() => {
                                        const nuevo = esEntregadoTotal ? 0 : item.cajas;
                                        setCantidadesEntrega(prev => ({
                                          ...prev,
                                          [pedido.id]: {
                                            ...(prev[pedido.id] || {}),
                                            [item.id]: nuevo
                                          }
                                        }));
                                      }}
                                      className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                                    />

                                    {/* Botones - / + */}
                                    <button
                                      type="button"
                                      onClick={() => setCantidadEntregaItem(pedido.id, item.id, -1, item.cajas)}
                                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                                    >
                                      −
                                    </button>
                                    <span className="font-black text-slate-900 min-w-4 text-center">{cantActual}</span>
                                    <span className="text-slate-400">/ {item.cajas}</span>
                                    <button
                                      type="button"
                                      onClick={() => setCantidadEntregaItem(pedido.id, item.id, 1, item.cajas)}
                                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                                    >
                                      +
                                    </button>

                                    <span className="flex-1 font-bold text-slate-800 truncate ml-1">
                                      {item.producto}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => togglePrecioVisible(`${pedido.id}_${item.id}`)}
                                      className="text-xs text-sky-700 font-semibold hover:underline cursor-pointer"
                                    >
                                      {esPrecioVisible ? formatCLP(item.precio) : item.sabor}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
                              <span>TOTAL: {cajasEntregadas} Cajas</span>
                              <span className="text-sm font-black text-emerald-700">{formatCLP(totalPesos)}</span>
                            </div>
                          </div>

                          {/* Observaciones */}
                          {pedido.observaciones && (
                            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900">
                              <span className="font-bold block text-[10px] uppercase text-amber-700">
                                📝 NOTA / OBSERVACIÓN DEL CLIENTE (DESDE LA TIENDA):
                              </span>
                              <p className="mt-0.5 font-medium">{pedido.observaciones}</p>
                            </div>
                          )}

                          {/* Selectores de Cierre de Pedido */}
                          <div className="space-y-2 pt-1">
                            {/* Selector Estado del Pedido */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">ESTADO DEL PEDIDO</label>
                              <select
                                value={estadoForm.estado || estadoCalculado}
                                onChange={(e) => {
                                  const val = e.target.value as 'Entregado' | 'Parcial' | 'Cancelado';
                                  handleCambiarEstadoPedidoDropdown(pedido.id, val);
                                }}
                                className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                              >
                                <option value="Entregado">Entregado</option>
                                <option value="Parcial">Parcial</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                            </div>

                            {/* Selector Pago */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">FORMA DE PAGO</label>
                              <select
                                value={estadoForm.pago}
                                onChange={(e) => {
                                  const nuevoPago = e.target.value;
                                  setEstadosEntrega(prev => ({
                                    ...prev,
                                    [pedido.id]: {
                                      ...(prev[pedido.id] || {}),
                                      pago: nuevoPago,
                                      montoEfectivo: prev[pedido.id]?.montoEfectivo || '',
                                      estado: prev[pedido.id]?.estado || estadoCalculado,
                                      factura: prev[pedido.id]?.factura || (pedido.factura === 'SÍ' ? 'Entregada' : '—')
                                    }
                                  }));
                                }}
                                className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              >
                                <option value="">Seleccionar forma de pago...</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Efectivo + Transferencia">Efectivo + Transferencia</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="—">—</option>
                              </select>
                            </div>

                            {/* Si es Efectivo + Transferencia */}
                            {estadoForm.pago === 'Efectivo + Transferencia' && (
                              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 space-y-2 text-xs">
                                <div>
                                  <label className="font-bold text-sky-950 block text-[11px] mb-1">💵 MONTO EN EFECTIVO</label>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sky-900">$</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={estadoForm.montoEfectivo || ''}
                                      onChange={(e) => {
                                        const cleanDigits = e.target.value.replace(/\D/g, '');
                                        const formatted = cleanDigits ? Number(cleanDigits).toLocaleString('es-CL') : '';
                                        setEstadosEntrega(prev => ({
                                          ...prev,
                                          [pedido.id]: {
                                            ...(prev[pedido.id] || {}),
                                            montoEfectivo: formatted
                                          }
                                        }));
                                      }}
                                      placeholder="0"
                                      className="w-full h-8 px-2 bg-white border border-sky-300 rounded-lg font-bold"
                                    />
                                  </div>
                                </div>
                                <div className="text-xs font-bold text-sky-900">
                                  💳 TRANSFERENCIA:{' '}
                                  {formatCLP(
                                    Math.max(0, totalPesos - (Number((estadoForm.montoEfectivo || '').replace(/\D/g, '')) || 0))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Selector Factura */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">FACTURA</label>
                              <select
                                value={estadoForm.factura}
                                onChange={(e) => {
                                  setEstadosEntrega(prev => ({
                                    ...prev,
                                    [pedido.id]: {
                                      ...(prev[pedido.id] || {}),
                                      factura: e.target.value
                                    }
                                  }));
                                }}
                                className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              >
                                <option value="—">—</option>
                                <option value="Entregada">Entregada</option>
                                <option value="Pendiente">Pendiente</option>
                              </select>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 bg-slate-100 p-2 rounded-lg flex items-center justify-between">
                            <span>🧾 Factura solicitada por cliente:</span>
                            <strong className="text-slate-900">{pedido.factura}</strong>
                          </div>

                          {/* Advertencia si falta pago */}
                          {(estadoForm.estado || estadoCalculado) !== 'Cancelado' && (!estadoForm.pago || estadoForm.pago === '—') && (
                            <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-[11px] font-bold text-amber-900 text-center">
                              ⚠️ Selecciona una forma de pago arriba para poder guardar
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleGuardarPedido(pedido)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            ✓ Guardar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSeccion('portada')}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              ← Volver al panel
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 3: VENTA DIRECTA (PD)                                     */}
        {/* ============================================================== */}
        {seccion === 'venta' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>💰</span> VENTA DIRECTA
              </h2>
              <button
                type="button"
                onClick={() => setMostrarFormCargaExtra(!mostrarFormCargaExtra)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {mostrarFormCargaExtra ? 'Cerrar catálogo' : '+ Agregar carga extra'}
              </button>
            </div>

            {/* Modal / Acordeón para agregar carga extra */}
            {mostrarFormCargaExtra && (
              <div className="bg-white rounded-2xl border border-sky-200 p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  📦 Seleccionar Carga Extra del Furgón
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {PRODUCTS.map(prod => {
                    const cant = cargaExtra[prod.id] || 0;
                    return (
                      <div key={prod.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex-1 min-w-0 pr-2">
                          <strong className="block text-slate-900 truncate">{prod.name}</strong>
                          <span className="text-[11px] text-slate-500">{formatCLP(prod.boxPrice)} / caja</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCambiarCargaExtra(prod.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold flex items-center justify-center cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-black">{cant}</span>
                          <button
                            type="button"
                            onClick={() => handleCambiarCargaExtra(prod.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmarCargaExtra}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ✓ Confirmar carga
                </button>
              </div>
            )}

            {/* Cajón de Productos Disponibles */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="text-center">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  🛒 Productos disponibles
                </h3>
                <div className="mt-1">
                  <span className="text-2xl font-black text-slate-900">{totalCajasDisponibles}</span>
                  <span className="text-xs text-slate-500 ml-1 font-bold">
                    {totalCajasDisponibles === 1 ? 'caja disponible' : 'cajas disponibles'}
                  </span>
                </div>
              </div>

              {/* Lista de productos disponibles */}
              {totalCajasDisponibles === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No hay cajas disponibles en este momento.<br />
                  Agrega carga extra o se sumarán cajas de pedidos parciales/cancelados.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(productosDisponibles).map(([prodId, cant]) => {
                    if (cant <= 0) return null;
                    const prod = getProductInfo(prodId);

                    const estaSeleccionadoVenta = productosSeleccionadosPD.includes(prodId);
                    const cantVenta = cantidadesVentaSelector[prodId] || 1;
                    const cantDest = cantidadesDestino[prodId] || 0;
                    const esPrecioVisible = Boolean(preciosVisibles[`disp_${prodId}`]);

                    // Determinar origen para mostrarlo claro
                    const origenes = origenProductosDisponibles[prodId] || [];
                    const tieneLiberadoPP = origenes.some(o => o.origen === 'pedido-parcial' || o.origen === 'pedido-cancelado');
                    const tieneExtra = origenes.some(o => o.origen === 'carga-extra');
                    const etiquetaOrigen = tieneLiberadoPP
                      ? '🔄 Liberado de pedido PP'
                      : tieneExtra
                        ? '📦 Carga extra del camión'
                        : '📦 Stock disponible';

                    return (
                      <div key={prodId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 shadow-2xs">
                        {/* Fila superior: Cantidad de cajas, Nombre completo del producto y Precio */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                              {cant}
                            </span>
                            <div>
                              <strong className="block text-slate-900 font-extrabold text-sm leading-snug">
                                {prod.name}
                              </strong>
                              <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                                {etiquetaOrigen}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <button
                              type="button"
                              onClick={() => togglePrecioVisible(`disp_${prodId}`)}
                              className="text-xs text-sky-700 font-bold hover:underline cursor-pointer"
                            >
                              {esPrecioVisible ? formatCLP(prod.boxPrice) : 'Ver precio'}
                            </button>
                            <span className="text-[10px] text-slate-400 block font-medium">por caja</span>
                          </div>
                        </div>

                        {/* Fila inferior: Controles operativos (Venta Directa con botón directo VENDER, y Destino) */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs gap-2 flex-wrap">
                          {/* Control de Venta Directa con Botón Directo */}
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-xl shadow-2xs">
                            <span className="text-xs font-black text-emerald-950">🛒 Venta:</span>
                            <button
                              type="button"
                              onClick={() => handleCambiarCantidadVentaSelector(prodId, -1, cant)}
                              className="w-5 h-5 text-xs bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-950 rounded font-bold cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-xs font-black text-emerald-950 w-4 text-center">{cantVenta}</span>
                            <button
                              type="button"
                              onClick={() => handleCambiarCantidadVentaSelector(prodId, 1, cant)}
                              className="w-5 h-5 text-xs bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-950 rounded font-bold cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVenderProductoDirecto(prodId)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-xs cursor-pointer ml-1 flex items-center gap-1 active:scale-95 transition-all"
                              title="Sumar este producto a la venta directa"
                            >
                              <span>Vender</span>
                              <span>➔</span>
                            </button>
                          </div>

                          {/* Control Destino (Merma / Sobrante / Compensación) */}
                          <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-300 px-2 py-1.5 rounded-xl shadow-2xs">
                            <span className="text-[11px] font-bold text-amber-950">Destino:</span>
                            <button
                              type="button"
                              onClick={() => handleCambiarCantidadDestino(prodId, -1, cant)}
                              className="w-5 h-5 text-xs bg-white hover:bg-amber-100 border border-amber-300 text-amber-950 rounded font-bold cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-xs font-black text-amber-950 w-4 text-center">{cantDest}</span>
                            <button
                              type="button"
                              onClick={() => handleCambiarCantidadDestino(prodId, 1, cant)}
                              className="w-5 h-5 text-xs bg-white hover:bg-amber-100 border border-amber-300 text-amber-950 rounded font-bold cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEnviarADestino(prodId)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-xs cursor-pointer ml-1 shadow-2xs"
                              title="Enviar a destino (merma, compensación o sobrante)"
                            >
                              →
                            </button>
                          </div>

                          {/* Quitar Carga Extra */}
                          <button
                            type="button"
                            onClick={() => handleQuitarCargaExtra(prodId)}
                            className="w-7 h-7 flex items-center justify-center text-xs text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 ml-auto"
                            title="Quitar producto de carga extra"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FORMULARIO DE VENTA DIRECTA (Si presionó VENDER) */}
            {enModoVenta && (
              <div className="bg-white rounded-2xl border-2 border-emerald-500 p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    📝 REGISTRAR VENTA DIRECTA
                  </h3>
                  <button
                    type="button"
                    onClick={handleDeshacerVenta}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    ↩️ Cancelar venta
                  </button>
                </div>

                {/* Resumen productos a vender con TOTAL destacado y botón para devolver si se equivocó */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase">
                      PRODUCTOS EN EL CAJÓN DE VENTA ({productosSeleccionadosPD.length}):
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      (Puedes seguir sumando productos arriba)
                    </span>
                  </div>

                  {productosSeleccionadosPD.map(prodId => {
                    const prod = getProductInfo(prodId);
                    const cant = cantidadesPD[prodId] || 1;
                    return (
                      <div key={prodId} className="flex justify-between items-center text-slate-800 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeshacerProductoVenta(prodId)}
                            className="text-xs text-amber-600 hover:text-amber-800 font-bold px-2 py-0.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 cursor-pointer flex items-center gap-1"
                            title="Devolver este producto a disponibles"
                          >
                            <span>↩️</span>
                            <span>Devolver</span>
                          </button>
                          <div>
                            <strong className="block text-slate-900 font-bold text-xs">{prod.name}</strong>
                            <span className="text-[11px] text-slate-500">{cant} caja(s) × {formatCLP(prod.boxPrice || 0)}</span>
                          </div>
                        </div>
                        <strong className="text-emerald-700 font-black text-xs">{formatCLP((prod.boxPrice || 0) * cant)}</strong>
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-emerald-300 mt-1 shadow-2xs">
                    <span className="font-black text-slate-900 text-xs uppercase">💰 TOTAL VENTA DIRECTA:</span>
                    <strong className="text-base font-black text-emerald-700">
                      {formatCLP(
                        productosSeleccionadosPD.reduce((sum, id) => {
                          const p = getProductInfo(id);
                          return sum + (p.boxPrice || 0) * (cantidadesPD[id] || 1);
                        }, 0)
                      )}
                    </strong>
                  </div>
                </div>

                {/* Datos del cliente (Opcional si es al paso, Obligatorio si es Pendiente) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">DATOS DEL CLIENTE (Opcional al contado, obligatorio si es fiado):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre *"
                      value={clienteVenta.nombre}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, nombre: e.target.value })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Apellido *"
                      value={clienteVenta.apellido}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, apellido: e.target.value })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Negocio"
                      value={clienteVenta.negocio}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, negocio: e.target.value })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Comuna / Sector"
                      value={clienteVenta.sector}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, sector: e.target.value })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Dirección"
                      value={clienteVenta.direccion}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, direccion: e.target.value })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="tel"
                      placeholder="Celular *"
                      value={clienteVenta.celular}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, celular: formatChileanPhone(e.target.value) })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Forma de pago */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">FORMA DE PAGO *</label>
                  <select
                    value={pagoVenta}
                    onChange={(e) => setPagoVenta(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="">Seleccionar forma de pago...</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo + Transferencia">Efectivo + Transferencia</option>
                    <option value="Pendiente">Pendiente (Fiado / Por cobrar)</option>
                  </select>
                </div>

                {/* Si es mixto */}
                {pagoVenta === 'Efectivo + Transferencia' && (() => {
                  const totalVenta = productosSeleccionadosPD.reduce((sum, id) => {
                    const p = PRODUCTS.find(prod => prod.id === id);
                    return sum + (p?.boxPrice || 0) * (cantidadesPD[id] || 1);
                  }, 0);
                  const ef = Number((montoEfectivoVenta || '').replace(/\D/g, '')) || 0;
                  const tr = Math.max(0, totalVenta - ef);

                  return (
                    <div className="bg-sky-50 p-3 rounded-xl border border-sky-300 text-xs space-y-2">
                      <div className="flex justify-between items-center pb-1.5 border-b border-sky-200">
                        <span className="font-bold text-sky-950 uppercase text-[11px]">Total a cobrar:</span>
                        <strong className="text-sm font-black text-sky-950">{formatCLP(totalVenta)}</strong>
                      </div>

                      <div>
                        <label className="font-bold text-sky-950 block text-[11px] mb-1">💵 MONTO EN EFECTIVO RECIBIDO</label>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sky-900">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={montoEfectivoVenta}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              setMontoEfectivoVenta(digits ? Number(digits).toLocaleString('es-CL') : '');
                            }}
                            placeholder="0"
                            className="w-full h-8 px-2 bg-white border border-sky-300 rounded-lg font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-sky-200 flex justify-between items-center">
                        <span className="font-bold text-sky-900">💳 SALDO POR TRANSFERENCIA:</span>
                        <strong className="text-emerald-700 font-black text-xs">
                          {formatCLP(tr)}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Factura */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">¿FACTURA?</label>
                    <select
                      value={facturaVenta}
                      onChange={(e) => setFacturaVenta(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="No">No</option>
                      <option value="Sí">Sí</option>
                    </select>
                  </div>

                  {facturaVenta === 'Sí' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">RUT</label>
                      <input
                        type="text"
                        value={rutFacturaVenta}
                        onChange={(e) => setRutFacturaVenta(formatChileanRut(e.target.value))}
                        placeholder="11.222.333-4"
                        className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRegistrarVentaDirecta}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  REGISTRAR VENTA
                </button>
              </div>
            )}

            {/* SECCIÓN DESTINO DE LOS PRODUCTOS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider text-center">
                📋 Destino de los productos
              </h3>

              {Object.keys(destinosEnProceso).length === 0 && movimientosDestino.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No hay cajas enviadas a destino.<br />
                  Usa los botones + y → en "Productos disponibles" para asignar destino.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Movimientos en proceso de confirmación */}
                  {Object.entries(destinosEnProceso).map(([key, item]) => {
                    const prodId = key.substring(0, key.lastIndexOf('_')) || key.split('_')[0];
                    const prod = getProductInfo(prodId);

                    return (
                      <div key={key} className="bg-amber-50/70 border border-amber-300 rounded-xl p-3 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-900">{prod.name}</strong>
                          <button
                            type="button"
                            onClick={() => handleDeshacerDestinoEnProceso(key, prodId, 1)}
                            className="text-xs text-slate-500 hover:text-slate-800"
                            title="Deshacer y devolver a disponibles"
                          >
                            ↩️ Deshacer
                          </button>
                        </div>

                        {/* Selector Destino */}
                        <select
                          value={item.destino}
                          onChange={(e) => {
                            const val = e.target.value as 'sobrante' | 'merma' | 'compensacion' | '';
                            setDestinosEnProceso(prev => ({
                              ...prev,
                              [key]: { ...prev[key], destino: val }
                            }));
                          }}
                          className="w-full h-8 px-2 bg-white border border-amber-300 rounded-lg text-xs font-bold"
                        >
                          <option value="">Seleccionar Destino...</option>
                          <option value="sobrante">📦 Sobrante (vuelve a bodega)</option>
                          <option value="merma">🗑️ Merma</option>
                          <option value="compensacion">🎁 Compensación</option>
                        </select>

                        {/* Motivo Merma */}
                        {item.destino === 'merma' && (
                          <select
                            value={item.motivo}
                            onChange={(e) => {
                              setDestinosEnProceso(prev => ({
                                ...prev,
                                [key]: { ...prev[key], motivo: e.target.value }
                              }));
                            }}
                            className="w-full h-8 px-2 bg-white border border-red-300 rounded-lg text-xs"
                          >
                            <option value="">Motivo de la merma...</option>
                            <option value="daño-en-ruta">🚚 Daño en ruta</option>
                            <option value="producto-deteriorado">📦 Producto deteriorado</option>
                          </select>
                        )}

                        {/* Compensación */}
                        {item.destino === 'compensacion' && (
                          <div className="space-y-1.5 pt-1">
                            <select
                              value={item.motivo}
                              onChange={(e) => {
                                setDestinosEnProceso(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], motivo: e.target.value }
                                }));
                              }}
                              className="w-full h-8 px-2 bg-white border border-purple-300 rounded-lg text-xs"
                            >
                              <option value="">Tipo de compensación...</option>
                              <option value="regalo">🎁 Regalo comercial</option>
                              <option value="queja-cliente">😕 Queja de cliente</option>
                            </select>

                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="text"
                                placeholder="Nombre y apellido *"
                                value={item.nombreComp}
                                onChange={(e) => setDestinosEnProceso(prev => ({ ...prev, [key]: { ...prev[key], nombreComp: e.target.value } }))}
                                className="h-7 px-2 bg-white border border-purple-200 rounded text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Comuna *"
                                value={item.comunaComp}
                                onChange={(e) => setDestinosEnProceso(prev => ({ ...prev, [key]: { ...prev[key], comunaComp: e.target.value } }))}
                                className="h-7 px-2 bg-white border border-purple-200 rounded text-xs"
                              />
                              <input
                                type="text"
                                placeholder="RUT *"
                                value={item.rutComp}
                                onChange={(e) => setDestinosEnProceso(prev => ({ ...prev, [key]: { ...prev[key], rutComp: formatChileanRut(e.target.value) } }))}
                                className="h-7 px-2 bg-white border border-purple-200 rounded text-xs"
                              />
                              <input
                                type="tel"
                                placeholder="Teléfono *"
                                value={item.telefonoComp}
                                onChange={(e) => setDestinosEnProceso(prev => ({ ...prev, [key]: { ...prev[key], telefonoComp: formatChileanPhone(e.target.value) } }))}
                                className="h-7 px-2 bg-white border border-purple-200 rounded text-xs"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleConfirmarDestinoItem(key, prodId, 1, prod.boxPrice, prod.name)}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          ENVIAR
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSeccion('portada')}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              ← Volver al panel
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VISTA 4: CIERRE DE RUTA (Tu exacto Cierre de Ruta)             */}
        {/* ============================================================== */}
        {seccion === 'cierre' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>📦</span> CIERRE DE RUTA
              </h2>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                validacionCierre.puedeCerrar ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {validacionCierre.puedeCerrar ? '🟢 CUADRADA' : `⚠️ ${validacionCierre.cajasSinResolver} sin resolver`}
              </span>
            </div>

            {/* 1. CUADRE DE CAJAS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>📦</span> CUADRE DE CAJAS
              </h3>

              <div className={`p-3 rounded-xl border text-xs font-bold ${
                pctCajasResueltas === 100
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span>{pctCajasResueltas === 100 ? '✅' : '⚠️'} Cajas resueltas: {pctCajasResueltas}%</span>
                  <span>{cajasInicialesRuta - validacionCierre.cajasSinResolver} / {cajasInicialesRuta}</span>
                </div>
                <p className="text-[11px] font-normal mt-0.5">
                  {pctCajasResueltas === 100
                    ? 'Todas las cajas tienen destino asignado.'
                    : 'El sistema verificará que todas las cajas tengan destino antes de cerrar.'}
                </p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">📋 Pedidos (PP)</span>
                  <strong className="text-slate-900">{pedidosInicialesCajas}</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">💰 Carga extra</span>
                  <strong className="text-slate-900">{cajasCargaExtraRuta}</strong>
                </div>
                <div className="py-1.5 flex justify-between font-bold bg-slate-50 px-2 rounded">
                  <span className="text-slate-800">📦 Total que salió</span>
                  <strong className="text-slate-900">{cajasInicialesRuta}</strong>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">🛒 Cajas vendidas</span>
                  <strong className="text-slate-900">{validacionCierre.cajasVendidas}</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">📦 Sobrantes (bodega)</span>
                  <strong className="text-slate-900">{cajasSobrantesTotal}</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">⚠️ Mermas</span>
                  <strong className="text-slate-900">{cajasMermasTotal}</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">🎁 Compensaciones</span>
                  <strong className="text-slate-900">{cajasCompensacionesTotal}</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">💳 Pendientes de cobro</span>
                  <strong className="text-slate-900">{pendientesCobroCount}</strong>
                </div>

                <div className={`py-2 flex justify-between font-black px-2 rounded mt-1 ${
                  validacionCierre.cajasSinResolver === 0
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'bg-amber-100 text-amber-950'
                }`}>
                  <span>⚠️ Cajas sin resolver</span>
                  <span>{validacionCierre.cajasSinResolver}</span>
                </div>
              </div>
            </div>

            {/* 2. VENTAS Y RECAUDACIÓN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>💰</span> VENTAS Y RECAUDACIÓN
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">📋 Pedidos entregados</span>
                  <strong className="text-slate-900">{formatCLP(totalPedidosPesos)}</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">🛒 Venta directa</span>
                  <strong className="text-slate-900">{formatCLP(totalVentaDirectaPesos)}</strong>
                </div>
                <div className="py-2 flex justify-between font-black text-sm bg-slate-50 px-2 rounded">
                  <span className="text-slate-800">💰 TOTAL VENDIDO</span>
                  <strong className="text-emerald-700">{formatCLP(totalVendidoGeneral)}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  💰 RECAUDACIÓN REAL
                </span>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-1 flex justify-between">
                    <span className="text-slate-600">💵 Efectivo</span>
                    <strong className="text-slate-900">{formatCLP(totalEfectivo)}</strong>
                  </div>
                  <div className="py-1 flex justify-between">
                    <span className="text-slate-600">💳 Transferencia</span>
                    <strong className="text-slate-900">{formatCLP(totalTransferencia)}</strong>
                  </div>
                  <div className="py-1.5 flex justify-between font-bold bg-sky-50 px-2 rounded text-sky-950">
                    <span>TOTAL RECAUDADO</span>
                    <span>{formatCLP(totalRecaudadoReal)}</span>
                  </div>
                </div>
              </div>

              {/* CUENTAS POR COBRAR */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-black bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <span className="text-amber-900">💳 CUENTAS POR COBRAR</span>
                  <strong className="text-amber-950">{formatCLP(totalCuentasPorCobrar)}</strong>
                </div>

                {totalCuentasPorCobrar > 0 && (
                  <div className="mt-2 space-y-1 text-xs">
                    {ventasRealizadas.filter(v => v.pago === 'Pendiente').map((v, i) => {
                      const nombre = typeof v.cliente === 'string'
                        ? v.cliente
                        : `${v.cliente.nombre} ${v.cliente.apellido}`;
                      return (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200">
                          <div>
                            <span className="font-bold text-slate-800">▶ {nombre}</span>
                            {typeof v.cliente === 'object' && v.cliente.celular && (
                              <span className="text-[11px] text-slate-500 block">📱 {v.cliente.celular}</span>
                            )}
                          </div>
                          <strong className="text-amber-700">{formatCLP(v.total)}</strong>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. OBSERVACIONES Y BOTÓN DE CIERRE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>📝</span> OBSERVACIONES DE RUTA
              </h3>
              <textarea
                value={observacionesCierre}
                onChange={(e) => setObservacionesCierre(e.target.value)}
                placeholder="Escribe aquí cualquier información importante de la ruta para Administración..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />

              {/* Banner de estado de validación */}
              <div className={`p-3 rounded-xl text-xs font-bold ${
                validacionCierre.puedeCerrar
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-300 text-amber-950'
              }`}>
                {validacionCierre.puedeCerrar ? (
                  <span>🟢 La ruta está lista para cerrar. Todas las cajas y ventas están auditadas.</span>
                ) : (
                  <div className="space-y-1">
                    <span>⚠️ La ruta aún no está lista para cerrar:</span>
                    <ul className="list-disc pl-4 font-normal text-[11px] space-y-0.5">
                      {validacionCierre.errores.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmarCierreRuta}
                disabled={!validacionCierre.puedeCerrar || rutaCerrada}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📤</span>
                <span>{rutaCerrada ? '✅ RUTA CERRADA Y ENVIADA' : 'CERRAR RUTA Y ENVIAR A ADMINISTRACIÓN'}</span>
              </button>
            </div>

            {/* DATOS DE PRUEBA / JSON INSPECTOR (Tu bloque exacto para probar) */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 font-mono text-[11px] space-y-2">
              <span className="text-emerald-400 font-bold block">🧪 Inspector de Trazabilidad en Vivo:</span>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">Ventas realizadas ({ventasRealizadas.length})</summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(ventasRealizadas, null, 2)}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">Origen de productos PD</summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(origenProductosDisponibles, null, 2)}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">Movimientos de destino ({movimientosDestino.length})</summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(movimientosDestino, null, 2)}
                </pre>
              </details>
            </div>

            <button
              type="button"
              onClick={() => setSeccion('portada')}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              ← Volver al panel
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
