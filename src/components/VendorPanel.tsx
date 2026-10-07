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
  const [pedidosAtendidos, setPedidosAtendidos] = useState<{
    id: string;
    cliente: string;
    telefono?: string;
    rut?: string;
    cajasPedidas: number;
    cajasEntregadas: number;
    cajasLiberadasPD: number;
    estadoFinal: string;
    pago: string;
    factura: string;
    total: number;
  }[]>([]);

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

  // Modales in-app para evitar bloqueos de window.alert y window.confirm en iframes
  const [mostrarModalReiniciar, setMostrarModalReiniciar] = useState(false);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setToastMensaje(msg);
    setTimeout(() => {
      setToastMensaje(null);
    }, 3800);
  };

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
          setPedidosAtendidos(data.pedidosAtendidos || []);
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
        pedidosAtendidos,
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
    pedidosAtendidos,
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

  // Ejecutar el reinicio de la ruta activa a su estado inicial
  const ejecutarReinicioRuta = () => {
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
    setPedidosAtendidos([]);
    setCajasCargaExtraRuta(0);
    setCantidadesEntrega({});
    setEstadosEntrega({});
    setCantidadesVentaSelector({});
    setProductosSeleccionadosPD([]);
    setCantidadesPD({});
    setDestinosEnProceso({});
    setCantidadesDestino({});
    setFacturaVenta('No');
    setRutFacturaVenta('');
    setEstadoFacturaVenta('Entregada');
    setEnModoVenta(false);
    setRutaCerrada(false);
    setCierreGenerado(null);
    setObservacionesCierre('');
    setSeccion('portada');

    mostrarToast(`🔄 Ruta de ${vendedorActivo === 'vendedor-1' ? 'Vendedor 1' : 'Vendedor 2'} reiniciada desde cero.`);
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

      setEstadosEntrega(prev => {
        const actual = prev[pedidoId] || {};
        return {
          ...prev,
          [pedidoId]: {
            ...actual,
            estado: 'Entregado',
            pago: actual.pago === '—' ? '' : (actual.pago || ''),
            factura: actual.factura !== undefined && actual.factura !== '—'
              ? actual.factura
              : (ped.factura === 'SÍ' ? 'Pendiente' : '—')
          }
        };
      });
    } else {
      setEstadosEntrega(prev => {
        const actual = prev[pedidoId] || {};
        return {
          ...prev,
          [pedidoId]: {
            ...actual,
            estado: 'Parcial',
            pago: actual.pago === '—' ? '' : (actual.pago || ''),
            factura: actual.factura !== undefined && actual.factura !== '—'
              ? actual.factura
              : (ped.factura === 'SÍ' ? 'Pendiente' : '—')
          }
        };
      });
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
      factura: pedido.factura === 'SÍ' ? 'Pendiente' : '—'
    };

    const estadoFinal = estadoForm.estado || estadoCalculado;
    const pagoFinal = estadoFinal === 'Cancelado' ? '—' : estadoForm.pago;
    const facturaFinal = estadoFinal === 'Cancelado'
      ? '—'
      : (estadoForm.factura && estadoForm.factura !== '—'
          ? estadoForm.factura
          : (pedido.factura === 'SÍ' ? 'Pendiente' : '—'));

    if (estadoFinal !== 'Cancelado' && (!pagoFinal || pagoFinal === '—')) {
      mostrarToast('⚠️ Selecciona una forma de pago antes de guardar.');
      return;
    }

    // 1. Si hubo cajas no entregadas en el pedido, liberarlas SIEMPRE al cajón PD
    // (La realidad física del camión manda: si no se entregaron todas las cajas, la diferencia se queda en el furgón)
    const cajasNoEntregadas = cajasPedidas - cajasEntregadas;
    if (cajasNoEntregadas > 0 || estadoFinal === 'Cancelado') {
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
        cliente: {
          nombre: pedido.cliente,
          apellido: '',
          negocio: pedido.negocio || '',
          sector: pedido.sector || '',
          direccion: pedido.direccion || '',
          celular: pedido.telefono || ''
        },
        total: totalPesos,
        pago: pagoFinal,
        montoEfectivo: efectivoNum,
        montoTransferencia: transferenciaNum,
        factura: facturaFinal,
        rut: pedido.rut,
        estadoFactura: facturaFinal,
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
      estadoFactura: facturaFinal
    };

    // Actualizamos el historial de pedidos completados para auditoría
    setPedidosAtendidos(prev => [
      ...prev,
      {
        id: pedido.id,
        cliente: pedido.cliente,
        telefono: pedido.telefono,
        rut: pedido.rut,
        cajasPedidas,
        cajasEntregadas,
        cajasLiberadasPD: Math.max(0, cajasPedidas - cajasEntregadas),
        estadoFinal: estadoFinal,
        pago: pagoFinal,
        factura: facturaFinal,
        total: totalPesos
      }
    ]);

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
    const cantDisponible = productosDisponibles[prodId] || 0;
    if (cantDisponible <= 0) return;

    // Verificar desglose de orígenes
    const origenes = origenProductosDisponibles[prodId] || [];
    const cantExtra = origenes
      .filter(o => o.origen === 'carga-extra')
      .reduce((sum, o) => sum + o.cantidad, 0);

    if (cantExtra <= 0) {
      mostrarToast('⚠️ Este producto no tiene cajas de carga extra para quitar. Proviene de Preventa (PP) y debe resolverse en ruta.');
      return;
    }

    // Descontar únicamente las cajas de carga extra (sin tocar jamás las cajas de PP)
    const aQuitar = Math.min(cantDisponible, cantExtra);

    // Reducimos las cajas de carga extra del furgón
    setCajasCargaExtraRuta(prev => Math.max(0, prev - aQuitar));

    const nuevoDisponible = cantDisponible - aQuitar;

    setProductosDisponibles(prev => {
      const copia = { ...prev };
      if (nuevoDisponible <= 0) {
        delete copia[prodId];
      } else {
        copia[prodId] = nuevoDisponible;
      }
      return copia;
    });

    setOrigenProductosDisponibles(prev => {
      const copia = { ...prev };
      // Quitamos exclusivamente los orígenes de carga-extra de este producto
      const origenesRestantes = (copia[prodId] || []).filter(o => o.origen !== 'carga-extra');
      if (origenesRestantes.length === 0) {
        delete copia[prodId];
      } else {
        copia[prodId] = origenesRestantes;
      }
      return copia;
    });

    // Ajustar selectores si superan el nuevo disponible
    setCantidadesVentaSelector(prev => ({
      ...prev,
      [prodId]: Math.min(prev[prodId] || 0, nuevoDisponible)
    }));
    setCantidadesDestino(prev => ({
      ...prev,
      [prodId]: Math.min(prev[prodId] || 0, nuevoDisponible)
    }));

    mostrarToast(`↩️ ${aQuitar} caja(s) de carga extra de ${getProductInfo(prodId).name} devuelta(s) al catálogo.`);
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
      const actual = prev[prodId] || 0;
      let nuevo = actual + delta;
      if (nuevo < 0) nuevo = 0;
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
      mostrarToast('⚠️ Elige una cantidad mayor a 0 con los botones + y − para enviar a destino.');
      return;
    }
    if (aEnviar > disponible) {
      mostrarToast('⚠️ La cantidad supera el stock disponible en el furgón.');
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
      mostrarToast('⚠️ Selecciona un destino antes de enviar.');
      return;
    }

    if (config.destino === 'merma' && !config.motivo) {
      mostrarToast('⚠️ Debes indicar el motivo de la merma antes de guardar.');
      return;
    }

    if (config.destino === 'compensacion') {
      if (!config.motivo) {
        mostrarToast('⚠️ Debes indicar el tipo de compensación.');
        return;
      }
      if (!config.nombreComp.trim()) {
        mostrarToast('⚠️ Debes ingresar el nombre y apellido para la compensación.');
        return;
      }
      if (!config.comunaComp.trim()) {
        mostrarToast('⚠️ Debes ingresar la comuna para la compensación.');
        return;
      }
      if (!config.rutComp.trim()) {
        mostrarToast('⚠️ Debes ingresar el RUT para la compensación.');
        return;
      }
      if (!config.telefonoComp.trim()) {
        mostrarToast('⚠️ Debes ingresar el teléfono para la compensación.');
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
      mostrarToast('⚠️ No quedan cajas disponibles de este producto.');
      return;
    }

    const cantidadDeseada = cantidadesVentaSelector[prodId] || 0;
    if (cantidadDeseada <= 0) {
      mostrarToast('⚠️ Presiona "+" para indicar cuántas cajas vas a vender.');
      return;
    }

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

    // 3. Reset selector en la tarjeta a 0 (igual que destino)
    setCantidadesVentaSelector(prev => ({ ...prev, [prodId]: 0 }));

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
    setFacturaVenta('No');
    setRutFacturaVenta('');
    setEstadoFacturaVenta('Entregada');
    setEnModoVenta(false);
  };

  const handlePrepararVenta = () => {
    if (productosSeleccionadosPD.length === 0) {
      mostrarToast('⚠️ Selecciona al menos un producto disponible para vender.');
      return;
    }
    setEnModoVenta(true);
  };

  const handleRegistrarVentaDirecta = () => {
    if (!pagoVenta) {
      mostrarToast('⚠️ Selecciona un medio de pago antes de registrar la venta.');
      return;
    }

    if (pagoVenta === 'Pendiente') {
      if (!clienteVenta.nombre.trim() || !clienteVenta.apellido.trim() || !clienteVenta.celular.trim()) {
        mostrarToast('⚠️ Para registrar un pago pendiente debes ingresar nombre, apellido y celular del cliente.');
        return;
      }
    }

    if (facturaVenta === 'Sí') {
      const rutLimpio = rutFacturaVenta.trim().replace(/[^0-9kK]/g, '');
      if (!rutLimpio || rutLimpio.length < 8) {
        mostrarToast('⚠️ Para registrar factura debes ingresar un RUT de cliente válido.');
        return;
      }

      const tieneNombreONegocio = Boolean(clienteVenta.nombre.trim() || clienteVenta.negocio.trim());
      if (!tieneNombreONegocio) {
        mostrarToast('⚠️ Para registrar factura debes ingresar el Nombre o Negocio del cliente (no puede ser sin registro).');
        return;
      }

      if (estadoFacturaVenta === 'Pendiente' && !clienteVenta.celular.trim()) {
        mostrarToast('⚠️ Para factura pendiente debes ingresar el celular del cliente para enviársela por WhatsApp.');
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
    setEstadoFacturaVenta('Entregada');
    setEnModoVenta(false);

    mostrarToast(`✅ Venta directa registrada por ${formatCLP(totalVentaPesos)}.`);
  };

  // Cajas disponibles totales actuales
  const totalCajasDisponibles = Object.values(productosDisponibles).reduce((a, b) => a + b, 0);

  // --- AUDITORÍA Y CIERRE DE RUTA (Tu función validarCierreRuta exacta) ---
  const validacionCierre = useMemo(() => {
    const errores: { mensaje: string; modulo: 'pp' | 'pd' | 'destino' | 'general' }[] = [];

    // 1. Pedidos pendientes de visita en Preventa (PP)
    if (pedidos.length > 0) {
      const nombresPedidos = pedidos.map(p => `${p.cliente} (${p.productos.reduce((s, x) => s + x.cajas, 0)} cj)`).join(', ');
      errores.push({
        mensaje: `📋 Preventa (PP): Aún te queda(n) ${pedidos.length} pedido(s) por visitar: ${nombresPedidos}. Ve a la sección PP y registra si fue entregado, parcial o cancelado.`,
        modulo: 'pp'
      });
    }

    // 2. Cajas atrapadas en el cajón de venta directa sin confirmar
    const cajasEnBorrador = productosSeleccionadosPD.reduce((s, id) => s + (cantidadesPD[id] || 0), 0);
    if (cajasEnBorrador > 0) {
      errores.push({
        mensaje: `🛒 Venta Directa (PD): Tienes ${cajasEnBorrador} caja(s) apartadas en el borrador de venta sin presionar "REGISTRAR VENTA" ni cancelarla.`,
        modulo: 'pd'
      });
    }

    // 3. Cajas disponibles en furgón esperando resolución en PD
    const cajasDisponiblesSinAccion = Object.entries(productosDisponibles).filter(([_, c]) => c > 0);
    const totalCajasFisicasPD = cajasDisponiblesSinAccion.reduce((s, [_, c]) => s + c, 0);
    if (totalCajasFisicasPD > 0) {
      const detalleFisico = cajasDisponiblesSinAccion.map(([id, c]) => `${c} cj de ${getProductInfo(id).name}`).join(', ');
      errores.push({
        mensaje: `📦 Venta Directa (PD): Te quedan ${totalCajasFisicasPD} caja(s) físicas en el camión sin resolver (${detalleFisico}). Debes venderlas, asignarlas a Sobrante a bodega, Merma o Compensación.`,
        modulo: 'pd'
      });
    }

    // 4. Destinos pendientes en proceso sin presionar ENVIAR
    const destinosSinConfirmar = Object.keys(destinosEnProceso).length;
    if (destinosSinConfirmar > 0) {
      errores.push({
        mensaje: `⚠️ Destino en proceso: Tienes ${destinosSinConfirmar} producto(s) en la sección Destino sin presionar el botón "ENVIAR".`,
        modulo: 'destino'
      });
    }

    // 5. Revisar movimientos de destino completados
    movimientosDestino.forEach((mov, idx) => {
      if (!mov.destino) errores.push({ mensaje: `⚠️ Movimiento ${idx + 1}: falta definir el destino.`, modulo: 'destino' });
      if (mov.destino === 'merma' && !mov.motivo) errores.push({ mensaje: `⚠️ Merma de ${mov.nombre}: falta seleccionar el motivo del daño.`, modulo: 'destino' });
      if (mov.destino === 'compensacion') {
        if (!mov.nombreCompensacion) errores.push({ mensaje: `🎁 Compensación de ${mov.nombre}: falta nombre y apellido de quien recibe.`, modulo: 'destino' });
        if (!mov.comunaCompensacion) errores.push({ mensaje: `🎁 Compensación de ${mov.nombre}: falta comuna.`, modulo: 'destino' });
        if (!mov.rutCompensacion) errores.push({ mensaje: `🎁 Compensación de ${mov.nombre}: falta RUT.`, modulo: 'destino' });
        if (!mov.telefonoCompensacion) errores.push({ mensaje: `🎁 Compensación de ${mov.nombre}: falta teléfono.`, modulo: 'destino' });
      }
    });

    // 6. Cuadre matemático estricto de cajas (sin inventar cajas)
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

    if (cajasSinResolver > 0 && totalCajasFisicasPD === 0 && cajasEnBorrador === 0 && pedidos.length === 0) {
      errores.push({
        mensaje: `🚨 Descuadre en furgón: Faltan ${cajasSinResolver} caja(s) que salieron en furgón pero no figuran ni en ventas, ni en pedidos, ni en mermas/sobrantes. Debes registrar su destino real.`,
        modulo: 'general'
      });
    }

    return {
      puedeCerrar: errores.length === 0,
      errores: errores,
      cajasVendidas,
      cajasDestino,
      cajasSinResolver: Math.max(0, cajasSinResolver),
      cajasEnBorrador,
      totalCajasFisicasPD
    };
  }, [cajasInicialesRuta, ventasRealizadas, movimientosDestino, destinosEnProceso, pedidos, productosSeleccionadosPD, cantidadesPD, productosDisponibles]);

  // Cuadre de cajas para la vista de cierre
  const cajasSobrantesTotal = movimientosDestino.filter(m => m.destino === 'sobrante').reduce((s, m) => s + m.cantidad, 0);
  const cajasMermasTotal = movimientosDestino.filter(m => m.destino === 'merma').reduce((s, m) => s + m.cantidad, 0);
  const cajasCompensacionesTotal = movimientosDestino.filter(m => m.destino === 'compensacion').reduce((s, m) => s + m.cantidad, 0);

  // Cajas vendidas desglosadas por origen (Preventa PP vs Venta Directa PD)
  const cajasVendidasPP = useMemo(() => {
    return ventasRealizadas
      .filter(v => Boolean(v.pedidoId))
      .reduce((sum, v) => sum + v.productos.reduce((s, p) => s + (Number(p.cantidad) || 0), 0), 0);
  }, [ventasRealizadas]);

  const cajasVendidasPD = useMemo(() => {
    return ventasRealizadas
      .filter(v => !v.pedidoId)
      .reduce((sum, v) => sum + v.productos.reduce((s, p) => s + (Number(p.cantidad) || 0), 0), 0);
  }, [ventasRealizadas]);

  // Recaudación
  const totalPedidosPesos = ventasRealizadas.filter(v => v.pedidoId).reduce((s, v) => s + v.total, 0);
  const totalVentaDirectaPesos = ventasRealizadas.filter(v => !v.pedidoId).reduce((s, v) => s + v.total, 0);
  const totalVendidoGeneral = totalPedidosPesos + totalVentaDirectaPesos;

  const totalEfectivo = ventasRealizadas.reduce((s, v) => s + v.montoEfectivo, 0);
  const totalTransferencia = ventasRealizadas.reduce((s, v) => s + v.montoTransferencia, 0);
  const totalRecaudadoReal = totalEfectivo + totalTransferencia;

  const totalCuentasPorCobrar = ventasRealizadas.filter(v => v.pago === 'Pendiente').reduce((s, v) => s + v.total, 0);
  const pendientesCobroCount = ventasRealizadas.filter(v => v.pago === 'Pendiente').length;

  // Resumen de Facturas del día (PP y Ventas directas)
  const facturasResumen = useMemo(() => {
    const listado: {
      id?: string;
      cliente: string;
      negocio?: string;
      tipo: 'PP' | 'PD';
      origen: string;
      rut?: string;
      celular?: string;
      estado: 'Entregada' | 'Pendiente';
      monto: number;
    }[] = [];

    // Facturas de ventas directas (exclusivamente ventas directas, sin pedidoId de PP)
    ventasRealizadas.filter(v => !v.pedidoId).forEach(v => {
      const nombreCli = typeof v.cliente === 'string'
        ? v.cliente
        : `${v.cliente.nombre} ${v.cliente.apellido}`.trim() || v.cliente.negocio || 'Cliente Venta Directa';
      const negocioCli = typeof v.cliente === 'object' ? v.cliente.negocio : undefined;
      const celCli = typeof v.cliente === 'object' ? v.cliente.celular : undefined;

      if (v.factura === 'Sí' || v.estadoFactura === 'Pendiente' || v.estadoFactura === 'Entregada') {
        listado.push({
          cliente: nombreCli,
          negocio: negocioCli,
          tipo: 'PD',
          origen: 'Venta Directa (PD)',
          rut: v.rut,
          celular: celCli,
          estado: v.estadoFactura === 'Pendiente' ? 'Pendiente' : 'Entregada',
          monto: v.total
        });
      }
    });

    // Facturas de pedidos PP atendidos (solo pedidos con entrega real > 0, nunca cancelados)
    pedidosAtendidos.forEach(p => {
      if (p.estadoFinal !== 'Cancelado' && p.factura && p.factura !== '—' && p.factura !== 'NO' && p.factura !== 'No') {
        const pedOriginal = [...PEDIDOS_INICIALES_VENDEDOR_1, ...PEDIDOS_INICIALES_VENDEDOR_2].find(po => po.id === p.id);
        listado.push({
          id: p.id,
          cliente: p.cliente,
          negocio: pedOriginal?.negocio,
          tipo: 'PP',
          origen: `Preventa PP (${p.id})`,
          rut: p.rut,
          celular: p.telefono,
          estado: p.factura === 'Pendiente' ? 'Pendiente' : 'Entregada',
          monto: p.total
        });
      }
    });

    const pendientes = listado.filter(f => f.estado === 'Pendiente');
    const entregadas = listado.filter(f => f.estado === 'Entregada');

    return { listado, pendientes, entregadas };
  }, [ventasRealizadas, pedidosAtendidos]);

  const pctCajasResueltas = cajasInicialesRuta > 0
    ? Math.round(((cajasInicialesRuta - validacionCierre.cajasSinResolver) / cajasInicialesRuta) * 100)
    : 100;

  const cajasEnBorradorVenta = productosSeleccionadosPD.reduce((s, id) => s + (cantidadesPD[id] || 0), 0);

  // Asignar sobrante a bodega exclusivamente con cajas físicas reales que existen en el furgón
  const handleAutoResolverSobranteBodega = () => {
    // Si hay cajas en el borrador de venta directa, cancelarlo y devolverlas a disponibles
    if (productosSeleccionadosPD.length > 0) {
      handleDeshacerVenta();
    }

    const cajasFisicasDisponibles = Object.entries(productosDisponibles).filter(([_, c]) => c > 0);
    const totalFisico = cajasFisicasDisponibles.reduce((s, [_, c]) => s + c, 0);

    if (totalFisico <= 0) {
      mostrarToast('⚠️ No tienes cajas físicas en "Productos Disponibles" para enviar a bodega.');
      return;
    }

    const nuevosMovimientos: MovimientoDestino[] = [...movimientosDestino];
    const nuevasDisponibles = { ...productosDisponibles };
    let cajasMovidas = 0;

    for (const [prodId, cant] of cajasFisicasDisponibles) {
      if (cant > 0) {
        const prod = getProductInfo(prodId);
        nuevosMovimientos.push({
          id: prodId,
          nombre: prod.name,
          cantidad: cant,
          precio: prod.boxPrice || 9916,
          destino: 'sobrante',
          aptoReventa: true
        });
        nuevasDisponibles[prodId] = 0;
        cajasMovidas += cant;
      }
    }

    setProductosDisponibles(nuevasDisponibles);
    setMovimientosDestino(nuevosMovimientos);
    setDestinosEnProceso({});
    setCantidadesPD({});
    setProductosSeleccionadosPD([]);
    setEnModoVenta(false);

    mostrarToast(`📦 Se enviaron ${cajasMovidas} caja(s) físicas restantes a Sobrante de Bodega.`);
  };

  const ejecutarCierreRuta = () => {
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
    setMostrarModalCierre(false);
    mostrarToast(`🎉 ¡Ruta sellada con éxito! ID: ${idCierre}`);
  };

  // Confirmar Cierre de Ruta
  const handleConfirmarCierreRuta = () => {
    if (!validacionCierre.puedeCerrar) {
      mostrarToast('⚠️ La ruta aún no está lista para cerrar. Revisa las advertencias en pantalla.');
      return;
    }
    setMostrarModalCierre(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-slate-800 pb-32 sm:pb-20 font-sans">
      {/* Toast de notificación in-app (libre de bloqueos de alert en iframe) */}
      {toastMensaje && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] p-3.5 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center justify-between gap-2 border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-base">ℹ️</span>
            <span>{toastMensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMensaje(null)}
            className="text-slate-400 hover:text-white font-black text-sm px-1.5 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal in-app para Reiniciar Ruta (funciona 100% en iframe y celular con z-[9999]) */}
      {mostrarModalReiniciar && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border-2 border-rose-300">
            <div className="text-center">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 mb-2">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-base font-black text-slate-900">¿Reiniciar ruta de {vendedorActivo === 'vendedor-1' ? 'Vendedor 1' : 'Vendedor 2'}?</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Se restablecerán todos los pedidos pendientes, la carga extra y el stock en el furgón a su estado inicial para comenzar un nuevo ensayo limpio.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  ejecutarReinicioRuta();
                  setMostrarModalReiniciar(false);
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>Sí, reiniciar ruta ahora</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalReiniciar(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal in-app para Confirmar Cierre de Ruta */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border-2 border-emerald-300">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="text-base font-black text-slate-900">¿Cerrar y enviar ruta?</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                Se sellará el cierre de <strong>{vendedorActivo === 'vendedor-1' ? 'Vendedor 1' : 'Vendedor 2'}</strong> con todas las cajas y dineros auditados para Administración.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={ejecutarCierreRuta}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>📤</span>
                <span>Sí, cerrar y enviar a Administración</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalCierre(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Revisar más
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra superior institucional 100% optimizada para celulares y pantallas táctiles */}
      <header className="bg-white border-b border-slate-200 px-3 py-2.5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-xl mx-auto space-y-2">
          {/* Fila 1: Logo institucional + Botón Volver a la Tienda (destacado y amplio) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">🍦</span>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight tracking-wide">JOLY MAYORISTA</h1>
                <span className="text-[10px] font-bold text-sky-700 block tracking-wider">PANEL DEL VENDEDOR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToStore}
              className="px-3.5 py-2 text-xs font-black text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 active:scale-[0.98]"
              title="Volver al catálogo público de la tienda"
            >
              <span>🏪</span>
              <span>Volver a Tienda</span>
            </button>
          </div>

          {/* Fila 2: Selector Vendedor 1 / Vendedor 2 / Reiniciar en 3 columnas iguales */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => setVendedorActivo('vendedor-1')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px] ${
                vendedorActivo === 'vendedor-1'
                  ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>👤</span>
              <span>Vendedor 1</span>
            </button>

            <button
              type="button"
              onClick={() => setVendedorActivo('vendedor-2')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 min-h-[40px] ${
                vendedorActivo === 'vendedor-2'
                  ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>👤</span>
              <span>Vendedor 2</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarModalReiniciar(true)}
              className="py-2 px-1 rounded-xl text-xs font-black text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200 shadow-2xs flex items-center justify-center gap-1 min-h-[40px] active:scale-[0.98]"
              title="Reiniciar ruta activa desde cero para una nueva prueba"
            >
              <span>🔄</span>
              <span>Reiniciar</span>
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

            {/* Accesos rápidos de Portada para celulares y tablet */}
            <div className="pt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMostrarModalReiniciar(true)}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 font-black text-xs border border-rose-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span>🔄</span>
                <span>Reiniciar ruta</span>
              </button>

              <button
                type="button"
                onClick={onBackToStore}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-black text-xs border border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span>🏪</span>
                <span>Ir a Tienda</span>
              </button>
            </div>
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
                    factura: pedido.factura === 'SÍ' ? 'Pendiente' : '—'
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
                                  setEstadosEntrega(prev => {
                                    const actual = prev[pedido.id] || {};
                                    return {
                                      ...prev,
                                      [pedido.id]: {
                                        ...actual,
                                        pago: nuevoPago,
                                        montoEfectivo: actual.montoEfectivo || '',
                                        estado: actual.estado || estadoCalculado,
                                        factura: actual.factura !== undefined ? actual.factura : (pedido.factura === 'SÍ' ? 'Pendiente' : '—')
                                      }
                                    };
                                  });
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
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-600 block">FACTURA FISCAL</label>
                                {pedido.factura === 'SÍ' && (
                                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                                    Solicitada en Preventa {pedido.rut ? `(RUT: ${pedido.rut})` : ''}
                                  </span>
                                )}
                              </div>
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
                                className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                              >
                                <option value="Pendiente">⚠️ Pendiente (Administración debe emitir/enviar)</option>
                                <option value="Entregada">✓ Entregada (Entregada física en mano)</option>
                                <option value="—">— (No requiere factura)</option>
                              </select>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl flex items-center justify-between">
                            <span className="font-medium">🧾 Factura solicitada por cliente:</span>
                            <strong className="text-slate-900">{pedido.factura} {pedido.rut ? `• RUT: ${pedido.rut}` : ''}</strong>
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
                    const cantVenta = cantidadesVentaSelector[prodId] || 0;
                    const cantDest = cantidadesDestino[prodId] || 0;
                    const esPrecioVisible = Boolean(preciosVisibles[`disp_${prodId}`]);

                    // Determinar origen para mostrarlo claro (Opción B: Desglose nítido)
                    const origenes = origenProductosDisponibles[prodId] || [];
                    const cantPP = origenes
                      .filter(o => o.origen === 'pedido-parcial' || o.origen === 'pedido-cancelado')
                      .reduce((sum, o) => sum + o.cantidad, 0);
                    const cantExtra = origenes
                      .filter(o => o.origen === 'carga-extra')
                      .reduce((sum, o) => sum + o.cantidad, 0);

                    return (
                      <div key={prodId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 shadow-2xs">
                        {/* Fila superior: Cantidad de cajas, Nombre completo del producto y Precio */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="px-2 py-1 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 text-amber-950 font-black text-xs flex items-center gap-1 shrink-0 shadow-2xs" title="Cantidad total de cajas disponibles en el camión">
                              <span className="text-sm leading-none">📦</span>
                              <span className="text-sm font-extrabold">{cant}</span>
                              <span className="text-[10px] text-amber-800 font-semibold">{cant === 1 ? 'cj' : 'cjs'}</span>
                            </div>
                            <strong className="text-slate-900 font-extrabold text-sm leading-snug truncate">
                              {prod.name}
                            </strong>
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

                        {/* Desglose nítido de origen de las cajas (Opción B: comparten fila con ancho completo) */}
                        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
                          {cantPP > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md shadow-2xs shrink-0"
                              title="Cajas liberadas de pedidos PP (resolver en ruta)"
                            >
                              <span>🔄</span>
                              <span>{cantPP} {cantPP === 1 ? 'cj' : 'cjs'} PP</span>
                            </span>
                          )}
                          {cantExtra > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-900 bg-sky-100/90 border border-sky-300 px-2 py-0.5 rounded-md shadow-2xs shrink-0"
                              title="Cajas cargadas como carga extra del furgón"
                            >
                              <span>📦</span>
                              <span>{cantExtra} {cantExtra === 1 ? 'cj' : 'cjs'} Carga extra</span>
                            </span>
                          )}
                          {cantPP === 0 && cantExtra === 0 && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              📦 Stock disponible
                            </span>
                          )}
                        </div>

                        {/* Fila inferior: Controles operativos ordenados en 2 filas limpias */}
                        <div className="pt-2 border-t border-slate-200 text-xs space-y-1.5">
                          {/* Fila 1: Control de Venta Directa */}
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-xl shadow-2xs w-full">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-emerald-950">🛒 Venta:</span>
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidadVentaSelector(prodId, -1, cant)}
                                className="w-6 h-6 text-sm bg-white hover:bg-emerald-100 border border-emerald-300 text-black font-black rounded-lg cursor-pointer flex items-center justify-center active:scale-95 leading-none"
                              >
                                −
                              </button>
                              <span className="text-xs font-black text-black w-5 text-center">{cantVenta}</span>
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidadVentaSelector(prodId, 1, cant)}
                                className="w-6 h-6 text-sm bg-white hover:bg-emerald-100 border border-emerald-300 text-black font-black rounded-lg cursor-pointer flex items-center justify-center active:scale-95 leading-none"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleVenderProductoDirecto(prodId)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                              title="Sumar este producto a la venta directa"
                            >
                              <span>Vender</span>
                              <span>➔</span>
                            </button>
                          </div>

                          {/* Fila 2: Control Destino a la izquierda + Quitar extra / Resolver en ruta a la derecha */}
                          <div className="flex items-center justify-between gap-1 w-full">
                            {/* Control Destino (Merma / Sobrante / Compensación) */}
                            <div className="flex items-center gap-1 bg-amber-50/80 border border-amber-300 px-2 py-1 rounded-xl shadow-2xs shrink-0">
                              <span className="text-[11px] font-bold text-amber-950">Destino:</span>
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidadDestino(prodId, -1, cant)}
                                className="w-5 h-5 text-sm bg-white hover:bg-amber-100 border border-amber-300 text-black font-black rounded cursor-pointer flex items-center justify-center active:scale-95 leading-none"
                              >
                                −
                              </button>
                              <span className="text-xs font-black text-black w-4 text-center">{cantDest}</span>
                              <button
                                type="button"
                                onClick={() => handleCambiarCantidadDestino(prodId, 1, cant)}
                                className="w-5 h-5 text-sm bg-white hover:bg-amber-100 border border-amber-300 text-black font-black rounded cursor-pointer flex items-center justify-center active:scale-95 leading-none"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEnviarADestino(prodId)}
                                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-xs cursor-pointer ml-0.5 shadow-2xs"
                                title="Enviar a destino (merma, compensación o sobrante)"
                              >
                                →
                              </button>
                            </div>

                            {/* Quitar Carga Extra O Resolver en ruta compartiendo la misma fila sin desbordar */}
                            {cantExtra > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleQuitarCargaExtra(prodId)}
                                className="px-2 py-1 flex items-center gap-1 text-[10.5px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors shadow-2xs active:scale-95 shrink-0"
                                title={`Devolver ${cantExtra} caja(s) de carga extra al catálogo`}
                              >
                                <span>✕</span>
                                <span>Quitar extra ({cantExtra})</span>
                              </button>
                            ) : cantPP > 0 ? (
                              <span
                                className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-1 rounded-lg shrink-0 select-none shadow-2xs"
                                title="Proviene de pedido PP: debe resolverse en ruta"
                              >
                                🔒 Resolver en ruta
                              </span>
                            ) : null}
                          </div>
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

                {/* Datos del cliente (Opcional si es al paso, Obligatorio si es Pendiente o Factura) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      DATOS DEL CLIENTE {pagoVenta === 'Pendiente' || facturaVenta === 'Sí' ? '(OBLIGATORIO)' : '(OPCIONAL AL PASO)'}:
                    </span>
                    {(pagoVenta === 'Pendiente' || facturaVenta === 'Sí') && (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {facturaVenta === 'Sí' ? 'Requiere datos para factura' : 'Cobro pendiente'}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={`Nombre ${pagoVenta === 'Pendiente' || facturaVenta === 'Sí' ? '*' : ''}`}
                      value={clienteVenta.nombre}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, nombre: e.target.value })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder={`Apellido ${pagoVenta === 'Pendiente' ? '*' : ''}`}
                      value={clienteVenta.apellido}
                      onChange={(e) => setClienteVenta({ ...clienteVenta, apellido: e.target.value })}
                      className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Negocio / Razón Social"
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
                      placeholder={`Celular WhatsApp ${pagoVenta === 'Pendiente' || estadoFacturaVenta === 'Pendiente' ? '*' : ''}`}
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
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">¿FACTURA?</label>
                      <select
                        value={facturaVenta}
                        onChange={(e) => setFacturaVenta(e.target.value)}
                        className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                      >
                        <option value="No">No</option>
                        <option value="Sí">Sí</option>
                      </select>
                    </div>

                    {facturaVenta === 'Sí' && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">RUT CLIENTE</label>
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

                  {facturaVenta === 'Sí' && (
                    <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-amber-950 block">ESTADO DE FACTURA</label>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          estadoFacturaVenta === 'Entregada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {estadoFacturaVenta === 'Entregada' ? '✓ Entregada' : '⏳ Pendiente'}
                        </span>
                      </div>
                      <select
                        value={estadoFacturaVenta}
                        onChange={(e) => setEstadoFacturaVenta(e.target.value)}
                        className="w-full h-8 px-2 text-xs bg-white border border-amber-300 rounded-lg font-bold"
                      >
                        <option value="Entregada">Entregada (emitida y entregada en ruta)</option>
                        <option value="Pendiente">Pendiente (sin internet / enviar mañana por WhatsApp)</option>
                      </select>
                      {estadoFacturaVenta === 'Pendiente' && (
                        <p className="text-[10px] text-amber-800 font-medium leading-tight">
                          📲 Quedará registrada en Cierre de Ruta como <strong>Factura pendiente PD</strong> para que Administración la envíe.
                        </p>
                      )}
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

            {/* Panel Ejecutivo / Semáforo de Control Rápido para el Celular */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`p-2.5 rounded-2xl border shadow-2xs ${
                validacionCierre.puedeCerrar
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                  Cajas Furgón
                </span>
                <strong className="text-base font-black block mt-0.5">
                  {cajasInicialesRuta - validacionCierre.cajasSinResolver} / {cajasInicialesRuta}
                </strong>
                <span className="text-[10px] font-bold block mt-0.5">
                  {validacionCierre.puedeCerrar ? '✅ 100% resueltas' : `⚠️ ${validacionCierre.cajasSinResolver} faltantes`}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-sky-50/80 border border-sky-300 text-sky-950 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                  Recaudado
                </span>
                <strong className="text-base font-black block mt-0.5">
                  {formatCLP(totalRecaudadoReal)}
                </strong>
                <span className="text-[10px] font-bold text-sky-800 block mt-0.5">
                  💵 {ventasRealizadas.length} ventas
                </span>
              </div>

              <div className={`p-2.5 rounded-2xl border shadow-2xs ${
                totalCuentasPorCobrar > 0
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                  Por Cobrar
                </span>
                <strong className="text-base font-black block mt-0.5">
                  {formatCLP(totalCuentasPorCobrar)}
                </strong>
                <span className="text-[10px] font-bold block mt-0.5">
                  {pendientesCobroCount > 0 ? `💳 ${pendientesCobroCount} cliente(s)` : '✓ Al día'}
                </span>
              </div>
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
                  <span className="text-slate-600">📋 Cajas de Pedidos iniciales (PP)</span>
                  <div className="text-right">
                    <strong className="text-slate-900">{pedidosInicialesCajas} cajas</strong>
                    <span className="text-[10px] text-slate-400 block font-normal">({pedidosInicialesCount} pedidos asignados)</span>
                  </div>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">💰 Cajas de Carga extra cargadas</span>
                  <strong className="text-slate-900">{cajasCargaExtraRuta} cajas</strong>
                </div>
                <div className="py-1.5 flex justify-between font-bold bg-slate-100 px-2 rounded">
                  <span className="text-slate-800">📦 Total cajas que salieron en furgón</span>
                  <strong className="text-slate-900">{cajasInicialesRuta} cajas</strong>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">🛒 Cajas vendidas en ruta</span>
                  <strong className="text-slate-900">{validacionCierre.cajasVendidas} cajas</strong>
                </div>
                <div className="py-1 pl-4 flex justify-between text-[11px] text-slate-500 bg-slate-50/50">
                  <span>↳ Entregadas en {ventasRealizadas.filter(v => Boolean(v.pedidoId)).length} pedidos PP</span>
                  <strong className="text-slate-700">{cajasVendidasPP} cajas</strong>
                </div>
                <div className="py-1 pl-4 flex justify-between text-[11px] text-slate-500 bg-slate-50/50">
                  <span>↳ Vendidas en {ventasRealizadas.filter(v => !v.pedidoId).length} ventas directas (PD)</span>
                  <strong className="text-slate-700">{cajasVendidasPD} cajas</strong>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">📦 Cajas sobrantes a bodega</span>
                  <strong className="text-slate-900">{cajasSobrantesTotal} cajas</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">⚠️ Cajas en mermas</span>
                  <strong className="text-slate-900">{cajasMermasTotal} cajas</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">🎁 Cajas en compensaciones</span>
                  <strong className="text-slate-900">{cajasCompensacionesTotal} cajas</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">💳 Cuentas pendientes de cobro</span>
                  <strong className="text-slate-900">{pendientesCobroCount} cliente(s)</strong>
                </div>

                <div className={`py-2 flex justify-between font-black px-2 rounded mt-1 ${
                  validacionCierre.cajasSinResolver === 0
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'bg-amber-100 text-amber-950'
                }`}>
                  <span>⚠️ Cajas sin resolver</span>
                  <span>{validacionCierre.cajasSinResolver} cajas</span>
                </div>

                {/* Movimientos de ruta (Sobrante, Mermas, Compensaciones) */}
                {movimientosDestino.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      📋 Movimientos de ruta ({movimientosDestino.length})
                    </span>
                    <div className="space-y-1">
                      {movimientosDestino.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <div>
                            <span className="font-bold text-slate-800">
                              {m.destino === 'sobrante' && '📦 Sobrante'}
                              {m.destino === 'merma' && '🗑️ Merma'}
                              {m.destino === 'compensacion' && '🎁 Compensación'}
                            </span>
                            <span className="text-slate-600 font-medium ml-1">
                              — {m.motivo ? m.motivo : m.destino === 'sobrante' ? 'Apto para reventa' : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {m.nombre} ({m.cantidad} cj) {m.nombreCompensacion ? `• Para: ${m.nombreCompensacion}` : ''}
                            </span>
                          </div>
                          <strong className="text-slate-700 text-xs">{formatCLP(m.precio * m.cantidad)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 1.1 TRAZABILIDAD DE PEDIDOS Y VENTAS (PP atendidos, PD realizadas, Total ventas) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📊</span> TRAZABILIDAD DE OPERACIÓN
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  {ventasRealizadas.length} ventas registradas
                </span>
              </div>

              {/* Cuadros de trazabilidad: PP Atendidos, Cancelados, PD Realizadas y Total Ventas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                  <span className="text-[10px] font-extrabold text-sky-800 uppercase block">PP atendidos</span>
                  <strong className="text-base font-black text-sky-950 block">{pedidosAtendidos.length}</strong>
                  <span className="text-[10px] text-sky-700 font-bold block">{cajasVendidasPP} cajas</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase block">Cancelados</span>
                  <strong className="text-base font-black text-rose-950 block">
                    {pedidosAtendidos.filter(p => p.estadoFinal === 'Cancelado').length}
                  </strong>
                  <span className="text-[10px] text-rose-700 font-bold block">
                    {pedidosAtendidos.filter(p => p.estadoFinal === 'Cancelado').reduce((s, p) => s + p.cajasLiberadasPD, 0)} cj a PD
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">PD realizadas</span>
                  <strong className="text-base font-black text-emerald-950 block">{ventasRealizadas.filter(v => !v.pedidoId).length}</strong>
                  <span className="text-[10px] text-emerald-700 font-bold block">{cajasVendidasPD} cajas</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-extrabold text-purple-800 uppercase block">Total ventas</span>
                  <strong className="text-base font-black text-purple-950 block">{ventasRealizadas.length}</strong>
                  <span className="text-[10px] text-purple-700 font-bold block">{validacionCierre.cajasVendidas} cajas</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
                ✨ <strong>Trazabilidad limpia:</strong> Se visitaron <strong>{pedidosAtendidos.length} clientes PP</strong> ({cajasVendidasPP} cajas entregadas{pedidosAtendidos.filter(p => p.estadoFinal === 'Cancelado').length > 0 ? `, ${pedidosAtendidos.filter(p => p.estadoFinal === 'Cancelado').length} cancelado con cajas a PD` : ''}) y se efectuaron <strong>{ventasRealizadas.filter(v => !v.pedidoId).length} ventas directas PD</strong> ({cajasVendidasPD} cajas vendidas), totalizando exactamente <strong>{ventasRealizadas.length} ventas registradas</strong> con <strong>{validacionCierre.cajasVendidas} cajas vendidas</strong>.
              </div>
            </div>

            {/* 1.2 ESTADO DE PEDIDOS (PP) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>📋</span> ESTADO DE PEDIDOS
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {pedidosAtendidos.length} atendido(s)
                </span>
              </h3>

              {pedidosAtendidos.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  Aún no has atendido pedidos de preventa (PP).
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Pedidos completos */}
                  {(() => {
                    const completos = pedidosAtendidos.filter(p => p.estadoFinal === 'Entregado');
                    if (completos.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <span>🟢 Pedidos completos {completos.length}</span>
                        </div>
                        <div className="space-y-1 pl-1">
                          {completos.map(p => (
                            <div key={p.id} className="text-xs flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                              <span className="font-semibold text-slate-800">
                                {p.id} — {p.cliente}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {p.cajasEntregadas} cj • {formatCLP(p.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pedidos parciales */}
                  {(() => {
                    const parciales = pedidosAtendidos.filter(p => p.estadoFinal === 'Parcial');
                    if (parciales.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          <span>🟡 Pedidos parciales {parciales.length}</span>
                        </div>
                        <div className="space-y-1 pl-1">
                          {parciales.map(p => (
                            <div key={p.id} className="text-xs flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                              <div>
                                <span className="font-semibold text-slate-800 block">
                                  {p.id} — {p.cliente}
                                </span>
                                <span className="text-[10px] text-amber-700 block">
                                  Entregadas: {p.cajasEntregadas} de {p.cajasPedidas} ({p.cajasLiberadasPD} a PD)
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-700 font-bold">
                                {formatCLP(p.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pedidos cancelados */}
                  {(() => {
                    const cancelados = pedidosAtendidos.filter(p => p.estadoFinal === 'Cancelado');
                    if (cancelados.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-rose-900 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                          <span>🔴 Pedidos cancelados {cancelados.length}</span>
                        </div>
                        <div className="space-y-1 pl-1">
                          {cancelados.map(p => (
                            <div key={p.id} className="text-xs flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                              <div>
                                <span className="font-semibold text-slate-800 block">
                                  {p.id} — {p.cliente}
                                </span>
                                <span className="text-[10px] text-rose-700 block">
                                  {p.cajasLiberadasPD} caja(s) liberadas completas a PD
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">
                                Cancelado ($0)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 2. VENTAS Y RECAUDACIÓN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>💰</span> VENTAS Y RECAUDACIÓN
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-1.5 flex justify-between items-center">
                  <div>
                    <span className="text-slate-700 font-bold block">📋 Pedidos entregados</span>
                    <span className="text-[10px] text-slate-500">
                      {ventasRealizadas.filter(v => Boolean(v.pedidoId)).length} pedido(s) PP entregados ({cajasVendidasPP} cajas)
                    </span>
                  </div>
                  <strong className="text-slate-900">{formatCLP(totalPedidosPesos)}</strong>
                </div>
                <div className="py-1.5 flex justify-between items-center">
                  <div>
                    <span className="text-slate-700 font-bold block">🛒 Venta directa</span>
                    <span className="text-[10px] text-slate-500">
                      {ventasRealizadas.filter(v => !v.pedidoId).length} venta(s) PD realizadas ({cajasVendidasPD} cajas)
                    </span>
                  </div>
                  <strong className="text-slate-900">{formatCLP(totalVentaDirectaPesos)}</strong>
                </div>
                <div className="py-2 flex justify-between items-center font-black text-sm bg-slate-50 px-2 rounded">
                  <div>
                    <span className="text-slate-800 block">💰 TOTAL VENDIDO</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      {ventasRealizadas.length} ventas registradas ({ventasRealizadas.filter(v => Boolean(v.pedidoId)).length} PP + {ventasRealizadas.filter(v => !v.pedidoId).length} PD) • {validacionCierre.cajasVendidas} cajas vendidas
                    </span>
                  </div>
                  <strong className="text-emerald-700 text-base">{formatCLP(totalVendidoGeneral)}</strong>
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
                        : `${v.cliente.nombre} ${v.cliente.apellido}`.trim() || v.cliente.negocio || 'Cliente';
                      const celular = typeof v.cliente === 'object' && v.cliente.celular
                        ? v.cliente.celular
                        : pedidosAtendidos.find(p => p.id === v.pedidoId || p.cliente === nombre)?.telefono;

                      return (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200">
                          <div>
                            <span className="font-bold text-slate-800">▶ {nombre}</span>
                            {celular && (
                              <span className="text-[11px] text-sky-800 font-medium block">📱 {celular}</span>
                            )}
                          </div>
                          <strong className="text-amber-700">{formatCLP(v.total)}</strong>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN FACTURAS SOLICITADAS / PENDIENTES */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-black bg-sky-50 p-2 rounded-lg border border-sky-200">
                  <span className="text-sky-950 flex items-center gap-1.5">
                    <span>🧾</span> FACTURAS DEL DÍA
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                      Entregadas: {facturasResumen.entregadas.length}
                    </span>
                    <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                      Pendientes: {facturasResumen.pendientes.length}
                    </span>
                  </div>
                </div>

                {/* LISTADO DE FACTURAS PENDIENTES */}
                {facturasResumen.pendientes.length > 0 && (() => {
                  const pendientesPD = facturasResumen.pendientes.filter(f => f.tipo === 'PD');
                  const pendientesPP = facturasResumen.pendientes.filter(f => f.tipo === 'PP');

                  return (
                    <div className="mt-2.5 space-y-3">
                      {/* Facturas pendientes PP */}
                      {pendientesPP.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-black text-sky-900 flex items-center gap-1">
                            <span>📋</span> Facturas pendientes Preventa (PP) — {pendientesPP.length} cliente(s)
                          </span>
                          <div className="space-y-1.5">
                            {pendientesPP.map((f, i) => (
                              <div key={i} className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs space-y-0.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-slate-900 font-bold">
                                    <span>👤</span> <span>{f.cliente}</span>
                                    {f.negocio && <span className="text-[11px] text-slate-500 font-medium">({f.negocio})</span>}
                                  </div>
                                  <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                                    Pendiente envío
                                  </span>
                                </div>
                                {f.rut && (
                                  <div className="flex items-center gap-1 text-slate-700 font-medium text-[11px]">
                                    <span>🧾</span> <span>RUT: {f.rut}</span>
                                  </div>
                                )}
                                {f.celular && (
                                  <div className="flex items-center gap-1 text-sky-800 font-semibold text-[11px]">
                                    <span>📱</span> <span>WhatsApp: {f.celular}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-emerald-800 font-black pt-1 border-t border-amber-200/60 mt-1">
                                  <span className="text-[10px] text-slate-500 font-medium">📋 {f.origen}</span>
                                  <span className="text-xs">Total {formatCLP(f.monto)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Facturas pendientes PD */}
                      {pendientesPD.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
                            <span>🛒</span> Facturas pendientes Venta Directa (PD) — {pendientesPD.length} cliente(s)
                          </span>
                          <div className="space-y-1.5">
                            {pendientesPD.map((f, i) => (
                              <div key={i} className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs space-y-0.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-slate-900 font-bold">
                                    <span>👤</span> <span>{f.cliente}</span>
                                    {f.negocio && <span className="text-[11px] text-slate-500 font-medium">({f.negocio})</span>}
                                  </div>
                                  <span className="text-[10px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                                    Pendiente envío
                                  </span>
                                </div>
                                {f.rut && (
                                  <div className="flex items-center gap-1 text-slate-700 font-medium text-[11px]">
                                    <span>🧾</span> <span>RUT: {f.rut}</span>
                                  </div>
                                )}
                                {f.celular && (
                                  <div className="flex items-center gap-1 text-sky-800 font-semibold text-[11px]">
                                    <span>📱</span> <span>WhatsApp: {f.celular}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-emerald-800 font-black pt-1 border-t border-amber-200/60 mt-1">
                                  <span className="text-[10px] text-slate-500 font-medium">🛒 Venta Directa</span>
                                  <span className="text-xs">Total {formatCLP(f.monto)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* LISTADO DE FACTURAS ENTREGADAS CONFORME */}
                {facturasResumen.entregadas.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1">
                      <span>✓</span> Facturas entregadas conforme en ruta ({facturasResumen.entregadas.length})
                    </span>
                    <div className="space-y-1.5">
                      {facturasResumen.entregadas.map((f, i) => (
                        <div key={i} className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex justify-between items-center shadow-2xs">
                          <div>
                            <div className="flex items-center gap-1 text-slate-900 font-bold">
                              <span>👤 {f.cliente}</span>
                              {f.negocio && <span className="text-[11px] text-slate-500 font-medium">({f.negocio})</span>}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              {f.rut && <span>🧾 RUT: {f.rut}</span>}
                              <span>• {f.origen}</span>
                            </div>
                          </div>
                          <strong className="text-emerald-800 text-xs font-black shrink-0 ml-2">
                            {formatCLP(f.monto)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {facturasResumen.listado.length === 0 && (
                  <div className="mt-2 text-center py-2 text-[11px] text-slate-400 font-medium">
                    No se solicitaron facturas durante la ruta de hoy.
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
              <div className={`p-3.5 rounded-xl text-xs font-bold space-y-2.5 ${
                validacionCierre.puedeCerrar
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-300 text-amber-950'
              }`}>
                {validacionCierre.puedeCerrar ? (
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟢</span>
                    <span>La ruta está lista para cerrar. Todas las {cajasInicialesRuta} cajas y ventas están 100% auditadas.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <span>La ruta aún no está lista para cerrar:</span>
                    </div>
                    <div className="space-y-2">
                      {validacionCierre.errores.map((err, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-white border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="text-[11px] font-medium text-slate-800 leading-snug">
                            {err.mensaje}
                          </div>
                          {err.modulo === 'pp' && (
                            <button
                              type="button"
                              onClick={() => setSeccion('pedidos')}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] rounded-lg shrink-0 cursor-pointer shadow-2xs"
                            >
                              Ir a Preventa (PP) →
                            </button>
                          )}
                          {err.modulo === 'pd' && (
                            <button
                              type="button"
                              onClick={() => setSeccion('venta')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shrink-0 cursor-pointer shadow-2xs"
                            >
                              Ir a Venta Directa (PD) →
                            </button>
                          )}
                          {err.modulo === 'destino' && (
                            <button
                              type="button"
                              onClick={() => setSeccion('venta')}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg shrink-0 cursor-pointer shadow-2xs"
                            >
                              Ir a Destino →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Botones de acción rápida para resolver sin rodeos */}
                    <div className="pt-2 border-t border-amber-200/80 flex flex-col gap-2">
                      {cajasEnBorradorVenta > 0 && (
                        <button
                          type="button"
                          onClick={handleDeshacerVenta}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                        >
                          ↩️ Cancelar borrador de venta y devolver {cajasEnBorradorVenta} caja(s) a Disponibles
                        </button>
                      )}

                      {validacionCierre.totalCajasFisicasPD > 0 && (
                        <button
                          type="button"
                          onClick={handleAutoResolverSobranteBodega}
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>📦</span>
                          <span>Enviar las {validacionCierre.totalCajasFisicasPD} caja(s) físicas restantes a Sobrante de Bodega</span>
                        </button>
                      )}
                    </div>
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

              {/* Botón destacado para nuevo ensayo cuando la ruta ya está cerrada */}
              {rutaCerrada && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 text-center font-bold">
                    ✅ La ruta está sellada y archivada. ¿Deseas hacer otro ensayo o una nueva ruta?
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      ejecutarReinicioRuta();
                      mostrarToast(`🔄 Ruta de ${vendedorActivo === 'vendedor-1' ? 'Vendedor 1' : 'Vendedor 2'} reiniciada. ¡Listo para un nuevo ensayo!`);
                    }}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>🔄</span>
                    <span>REINICIAR RUTA Y COMENZAR NUEVO ENSAYO</span>
                  </button>
                </div>
              )}

              {/* Acciones auxiliares de cierre */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalReiniciar(true)}
                  className="py-2.5 px-2 bg-slate-100 hover:bg-rose-50 text-rose-700 hover:text-rose-900 border border-slate-200 hover:border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <span>🔄</span>
                  <span>Reiniciar ruta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSeccion('portada')}
                  className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <span>←</span>
                  <span>Volver al panel</span>
                </button>
              </div>
            </div>

            {/* DATOS DE PRUEBA / JSON INSPECTOR (Tu bloque exacto para probar) */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 font-mono text-[11px] space-y-2">
              <span className="text-emerald-400 font-bold block">🧪 Inspector de Trazabilidad en Vivo:</span>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">
                  📋 Pedidos PP atendidos ({pedidosAtendidos.length})
                </summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(pedidosAtendidos, null, 2)}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">
                  🛒 Ventas directas (PD) realizadas ({ventasRealizadas.filter(v => !v.pedidoId).length})
                </summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(ventasRealizadas.filter(v => !v.pedidoId), null, 2)}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">
                  💰 Todas las ventas registradas ({ventasRealizadas.length} = {ventasRealizadas.filter(v => Boolean(v.pedidoId)).length} PP + {ventasRealizadas.filter(v => !v.pedidoId).length} PD) • {validacionCierre.cajasVendidas} cajas
                </summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(ventasRealizadas, null, 2)}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">
                  🧾 Facturas del día ({facturasResumen.listado.length}: {facturasResumen.entregadas.length} entregadas, {facturasResumen.pendientes.length} pendientes)
                </summary>
                <div className="mt-1 p-2 bg-slate-950 rounded text-[10px] space-y-2">
                  <div>
                    <span className="text-emerald-400 font-bold block">✓ Entregadas ({facturasResumen.entregadas.length}):</span>
                    {facturasResumen.entregadas.length === 0 ? (
                      <span className="text-slate-500">Ninguna</span>
                    ) : (
                      <pre className="text-slate-300 overflow-x-auto">
                        {JSON.stringify(facturasResumen.entregadas, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-amber-400 font-bold block">⚠️ Pendientes ({facturasResumen.pendientes.length}):</span>
                    {facturasResumen.pendientes.length === 0 ? (
                      <span className="text-slate-500">Ninguna</span>
                    ) : (
                      <pre className="text-slate-300 overflow-x-auto">
                        {JSON.stringify(facturasResumen.pendientes, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </details>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">Productos disponibles en furgón ({totalCajasDisponibles} cajas)</summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(productosDisponibles, null, 2)}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">Cajón de venta en borrador ({cajasEnBorradorVenta} cajas)</summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify({ productosSeleccionadosPD, cantidadesPD, enModoVenta }, null, 2)}
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
              <details className="cursor-pointer">
                <summary className="text-slate-400 hover:text-white">Destinos en proceso ({Object.keys(destinosEnProceso).length})</summary>
                <pre className="mt-1 p-2 bg-slate-950 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(destinosEnProceso, null, 2)}
                </pre>
              </details>
            </div>

            {/* Navegación al final de la pantalla de cierre */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSeccion('portada')}
                className="py-3 bg-white hover:bg-slate-100 text-slate-800 font-black text-xs rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <span>←</span>
                <span>Volver al panel</span>
              </button>
              <button
                type="button"
                onClick={onBackToStore}
                className="py-3 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <span>🏪</span>
                <span>Ir a la Tienda</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Barra de acceso rápido fija inferior para celulares (100% visible con el pulgar) */}
      <nav aria-label="Navegación rápida de vendedor" className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-2xl sm:hidden">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <button
            type="button"
            onClick={onBackToStore}
            className="py-2 px-1 rounded-xl bg-slate-950 active:bg-slate-800 text-white font-black text-[11px] flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-xs"
          >
            <span className="text-base leading-none">🏪</span>
            <span>Tienda</span>
          </button>

          <button
            type="button"
            onClick={() => setVendedorActivo('vendedor-1')}
            className={`py-2 px-1 rounded-xl font-black text-[11px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
              vendedorActivo === 'vendedor-1'
                ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span className="text-base leading-none">👤</span>
            <span>Vend. 1</span>
          </button>

          <button
            type="button"
            onClick={() => setVendedorActivo('vendedor-2')}
            className={`py-2 px-1 rounded-xl font-black text-[11px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
              vendedorActivo === 'vendedor-2'
                ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span className="text-base leading-none">👤</span>
            <span>Vend. 2</span>
          </button>

          <button
            type="button"
            onClick={() => setMostrarModalReiniciar(true)}
            className="py-2 px-1 rounded-xl bg-rose-50 active:bg-rose-100 text-rose-700 font-black text-[11px] flex flex-col items-center justify-center gap-0.5 border border-rose-200 cursor-pointer shadow-2xs"
          >
            <span className="text-base leading-none">🔄</span>
            <span>Reiniciar</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
