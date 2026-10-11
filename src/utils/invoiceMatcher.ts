import { PRODUCTS, CatalogProduct } from '../data/catalog';
import { ItemRecepcionFactura, MatchStatusFactura } from '../types/inventory';

// Función para normalizar cadenas: minúsculas, sin tildes ni caracteres especiales
export function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Mapa de alias y sinónimos comunes de proveedores hacia los IDs de los 31 productos JOLY
const KNOWN_ALIASES: Record<string, string[]> = {
  'cas-1l-crema-frambuesa': ['cassata 1 l crema frambuesa', 'cassata 1l crema frambuesa', 'cassata frambuesa 1l', 'cassata crema frambuesa', 'crema frambuesa 1l', 'frambuesa 1 litro'],
  'cas-1l-frutos-del-bosque': ['cassata 1 l frutos del bosque', 'cassata 1l frutos del bosque', 'frutos del bosque 1l', 'frutos bosque 1l', 'cassata frutos bosque'],
  'cas-1l-chirimoya-alegre': ['cassata 1 l chirimoya alegre', 'cassata 1l chirimoya alegre', 'chirimoya alegre 1l', 'cassata chirimoya 1l', 'chirimoya alegre 1 litro'],
  'cas-1l-pina': ['cassata 1 l pina', 'cassata 1l pina', 'cassata pina 1l', 'cassata 1l pina', 'pina 1 litro'],
  'cas-1l-tradicional': ['cassata 1 l tradicional', 'cassata 1l tradicional', 'tradicional 1l', 'cassata tradicional 1l'],
  'cas-1l-trisabor': ['cassata 1 l trisabor', 'cassata 1l trisabor', 'trisabor 1l', 'cassata trisabor 1l'],
  'cas-18l-choco-menta-3leches': ['cassata 1 8 l chocolate menta chips 3 leches', 'cassata 1 8l chocolate menta', 'choco menta 3 leches', 'menta chips 1 8l', 'cassata menta 1 8', 'tres leches menta 1 8l'],
  'cas-18l-cassata': ['cassata 1 8 l cassata', 'cassata 1 8l cassata', 'cassata 1 8l tradicional', 'cassata familiar 1 8'],
  'cas-18l-trisabor': ['cassata 1 8 l trisabor', 'cassata 1 8l trisabor', 'trisabor 1 8l', 'trisabor 1 8 litro'],
  'cas-18l-pina': ['cassata 1 8 l pina', 'cassata 1 8l pina', 'pina 1 8l', 'cassata pina 1 8 litro'],
  'ind-lyn-naranja': ['lyn naranja', 'paleta lyn naranja', 'helado lyn naranja', 'lyn naranja agua'],
  'ind-lyn-frutilla': ['lyn frutilla', 'paleta lyn frutilla', 'helado lyn frutilla', 'lyn frutilla agua'],
  'ind-yiro-papaya-frambuesa': ['yiro papaya frambuesa', 'yiro papaya', 'paleta yiro papaya frambuesa', 'yiro papaya y frambuesa'],
  'ind-yiro-uva-berries': ['yiro uva berries', 'yiro uva', 'paleta yiro uva berries', 'yiro berries'],
  'ind-yiro-limon-manzana': ['yiro limon manzana', 'yiro limon', 'paleta yiro limon manzana', 'yiro manzana limon'],
  'ind-2-palos-frambuesa': ['2 palos frambuesa', 'dos palos frambuesa', '2 palos', 'dos palos', 'paleta 2 palos', 'paleta dos palos frambuesa'],
  'ind-colo-colo-pina': ['colo colo pina', 'colo colo', 'paleta colo colo', 'paleta colo colo pina', 'helado colo colo'],
  'ind-u-de-chile-pina': ['u de chile pina', 'u de chile', 'universidad de chile pina', 'paleta u de chile', 'helado u de chile'],
  'postre-manjar-crocante': ['manjar crocante', 'postre manjar crocante', 'paleta manjar crocante', 'crocante manjar'],
  'postre-choco-panda': ['choco panda', 'paleta choco panda', 'postre choco panda', 'panda chocolate'],
  'postre-crema-frambuesa': ['crema frambuesa', 'paleta crema frambuesa', 'postre crema frambuesa', 'paleta frambuesa crema'],
  'postre-chirimoya-alegre': ['chirimoya alegre', 'paleta chirimoya alegre', 'postre chirimoya alegre', 'paleta chirimoya'],
  'postre-mora-mora': ['mora mora', 'paleta mora mora', 'postre mora mora', 'helado mora mora', 'paleta mora'],
  'postre-paleta-crema': ['paleta crema', 'postre paleta crema', 'paleta de crema', 'helado paleta crema'],
  'postre-paleta-cassatta': ['paleta cassatta', 'paleta cassata', 'postre paleta cassatta', 'paleta tipo cassata'],
  'postre-paleta-tunga': ['paleta tunga', 'tunga', 'postre paleta tunga', 'tunga frambuesa', 'paleta tunga frambuesa'],
  'chocante-tres-leches': ['chocante tres leches', 'chocante 3 leches', 'bombon chocante tres leches', 'bombon chocante 3 leches'],
  'chocante-frambuesa': ['chocante frambuesa', 'bombon chocante frambuesa', 'paleta chocante frambuesa'],
  'chocante-macchiato': ['chocante macchiato', 'bombon chocante macchiato', 'chocante moca', 'chocante cafe'],
  'cono-crema-frambuesa': ['cono crema frambuesa', 'cono crema y frambuesa', 'cono frambuesa'],
  'copa-crema-frambuesa': ['copa crema frambuesa', 'copa crema y frambuesa', 'copa frambuesa']
};

export interface MatchResult {
  catalogProduct: CatalogProduct | null;
  matchStatus: MatchStatusFactura;
  confidence: number;
  reason: string;
}

/**
 * Compara una descripción extraída de factura contra el catálogo vigente de 31 productos de JOLY.
 * Distingue:
 * 1. 'coincidencia_exacta': coincidencia clara por nombre, formato o alias reconocido.
 * 2. 'requiere_confirmacion': posible coincidencia pero con cierta ambigüedad (ej: "Frambuesa" que podría ser Cassata, Paleta, Cono o Copa).
 * 3. 'descontinuado': el producto no existe en el catálogo vigente de 31 productos (ej: productos de facturas antiguas).
 */
export function matchProductWithCatalog(invoiceDesc: string, providerCode?: string): MatchResult {
  const normInvoice = normalizeString(invoiceDesc);

  if (!normInvoice) {
    return {
      catalogProduct: null,
      matchStatus: 'descontinuado',
      confidence: 0,
      reason: 'Descripción vacía'
    };
  }

  // 1. Búsqueda exacta en alias conocidos
  for (const [prodId, aliases] of Object.entries(KNOWN_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeString(alias);
      if (normInvoice === normAlias || normInvoice.includes(normAlias)) {
        const prod = PRODUCTS.find(p => p.id === prodId);
        if (prod) {
          return {
            catalogProduct: prod,
            matchStatus: 'coincidencia_exacta',
            confidence: 0.95,
            reason: `Coincidencia por alias reconocido: "${alias}"`
          };
        }
      }
    }
  }

  // 2. Búsqueda directa por nombre normalizado de producto en catálogo
  for (const prod of PRODUCTS) {
    const normName = normalizeString(prod.name);
    if (normInvoice === normName) {
      return {
        catalogProduct: prod,
        matchStatus: 'coincidencia_exacta',
        confidence: 1.0,
        reason: 'Nombre idéntico al catálogo JOLY'
      };
    }
  }

  // 3. Puntuación por coincidencia de palabras clave ponderadas (excluyendo palabras genéricas)
  const STOP_WORDS = new Set(['paleta', 'paletas', 'helado', 'helados', 'caja', 'cajas', 'unidad', 'unidades', 'de', 'del', 'los', 'las', 'por', 'con', 'formato', 'postre', 'postres', 'chile']);
  const invoiceTokens = normInvoice.split(' ').filter(t => t.length > 2 && !STOP_WORDS.has(t));
  let bestScore = 0;
  let bestCandidate: CatalogProduct | null = null;
  let matchReason = '';

  for (const prod of PRODUCTS) {
    const normName = normalizeString(prod.name);
    const prodTokens = normName.split(' ').filter(t => t.length > 2 && !STOP_WORDS.has(t));

    let matchCount = 0;
    for (const token of invoiceTokens) {
      if (prodTokens.includes(token)) {
        matchCount++;
      }
    }

    // Comprobar formato explícito (cassata 1l vs 1.8l vs paleta vs cono vs copa)
    const mentions1L = normInvoice.includes('1 l') || normInvoice.includes('1l') || normInvoice.includes('1 litro');
    const mentions18L = normInvoice.includes('1 8') || normInvoice.includes('1 8l') || normInvoice.includes('1 8 l') || normInvoice.includes('familiar');
    const isProd1L = prod.categoryId === 'cassatas-1l';
    const isProd18L = prod.categoryId === 'cassatas-1-8l';

    let penalty = 0;
    if (mentions1L && isProd18L) penalty = 0.5;
    if (mentions18L && isProd1L) penalty = 0.5;

    const score = Math.max(0, (matchCount / Math.max(prodTokens.length, invoiceTokens.length)) - penalty);

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = prod;
      matchReason = `Coincidencia parcial con ${prod.name} (${matchCount} términos clave)`;
    }
  }

  // Evaluación de umbrales
  if (bestScore >= 0.70 && bestCandidate) {
    return {
      catalogProduct: bestCandidate,
      matchStatus: 'coincidencia_exacta',
      confidence: bestScore,
      reason: matchReason
    };
  } else if (bestScore >= 0.40 && bestCandidate) {
    return {
      catalogProduct: bestCandidate,
      matchStatus: 'requiere_confirmacion',
      confidence: bestScore,
      reason: `Sugerencia con dudas: ${bestCandidate.name}. Requiere confirmación humana.`
    };
  } else {
    return {
      catalogProduct: null,
      matchStatus: 'descontinuado',
      confidence: bestScore,
      reason: 'No encontrado en catálogo vigente / posible descontinuado'
    };
  }
}

/**
 * Transforma una fila detectada por el OCR en un ItemRecepcionFactura seguro
 */
export function buildItemFromExtraction(extractedItem: {
  codigoProveedor?: string;
  descripcion: string;
  cantidadCajas: number;
  precioUnitario?: number;
}): ItemRecepcionFactura {
  const match = matchProductWithCatalog(extractedItem.descripcion, extractedItem.codigoProveedor);
  const prod = match.catalogProduct;

  return {
    productId: prod ? prod.id : '',
    productName: prod ? prod.name : extractedItem.descripcion,
    categoryName: prod ? prod.categoryName : 'Sin categoría vigente',
    unitsPerBox: prod ? prod.unitsPerBox : 0,
    cajasFacturadas: Number(extractedItem.cantidadCajas) || 0,
    cajasRecibidasFisicas: Number(extractedItem.cantidadCajas) || 0, // Inicialmente igual a facturadas para que el bodeguero ajuste
    precioUnitarioCaja: prod ? prod.boxPrice : (extractedItem.precioUnitario || 0),
    codigoProveedor: extractedItem.codigoProveedor,
    nombreFacturaOriginal: extractedItem.descripcion,
    matchStatus: match.matchStatus,
    descartado: match.matchStatus === 'descontinuado', // Marcar descartado por defecto si no existe en catálogo
    observaciones: match.matchStatus === 'descontinuado'
      ? '⚠️ Producto no encontrado en catálogo vigente (posible descontinuado). Excluido de recepción.'
      : match.matchStatus === 'requiere_confirmacion'
      ? '🔍 Verificado con dudas. Confirmar sabor y formato antes de ingresar.'
      : undefined
  };
}
