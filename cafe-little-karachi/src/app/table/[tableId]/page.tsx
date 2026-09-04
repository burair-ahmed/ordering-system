// src/app/table/[tableId]/page.tsx
// Clean Table QR Code Entrypoint — cafelittlekarachi.com/table/[tableId]
// When a diner scans a table QR code, it sets their table in persistent state and shows the menu at clean /.

'use client';

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrder } from "../../context/OrderContext";
import MenuPage from "../../order/page";

export default function TableQrPage() {
  const params = useParams();
  const router = useRouter();
  const { setOrder } = useOrder();
  const tableId = params?.tableId as string | undefined;

  useEffect(() => {
    if (tableId) {
      // Set dinein table in persistent OrderContext + localStorage + Cookies
      setOrder({ orderType: "dinein", tableId });
      // Silently replace address bar to clean root / without query parameters
      router.replace("/");
    }
  }, [tableId, setOrder, router]);

  return <MenuPage />;
}
