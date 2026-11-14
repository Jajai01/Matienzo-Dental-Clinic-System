// routes/inventory.js
import express from 'express';
import Inventory from '../models/Inventory.js'; // Note: Node.js ES modules usually require the .js extension for local files

const router = express.Router();

// GET all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
});

// POST a new inventory item
router.post('/', async (req, res) => {
  try {
    const { itemName, category, quantity, reorderLevel } = req.body;
    const newItem = new Inventory({
      itemName,
      category,
      quantity,
      reorderLevel
    });
    
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating item', error: error.message });
  }
});

// PUT (update) an existing item
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true } // Updated to fix Mongoose deprecation warning
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating item', error: error.message });
  }
});

// 🔑 PATCH (partial update) to support quick quantity adjustments from the frontend
router.patch('/:id', async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating item quantity', error: error.message });
  }
});

// DELETE an inventory item
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});

export default router;