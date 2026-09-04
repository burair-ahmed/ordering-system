// src/app/delivery/[area]/page.tsx
// Clean Delivery Area Route — cafelittlekarachi.com/delivery/[area]
// Sets delivery area in persistent OrderContext and navigates to clean root /.

'use client';

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrder } from "../../context/OrderContext";
import MenuPage from "../../order/page";

export default function DeliveryAreaPage() {
  const params = useParams();
  const router = useRouter();
  const { setOrder } = useOrder();
  const rawArea = params?.area as string | undefined;
  const decodedArea = rawArea ? decodeURIComponent(rawArea).replace(/-/g, " ") : undefined;

  useEffect(() => {
    if (decodedArea) {
      // Set delivery area in persistent OrderContext + localStorage + Cookies
      setOrder({ orderType: "delivery", area: decodedArea });
      // Silently replace address bar to clean root / without query parameters
      router.replace("/");
    }
  }, [decodedArea, setOrder, router]);

  return <MenuPage />;
}
