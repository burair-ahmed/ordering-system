// src/app/order/[tableId]/page.tsx

'use client';

import { useParams } from 'next/navigation'; // Use useParams for dynamic route parameters
import MenuPage from '../../order/page'; // Import the MenuPage component

const TableMenuPage = () => {
  const params = useParams(); // Get parameters from the URL

  const tableId = params?.tableId as string | undefined; // Assert tableId as string (or undefined if not found)

  if (!tableId) {
    return <div>Loading table menu...</div>;
  }

  return (
    <div>
      {/* <h2>Table {tableId} Menu</h2> */}
      <MenuPage />
    </div>
  );
};

export default TableMenuPage;
