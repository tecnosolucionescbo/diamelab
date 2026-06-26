// src/types/index.ts
// Tipos globales del Sistema Diamelad

export type RolUsuario = 'admin' | 'vendedor_bolivar' | 'vendedor_guayana' | 'vendedor_maturin';
export type SedeEmpresa = 'Ciudad Bolivar' | 'Ciudad Guayana' | 'Maturin';
export type EstadoVenta = 'pendiente' | 'parcial' | 'pagada' | 'vencida' | 'anulada';
export type MetodoPago = 'transferencia' | 'efectivo' | 'divisa' | 'zelle' | 'otro';
export type TipoRetencion = 'IVA' | 'ISLR';
export type TipoNotificacion = 'nueva_venta' | 'pago_registrado' | 'vencimiento_proximo' | 'venta_vencida' | 'sistema';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: RolUsuario;
  sede: SedeEmpresa | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TasaBCV {
  id: number;
  fecha: string;
  tasa_usd: number;
  fuente: string;
  es_manual: boolean;
  created_by?: string;
  created_at: string;
}

export interface Cliente {
  id: string;
  razon_social: string;
  rif: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  codigo_producto: string;
  descripcion: string;
  cantidad: number;
  precio_unitario_usd: number;
  total_item_usd: number;
  created_at: string;
}

export interface Venta {
  id: string;
  numero_oe: string;
  correlacion_a2: string;
  cliente_id: string;
  vendedor_id: string;
  sede: SedeEmpresa;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_total_usd: number;
  monto_total_bsd: number | null;
  tasa_aplicada: number;
  saldo_pendiente_usd: number;
  estado: EstadoVenta;
  notas: string | null;
  created_at: string;
  updated_at: string;

  // Relaciones (opcionales, se cargan con join)
  cliente?: Cliente;
  vendedor?: Profile;
  items?: VentaItem[];
  pagos?: Pago[];
  retenciones?: Retencion[];
}

export interface Pago {
  id: string;
  venta_id: string;
  vendedor_id: string;
  fecha_pago: string;
  monto_pagado_usd: number;
  monto_pagado_bsd: number | null;
  tasa_usada: number;
  es_tasa_manual: boolean;
  metodo_pago: MetodoPago;
  referencia_pago: string | null;
  banco: string | null;
  comprobante_url: string | null;
  notas: string | null;
  created_at: string;
}

export interface Retencion {
  id: string;
  venta_id: string;
  tipo: TipoRetencion;
  porcentaje: number;
  monto_retenido_usd: number;
  fecha_retencion: string;
  numero_comprobante: string | null;
  comprobante_url: string | null;
  created_at: string;
}

export interface Notificacion {
  id: string;
  user_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  data: Record<string, any> | null;
  leida: boolean;
  created_at: string;
}

export interface VentaFormData {
  numero_oe: string;
  correlacion_a2: string;
  cliente_id: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  tasa_aplicada: number;
  notas: string;
  items: VentaItemFormData[];
}

export interface VentaItemFormData {
  codigo_producto: string;
  descripcion: string;
  cantidad: number;
  precio_unitario_usd: number;
}

export interface PagoFormData {
  venta_id: string;
  fecha_pago: string;
  monto_pagado_usd: number;
  tasa_usada: number;
  es_tasa_manual: boolean;
  metodo_pago: MetodoPago;
  referencia_pago: string;
  banco: string;
  notas: string;
  comprobante_file?: File | null;
}

export interface RetencionFormData {
  venta_id: string;
  tipo: TipoRetencion;
  porcentaje: number;
  monto_retenido_usd: number;
  fecha_retencion: string;
  numero_comprobante: string;
  comprobante_file?: File | null;
}
