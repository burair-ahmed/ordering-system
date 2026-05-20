import { NextApiRequest, NextApiResponse } from 'next';
import testMongoConnection from '../../lib/testConnection';
import DeliveryArea from '../../models/DeliveryArea';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await testMongoConnection();

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const areas = await DeliveryArea.find({}).sort({ name: 1 });
        return res.status(200).json(areas);
      } catch (error) {
        console.error('Error fetching delivery areas:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

    case 'POST':
      try {
        const { name, charge, isAvailable, note } = req.body;
        if (!name) {
          return res.status(400).json({ error: 'Name is required' });
        }

        const newArea = new DeliveryArea({
          name,
          charge: charge !== undefined ? Number(charge) : 0,
          isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
          note: note || '',
        });

        await newArea.save();
        return res.status(201).json(newArea);
      } catch (error: any) {
        console.error('Error creating delivery area:', error);
        if (error.code === 11000) {
          return res.status(400).json({ error: 'Delivery area with this name already exists' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
      }

    case 'PUT':
      try {
        const { id, name, charge, isAvailable, note } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }

        const updateFields: any = {};
        if (name !== undefined) updateFields.name = name;
        if (charge !== undefined) updateFields.charge = Number(charge);
        if (isAvailable !== undefined) updateFields.isAvailable = Boolean(isAvailable);
        if (note !== undefined) updateFields.note = note;

        const updatedArea = await DeliveryArea.findByIdAndUpdate(
          id,
          updateFields,
          { new: true }
        );

        if (!updatedArea) {
          return res.status(404).json({ error: 'Delivery area not found' });
        }

        return res.status(200).json(updatedArea);
      } catch (error: any) {
        console.error('Error updating delivery area:', error);
        if (error.code === 11000) {
          return res.status(400).json({ error: 'Delivery area with this name already exists' });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
      }

    case 'DELETE':
      try {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }

        const deletedArea = await DeliveryArea.findByIdAndDelete(id);
        if (!deletedArea) {
          return res.status(404).json({ error: 'Delivery area not found' });
        }

        return res.status(200).json({ message: 'Delivery area deleted successfully' });
      } catch (error) {
        console.error('Error deleting delivery area:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
