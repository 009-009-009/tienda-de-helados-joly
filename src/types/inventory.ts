export type MovimientoTipo = 
  | 'INVENTARIO_INICIAL_APERTURA'
  | 'RECEPCION_FACTURA' 
  | 'INGRESO_MANUAL' 
  | 'ASIGNACION_FURGON' 
  | 'RETORNO_FURGON' 
  | 'AJUSTE_MERMA_BODEGA' 
  | 'AJUSTE_CONTEO_FISICO'
  | 'INGRESO_EXTRAORDINARIO'
  | 'DEVOLUCION_EXTERNA';

export type UbicacionStock = 
  | 'BODEGA_CENTRAL' 
  | 'FURGON_1' 
  | 'FURGON_2' 
  | 'PROVEEDOR' 
  | 'EXTERNO' 
  | 'MERMA' 
  | 'AJUSTE'
  | 'APERTURA_INICIAL';

export type MatchStatusFactura = 
  | 'coincidencia_exacta' 
  | 'requiere_confirmacion' 
  | 'descontinuado' 
  | 'manual';

export interface ItemRecepcionFactura {
  productId: string;
  productName: string;
  categoryName: string;
  unitsPerBox: number;
  cajasFacturadas: number;
  cajasRecibidasFisicas: number;
  precioUnitarioCaja?: number;
  observaciones?: string;
  codigoProveedor?: string;
  nombreFacturaOriginal?: string;
  matchStatus?: MatchStatusFactura;
  descartado?: boolean;
}

export interface RecepcionFacturaDoc {
  id: string;
  numeroFactura: string;
  proveedor: string;
  fechaRecepcion: string;
  responsableRecepcion: string;
  archivoNombre?: string;
  archivoTipo?: string;
  archivoTamano?: string;
  estado: 'borrador_revision' | 'confirmada_ingresada' | 'rechazada' | 'modo_prueba_sin_stock';
  items: ItemRecepcionFactura[];
  totalCajasFacturadas: number;
  totalCajasRecibidas: number;
  totalMontoNeto?: number;
  confirmadaAt?: string;
  confirmadaPor?: string;
  esDemo: boolean;
  esModoPrueba?: boolean;
}

export type TipoAjusteManual = 
  | 'inventario_inicial'
  | 'ajuste_conteo'
  | 'ingreso_extraordinario'
  | 'devolucion_externa'
  | 'merma_bodega'
  | 'reversion_movimientos';

export interface ItemAjusteManual {
  productId: string;
  productName: string;
  cajas: number;
  stockPrevio?: number;
  stockNuevo?: number;
}

export interface IngresoManualDoc {
  id: string;
  fecha: string;
  tipoAjuste: TipoAjusteManual;
  motivo: string;
  responsable: string;
  items: ItemAjusteManual[];
  esDemo: boolean;
}

export interface MovimientoInventario {
  id: string;
  fecha: string;
  tipo: MovimientoTipo;
  referenciaDoc: string; // Ej: "FAC-98402" o "AJUSTE-MANUAL-004"
  descripcion: string;
  responsable: string;
  origen: UbicacionStock;
  destino: UbicacionStock;
  totalCajas: number;
  items: {
    productId: string;
    productName: string;
    cajas: number;
  }[];
  esDemo: boolean;
}

export interface StockProductoUnificado {
  productId: string;
  productName: string;
  categoryName: string;
  unitsPerBox: number;
  cajasBodega: number;          // Stock disponible en cámaras centrales
  cajasAsignadasFurgon1: number; // Cajas cargadas en Furgón 1
  cajasAsignadasFurgon2: number; // Cajas cargadas en Furgón 2
  totalEmpresa: number;          // Bodega + Furgón 1 + Furgón 2
  stockMinimoAlerta: number;
  ultimaActualizacion: string;
  esDemo: boolean;
}
