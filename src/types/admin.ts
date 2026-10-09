export type AdminSectionId = 
  | 'inventario'
  | 'pedidos'
  | 'rutas'
  | 'seguimiento'
  | 'cobranza'
  | 'cierres';

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  sublabel: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'info';
}
