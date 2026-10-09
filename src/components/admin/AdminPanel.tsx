import React, { useState } from 'react';
import { AdminSectionId, AdminNavItem } from '../../types/admin';
import { InventorySection } from './InventorySection';
import { 
  Package, 
  ClipboardList, 
  Truck, 
  Wallet, 
  BarChart3, 
  Store, 
  Users,
  Menu,
  X,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { JOLY_OFFICIAL_LOGO } from '../../assets/officialLogo';

interface AdminPanelProps {
  onVolverTienda: () => void;
  onIrAVendedor: () => void;
}

export function AdminPanel({ onVolverTienda, onIrAVendedor }: AdminPanelProps) {
  // Sección activa por defecto: 'inventario' para ver inmediatamente el módulo y sus datos
  const [activeSection, setActiveSection] = useState<AdminSectionId>('inventario');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lista de accesos de navegación según la estructura definida
  const navItems: (AdminNavItem & { icon: React.ReactNode })[] = [
    {
      id: 'inventario',
      label: 'Inventario y recepción',
      sublabel: 'Bodega y furgones',
      badge: 'Activo',
      badgeVariant: 'info',
      icon: <Package className="w-5 h-5" />
    },
    {
      id: 'pedidos',
      label: 'Pedidos',
      sublabel: 'Recepción de clientes',
      badge: 'Próximo',
      icon: <ClipboardList className="w-5 h-5" />
    },
    {
      id: 'rutas',
      label: 'Preparación de rutas',
      sublabel: 'Carga de furgones',
      badge: 'Próximo',
      icon: <Truck className="w-5 h-5" />
    },
    {
      id: 'seguimiento',
      label: 'Seguimiento vendedores',
      sublabel: 'Monitoreo en ruta',
      badge: 'Próximo',
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 'cobranza',
      label: 'Cuentas por cobrar',
      sublabel: 'Créditos y saldos',
      badge: 'Próximo',
      icon: <Wallet className="w-5 h-5" />
    },
    {
      id: 'cierres',
      label: 'Historial de cierres',
      sublabel: 'Rendición diaria',
      badge: 'Próximo',
      icon: <BarChart3 className="w-5 h-5" />
    }
  ];

  const currentNav = navItems.find((item) => item.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 font-sans flex flex-col md:flex-row">
      
      {/* ------------------------------------------------------------- */}
      {/* BARRA LATERAL (SIDEBAR): AZUL MARINO PROFESIONAL              */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-full md:w-64 lg:w-72 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800">
        
        {/* Cabecera del sidebar con logo y título */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs shrink-0">
              <img 
                src={JOLY_OFFICIAL_LOGO} 
                alt="JOLY" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                Administración Central
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                JOLY Helados • Temuco
              </p>
            </div>
          </div>

          {/* Botón menú móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Lista de navegación */}
        <div className={`flex-1 p-3 space-y-1 overflow-y-auto ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Módulos del Sistema
          </div>

          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm truncate font-medium">
                      {item.label}
                    </div>
                    <div className={`text-[11px] truncate ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeVariant === 'info'
                        ? 'bg-sky-950 text-sky-300 border border-sky-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Acceso rápido inferior (Furgón y Tienda) */}
        <div className={`p-3 border-t border-slate-800 space-y-2 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Accesos Rápidos
          </div>

          <button
            type="button"
            onClick={onIrAVendedor}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-sky-300 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Panel del Furgón</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onVolverTienda}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <Store className="w-4 h-4 text-slate-400" />
              <span>Tienda de Clientes</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <div className="pt-2 px-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Administración segura</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">v1.2</span>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* CONTENIDO PRINCIPAL: GRIS CLARO Y BLANCO                      */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100/70 overflow-y-auto">
        
        {/* Barra superior de información */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 sticky top-0 z-10 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Administración Central</span>
              <span>/</span>
              <span className="font-semibold text-slate-900">{currentNav?.label}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {currentNav?.label}
            </h2>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
              Modo Demostración
            </span>

            <button
              type="button"
              onClick={onVolverTienda}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1.5"
            >
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Tienda</span>
            </button>
          </div>
        </header>

        {/* Cuerpo del contenido según la sección activa */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {activeSection === 'inventario' && (
            <InventorySection />
          )}

          {activeSection === 'pedidos' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Módulo de Pedidos Centrales
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                En esta sección se recibirán y ordenarán los pedidos ingresados por los clientes en la tienda o generados por ingreso manual, antes de ser asignados al furgón de reparto correspondiente.
              </p>
              <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
                Fase siguiente: Integración de pedidos y asignación matutina
              </span>
            </div>
          )}

          {activeSection === 'rutas' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Preparación de Rutas y Carga de Furgones
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Organización de la carga diaria: define los pedidos asignados a Furgón 1 y Furgón 2, y las cajas adicionales de stock para ventas directas en calle antes del inicio de la jornada.
              </p>
              <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
                Fase siguiente: Planilla de carga y despacho
              </span>
            </div>
          )}

          {activeSection === 'seguimiento' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Seguimiento de Vendedores en Ruta
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Visualización del avance de las entregas del día, pedidos entregados, cobros efectuados y ubicación estimada del furgón durante su jornada.
              </p>
              <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
                Fase siguiente: Monitoreo operativo en ruta
              </span>
            </div>
          )}

          {activeSection === 'cobranza' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Cuentas por Cobrar y Saldos Pendientes
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Registro de clientes con línea de crédito, saldos pendientes de pago, control de abonos recibidos y estado de cobranza general de la distribuidora.
              </p>
              <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
                Fase siguiente: Registro de cobranzas y abonos
              </span>
            </div>
          )}

          {activeSection === 'cierres' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Historial de Cierres de Ruta y Rendición
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Consulta y auditoría de los cierres de jornada: cuadratura de dinero en efectivo y transferencias, cajas devueltas a bodega central y revisión de diferencias.
              </p>
              <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
                Fase siguiente: Auditoría de cierres y archivo histórico
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
