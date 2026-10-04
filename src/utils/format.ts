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

// Formateador automático de RUT chileno con puntos y guión (ej: 13.455.678-0 ó 76.123.456-K)
export function formatChileanRut(value: string): string {
  const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (!cleaned) return '';
  if (cleaned.length === 1) return cleaned;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

// Formateador automático de celular chileno (+56 9 XXXX XXXX)
export function formatChileanPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  let rest = digits;
  if (rest.startsWith('569')) {
    rest = rest.slice(3);
  } else if (rest.startsWith('56')) {
    rest = rest.slice(2);
  } else if (rest.startsWith('9')) {
    rest = rest.slice(1);
  }

  // Limita a exactamente los 8 dígitos móviles chilenos (imposible pasarse)
  const mobileDigits = rest.slice(0, 8);
  if (!mobileDigits) return '+56 9 ';

  if (mobileDigits.length <= 4) {
    return `+56 9 ${mobileDigits}`;
  }
  return `+56 9 ${mobileDigits.slice(0, 4)} ${mobileDigits.slice(4)}`;
}

export function getChileanPhoneDigitsCount(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('569')) return Math.min(8, digits.slice(3).length);
  if (digits.startsWith('56')) return Math.min(8, digits.slice(2).length);
  if (digits.startsWith('9')) return Math.min(8, digits.slice(1).length);
  return Math.min(8, digits.length);
}

// Generador de número de pedido diario: se reinicia automáticamente a 1 cada nuevo día
export function generateOrderId(): string {
  try {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const lastDate = localStorage.getItem('joly_order_last_date');
    let nextNum = 1;

    // Si es el mismo día, incrementamos el contador del día
    if (lastDate === todayKey) {
      const current = parseInt(localStorage.getItem('joly_order_daily_count') || '0', 10);
      nextNum = current + 1;
    }

    localStorage.setItem('joly_order_last_date', todayKey);
    localStorage.setItem('joly_order_daily_count', nextNum.toString());
    // Limpiamos el contador acumulado histórico anterior para que no interfiera
    localStorage.removeItem('joly_order_counter');

    return `${nextNum}`;
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

  // Encabezado limpio y directo solicitado por la cliente
  lines.push('🍦 PEDIDO MAYORISTA');
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
    const subtotal = formatCLP(item.quantity * item.product.boxPrice);
    // Formato ultra limpio y compacto: solo la cantidad, ya que el encabezado indica (POR CAJAS)
    lines.push(`• ${item.quantity} · ${item.product.name} — ${subtotal}`);
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
