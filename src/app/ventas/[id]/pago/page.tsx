// src/app/ventas/[id]/pago/page.tsx
'use client';

import { useParams } from 'next/navigation';
import PagoForm from '@/components/PagoForm';

export default function PagoPage() {
  const params = useParams();
  const ventaId = params.id as string;

  return <PagoForm ventaId={ventaId} />;
}
