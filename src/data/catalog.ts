export interface Category {
  id: string;
  name: string;
  shortName: string;
  defaultPresentation: string;
  description: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unitsPerBox: number;
  boxPrice: number;
  unitRefPrice: number;
  imageFileName: string;
  hasPreservedPhoto: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: 'cassatas-1l',
    name: 'Cassatas 1 L',
    shortName: 'Cassatas 1L',
    defaultPresentation: 'Caja de 6 unidades',
    description: 'Formato ideal para vitrina y negocios gastronómicos'
  },
  {
    id: 'cassatas-1-8l',
    name: 'Cassatas 1,8 L',
    shortName: 'Cassatas 1,8L',
    defaultPresentation: 'Caja de 4 unidades',
    description: 'Formato familiar de alto rendimiento'
  },
  {
    id: 'helados-individuales',
    name: 'Helados Individuales',
    shortName: 'Individuales',
    defaultPresentation: 'Venta por caja',
    description: 'Paletas de agua y crema de alta rotación'
  },
  {
    id: 'postres-especiales',
    name: 'Postres y Especiales',
    shortName: 'Postres',
    defaultPresentation: 'Venta por caja',
    description: 'Línea de especialidades y paletas premium'
  },
  {
    id: 'chocante-copas',
    name: 'Línea Chocante y Copas',
    shortName: 'Chocante y Copas',
    defaultPresentation: 'Venta por caja',
    description: 'Bombones Chocante, conos y copas heladas'
  }
];

export const PRODUCTS: CatalogProduct[] = [
  // --- CASSATAS 1 L (Fotos oficiales centradas y optimizadas) ---
  {
    id: 'cas-1l-crema-frambuesa',
    name: 'Cassata 1 L - Crema Frambuesa',
    categoryId: 'cassatas-1l',
    categoryName: 'Cassatas 1 L',
    unitsPerBox: 6,
    boxPrice: 14536,
    unitRefPrice: 2422,
    imageFileName: 'cassata-crema-frambuesa.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-1l-frutos-del-bosque',
    name: 'Cassata 1 L - Frutos del Bosque',
    categoryId: 'cassatas-1l',
    categoryName: 'Cassatas 1 L',
    unitsPerBox: 6,
    boxPrice: 14536,
    unitRefPrice: 2422,
    imageFileName: 'cassata-frutos-del-bosque.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-1l-chirimoya-alegre',
    name: 'Cassata 1 L - Chirimoya Alegre',
    categoryId: 'cassatas-1l',
    categoryName: 'Cassatas 1 L',
    unitsPerBox: 6,
    boxPrice: 14536,
    unitRefPrice: 2422,
    imageFileName: 'cassata-chirimoya-alegre.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-1l-pina',
    name: 'Cassata 1 L - Piña',
    categoryId: 'cassatas-1l',
    categoryName: 'Cassatas 1 L',
    unitsPerBox: 6,
    boxPrice: 14536,
    unitRefPrice: 2422,
    imageFileName: 'cassata-pina.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-1l-tradicional',
    name: 'Cassata 1 L - Tradicional',
    categoryId: 'cassatas-1l',
    categoryName: 'Cassatas 1 L',
    unitsPerBox: 6,
    boxPrice: 14536,
    unitRefPrice: 2422,
    imageFileName: 'cassata-tradicional.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-1l-trisabor',
    name: 'Cassata 1 L - Trisabor',
    categoryId: 'cassatas-1l',
    categoryName: 'Cassatas 1 L',
    unitsPerBox: 6,
    boxPrice: 14536,
    unitRefPrice: 2422,
    imageFileName: 'cassata-trisabor.png',
    hasPreservedPhoto: true
  },

  // --- CASSATAS 1,8 L (Fotos oficiales centradas y optimizadas) ---
  {
    id: 'cas-18l-choco-menta-3leches',
    name: 'Cassata 1,8 L - Chocolate/Menta Chips/3 Leches',
    categoryId: 'cassatas-1-8l',
    categoryName: 'Cassatas 1,8 L',
    unitsPerBox: 4,
    boxPrice: 16240,
    unitRefPrice: 4060,
    imageFileName: 'cassata-1-8l-choco-menta-3leches.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-18l-cassata',
    name: 'Cassata 1,8 L - Cassata',
    categoryId: 'cassatas-1-8l',
    categoryName: 'Cassatas 1,8 L',
    unitsPerBox: 4,
    boxPrice: 16240,
    unitRefPrice: 4060,
    imageFileName: 'cassata-1-8l-cassata.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-18l-trisabor',
    name: 'Cassata 1,8 L - Trisabor',
    categoryId: 'cassatas-1-8l',
    categoryName: 'Cassatas 1,8 L',
    unitsPerBox: 4,
    boxPrice: 16240,
    unitRefPrice: 4060,
    imageFileName: 'cassata-1-8l-trisabor.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cas-18l-pina',
    name: 'Cassata 1,8 L - Piña',
    categoryId: 'cassatas-1-8l',
    categoryName: 'Cassatas 1,8 L',
    unitsPerBox: 4,
    boxPrice: 16240,
    unitRefPrice: 4060,
    imageFileName: 'cassata-1-8l-pina.png',
    hasPreservedPhoto: true
  },

  // --- HELADOS INDIVIDUALES ---
  {
    id: 'ind-lyn-naranja',
    name: 'Lyn Naranja',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 42,
    boxPrice: 7375,
    unitRefPrice: 175,
    imageFileName: 'lyn-frutilla.png',
    hasPreservedPhoto: true
  },
  {
    id: 'ind-lyn-frutilla',
    name: 'Lyn Frutilla',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 42,
    boxPrice: 7375,
    unitRefPrice: 175,
    imageFileName: 'lyn-frutilla.png',
    hasPreservedPhoto: true
  },
  {
    id: 'ind-yiro-papaya-frambuesa',
    name: 'Yiro Papaya / Frambuesa',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 44,
    boxPrice: 7821,
    unitRefPrice: 177,
    imageFileName: 'yiro-uva-berries.png',
    hasPreservedPhoto: true
  },
  {
    id: 'ind-yiro-uva-berries',
    name: 'Yiro Uva / Berries',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 44,
    boxPrice: 7821,
    unitRefPrice: 177,
    imageFileName: 'yiro-uva-berries.png',
    hasPreservedPhoto: true
  },
  {
    id: 'ind-yiro-limon-manzana',
    name: 'Yiro Limón / Manzana',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 44,
    boxPrice: 7821,
    unitRefPrice: 177,
    imageFileName: 'yiro-uva-berries.png',
    hasPreservedPhoto: true
  },
  {
    id: 'ind-2-palos-frambuesa',
    name: '2 Palos Frambuesa',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 42,
    boxPrice: 7819,
    unitRefPrice: 186,
    imageFileName: '2-palos-frambuesa.png',
    hasPreservedPhoto: true
  },
  {
    id: 'ind-colo-colo-pina',
    name: 'Colo Colo Piña',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 42,
    boxPrice: 9916,
    unitRefPrice: 236,
    imageFileName: 'colo-colo-pina.png',
    hasPreservedPhoto: true
  },
  {
    id: 'ind-u-de-chile-pina',
    name: 'U. de Chile Piña',
    categoryId: 'helados-individuales',
    categoryName: 'Helados Individuales',
    unitsPerBox: 42,
    boxPrice: 9916,
    unitRefPrice: 236,
    imageFileName: 'colo-colo-pina.png',
    hasPreservedPhoto: true
  },

  // --- POSTRES Y ESPECIALES (Imágenes de IA removidas) ---
  {
    id: 'postre-manjar-crocante',
    name: 'Manjar Crocante (Choco Manjar)',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 42,
    boxPrice: 13710,
    unitRefPrice: 326,
    imageFileName: 'manjar-crocante.png',
    hasPreservedPhoto: true
  },
  {
    id: 'postre-choco-panda',
    name: 'Choco Panda',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 42,
    boxPrice: 13711,
    unitRefPrice: 326,
    imageFileName: 'choco-panda.png',
    hasPreservedPhoto: true
  },
  {
    id: 'postre-crema-frambuesa',
    name: 'Crema Frambuesa',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 42,
    boxPrice: 8631,
    unitRefPrice: 205,
    imageFileName: 'crema-frambuesa.png',
    hasPreservedPhoto: true
  },
  {
    id: 'postre-chirimoya-alegre',
    name: 'Chirimoya Alegre',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 42,
    boxPrice: 8631,
    unitRefPrice: 205,
    imageFileName: 'paleta-chirimoya-alegre.png',
    hasPreservedPhoto: true
  },
  {
    id: 'postre-mora-mora',
    name: 'Mora Mora',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 44,
    boxPrice: 9642,
    unitRefPrice: 219,
    imageFileName: 'paleta-mora-mora.png',
    hasPreservedPhoto: true
  },
  {
    id: 'postre-paleta-crema',
    name: 'Paleta Crema',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 42,
    boxPrice: 12854,
    unitRefPrice: 306,
    imageFileName: 'paleta-crema.png',
    hasPreservedPhoto: true
  },
  {
    id: 'postre-paleta-cassatta',
    name: 'Paleta Cassatta',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 42,
    boxPrice: 12844,
    unitRefPrice: 305,
    imageFileName: 'paleta-cassata.png',
    hasPreservedPhoto: true
  },
  {
    id: 'postre-paleta-tunga',
    name: 'Paleta Tunga',
    categoryId: 'postres-especiales',
    categoryName: 'Postres y Especiales',
    unitsPerBox: 44,
    boxPrice: 13467,
    unitRefPrice: 306,
    imageFileName: 'paleta-tunga.png',
    hasPreservedPhoto: true
  },

  // --- LÍNEA CHOCANTE Y COPAS ---
  {
    id: 'chocante-tres-leches',
    name: 'Chocante Tres Leches',
    categoryId: 'chocante-copas',
    categoryName: 'Línea Chocante y Copas',
    unitsPerBox: 16,
    boxPrice: 7480,
    unitRefPrice: 467,
    imageFileName: 'chocante-crema.frambuesa.png',
    hasPreservedPhoto: true
  },
  {
    id: 'chocante-frambuesa',
    name: 'Chocante Frambuesa',
    categoryId: 'chocante-copas',
    categoryName: 'Línea Chocante y Copas',
    unitsPerBox: 16,
    boxPrice: 7480,
    unitRefPrice: 467,
    imageFileName: 'chocante-crema.frambuesa.png',
    hasPreservedPhoto: true
  },
  {
    id: 'chocante-chocolate',
    name: 'Chocante Chocolate',
    categoryId: 'chocante-copas',
    categoryName: 'Línea Chocante y Copas',
    unitsPerBox: 16,
    boxPrice: 7480,
    unitRefPrice: 467,
    imageFileName: 'chocante-crema.frambuesa.png',
    hasPreservedPhoto: true
  },
  {
    id: 'cono-crema-frambuesa',
    name: 'Cono Crema / Frambuesa',
    categoryId: 'chocante-copas',
    categoryName: 'Línea Chocante y Copas',
    unitsPerBox: 16,
    boxPrice: 10887,
    unitRefPrice: 680,
    imageFileName: 'cono-crema-frambuesa.png',
    hasPreservedPhoto: true
  },
  {
    id: 'copa-crema-frambuesa',
    name: 'Copa Crema / Frambuesa',
    categoryId: 'chocante-copas',
    categoryName: 'Línea Chocante y Copas',
    unitsPerBox: 12,
    boxPrice: 8425,
    unitRefPrice: 702,
    imageFileName: 'cono-crema-frambuesa.png',
    hasPreservedPhoto: true
  }
];

export const WHATSAPP_PHONE = '56995769200';
export const WHATSAPP_DISPLAY = '+56 9 9576 9200';

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export interface CustomerData {
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  sector: string;
  address: string;
  notes?: string;
}

export interface InvoiceData {
  needsInvoice: boolean;
  businessName: string;
  rut: string;
  activity: string;
  address: string;
}
