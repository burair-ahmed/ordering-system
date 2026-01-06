import { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/db";
import Table from "../../../models/tableSchema";  // Import the Table model

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await connectDB();

  const { id } = req.query;  // Get table ID from the URL

  // Ensure the table ID is provided
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "Table ID is required" });
  }

  if (req.method === "GET") {
    // Fetch the current status of the table
    try {
      const table = await Table.findOne({ id });

      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }

      return res.status(200).json({ status: table.status });
    } catch (error: unknown) { // Explicitly declare the type as 'unknown'
      // Type guard to check if the error is an instance of Error
      if (error instanceof Error) {
        return res.status(500).json({ error: "Error fetching table status", details: error.message });
      } else {
        return res.status(500).json({ error: "Unknown error occurred" });
      }
    }
  }

  if (req.method === "PUT") {
    const { status } = req.body;

    // Validate the status input
    if (!['empty', 'reserved', 'occupied'].includes(status)) {
      return res.status(400).json({ error: "Invalid status provided" });
    }

    try {
      const table = await Table.findOne({ id });

      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }

      // Update the status
      table.status = status;
      await table.save();

      return res.status(200).json({ success: true, message: `Table status updated to ${status}` });
    } catch (error: unknown) { // Explicitly declare the type as 'unknown'
      // Type guard to check if the error is an instance of Error
      if (error instanceof Error) {
        return res.status(500).json({ error: "Error updating table status", details: error.message });
      } else {
        return res.status(500).json({ error: "Unknown error occurred" });
      }
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};

export default handler;
