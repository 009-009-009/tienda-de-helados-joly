import { PRODUCTS } from './catalog';
import { StockProductoUnificado, MovimientoInventario, RecepcionFacturaDoc } from '../types/inventory';

export const PROVEEDORES_DEMO: string[] = [
  'Helados San Francisco de Lonquén S.A.',
  'Frutos del Maipo Distribución SpA',
  'Alimentos Trendy Chile S.A.',
  'Lácteos y Postres del Sur SpA'
];

/**
 * Stock inicial de demostración para Administración.
 * Claramente rotulado como [DEMO - Demostración] para no confundirse con datos reales.
 */
export const INITIAL_STOCK_DEMO: StockProductoUnificado[] = PRODUCTS.map((prod, index) => {
  // Asignar cantidades de prueba coherentes para el catálogo
  const cajasBodega = 25 + ((index * 7) % 35);
  const cajasFurgon1 = (index % 4 === 0) ? 4 : (index % 3 === 0) ? 2 : 0;
  const cajasFurgon2 = (index % 5 === 0) ? 3 : 0;
  const total = cajasBodega + cajasFurgon1 + cajasFurgon2;

  return {
    productId: prod.id,
    productName: prod.name,
    categoryName: prod.categoryName,
    unitsPerBox: prod.unitsPerBox,
    cajasBodega,
    cajasAsignadasFurgon1: cajasFurgon1,
    cajasAsignadasFurgon2: cajasFurgon2,
    totalEmpresa: total,
    stockMinimoAlerta: 10,
    ultimaActualizacion: '2026-10-08 14:30',
    esDemo: true
  };
});

/**
 * Historial inicial de movimientos de prueba
 */
export const MOVIMIENTOS_INICIALES_DEMO: MovimientoInventario[] = [
  {
    id: 'MOV-DEMO-001',
    fecha: '2026-10-08 09:15',
    tipo: 'RECEPCION_FACTURA',
    referenciaDoc: 'FAC-98402',
    descripcion: 'Recepción compra proveedor Frutos del Maipo (45 cj confirmadas)',
    responsable: 'María Paz (Bodega)',
    origen: 'PROVEEDOR',
    destino: 'BODEGA_CENTRAL',
    totalCajas: 45,
    items: [
      { productId: 'cassata-1l-chirimoya-alegre', productName: 'Cassata 1 L - Chirimoya Alegre', cajas: 20 },
      { productId: 'paleta-tunga-frambuesa', productName: 'Paleta Tunga Frambuesa', cajas: 25 }
    ],
    esDemo: true
  },
  {
    id: 'MOV-DEMO-002',
    fecha: '2026-10-08 07:30',
    tipo: 'ASIGNACION_FURGON',
    referenciaDoc: 'RUTA-F01-20261008',
    descripcion: 'Carga inicial despachada a Furgón 1 (Ruta Poniente)',
    responsable: 'Carlos Muñoz (Supervisor)',
    origen: 'BODEGA_CENTRAL',
    destino: 'FURGON_1',
    totalCajas: 33,
    items: [
      { productId: 'cassata-1l-chirimoya-alegre', productName: 'Cassata 1 L - Chirimoya Alegre', cajas: 4 },
      { productId: 'cassata-1l-frutilla', productName: 'Cassata 1 L - Frutilla', cajas: 6 }
    ],
    esDemo: true
  },
  {
    id: 'MOV-DEMO-003',
    fecha: '2026-10-07 18:00',
    tipo: 'RETORNO_FURGON',
    referenciaDoc: 'CIERRE-F01-20261007',
    descripcion: 'Retorno sobrante de ruta Furgón 1 apto para reventa',
    responsable: 'Carlos Muñoz (Supervisor)',
    origen: 'FURGON_1',
    destino: 'BODEGA_CENTRAL',
    totalCajas: 1,
    items: [
      { productId: 'cassata-1l-chirimoya-alegre', productName: 'Cassata 1 L - Chirimoya Alegre', cajas: 1 }
    ],
    esDemo: true
  }
];

/**
 * Facturas registradas de ejemplo en estado de demostración
 */
export const FACTURAS_DEMO: RecepcionFacturaDoc[] = [
  {
    id: 'REC-DEMO-20261008-01',
    numeroFactura: 'FAC-98402',
    proveedor: 'Frutos del Maipo Distribución SpA',
    fechaRecepcion: '2026-10-08',
    responsableRecepcion: 'María Paz (Bodega Central)',
    archivoNombre: 'Factura_98402_FrutosDelMaipo.pdf',
    archivoTipo: 'application/pdf',
    archivoTamano: '1.4 MB',
    estado: 'confirmada_ingresada',
    totalCajasFacturadas: 46,
    totalCajasRecibidas: 45, // 1 caja menos por merma en transporte del proveedor
    totalMontoNeto: 580000,
    confirmadaAt: '2026-10-08 09:15',
    confirmadaPor: 'María Paz',
    items: [
      {
        productId: 'cassata-1l-chirimoya-alegre',
        productName: 'Cassata 1 L - Chirimoya Alegre',
        categoryName: 'Cassatas 1 L',
        unitsPerBox: 6,
        cajasFacturadas: 20,
        cajasRecibidasFisicas: 20,
        precioUnitarioCaja: 13500,
        observaciones: 'Llegó en perfecto estado de temperatura (-18°C)'
      },
      {
        productId: 'paleta-tunga-frambuesa',
        productName: 'Paleta Tunga Frambuesa',
        categoryName: 'Helados Individuales',
        unitsPerBox: 24,
        cajasFacturadas: 26,
        cajasRecibidasFisicas: 25,
        precioUnitarioCaja: 11900,
        observaciones: '1 caja rechazada por empaque deshecho en camión proveedor'
      }
    ],
    esDemo: true
  }
];
