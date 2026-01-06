// src/pages/api/tables/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Table from "../../../models/tableSchema";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await connectDB();

  if (req.method === "GET") {
    try {
      // Fetch all tables from the database
      const tables = await Table.find();

      if (!tables) {
        return res.status(404).json({ error: "No tables found" });
      }

      res.status(200).json(tables);
    } catch (error: unknown) {  // Typing the error as `unknown`
      if (error instanceof Error) {
        res.status(500).json({ error: "Error fetching tables", details: error.message });
      } else {
        res.status(500).json({ error: "Error fetching tables", details: "Unknown error" });
      }
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

export default handler;
