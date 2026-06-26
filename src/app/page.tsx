// src/app/page.tsx (Dashboard)
'use client';

import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/AdminDashboard';
import VendedorDashboard from '@/components/VendedorDashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) return <div className="p-6 text-center">Cargando...</div>;
  if (!user) return null;

  return isAdmin ? <AdminDashboard /> : <VendedorDashboard />;
}
