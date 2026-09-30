import { Product } from '../types';

export const PRODUCTS: Product[] = [
  // --- SECCIÓN CASSATAS (Fotos conservadas intactas tal como se solicitó) ---
  {
    id: 'cassata-clasica',
    name: 'Cassata Siciliana Tradicional',
    category: 'cassatas',
    categoryLabel: 'Cassatas Artesanales',
    price: 18.50,
    description: 'Receta tradicional italiana con base de bizcocho suave, crema de ricotta artesanal, frutas confitadas y capas de helado de pistacho y vainilla.',
    image: '/images/products/cassata-clasica.jpg',
    hasAiImage: true, // Conservada tal como se solicitó
    recommendedFilename: 'cassata-clasica.jpg',
    badge: 'Foto Conservada',
    servings: '8 - 10 porciones',
    highlights: ['Receta Siciliana', 'Frutas Glaseadas', '100% Artesanal'],
    inStock: true
  },
  {
    id: 'cassata-napolitana',
    name: 'Cassata Napolitana Tricolor',
    category: 'cassatas',
    categoryLabel: 'Cassatas Artesanales',
    price: 17.00,
    description: 'Clásica combinación equilibrada de tres capas de gelato premium: frutilla natural, chocolate belga semiamargo y crema americana.',
    image: '/images/products/cassata-napolitana.jpg',
    hasAiImage: true, // Conservada tal como se solicitó
    recommendedFilename: 'cassata-napolitana.jpg',
    badge: 'Foto Conservada',
    servings: '8 porciones',
    highlights: ['Chocolate Belga', 'Frutilla Natural', 'Crema de Leche'],
    inStock: true
  },
  {
    id: 'cassata-frutos-bosque',
    name: 'Cassata Frutos del Bosque',
    category: 'cassatas',
    categoryLabel: 'Cassatas Artesanales',
    price: 19.50,
    description: 'Exquisita tarta helada con corazón de frutos rojos silvestres macerados, coulis de frambuesa y cobertura de chocolate blanco raspado.',
    image: '/images/products/cassata-frutos-del-bosque.jpg',
    hasAiImage: true, // Conservada tal como se solicitó
    recommendedFilename: 'cassata-frutos-del-bosque.jpg',
    badge: 'Foto Conservada',
    servings: '10 porciones',
    highlights: ['Frambuesas & Moras', 'Chocolate Blanco', 'Edición Especial'],
    inStock: true
  },

  // --- SECCIÓN PRODUCTOS INDIVIDUALES (Imágenes de IA removidas, configuradas con rutas permanentes) ---
  {
    id: 'cono-artesanal-doble',
    name: 'Cono Artesanal Doble Sabor',
    category: 'individuales',
    categoryLabel: 'Helados Individuales',
    price: 4.50,
    description: 'Barquillo crujiente horneado en tienda con dos bolas generosas de helado a elección, bañado en cobertura crujiente de chocolate y crocante de maní.',
    image: '/images/products/cono-artesanal.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'cono-artesanal.jpg',
    badge: 'Ruta Permanente Lista',
    servings: '1 persona',
    highlights: ['Barquillo Casero', '2 Sabores a elección', 'Crocante incluido'],
    inStock: true
  },
  {
    id: 'tarrina-gelato-personal',
    name: 'Tarrina Gelato Mediana',
    category: 'individuales',
    categoryLabel: 'Helados Individuales',
    price: 5.25,
    description: 'Porción individual en copa térmica ecológica con hasta 3 sabores a tu gusto, servido con espátula italiana para conservar la cremosidad.',
    image: '/images/products/tarrina-mediana.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'tarrina-mediana.jpg',
    badge: 'Ruta Permanente Lista',
    servings: '350 ml (1-2 personas)',
    highlights: ['Hasta 3 sabores', 'Envase térmico', 'Cremosidad italiana'],
    inStock: true
  },
  {
    id: 'paleta-artesanal-rellena',
    name: 'Paleta Artesanal Rellena',
    category: 'individuales',
    categoryLabel: 'Helados Individuales',
    price: 3.75,
    description: 'Paleta de fruta natural rellena de leche condensada o dulce de leche repostero, bañada en chocolate crujiente.',
    image: '/images/products/paleta-artesanal.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'paleta-artesanal.jpg',
    badge: 'Ruta Permanente Lista',
    servings: '1 unidad',
    highlights: ['Relleno líquido cremoso', 'Sin conservantes', 'Fruta 100% natural'],
    inStock: true
  },
  {
    id: 'pote-medio-litro',
    name: 'Pote Take Away 1/2 Litro',
    category: 'individuales',
    categoryLabel: 'Helados Individuales',
    price: 8.50,
    description: 'Formato ideal para llevar a casa y disfrutar en el momento. Hasta 3 sabores en envase isotérmico para mantener la temperatura.',
    image: '/images/products/pote-medio-litro.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'pote-medio-litro.jpg',
    badge: 'Ruta Permanente Lista',
    servings: '500 ml',
    highlights: ['Ideal para llevar', 'Conserva el frío 60 min', 'Hasta 3 sabores'],
    inStock: true
  },

  // --- SECCIÓN ESPECIALIDADES (Imágenes de IA removidas, configuradas con rutas permanentes) ---
  {
    id: 'copa-tulipan-suprema',
    name: 'Copa Tulipán Suprema',
    category: 'especiales',
    categoryLabel: 'Especialidades de la Casa',
    price: 7.90,
    description: 'Cesta crocante de galleta tulipa horneada con 3 bolas de gelato, crema chantilly fresca, sirope de caramelo salado y nueces pecanas tostadas.',
    image: '/images/products/copa-tulipan-especial.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'copa-tulipan-especial.jpg',
    badge: 'Ruta Permanente Lista',
    servings: '1-2 personas',
    highlights: ['Tulipa de galleta casera', 'Chantilly fresca', 'Caramelo salado'],
    inStock: true
  },
  {
    id: 'banana-split-deluxe',
    name: 'Banana Split Gourmet',
    category: 'especiales',
    categoryLabel: 'Especialidades de la Casa',
    price: 8.20,
    description: 'Plátano caramelizado flambeado sobre lecho de helado de fresa, vainilla y chocolate, con hilos de fudge tibio y cerezas marrasquino.',
    image: '/images/products/banana-split-deluxe.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'banana-split-deluxe.jpg',
    badge: 'Ruta Permanente Lista',
    servings: 'Para compartir',
    highlights: ['Plátano fresco', 'Salsa de fudge tibia', 'Cerezas marrasquino'],
    inStock: true
  },
  {
    id: 'affogato-al-caffe',
    name: 'Affogato al Caffè Italiano',
    category: 'especiales',
    categoryLabel: 'Especialidades de la Casa',
    price: 4.80,
    description: 'Una bola de gelato cremoso de fior di latte o vainilla de Madagascar sumergida en un shot doble de espresso recién extraído.',
    image: '/images/products/affogato-italiano.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'affogato-italiano.jpg',
    badge: 'Ruta Permanente Lista',
    servings: '1 persona',
    highlights: ['Espresso 100% Arábica', 'Vainilla Madagascar', 'Fusión caliente-frío'],
    inStock: true
  },
  {
    id: 'waffle-belga-gelato',
    name: 'Waffle Belga con Helado',
    category: 'especiales',
    categoryLabel: 'Especialidades de la Casa',
    price: 7.50,
    description: 'Waffle caliente recién hecho con perlas de azúcar crujiente, servido con bola de gelato a tu elección y coulis de chocolate avellana.',
    image: '/images/products/waffle-con-helado.jpg',
    hasAiImage: false, // Foto de IA removida
    recommendedFilename: 'waffle-con-helado.jpg',
    badge: 'Ruta Permanente Lista',
    servings: '1 persona',
    highlights: ['Waffle recién horneado', 'Nutella o Dulce de Leche', 'Gelato artesanal'],
    inStock: true
  }
];
