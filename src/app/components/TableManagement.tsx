// src/components/TableManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { Table } from '../types';  // Importing Table type if you have it

const TableManagement = () => {
  const [tables, setTables] = useState<Table[]>([]);  // Table data state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tables data from API
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/api/tables');
        if (!response.ok) {
          throw new Error('Failed to fetch tables');
        }
        const data = await response.json();
        setTables(data);  // Assuming the response has the table data in the body
      } catch (err) {
        if (err instanceof Error) {
          setError('Error fetching tables: ' + err.message);
        } else {
          setError('Unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Update table status
  const updateTableStatus = async (id: string, status: 'empty' | 'reserved' | 'occupied') => {
    try {
      const response = await fetch(`/api/tables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update table status');
      }

      // Update status in UI
      setTables(prevTables =>
        prevTables.map(table => (table.id === id ? { ...table, status } : table))
      );
    } catch (err) {
      setError('Error updating table status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) return <div>Loading tables...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table) => (
        <div key={table.id} className="p-4 border rounded shadow-md">
          <h3>Table {table.id}</h3>
          <p>Status: {table.status}</p>
          <div className="mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              onClick={() => updateTableStatus(table.id, 'empty')}
            >
              Empty
            </button>
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
              onClick={() => updateTableStatus(table.id, 'reserved')}
            >
              Reserved
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => updateTableStatus(table.id, 'occupied')}
            >
              Occupied
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableManagement;
