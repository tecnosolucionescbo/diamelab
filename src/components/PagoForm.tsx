// src/components/PagoForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVentas } from '@/hooks/useVentas';
import { Venta, MetodoPago } from '@/types';
import { supabase } from '@/lib/supabase';

interface PagoFormProps {
  ventaId: string;
}

export default function PagoForm({ ventaId }: PagoFormProps) {
  const router = useRouter();
  const { createPago, getTasaActual, isLoading } = useVentas();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [tasa, setTasa] = useState(36.5);
  const [comprobante, setComprobante] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    venta_id: ventaId,
    fecha_pago: new Date().toISOString().split('T')[0],
    monto_pagado_usd: 0,
    tasa_usada: 36.5,
    es_tasa_manual: false,
    metodo_pago: 'transferencia' as MetodoPago,
    referencia_pago: '',
    banco: '',
    notas: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from('ventas')
        .select('*, cliente:clientes(id, razon_social), items:venta_items(*)')
        .eq('id', ventaId)
        .single();

      if (data) {
        setVenta(data as Venta);
        const tasaActual = await getTasaActual();
        setTasa(tasaActual);
        setFormData(prev => ({
          ...prev,
          tasa_usada: tasaActual,
          monto_pagado_usd: data.saldo_pendiente_usd,
        }));
      }
    };
    loadData();
  }, [ventaId, getTasaActual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.monto_pagado_usd <= 0) {
      alert('El monto del pago debe ser mayor a 0');
      return;
    }

    if (formData.monto_pagado_usd > (venta?.saldo_pendiente_usd || 0)) {
      alert('El monto del pago no puede exceder el saldo pendiente');
      return;
    }

    const pago = await createPago({
      ...formData,
      comprobante_file: comprobante,
    });

    if (pago) {
      router.push('/ventas');
    }
  };

  const montoBSD = formData.monto_pagado_usd * formData.tasa_usada;

  if (!venta) return <div className="p-6 text-center">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Registrar Pago</h1>

      {/* Resumen de la Venta */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
        <h3 className="font-semibold text-gray-700 mb-2">Resumen de la Venta</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">OE</p>
            <p className="font-medium">{venta.numero_oe}</p>
          </div>
          <div>
            <p className="text-gray-500">Cliente</p>
            <p className="font-medium">{venta.cliente?.razon_social}</p>
          </div>
          <div>
            <p className="text-gray-500">Saldo Pendiente</p>
            <p className="font-medium text-red-600">${venta.saldo_pendiente_usd.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
            <input
              type="date"
              required
              value={formData.fecha_pago}
              onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto Pagado (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={venta.saldo_pendiente_usd}
              required
              value={formData.monto_pagado_usd}
              onChange={(e) => setFormData({ ...formData, monto_pagado_usd: parseFloat(e.target.value) })}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tasa Usada</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.0001"
                required
                value={formData.tasa_usada}
                onChange={(e) => setFormData({ ...formData, tasa_usada: parseFloat(e.target.value), es_tasa_manual: true })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tasa del dia: {tasa}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Metodo de Pago</label>
            <select
              value={formData.metodo_pago}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value as MetodoPago })}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="divisa">Divisa</option>
              <option value="zelle">Zelle</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Referencia / Nro. Operacion</label>
            <input
              type="text"
              value={formData.referencia_pago}
              onChange={(e) => setFormData({ ...formData, referencia_pago: e.target.value })}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              placeholder="Nro. de referencia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Banco</label>
            <input
              type="text"
              value={formData.banco}
              onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              placeholder="Nombre del banco"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Comprobante de Pago (Captura)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,application/pdf"
            onChange={(e) => setComprobante(e.target.files?.[0] || null)}
            className="mt-1 block w-full border rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">PNG, JPG o PDF</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notas</label>
          <textarea
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            className="mt-1 block w-full border rounded-md px-3 py-2"
            rows={2}
          />
        </div>

        {/* Resumen del Pago */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto en USD</p>
              <p className="text-xl font-bold text-green-900">${formData.monto_pagado_usd.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto en BsD</p>
              <p className="text-xl font-bold text-green-900">Bs. {montoBSD.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/ventas')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Procesando...' : 'Registrar Pago'}
          </button>
        </div>
      </form>
    </div>
  );
}
