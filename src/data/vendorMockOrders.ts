import { PedidoPP } from '../types/vendor';

export const PEDIDOS_INICIALES_VENDEDOR_1: PedidoPP[] = [
  {
    id: 'pedido-001',
    cliente: 'Juana Los Palotes',
    negocio: 'Minimarket Los Tilos',
    direccion: 'Los Tilos 430',
    sector: 'Hualqui',
    telefono: '+56 9 9123 4567',
    total: '$29.072',
    totalNumero: 29072,
    productos: [
      { id: 'cas-1l-frutos-del-bosque', producto: 'Cassata 1 L', sabor: 'Frutos del Bosque', cajas: 1, precio: 14536 },
      { id: 'cas-1l-chirimoya-alegre', producto: 'Cassata 1 L', sabor: 'Chirimoya Alegre', cajas: 1, precio: 14536 }
    ],
    observaciones: 'Tráigame un cartel de helados por favor.',
    factura: 'SÍ'
  },
  {
    id: 'pedido-002',
    cliente: 'Pedro Pérez',
    negocio: 'Almacén Los Aromos',
    direccion: 'Los Aromos 125',
    sector: 'Hualqui',
    telefono: '+56 9 9234 5678',
    total: '$37.144',
    totalNumero: 37144,
    productos: [
      { id: 'ind-colo-colo-pina', producto: 'Colo Colo Piña', sabor: 'Piña', cajas: 2, precio: 9916 },
      { id: 'chocante-tres-leches', producto: 'Chocante Tres Leches', sabor: 'Tres Leches', cajas: 1, precio: 7480 },
      { id: 'chocante-macchiato', producto: 'Chocante Macchiato', sabor: 'Macchiato', cajas: 1, precio: 7480 }
    ],
    observaciones: 'Entregar antes de las 14:00 hrs.',
    factura: 'NO'
  },
  {
    id: 'pedido-003',
    cliente: 'María González',
    negocio: 'Heladería Don Canelo',
    direccion: 'Los Canelos 215',
    sector: 'Chiguayante',
    telefono: '+56 9 9345 6789',
    total: '$57.940',
    totalNumero: 57940,
    productos: [
      { id: 'ind-u-de-chile-pina', producto: 'U. de Chile Piña', sabor: 'Piña', cajas: 2, precio: 9916 },
      { id: 'postre-paleta-cassatta', producto: 'Paleta Cassatta', sabor: 'Tricolor', cajas: 1, precio: 12844 },
      { id: 'postre-manjar-crocante', producto: 'Manjar Crocante', sabor: 'Manjar', cajas: 1, precio: 13710 },
      { id: 'cas-18l-trisabor', producto: 'Cassata 1,8 L', sabor: 'Trisabor', cajas: 1, precio: 16240 }
    ],
    observaciones: 'Estaré donde mi vecina después de las 15:00.',
    factura: 'SÍ'
  },
  {
    id: 'pedido-004',
    cliente: 'Carlos Muñoz',
    negocio: 'Supermercado La Araucaria',
    direccion: 'Las Araucarias 80',
    sector: 'Chiguayante',
    telefono: '+56 9 9456 7890',
    total: '$87.546',
    totalNumero: 87546,
    productos: [
      { id: 'ind-colo-colo-pina', producto: 'Colo Colo Piña', sabor: 'Piña', cajas: 3, precio: 9916 },
      { id: 'postre-paleta-tunga', producto: 'Paleta Tunga', sabor: 'Chocolate', cajas: 2, precio: 13467 },
      { id: 'cas-1l-crema-frambuesa', producto: 'Cassata 1 L', sabor: 'Crema Frambuesa', cajas: 1, precio: 14536 },
      { id: 'cas-1l-tradicional', producto: 'Cassata 1 L', sabor: 'Tradicional', cajas: 1, precio: 14536 }
    ],
    observaciones: 'Dejar el pedido en bodega trasera.',
    factura: 'SÍ'
  }
];

export const PEDIDOS_INICIALES_VENDEDOR_2: PedidoPP[] = [
  {
    id: 'pedido-005',
    cliente: 'Rosa Sepúlveda',
    negocio: 'Almacén El Sol',
    direccion: 'Av. Michimalonco 840',
    sector: 'San Pedro de la Paz',
    telefono: '+56 9 9567 8901',
    total: '$39.262',
    totalNumero: 39262,
    productos: [
      { id: 'cas-1l-frutos-del-bosque', producto: 'Cassata 1 L', sabor: 'Frutos del Bosque', cajas: 1, precio: 14536 },
      { id: 'chocante-tres-leches', producto: 'Chocante Tres Leches', sabor: 'Tres Leches', cajas: 2, precio: 7480 },
      { id: 'ind-colo-colo-pina', producto: 'Colo Colo Piña', sabor: 'Piña', cajas: 1, precio: 9916 }
    ],
    observaciones: 'Llamar antes de llegar para abrir reja.',
    factura: 'SÍ'
  },
  {
    id: 'pedido-006',
    cliente: 'Patricio Alarcón',
    negocio: 'Minimarket Coronel Centro',
    direccion: 'Sotomayor 310',
    sector: 'Coronel',
    telefono: '+56 9 9678 9012',
    total: '$52.920',
    totalNumero: 52920,
    productos: [
      { id: 'postre-paleta-tunga', producto: 'Paleta Tunga', sabor: 'Chocolate', cajas: 2, precio: 13467 },
      { id: 'postre-paleta-cassatta', producto: 'Paleta Cassatta', sabor: 'Tricolor', cajas: 2, precio: 12844 }
    ],
    observaciones: 'Cobrar en efectivo en caja central.',
    factura: 'NO'
  }
];
