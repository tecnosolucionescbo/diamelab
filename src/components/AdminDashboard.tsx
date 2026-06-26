// src/components/AdminDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Venta } from '@/types';

interface DashboardStats {
  totalVentas: number;
  totalMontoUSD: number;
  ventasPendientes: number;
  ventasVencidas: number;
  pagosHoy: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVentas: 0,
    totalMontoUSD: 0,
    ventasPendientes: 0,
    ventasVencidas: 0,
    pagosHoy: 0,
  });
  const [ventasRecientes, setVentasRecientes] = useState<Venta[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const { data: ventas } = await supabase
        .from('ventas')
        .select('*')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const { data: vencidas } = await supabase
        .from('ventas')
        .select('*')
        .eq('estado', 'vencida');

      const today = new Date().toISOString().split('T')[0];
      const { data: pagos } = await supabase
        .from('pagos')
        .select('*')
        .eq('fecha_pago', today);

      const { data: notifs } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('leida', false)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalVentas: ventas?.length || 0,
        totalMontoUSD: ventas?.reduce((sum: number, v: any) => sum + v.monto_total_usd, 0) || 0,
        ventasPendientes: ventas?.filter((v: any) => v.estado === 'pendiente').length || 0,
        ventasVencidas: vencidas?.length || 0,
        pagosHoy: pagos?.length || 0,
      });

      setVentasRecientes((ventas || []).slice(0, 5) as Venta[]);
      setNotificaciones(notifs || []);
    };

    loadStats();

    const channel = supabase
      .channel('notificaciones')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, (payload) => {
        setNotificaciones(prev => [payload.new, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const marcarLeida = async (id: string) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Administrativo</h1>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Ventas del Mes</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalVentas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Monto Total USD</p>
          <p className="text-2xl font-bold text-green-600">${stats.totalMontoUSD.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.ventasPendientes}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Vencidas</p>
          <p className="text-2xl font-bold text-red-600">{stats.ventasVencidas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Pagos Hoy</p>
          <p className="text-2xl font-bold text-purple-600">{stats.pagosHoy}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            Notificaciones
            {notificaciones.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {notificaciones.length}
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {notificaciones.map((notif) => (
              <div key={notif.id} className="bg-blue-50 p-3 rounded-md flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{notif.titulo}</p>
                  <p className="text-sm text-gray-600">{notif.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => marcarLeida(notif.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Marcar leida
                </button>
              </div>
            ))}
            {notificaciones.length === 0 && (
              <p className="text-gray-500 text-sm">No hay notificaciones nuevas</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Ventas Recientes</h2>
          <div className="space-y-3">
            {ventasRecientes.map((venta) => (
              <div key={venta.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between">
                  <p className="font-medium text-sm">{venta.numero_oe}</p>
                  <p className="text-sm text-gray-600">${venta.monto_total_usd.toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-500">{venta.correlacion_a2} - {venta.sede}</p>
              </div>
            ))}
            {ventasRecientes.length === 0 && (
              <p className="text-gray-500 text-sm">No hay ventas recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
