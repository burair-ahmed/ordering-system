// // pages/api/testMenuItem.ts

// import { NextApiRequest, NextApiResponse } from 'next';
// import mongoose from 'mongoose';
// import connectDB from '../../lib/db'; // Ensure the path is correct

// // Define the schema
// const menuItemSchema = new mongoose.Schema({
//   title: String,
//   price: Number,
//   description: String,
//   createdAt: { type: Date, default: Date.now },
// });

// const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);

// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//   await connectDB(); // Connect to the database

//   if (req.method === 'POST') {
//     const { title, price, description } = req.body;

//     if (!title || !price || !description) {
//       return res.status(400).json({ error: 'Title, price, and description are required' });
//     }

//     try {
//       const newMenuItem = new MenuItem({
//         title,
//         price,
//         description,
//       });

//       const savedItem = await newMenuItem.save();
//       return res.status(201).json({ success: true, data: savedItem });
//     } catch (error) {
//       console.error('Error saving menu item:', error);
//       return res.status(500).json({ error: 'Failed to save menu item' });
//     }
//   } else {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }
// };

// export default handler;
