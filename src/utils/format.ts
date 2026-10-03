import { CartItem, CustomerData, InvoiceData } from '../data/catalog';

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatBoxes(quantity: number): string {
  return quantity === 1 ? '1 caja' : `${quantity} cajas`;
}

// Generador de número de pedido correlativo simple y limpio (1, 2, 3, etc.)
export function generateOrderId(): string {
  try {
    const current = parseInt(localStorage.getItem('joly_order_counter') || '0', 10);
    const next = current + 1;
    localStorage.setItem('joly_order_counter', next.toString());
    return `${next}`;
  } catch {
    return '1';
  }
}

export function getCurrentDateTime(): { date: string; time: string } {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())} hrs`;
  return { date, time };
}

export function buildWhatsAppMessage(
  cart: CartItem[],
  customer: CustomerData & { paymentMethod: string; observations?: string },
  invoice: InvoiceData,
  orderId: string
): string {
  const { date, time } = getCurrentDateTime();
  const lines: string[] = [];

  lines.push('🍦 JOLY & HELADOS PANDA — PEDIDO MAYORISTA');
  lines.push(`🔖 PEDIDO N°: ${orderId}`);
  lines.push(`📅 FECHA: ${date}  ⏰ HORA: ${time}`);
  lines.push('🚚 Despacho Tempranito');
  lines.push('──────────────────────────────');
  lines.push('');
  lines.push(`👤 CLIENTE: ${customer.firstName.trim()} ${customer.lastName.trim()}`);
  lines.push(`🏪 NEGOCIO: ${customer.businessName.trim()}`);
  lines.push(`📍 SECTOR: ${customer.sector.trim()}`);
  lines.push(`🏠 DIRECCIÓN: ${customer.address.trim()}`);
  lines.push(`📞 TELÉFONO: ${customer.phone.trim()}`);
  lines.push('');
  lines.push('📦 DETALLE DEL PEDIDO (POR CAJAS):');

  cart.forEach((item) => {
    const boxes = formatBoxes(item.quantity);
    const subtotal = formatCLP(item.quantity * item.product.boxPrice);
    // Formato limpio sin (un/caja) repetitivo solicitado por la cliente
    lines.push(`• ${boxes} · ${item.product.name} — ${subtotal}`);
  });

  const total = cart.reduce((sum, item) => sum + item.quantity * item.product.boxPrice, 0);

  // Total integrado directamente al flujo del pedido sin línea separadora intermedia
  lines.push(`💰 TOTAL A PAGAR: ${formatCLP(total)}`);
  lines.push(`💳 FORMA DE PAGO: ${customer.paymentMethod}`);

  if (customer.observations && customer.observations.trim().length > 0) {
    lines.push('');
    lines.push(`📝 OBSERVACIÓN: ${customer.observations.trim()}`);
  }

  if (invoice.needsInvoice) {
    lines.push('');
    lines.push('──────────────────────────────');
    lines.push('📄 DATOS PARA FACTURA:');
    lines.push(`• Razón social: ${invoice.businessName.trim()}`);
    lines.push(`• RUT: ${invoice.rut.trim()}`);
    lines.push(`• Giro: ${invoice.activity.trim()}`);
    lines.push(`• Dirección: ${invoice.address.trim()}`);
  }

  return lines.join('\n');
}

export function getWhatsAppUrl(phone: string, text: string): string {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}
