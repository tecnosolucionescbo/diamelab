// src/components/VentasList.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useVentas } from '@/hooks/useVentas';
import { useAuth } from '@/hooks/useAuth';
import { Venta } from '@/types';

export default function VentasList() {
  const { getVentas } = useVentas();
  const { profile, isAdmin } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVentas = async () => {
      setIsLoading(true);
      const filters: any = {};
      if (!isAdmin && profile) {
        filters.vendedor_id = profile.id;
      }
      const data = await getVentas(filters);
      setVentas(data);
      setIsLoading(false);
    };
    loadVentas();
  }, [getVentas, isAdmin, profile]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagada': return 'bg-green-100 text-green-800';
      case 'parcial': return 'bg-yellow-100 text-yellow-800';
      case 'pendiente': return 'bg-blue-100 text-blue-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="p-6 text-center">Cargando ventas...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ordenes de Entrega</h1>
        <Link
          href="/ventas/nueva"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Nueva Venta
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correlacion A2</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto USD</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventas.map((venta) => (
              <tr key={venta.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {venta.numero_oe}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {venta.correlacion_a2}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {venta.cliente?.razon_social}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${venta.monto_total_usd.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${venta.saldo_pendiente_usd.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(venta.estado)}`}>
                    {venta.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {venta.fecha_vencimiento}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venta.vendedor?.full_name}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/ventas/${venta.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Ver
                  </Link>
                  {venta.estado !== 'pagada' && (
                    <Link
                      href={`/ventas/${venta.id}/pago`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Pagar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ventas.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay ventas registradas.
          </div>
        )}
      </div>
    </div>
  );
}
