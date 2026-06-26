// src/hooks/useVentas.ts
// Hook para CRUD de ventas y pagos

'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Venta, VentaFormData, PagoFormData, VentaItem } from '@/types';

export function useVentas() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener ventas (con filtros opcionales)
  const getVentas = useCallback(async (filters?: {
    vendedor_id?: string;
    sede?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    let query = supabase
      .from('ventas')
      .select(`
        *,
        cliente:clientes(id, razon_social, rif),
        vendedor:profiles(id, full_name, sede),
        items:venta_items(*),
        pagos:pagos(*),
        retenciones:retenciones(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.vendedor_id) {
      query = query.eq('vendedor_id', filters.vendedor_id);
    }
    if (filters?.sede) {
      query = query.eq('sede', filters.sede);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }
    if (filters?.fecha_desde) {
      query = query.gte('fecha_emision', filters.fecha_desde);
    }
    if (filters?.fecha_hasta) {
      query = query.lte('fecha_emision', filters.fecha_hasta);
    }

    const { data, error: err } = await query;
    setIsLoading(false);

    if (err) {
      setError(err.message);
      return [];
    }

    return (data || []) as Venta[];
  }, []);

  // Crear nueva venta con items
  const createVenta = useCallback(async (ventaData: VentaFormData, items: VentaItem[]) => {
    setIsLoading(true);
    setError(null);

    // 1. Calcular totales
    const montoTotalUSD = items.reduce((sum: number, item: any) => sum + (item.cantidad * item.precio_unitario_usd), 0);
    const montoTotalBSD = montoTotalUSD * ventaData.tasa_aplicada;

    // 2. Insertar venta
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert({
        numero_oe: ventaData.numero_oe,
        correlacion_a2: ventaData.correlacion_a2,
        cliente_id: ventaData.cliente_id,
        fecha_emision: ventaData.fecha_emision,
        fecha_vencimiento: ventaData.fecha_vencimiento,
        tasa_aplicada: ventaData.tasa_aplicada,
        monto_total_usd: montoTotalUSD,
        monto_total_bsd: montoTotalBSD,
        saldo_pendiente_usd: montoTotalUSD,
        notas: ventaData.notas,
      })
      .select()
      .single();

    if (ventaError) {
      setError(ventaError.message);
      setIsLoading(false);
      return null;
    }

    // 3. Insertar items
    const itemsToInsert = items.map(item => ({
      venta_id: venta.id,
      codigo_producto: item.codigo_producto,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario_usd: item.precio_unitario_usd,
    }));

    const { error: itemsError } = await supabase
      .from('venta_items')
      .insert(itemsToInsert);

    if (itemsError) {
      setError(itemsError.message);
      setIsLoading(false);
      return null;
    }

    setIsLoading(false);
    return venta as Venta;
  }, []);

  // Registrar pago
  const createPago = useCallback(async (pagoData: PagoFormData) => {
    setIsLoading(true);
    setError(null);

    let comprobanteUrl = null;

    // 1. Subir comprobante si existe
    if (pagoData.comprobante_file) {
      const fileExt = pagoData.comprobante_file.name.split('.').pop();
      const fileName = `${pagoData.venta_id}_${Date.now()}.${fileExt}`;
      const filePath = `${pagoData.venta_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('comprobantes-pago')
        .upload(filePath, pagoData.comprobante_file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setIsLoading(false);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('comprobantes-pago')
        .getPublicUrl(filePath);

      comprobanteUrl = publicUrl;
    }

    // 2. Calcular monto en BsD
    const montoPagadoBSD = pagoData.monto_pagado_usd * pagoData.tasa_usada;

    // 3. Insertar pago
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .insert({
        venta_id: pagoData.venta_id,
        fecha_pago: pagoData.fecha_pago,
        monto_pagado_usd: pagoData.monto_pagado_usd,
        monto_pagado_bsd: montoPagadoBSD,
        tasa_usada: pagoData.tasa_usada,
        es_tasa_manual: pagoData.es_tasa_manual,
        metodo_pago: pagoData.metodo_pago,
        referencia_pago: pagoData.referencia_pago || null,
        banco: pagoData.banco || null,
        comprobante_url: comprobanteUrl,
        notas: pagoData.notas || null,
      })
      .select()
      .single();

    if (pagoError) {
      setError(pagoError.message);
      setIsLoading(false);
      return null;
    }

    setIsLoading(false);
    return pago;
  }, []);

  // Obtener tasa del dia
  const getTasaActual = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tasas_bcv')
      .select('*')
      .eq('fecha', today)
      .single();

    if (error || !data) {
      // Si no hay tasa de hoy, obtener la mas reciente
      const { data: lastTasa } = await supabase
        .from('tasas_bcv')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(1)
        .single();
      return lastTasa?.tasa_usd ?? 36.5;
    }

    return data.tasa_usd;
  }, []);

  return {
    isLoading,
    error,
    getVentas,
    createVenta,
    createPago,
    getTasaActual,
  };
}
