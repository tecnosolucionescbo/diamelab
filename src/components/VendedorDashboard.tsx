// src/components/VendedorDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useVentas } from '@/hooks/useVentas';
import { Venta } from '@/types';

export default function VendedorDashboard() {
  const { profile } = useAuth();
  const { getVentas } = useVentas();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [stats, setStats] = useState({ total: 0, pendientes: 0, monto: 0 });

  useEffect(() => {
    const loadData = async () => {
      if (!profile) return;
      const data = await getVentas({ vendedor_id: profile.id });
      setVentas(data);
      setStats({
        total: data.length,
        pendientes: data.filter(v => v.estado === 'pendiente').length,
        monto: data.reduce((sum: number, v: any) => sum + v.monto_total_usd, 0),
      });
    };
    loadData();
  }, [getVentas, profile]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Bienvenido, {profile?.full_name}</h1>
      <p className="text-gray-600 mb-6">Sede: {profile?.sede}</p>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Mis Ventas</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Monto Total USD</p>
          <p className="text-2xl font-bold text-green-600">${stats.monto.toFixed(2)}</p>
        </div>
      </div>

      {/* Acciones Rapidas */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/ventas/nueva"
          className="bg-blue-600 text-white p-6 rounded-lg text-center hover:bg-blue-700 transition"
        >
          <p className="text-lg font-semibold">+ Nueva Venta</p>
          <p className="text-sm opacity-80">Registrar orden de entrega</p>
        </Link>
        <Link
          href="/ventas"
          className="bg-gray-100 text-gray-800 p-6 rounded-lg text-center hover:bg-gray-200 transition"
        >
          <p className="text-lg font-semibold">Ver Mis Ventas</p>
          <p className="text-sm opacity-80">Consultar y registrar pagos</p>
        </Link>
      </div>

      {/* Ventas Pendientes */}
      <div className="bg-white rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold p-4 border-b">Ventas Pendientes</h2>
        <div className="divide-y">
          {ventas.filter(v => v.estado !== 'pagada').slice(0, 5).map((venta) => (
            <div key={venta.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-medium">{venta.numero_oe}</p>
                <p className="text-sm text-gray-500">Vence: {venta.fecha_vencimiento}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${venta.saldo_pendiente_usd.toFixed(2)}</p>
                <Link
                  href={`/ventas/${venta.id}/pago`}
                  className="text-sm text-green-600 hover:underline"
                >
                  Registrar Pago
                </Link>
              </div>
            </div>
          ))}
          {ventas.filter(v => v.estado !== 'pagada').length === 0 && (
            <p className="p-4 text-center text-gray-500">No tienes ventas pendientes</p>
          )}
        </div>
      </div>
    </div>
  );
}
