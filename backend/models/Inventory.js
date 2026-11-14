// models/Inventory.js
import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Consumable', 'Material', 'Medicine', 'Equipment'],
    default: 'Consumable'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 5
  }
}, { timestamps: true });

export default mongoose.model('Inventory', inventorySchema);