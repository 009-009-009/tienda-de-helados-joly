import React, { useState } from 'react';
import { CartItem, CustomerData, InvoiceData, WHATSAPP_PHONE, WHATSAPP_DISPLAY } from '../data/catalog';
import { 
  formatCLP, 
  formatBoxes, 
  buildWhatsAppMessage, 
  getWhatsAppUrl, 
  generateOrderId,
  formatChileanRut,
  formatChileanPhone,
  getChileanPhoneDigitsCount
} from '../utils/format';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Send, 
  Copy, 
  FileText, 
  CreditCard, 
  Building2, 
  User, 
  MapPin, 
  Phone 
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isOrderSent, setIsOrderSent] = useState(false);

  const [customer, setCustomer] = useState<CustomerData & { paymentMethod: string; observations: string }>({
    firstName: '',
    lastName: '',
    phone: '',
    businessName: '',
    sector: '',
    address: '',
    paymentMethod: 'Efectivo',
    observations: ''
  });

  const [invoice, setInvoice] = useState<InvoiceData>({
    needsInvoice: false,
    businessName: '',
    rut: '',
    activity: '',
    address: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResetCustomer = () => {
    setCustomer({
      firstName: '',
      lastName: '',
      phone: '',
      businessName: '',
      sector: '',
      address: '',
      paymentMethod: 'Efectivo',
      observations: ''
    });
    setInvoice({
      needsInvoice: false,
      businessName: '',
      rut: '',
      activity: '',
      address: ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  const totalBoxes = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.product.boxPrice, 0);

  const validateCustomer = () => {
    const newErrors: Record<string, string> = {};
    if (!customer.firstName.trim()) newErrors.firstName = 'Ingresa el nombre del contacto';
    if (!customer.lastName.trim()) newErrors.lastName = 'Ingresa el apellido';
    if (!customer.businessName.trim()) newErrors.businessName = 'Ingresa el nombre de tu negocio o local';
    
    const phoneCount = getChileanPhoneDigitsCount(customer.phone);
    if (!customer.phone.trim()) {
      newErrors.phone = 'Ingresa un teléfono de contacto';
    } else if (phoneCount < 8) {
      newErrors.phone = `Faltan números: debes ingresar los 8 dígitos del celular (${phoneCount}/8)`;
    }

    if (!customer.sector.trim()) newErrors.sector = 'Ingresa el sector o comuna';
    if (!customer.address.trim()) newErrors.address = 'Ingresa la dirección de entrega';

    if (invoice.needsInvoice) {
      if (!invoice.businessName.trim()) newErrors.invoiceBusinessName = 'Ingresa la razón social';
      
      const cleanRut = invoice.rut.replace(/[^0-9kK]/g, '');
      if (!invoice.rut.trim()) {
        newErrors.invoiceRut = 'Ingresa el RUT de la empresa';
      } else if (cleanRut.length < 8) {
        newErrors.invoiceRut = 'Ingresa un RUT completo (mínimo 8 dígitos con su dígito verificador)';
      }

      if (!invoice.activity.trim()) newErrors.invoiceActivity = 'Ingresa el giro comercial';
      if (!invoice.address.trim()) newErrors.invoiceAddress = 'Ingresa la dirección tributaria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoToCustomerForm = () => {
    if (cart.length === 0) return;
    setStep(2);
  };

  const handleGoToConfirmation = () => {
    if (validateCustomer()) {
      if (!orderId) {
        const newId = generateOrderId();
        setOrderId(newId);
      }
      setStep(3);
    }
  };

  const orderMessage = buildWhatsAppMessage(cart, customer, invoice, orderId || '1');

  const handleSendWhatsApp = () => {
    const url = getWhatsAppUrl(WHATSAPP_PHONE, orderMessage);
    window.open(url, '_blank');
    // Vaciar carrito automáticamente para que no queden productos pegados
    onClearCart();
    setIsOrderSent(true);
  };

  const handleNewOrderDifferentClient = () => {
    onClearCart();
    handleResetCustomer();
    setIsOrderSent(false);
    setOrderId('');
    setStep(1);
    onClose();
  };

  const handleNewOrderSameClient = () => {
    onClearCart();
    setCustomer((prev) => ({ ...prev, observations: '' }));
    setInvoice((prev) => ({ ...prev, needsInvoice: false }));
    setIsOrderSent(false);
    setOrderId('');
    setStep(1);
    onClose();
  };

  const handleCloseModal = () => {
    if (isOrderSent) {
      setIsOrderSent(false);
      setOrderId('');
      setStep(1);
    }
    onClose();
  };

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(orderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#28AEE4]/20 border border-[#28AEE4]/40 flex items-center justify-center text-[#EEFF00]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#EEFF00] bg-[#EEFF00]/10 px-2 py-0.5 rounded border border-[#EEFF00]/30">
                  Paso {step} de 3
                </span>
                <span className="text-xs text-slate-400">
                  {step === 1 && 'Revisar Cajas'}
                  {step === 2 && 'Datos del Negocio y Despacho'}
                  {step === 3 && 'Enviar por WhatsApp'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {step === 1 && 'Tu Pedido por Mayor'}
                {step === 2 && 'Información de Entrega'}
                {step === 3 && 'Confirmación de Pedido'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* PASO 1: LISTADO DE PRODUCTOS */}
          {step === 1 && (
            <div>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                    <ShoppingBag className="w-8 h-8 opacity-40" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Tu carro de cajas está vacío</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Selecciona las cajas de Cassatas, helados individuales o postres para tu negocio.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#28AEE4] hover:bg-[#209bcc] text-white font-bold text-xs"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span>{totalBoxes} {totalBoxes === 1 ? 'caja seleccionada' : 'cajas seleccionadas'}</span>
                    <button
                      onClick={onClearCart}
                      className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vaciar pedido</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Caja de {item.product.unitsPerBox} un. · {formatCLP(item.product.boxPrice)} c/caja
                          </p>
                        </div>

                        {/* Cantidad de cajas */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="w-7 h-7 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="w-7 h-7 rounded bg-[#28AEE4] hover:bg-[#209bcc] flex items-center justify-center text-white transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="w-20 text-right text-sm font-bold text-[#0284c7]">
                            {formatCLP(item.quantity * item.product.boxPrice)}
                          </span>

                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-1 text-slate-400 hover:text-red-500"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen de totales */}
                  <div className="mt-4 p-4 rounded-2xl bg-sky-50 border border-sky-100 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Total de Cajas:</span>
                      <span className="font-bold text-slate-900">{totalBoxes} cajas</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-sky-200/60">
                      <span>Total Estimado:</span>
                      <span className="text-xl text-[#0284c7]">{formatCLP(totalAmount)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      🚚 Despacho gratuito en zonas de cobertura prioritario antes de las 11:00 AM.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: FORMULARIO DE CLIENTE Y FACTURA */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Datos de Entrega y Despacho
                </span>
                <button
                  type="button"
                  onClick={handleResetCustomer}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold underline underline-offset-2 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar datos / Nuevo cliente</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nombre de contacto *
                  </label>
                  <input
                    type="text"
                    value={customer.firstName}
                    onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                    placeholder="Ej. Carlos"
                    className={`w-full h-10 px-3 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#28AEE4]/20 ${
                      errors.firstName ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.firstName && <span className="text-[11px] text-red-500">{errors.firstName}</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={customer.lastName}
                    onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                    placeholder="Ej. González"
                    className={`w-full h-10 px-3 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#28AEE4]/20 ${
                      errors.lastName ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.lastName && <span className="text-[11px] text-red-500">{errors.lastName}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Nombre del Negocio o Local *
                  </label>
                  <input
                    type="text"
                    value={customer.businessName}
                    onChange={(e) => setCustomer({ ...customer, businessName: e.target.value })}
                    placeholder="Ej. Almacén Don Carlos"
                    className={`w-full h-10 px-3 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#28AEE4]/20 ${
                      errors.businessName ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.businessName && <span className="text-[11px] text-red-500">{errors.businessName}</span>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Teléfono de contacto (WhatsApp) *
                    </label>
                    {customer.phone && (
                      <span className={`text-[10px] font-bold ${
                        getChileanPhoneDigitsCount(customer.phone) === 8 
                          ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200' 
                          : 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200'
                      }`}>
                        {getChileanPhoneDigitsCount(customer.phone) === 8 
                          ? '✓ 8 de 8 dígitos' 
                          : `${getChileanPhoneDigitsCount(customer.phone)}/8 dígitos`}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => {
                      const formatted = formatChileanPhone(e.target.value);
                      setCustomer({ ...customer, phone: formatted });
                    }}
                    placeholder="+56 9 3456 7899"
                    maxLength={16}
                    className={`w-full h-10 px-3 text-sm font-medium bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#28AEE4]/20 ${
                      errors.phone ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.phone ? (
                    <span className="text-[11px] text-red-500 mt-0.5 block">{errors.phone}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Formato chileno: escribe los 8 números y se ordenan solos (+56 9 XXXX XXXX)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Sector o Comuna *
                  </label>
                  <input
                    type="text"
                    value={customer.sector}
                    onChange={(e) => setCustomer({ ...customer, sector: e.target.value })}
                    placeholder="Ej. Maipú / La Florida"
                    className={`w-full h-10 px-3 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#28AEE4]/20 ${
                      errors.sector ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.sector && <span className="text-[11px] text-red-500">{errors.sector}</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Dirección de entrega *
                  </label>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Ej. Av. Los Pajaritos 1234"
                    className={`w-full h-10 px-3 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#28AEE4]/20 ${
                      errors.address ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.address && <span className="text-[11px] text-red-500">{errors.address}</span>}
                </div>
              </div>

              {/* Forma de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Forma de Pago preferida
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, paymentMethod: 'Efectivo' })}
                    className={`p-3 rounded-xl border text-left font-semibold text-xs flex items-center justify-between transition-colors ${
                      customer.paymentMethod === 'Efectivo'
                        ? 'border-[#28AEE4] bg-sky-50 text-[#0284c7] ring-1 ring-[#28AEE4]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>Efectivo contra entrega</span>
                    {customer.paymentMethod === 'Efectivo' && <Check className="w-4 h-4 text-[#0284c7]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomer({ ...customer, paymentMethod: 'Transferencia' })}
                    className={`p-3 rounded-xl border text-left font-semibold text-xs flex items-center justify-between transition-colors ${
                      customer.paymentMethod === 'Transferencia'
                        ? 'border-[#28AEE4] bg-sky-50 text-[#0284c7] ring-1 ring-[#28AEE4]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>Transferencia bancaria</span>
                    {customer.paymentMethod === 'Transferencia' && <Check className="w-4 h-4 text-[#0284c7]" />}
                  </button>
                </div>
              </div>

              {/* Toggle Factura */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.needsInvoice}
                    onChange={(e) => setInvoice({ ...invoice, needsInvoice: e.target.checked })}
                    className="w-4 h-4 text-[#28AEE4] rounded border-slate-300 focus:ring-[#28AEE4]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    ¿Necesitas Factura para tu negocio?
                  </span>
                </label>

                {invoice.needsInvoice && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Razón Social *</label>
                        <input
                          type="text"
                          value={invoice.businessName}
                          onChange={(e) => setInvoice({ ...invoice, businessName: e.target.value })}
                          placeholder="Ej. Comercializadora SpA"
                          className={`w-full h-9 px-2.5 text-xs bg-white border rounded-lg ${
                            errors.invoiceBusinessName ? 'border-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.invoiceBusinessName && (
                          <span className="text-[10px] text-red-500 block mt-0.5">{errors.invoiceBusinessName}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[11px] font-semibold text-slate-600">RUT Empresa *</label>
                          {invoice.rut && invoice.rut.replace(/[^0-9kK]/g, '').length >= 8 && (
                            <span className="text-[10px] font-bold text-emerald-600">✓ Formato listo</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={invoice.rut}
                          onChange={(e) => {
                            const formatted = formatChileanRut(e.target.value);
                            setInvoice({ ...invoice, rut: formatted });
                          }}
                          placeholder="Ej. 13.455.678-0"
                          maxLength={12}
                          className={`w-full h-9 px-2.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28AEE4]/20 ${
                            errors.invoiceRut ? 'border-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.invoiceRut ? (
                          <span className="text-[10px] text-red-500 block mt-0.5">{errors.invoiceRut}</span>
                        ) : (
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            Puntos y guión automáticos (ej. 13.455.678-0)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Giro Comercial *</label>
                        <input
                          type="text"
                          value={invoice.activity}
                          onChange={(e) => setInvoice({ ...invoice, activity: e.target.value })}
                          placeholder="Minimarket, Heladería, etc."
                          className={`w-full h-9 px-2.5 text-xs bg-white border rounded-lg ${
                            errors.invoiceActivity ? 'border-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.invoiceActivity && (
                          <span className="text-[10px] text-red-500 block mt-0.5">{errors.invoiceActivity}</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Dirección Tributaria *</label>
                        <input
                          type="text"
                          value={invoice.address}
                          onChange={(e) => setInvoice({ ...invoice, address: e.target.value })}
                          placeholder="Dirección fiscal"
                          className={`w-full h-9 px-2.5 text-xs bg-white border rounded-lg ${
                            errors.invoiceAddress ? 'border-red-400' : 'border-slate-200'
                          }`}
                        />
                        {errors.invoiceAddress && (
                          <span className="text-[10px] text-red-500 block mt-0.5">{errors.invoiceAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Observaciones especiales de entrega (Opcional):
                </label>
                <textarea
                  value={customer.observations}
                  onChange={(e) => setCustomer({ ...customer, observations: e.target.value })}
                  placeholder="Ej. Dejar en bodega trasera, llamar al llegar..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* PASO 3: CONFIRMACIÓN Y ENVÍO POR WHATSAPP */}
          {step === 3 && (
            <div className="space-y-4">
              {isOrderSent ? (
                <div className="py-4 px-2 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Check className="w-9 h-9 stroke-[3]" />
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-slate-900">
                      ¡Pedido N° {orderId} Enviado con Éxito!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      Tu pedido se abrió en WhatsApp y el carrito se ha vaciado automáticamente.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 text-left max-w-md mx-auto space-y-1">
                    <p className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-1">
                      Resumen del pedido registrado:
                    </p>
                    <p><strong>Cliente:</strong> {customer.firstName} {customer.lastName}</p>
                    <p><strong>Negocio:</strong> {customer.businessName}</p>
                    <p><strong>Dirección:</strong> {customer.address}, {customer.sector}</p>
                    <p><strong>Pago:</strong> {customer.paymentMethod}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-2">
                    <button
                      type="button"
                      onClick={handleNewOrderDifferentClient}
                      className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      Hacer otro pedido (Nuevo cliente)
                    </button>

                    <button
                      type="button"
                      onClick={handleNewOrderSameClient}
                      className="flex-1 py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                    >
                      Hacer otro pedido (Mismo cliente)
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm">
                        ¡Pedido N° {orderId} listo para enviar!
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Envía el detalle oficial a nuestro WhatsApp mayorista ({WHATSAPP_DISPLAY}) con un solo clic.
                      </p>
                    </div>
                  </div>

                  {/* Previsualización del mensaje */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                    {orderMessage}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Pedido por WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyOrder}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar texto</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Footer con botones de navegación */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isOrderSent && step > 1 ? (
            <button
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
          ) : (
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors"
            >
              {isOrderSent ? 'Cerrar y volver al catálogo' : 'Cerrar'}
            </button>
          )}

          {step === 1 && cart.length > 0 && (
            <button
              onClick={handleGoToCustomerForm}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Continuar con Datos de Entrega</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleGoToConfirmation}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Revisar y Enviar Pedido</span>
              <ArrowRight className="w-4 h-4 text-[#EEFF00]" />
            </button>
          )}

          {step === 3 && !isOrderSent && (
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Volver a la tienda
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
