// src/app/order/[tableId]/page.tsx
// Legacy Dine-In Route — auto-redirects to clean /table/[tableId]

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacyTableOrderPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params?.tableId as string | undefined;

  useEffect(() => {
    if (tableId) {
      router.replace(`/table/${tableId}`);
    } else {
      router.replace('/');
    }
  }, [tableId, router]);

  return null;
}
