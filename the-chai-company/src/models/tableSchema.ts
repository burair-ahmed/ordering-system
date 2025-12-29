import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['empty', 'reserved', 'occupied'],
    default: 'empty',
  },
});

const Table = mongoose.models.Table || mongoose.model('Table', tableSchema);

export default Table;
