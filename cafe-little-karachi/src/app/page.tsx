// src/app/page.tsx
// Root page — hosts the full CLK ordering experience directly at cafelittlekarachi.com/
// Hero + Menu catalog are served immediately at / for maximum conversion & clean URLs.

import MenuPage from "./order/page";
import TableForm from "./components/TableForm";

export default function Home() {
  return (
    <>
      {/* Location selector modal — appears over menu if location not set */}
      <TableForm />
      {/* Full menu catalog */}
      <MenuPage />
    </>
  );
}
