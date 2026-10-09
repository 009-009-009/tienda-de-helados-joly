export type MovimientoTipo = 
  | 'RECEPCION_FACTURA' 
  | 'INGRESO_MANUAL' 
  | 'ASIGNACION_FURGON' 
  | 'RETORNO_FURGON' 
  | 'AJUSTE_MERMA_BODEGA' 
  | 'AJUSTE_CONTEO_FISICO';

export type UbicacionStock = 
  | 'BODEGA_CENTRAL' 
  | 'FURGON_1' 
  | 'FURGON_2' 
  | 'PROVEEDOR' 
  | 'EXTERNO' 
  | 'MERMA' 
  | 'AJUSTE';

export interface ItemRecepcionFactura {
  productId: string;
  productName: string;
  categoryName: string;
  unitsPerBox: number;
  cajasFacturadas: number;
  cajasRecibidasFisicas: number;
  precioUnitarioCaja?: number;
  observaciones?: string;
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
  estado: 'borrador_revision' | 'confirmada_ingresada' | 'rechazada';
  items: ItemRecepcionFactura[];
  totalCajasFacturadas: number;
  totalCajasRecibidas: number;
  totalMontoNeto?: number;
  confirmadaAt?: string;
  confirmadaPor?: string;
  esDemo: boolean;
}

export interface IngresoManualDoc {
  id: string;
  fecha: string;
  tipoAjuste: 'ingreso_extraordinario' | 'ajuste_conteo' | 'devolucion_cliente' | 'merma_bodega';
  motivo: string;
  responsable: string;
  items: {
    productId: string;
    productName: string;
    cajas: number;
  }[];
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
