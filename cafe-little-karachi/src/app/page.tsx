// src/app/page.tsx
// Root page — hosts the full CLK ordering experience directly at cafelittlekarachi.com/
// Hero + Menu catalog are served immediately at / with pre-rendered data for maximum conversion & near-zero CLS.

import MenuPage from "./order/page";
import { getServerMenuData } from "@/lib/serverMenuData";

export const revalidate = 300; // 5-minute ISR cache

export default async function Home() {
  const initialData = await getServerMenuData();
  return <MenuPage initialData={initialData} />;
}
