import { PRODUCTS } from './catalog';
import { StockProductoUnificado, MovimientoInventario, RecepcionFacturaDoc } from '../types/inventory';

export const PROVEEDORES_DEMO: string[] = [
  'Helados San Francisco de Lonquén S.A.',
  'Frutos del Maipo Distribución SpA',
  'Alimentos Trendy Chile S.A.',
  'Lácteos y Postres del Sur SpA'
];

/**
 * Stock base inicial limpio para nueva ronda operativa de pruebas:
 * - Los 31 productos vigentes del catálogo JOLY intactos (nombres, categorías, unidades por caja y precios).
 * - 0 cajas en Bodega Central (listas para registrar recepción de facturas o inventario inicial de apertura).
 * - 0 cajas en Furgón 1.
 * - 0 cajas en Furgón 2.
 * - Total empresa: 0 cajas.
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
 * Stock inicial de la aplicación: 0 cajas en todas las ubicaciones
 */
export const INITIAL_STOCK_DEMO: StockProductoUnificado[] = STOCK_BASE_INICIAL_LIMPIO;

/**
 * Historial de movimientos limpio para nueva ronda de pruebas (0 registros de prueba ficticios)
 */
export const MOVIMIENTOS_INICIALES_DEMO: MovimientoInventario[] = [];

/**
 * Facturas registradas limpias para nueva ronda de pruebas (0 facturas de prueba)
 */
export const FACTURAS_DEMO: RecepcionFacturaDoc[] = [];
