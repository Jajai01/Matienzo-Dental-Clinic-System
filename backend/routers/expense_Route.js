import express from 'express';
import { addExpense, deleteExpense } from '../controllers/expenseController.js'; // Adjust path as needed

const router = express.Router();

router.post('/add', addExpense);
router.delete('/:id', deleteExpense); // 🔑 Added delete route

export default router;