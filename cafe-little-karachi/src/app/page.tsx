// src/app/page.tsx
// Root page — hosts the full CLK ordering experience directly at cafelittlekarachi.com/
// Hero + Menu catalog are served immediately at / for maximum conversion & clean URLs.

import MenuPage from "./order/page";

export default function Home() {
  return <MenuPage />;
}
