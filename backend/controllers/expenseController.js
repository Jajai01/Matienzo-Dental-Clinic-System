import Expense from '../models/Expense.js';

export const addExpense = async (req, res) => {
  try {
    const { description, amount, category } = req.body;
    
    if (!description || !amount) {
      return res.status(400).json({ message: "Description and amount are required" });
    }

    const newExpense = new Expense({
      description,
      amount: Number(amount),
      category: category || "Miscellaneous"
    });

    await newExpense.save();
    res.status(201).json({ success: true, expense: newExpense });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ message: "Failed to add expense" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    res.status(200).json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete expense" });
  }
};