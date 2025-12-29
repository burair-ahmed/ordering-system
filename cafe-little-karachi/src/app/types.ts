// src/app/types.ts
export interface Table {
    id: string; // Unique identifier for each table
    status: 'empty' | 'reserved' | 'occupied'; // Possible statuses of a table
  }
  