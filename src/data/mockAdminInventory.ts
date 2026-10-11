import { PRODUCTS } from './catalog';
import { StockProductoUnificado, MovimientoInventario, RecepcionFacturaDoc } from '../types/inventory';

export const PROVEEDORES_DEMO: string[] = [
  'Helados San Francisco de Lonquén S.A.',
  'Frutos del Maipo Distribución SpA',
  'Alimentos Trendy Chile S.A.',
  'Lácteos y Postres del Sur SpA'
];

/**
 * Stock base limpio para inicio operativo real:
 * - Los 31 productos del catálogo vigentes.
 * - 0 cajas en Bodega Central (listas para registrar conteo físico real o inventario inicial de apertura).
 * - 0 cajas en Furgón 1.
 * - 0 cajas en Furgón 2.
 */
export const STOCK_BASE_INICIAL_LIMPIO: StockProductoUnificado[] = PRODUCTS.map((prod) => ({
  productId: prod.id,
  productName: prod.name,
  categoryName: prod.categoryName,
  unitsPerBox: prod.unitsPerBox,
  cajasBodega: 0,
  cajasAsignadasFurgon1: 0,
  cajasAsignadasFurgon2: 0,
  totalEmpresa: 0,
  stockMinimoAlerta: 10,
  ultimaActualizacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
  esDemo: false
}));

/**
 * Stock de demostración anterior (para pruebas visuales opcionales)
 */
export const INITIAL_STOCK_DEMO: StockProductoUnificado[] = PRODUCTS.map((prod, index) => {
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
      { productId: 'cas-1l-chirimoya-alegre', productName: 'Cassata 1 L - Chirimoya Alegre', cajas: 20 },
      { productId: 'postre-paleta-tunga', productName: 'Paleta Tunga', cajas: 25 }
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
    totalCajasRecibidas: 45,
    totalMontoNeto: 580000,
    confirmadaAt: '2026-10-08 09:15',
    confirmadaPor: 'María Paz',
    items: [
      {
        productId: 'cas-1l-chirimoya-alegre',
        productName: 'Cassata 1 L - Chirimoya Alegre',
        categoryName: 'Cassatas 1 L',
        unitsPerBox: 6,
        cajasFacturadas: 20,
        cajasRecibidasFisicas: 20,
        precioUnitarioCaja: 14536,
        observaciones: 'Llegó en perfecto estado de temperatura (-18°C)',
        matchStatus: 'coincidencia_exacta'
      },
      {
        productId: 'postre-paleta-tunga',
        productName: 'Paleta Tunga',
        categoryName: 'Postres y Especiales',
        unitsPerBox: 44,
        cajasFacturadas: 26,
        cajasRecibidasFisicas: 25,
        precioUnitarioCaja: 13467,
        observaciones: '1 caja rechazada por empaque deshecho en camión proveedor',
        matchStatus: 'coincidencia_exacta'
      }
    ],
    esDemo: true
  }
];
