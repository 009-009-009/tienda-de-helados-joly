export type ProductCategory = 'todas' | 'cassatas' | 'individuales' | 'especiales';

export interface Product {
  id: string;
  name: string;
  category: 'cassatas' | 'individuales' | 'especiales';
  categoryLabel: string;
  price: number;
  description: string;
  image: string; // Ruta relativa limpia '/images/products/...' o URL directa
  hasAiImage: boolean; // Solo true para Cassatas según solicitud, false para individuales/especiales
  recommendedFilename: string;
  badge?: string;
  servings?: string;
  highlights?: string[];
  inStock?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customNotes?: string;
}
