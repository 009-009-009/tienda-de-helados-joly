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

// 1. Alias de Coincidencia Concreta / Exacta (identidad 100% indudable del producto)
const EXACT_ALIASES: Record<string, string[]> = {
  'postre-mora-mora': [
    'mora mora',
    'paleta mora mora',
    'postre mora mora',
    'helado mora mora',
    'paleta mora'
  ],
  'postre-choco-panda': [
    'choco panda',
    'paleta choco panda',
    'postre choco panda',
    'panda chocolate'
  ],
  'postre-manjar-crocante': [
    'manjar crocante',
    'postre manjar crocante',
    'paleta manjar crocante',
    'crocante manjar'
  ],
  'postre-paleta-tunga': [
    'paleta tunga',
    'tunga',
    'postre paleta tunga',
    'tunga frambuesa',
    'paleta tunga frambuesa'
  ],
  'postre-paleta-cassatta': [
    'paleta cassatta',
    'paleta cassata',
    'postre paleta cassatta'
  ],
  'postre-paleta-crema': [
    'paleta crema',
    'postre paleta crema',
    'helado paleta crema'
  ],
  'ind-2-palos-frambuesa': [
    '2 palos frambuesa',
    'dos palos frambuesa',
    '2 palos',
    'dos palos',
    'paleta 2 palos',
    'paleta dos palos'
  ],
  'ind-colo-colo-pina': [
    'colo colo pina',
    'colo colo',
    'paleta colo colo',
    'helado colo colo'
  ],
  'ind-u-de-chile-pina': [
    'u de chile pina',
    'u de chile',
    'universidad de chile pina',
    'paleta u de chile',
    'helado u de chile'
  ],
  'ind-lyn-naranja': [
    'lyn naranja',
    'paleta lyn naranja',
    'helado lyn naranja'
  ],
  'ind-lyn-frutilla': [
    'lyn frutilla',
    'paleta lyn frutilla',
    'helado lyn frutilla'
  ],
  'ind-yiro-papaya-frambuesa': [
    'yiro papaya frambuesa',
    'yiro papaya',
    'paleta yiro papaya frambuesa'
  ],
  'ind-yiro-uva-berries': [
    'yiro uva berries',
    'yiro uva',
    'paleta yiro uva berries'
  ],
  'ind-yiro-limon-manzana': [
    'yiro limon manzana',
    'yiro limon',
    'paleta yiro limon manzana'
  ],
  'cas-1l-tradicional': [
    'cassata 1 l tradicional',
    'cassata 1l tradicional',
    'cassata tradicional 1l'
  ],
  'cas-1l-trisabor': [
    'cassata 1 l trisabor',
    'cassata 1l trisabor',
    'cassata trisabor 1l'
  ],
  'cas-1l-pina': [
    'cassata 1 l pina',
    'cassata 1l pina',
    'cassata pina 1l'
  ],
  'cas-1l-frutos-del-bosque': [
    'cassata 1 l frutos del bosque',
    'cassata 1l frutos del bosque',
    'cassata frutos del bosque 1l',
    'frutos del bosque 1l'
  ],
  'cas-18l-cassata': [
    'cassata 1 8 l cassata',
    'cassata 1 8l cassata',
    'cassata 1 8l tradicional'
  ],
  'cas-18l-trisabor': [
    'cassata 1 8 l trisabor',
    'cassata 1 8l trisabor',
    'cassata trisabor 1 8l'
  ],
  'cas-18l-pina': [
    'cassata 1 8 l pina',
    'cassata 1 8l pina',
    'cassata pina 1 8l'
  ],
  'chocante-tres-leches': [
    'chocante tres leches',
    'chocante 3 leches',
    'bombon chocante tres leches'
  ],
  'chocante-frambuesa': [
    'chocante frambuesa',
    'bombon chocante frambuesa'
  ],
  'chocante-macchiato': [
    'chocante macchiato',
    'bombon chocante macchiato'
  ],
  'cono-crema-frambuesa': [
    'cono crema frambuesa',
    'cono frambuesa'
  ],
  'copa-crema-frambuesa': [
    'copa crema frambuesa',
    'copa frambuesa'
  ]
};

// 2. Propuestas con dudas / equivalencias que requieren confirmación humana
// Ej: "Cassata Frambuesa 1L" omite la palabra "Crema", por lo que se propone
// "Cassata 1 L - Crema Frambuesa" pero solicitando confirmación explícita al usuario.
const PROPOSALS_REQUIRING_CONFIRMATION: {
  triggers: string[];
  targetProductId: string;
  reason: string;
}[] = [
  {
    triggers: ['cassata frambuesa 1l', 'cassata 1l frambuesa', 'cassata frambuesa 1 l', 'cassata frambuesa', 'frambuesa 1l'],
    targetProductId: 'cas-1l-crema-frambuesa',
    reason: 'La factura indica "Cassata Frambuesa 1L". El catálogo registra "Cassata 1 L - Crema Frambuesa". Confirmar equivalencia.'
  },
  {
    triggers: ['cassata chirimoya 1l', 'cassata 1l chirimoya', 'chirimoya 1l'],
    targetProductId: 'cas-1l-chirimoya-alegre',
    reason: 'La factura indica "Cassata Chirimoya". El catálogo registra "Cassata 1 L - Chirimoya Alegre". Confirmar equivalencia.'
  },
  {
    triggers: ['cassata menta 1 8l', 'choco menta 1 8l', 'menta chips 1 8l'],
    targetProductId: 'cas-18l-choco-menta-3leches',
    reason: 'La factura indica "Cassata Menta / Choco Menta". El catálogo registra "Cassata 1,8 L - Chocolate/Menta Chips/3 Leches". Confirmar equivalencia.'
  },
  {
    triggers: ['crema frambuesa', 'paleta crema frambuesa'],
    targetProductId: 'postre-crema-frambuesa',
    reason: 'La factura indica "Crema Frambuesa". Confirmar si corresponde a Paleta "Crema Frambuesa" o formato Cassata.'
  }
];

export interface MatchResult {
  catalogProduct: CatalogProduct | null;
  matchStatus: MatchStatusFactura;
  confidence: number;
  reason: string;
}

/**
 * Compara una descripción de factura contra el catálogo de 31 productos de JOLY.
 * Cumple estrictamente las reglas del usuario:
 * - «Paleta Mora Mora» -> Proponer coincidencia concreta: Mora Mora (postre-mora-mora)
 * - «Cassata Frambuesa 1L» -> Proponer «Cassata 1 L - Crema Frambuesa» pero con estado 'requiere_confirmacion'
 * - Productos antiguos (ej: Paleta Naranjita, Cassata Lúcuma) -> Identificados como 'descontinuado' (sin asociar a otro producto)
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

  // 1. Verificación directa contra propuestas con dudas que requieren confirmación
  // ("Cassata Frambuesa 1L" debe solicitar confirmación para "Cassata 1 L - Crema Frambuesa")
  for (const proposal of PROPOSALS_REQUIRING_CONFIRMATION) {
    for (const trigger of proposal.triggers) {
      const normTrigger = normalizeString(trigger);
      if (normInvoice === normTrigger || normInvoice.includes(normTrigger)) {
        const prod = PRODUCTS.find(p => p.id === proposal.targetProductId);
        if (prod) {
          return {
            catalogProduct: prod,
            matchStatus: 'requiere_confirmacion',
            confidence: 0.85,
            reason: proposal.reason
          };
        }
      }
    }
  }

  // 2. Verificación contra alias exactos / identidad concreta (ej: "Paleta Mora Mora" -> "Mora Mora")
  for (const [prodId, aliases] of Object.entries(EXACT_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeString(alias);
      if (normInvoice === normAlias || normInvoice.includes(normAlias)) {
        const prod = PRODUCTS.find(p => p.id === prodId);
        if (prod) {
          return {
            catalogProduct: prod,
            matchStatus: 'coincidencia_exacta',
            confidence: 1.0,
            reason: `Coincidencia concreta con catálogo JOLY: "${prod.name}"`
          };
        }
      }
    }
  }

  // 3. Verificación por nombre completo idéntico en el catálogo de 31
  for (const prod of PRODUCTS) {
    const normName = normalizeString(prod.name);
    if (normInvoice === normName) {
      return {
        catalogProduct: prod,
        matchStatus: 'coincidencia_exacta',
        confidence: 1.0,
        reason: `Nombre idéntico al catálogo JOLY: "${prod.name}"`
      };
    }
  }

  // 4. Búsqueda por similitud de palabras clave significativas (sin stop words)
  const STOP_WORDS = new Set([
    'paleta', 'paletas', 'helado', 'helados', 'caja', 'cajas', 'unidad', 'unidades', 
    'de', 'del', 'los', 'las', 'por', 'con', 'formato', 'postre', 'postres', 'chile', 
    'sku', 'art', 'articulo', 'codigo'
  ]);
  const invoiceTokens = normInvoice.split(' ').filter(t => t.length > 2 && !STOP_WORDS.has(t));

  if (invoiceTokens.length === 0) {
    return {
      catalogProduct: null,
      matchStatus: 'descontinuado',
      confidence: 0,
      reason: 'No encontrado en catálogo vigente / posible descontinuado'
    };
  }

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

    // Penalización severa si confunde formatos
    const mentions1L = normInvoice.includes('1 l') || normInvoice.includes('1l') || normInvoice.includes('1 litro');
    const mentions18L = normInvoice.includes('1 8') || normInvoice.includes('1 8l') || normInvoice.includes('1 8 l') || normInvoice.includes('familiar');
    const isProd1L = prod.categoryId === 'cassatas-1l';
    const isProd18L = prod.categoryId === 'cassatas-1-8l';

    let penalty = 0;
    if (mentions1L && !isProd1L) penalty = 0.6;
    if (mentions18L && !isProd18L) penalty = 0.6;

    const score = Math.max(0, (matchCount / Math.max(prodTokens.length, invoiceTokens.length)) - penalty);

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = prod;
      matchReason = `Sugerencia con dudas: ${prod.name} (${matchCount} términos coincidentes). Requiere confirmación humana.`;
    }
  }

  // Si la coincidencia es alta (>= 0.75) y no cayó en reglas anteriores
  if (bestScore >= 0.75 && bestCandidate) {
    return {
      catalogProduct: bestCandidate,
      matchStatus: 'coincidencia_exacta',
      confidence: bestScore,
      reason: `Coincidencia concreta con: ${bestCandidate.name}`
    };
  } else if (bestScore >= 0.50 && bestCandidate) {
    return {
      catalogProduct: bestCandidate,
      matchStatus: 'requiere_confirmacion',
      confidence: bestScore,
      reason: matchReason
    };
  } else {
    // Si no alcanza un puntaje convincente, es un producto antiguo o no perteneciente al catálogo
    return {
      catalogProduct: null,
      matchStatus: 'descontinuado',
      confidence: bestScore,
      reason: 'No encontrado en catálogo vigente / posible descontinuado'
    };
  }
}

/**
 * Transforma una fila detectada en un ItemRecepcionFactura seguro
 */
export function buildItemFromExtraction(extractedItem: {
  codigoProveedor?: string;
  descripcion: string;
  cantidadCajas: number;
  precioUnitario?: number;
}): ItemRecepcionFactura {
  const match = matchProductWithCatalog(extractedItem.descripcion, extractedItem.codigoProveedor);
  const prod = match.catalogProduct;
  const esDescontinuado = match.matchStatus === 'descontinuado';

  return {
    productId: prod ? prod.id : '',
    productName: prod ? prod.name : extractedItem.descripcion,
    categoryName: prod ? prod.categoryName : 'No encontrado en catálogo vigente',
    unitsPerBox: prod ? prod.unitsPerBox : 0,
    cajasFacturadas: Number(extractedItem.cantidadCajas) || 0,
    // Si está descontinuado, 0 cajas físicas a ingresar por defecto; si es válido, igual a facturadas para cotejo
    cajasRecibidasFisicas: esDescontinuado ? 0 : (Number(extractedItem.cantidadCajas) || 0),
    precioUnitarioCaja: prod ? prod.boxPrice : (extractedItem.precioUnitario || 0),
    codigoProveedor: extractedItem.codigoProveedor,
    nombreFacturaOriginal: extractedItem.descripcion,
    matchStatus: match.matchStatus,
    descartado: esDescontinuado, // Excluido por defecto si es descontinuado
    observaciones: match.reason
  };
}
