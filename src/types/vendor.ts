import { Product } from './catalog';

export type VendedorId = 'vendedor-1' | 'vendedor-2';

export interface VendedorProfile {
  id: VendedorId;
  nombre: string;
  rutaDefecto: string;
}

export const VENDEDORES_DISPONIBLES: VendedorProfile[] = [
  { id: 'vendedor-1', nombre: 'VENDEDOR 1', rutaDefecto: 'Ruta Hualqui / Chiguayante' },
  { id: 'vendedor-2', nombre: 'VENDEDOR 2', rutaDefecto: 'Ruta San Pedro / Coronel' },
];

export interface PedidoProductoItem {
  id: string; // ID del producto oficial
  producto: string;
  sabor: string;
  cajas: number;
  precio: number; // Precio por caja
}

export interface PedidoPP {
  id: string;
  cliente: string;
  negocio?: string;
  direccion: string;
  sector?: string;
  telefono?: string;
  total: string;
  totalNumero: number;
  productos: PedidoProductoItem[];
  observaciones: string;
  factura: 'SÍ' | 'NO' | '—';
  estadoPedido?: 'Entregado' | 'Parcial' | 'Cancelado';
  estadoPago?: string;
  estadoFactura?: string;
}

export interface OrigenRegistro {
  cantidad: number;
  origen: 'carga-extra' | 'pedido-parcial' | 'pedido-cancelado';
  pedidoId?: string;
}

export interface VentaRealizadaItem {
  id: string;
  producto?: string;
  sabor?: string;
  cantidad: number;
  precio?: number;
}

export interface VentaRealizada {
  pedidoId?: string;
  cliente: string | {
    nombre: string;
    apellido: string;
    negocio: string;
    sector: string;
    direccion: string;
    celular: string;
  };
  tipoVenta?: 'Venta con cliente' | 'Venta sin registro';
  total: number;
  pago: string;
  montoEfectivo: number;
  montoTransferencia: number;
  factura?: string;
  rut?: string;
  estadoFactura?: string;
  productos: VentaRealizadaItem[];
  fechaHora?: string;
}

export interface MovimientoDestino {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  destino: 'sobrante' | 'merma' | 'compensacion';
  motivo?: string;
  aptoReventa: boolean;
  nombreCompensacion?: string;
  comunaCompensacion?: string;
  rutCompensacion?: string;
  telefonoCompensacion?: string;
}

export interface ResumenCierreRuta {
  cajasIniciales: number;
  cajasPedidosPP: number;
  cajasCargaExtra: number;
  cajasVendidas: number;
  sobrantes: number;
  mermas: number;
  compensaciones: number;
  pendientesCobro: number;
  totalVendido: number;
  efectivo: number;
  transferencia: number;
}

export interface CierreRutaRecord {
  idCierre: string;
  fecha: string;
  hora: string;
  vendedor: string;
  vendedorId: VendedorId;
  resumen: ResumenCierreRuta;
  pedidos: PedidoPP[];
  ventasRealizadas: VentaRealizada[];
  productosDisponibles: Record<string, number>;
  movimientosDestino: MovimientoDestino[];
  origenProductosDisponibles: Record<string, OrigenRegistro[]>;
  cargaExtra: Record<string, number>;
  observaciones?: string;
  auditoria: {
    puedeCerrar: boolean;
    errores: string[];
  };
}
