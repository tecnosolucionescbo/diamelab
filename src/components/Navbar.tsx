// src/components/Navbar.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              DIAMELAD
            </Link>
            <div className="ml-10 flex space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/ventas" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Ventas
              </Link>
              <Link href="/ventas/nueva" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Nueva Venta
              </Link>
              {isAdmin && (
                <>
                  <Link href="/admin/usuarios" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Usuarios
                  </Link>
                  <Link href="/admin/tasas" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Tasas BCV
                  </Link>
                  <Link href="/admin/reportes" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Reportes
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{profile?.full_name}</span>
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                {profile?.role === 'admin' ? 'Admin' : profile?.sede}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Cerrar Sesion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
