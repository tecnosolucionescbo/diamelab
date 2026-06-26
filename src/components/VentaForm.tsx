// src/components/VentaForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useVentas } from '@/hooks/useVentas';
import { VentaItemFormData, VentaItem } from '@/types';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  razon_social: string;
  rif: string;
}

export default function VentaForm() {
  const router = useRouter();
  const { profile, sede } = useAuth();
  const { createVenta, getTasaActual, isLoading } = useVentas();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tasa, setTasa] = useState(36.5);

  const [formData, setFormData] = useState({
    numero_oe: '',
    correlacion_a2: '',
    cliente_id: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    tasa_aplicada: 36.5,
    notas: '',
  });

  const [items, setItems] = useState<VentaItemFormData[]>([
    { codigo_producto: '', descripcion: '', cantidad: 1, precio_unitario_usd: 0 }
  ]);

  // Cargar clientes y tasa
  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.from('clientes').select('id, razon_social, rif').order('razon_social');
      setClientes(data || []);

      const tasaActual = await getTasaActual();
      setTasa(tasaActual);
      setFormData(prev => ({ ...prev, tasa_aplicada: tasaActual }));
    };
    loadData();
  }, [getTasaActual]);

  const addItem = () => {
    setItems([...items, { codigo_producto: '', descripcion: '', cantidad: 1, precio_unitario_usd: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof VentaItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const totalUSD = items.reduce((sum: number, item: any) => sum + (item.cantidad * item.precio_unitario_usd), 0);
  const totalBSD = totalUSD * formData.tasa_aplicada;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cliente_id) {
      alert('Seleccione un cliente');
      return;
    }

    const venta = await createVenta({ ...formData, items }, items as VentaItem[]);
    if (venta) {
      router.push('/ventas');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nueva Orden de Entrega</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la Venta */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Datos de la Orden</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Numero OE</label>
              <input
                type="text"
                required
                value={formData.numero_oe}
                onChange={(e) => setFormData({ ...formData, numero_oe: e.target.value })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="OE-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correlacion A2</label>
              <input
                type="text"
                required
                value={formData.correlacion_a2}
                onChange={(e) => setFormData({ ...formData, correlacion_a2: e.target.value })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="A2-00001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <select
              required
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon_social} - {c.rif}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Emision</label>
              <input
                type="date"
                required
                value={formData.fecha_emision}
                onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
              <input
                type="date"
                required
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tasa USD (BsD)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.tasa_aplicada}
                onChange={(e) => setFormData({ ...formData, tasa_aplicada: parseFloat(e.target.value) })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">Tasa del dia: {tasa}</p>
            </div>
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
        </div>

        {/* Items de Producto */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold">Items de Producto</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
            >
              + Agregar Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-md">
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Codigo</label>
                  <input
                    type="text"
                    required
                    value={item.codigo_producto}
                    onChange={(e) => updateItem(index, 'codigo_producto', e.target.value)}
                    className="block w-full border rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-gray-600">Descripcion</label>
                  <input
                    type="text"
                    required
                    value={item.descripcion}
                    onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                    className="block w-full border rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value))}
                    className="block w-full border rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-600">Precio Unit. USD</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={item.precio_unitario_usd}
                    onChange={(e) => updateItem(index, 'precio_unitario_usd', parseFloat(e.target.value))}
                    className="block w-full border rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-gray-600">Total USD</p>
                  <p className="text-sm font-medium">${(item.cantidad * item.precio_unitario_usd).toFixed(2)}</p>
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total USD</p>
              <p className="text-2xl font-bold text-blue-900">${totalUSD.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total BsD</p>
              <p className="text-2xl font-bold text-blue-900">Bs. {totalBSD.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tasa Aplicada</p>
              <p className="text-lg font-medium text-blue-800">{formData.tasa_aplicada}</p>
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar Venta'}
          </button>
        </div>
      </form>
    </div>
  );
}
