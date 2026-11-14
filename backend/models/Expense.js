import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  category: {
    type: String,
    enum: ["Dental Supplies", "Utilities", "Staff Salaries", "Equipment Repair", "Marketing", "Miscellaneous"],
    default: "Miscellaneous"
  },
  // The specific date the expense was incurred
  expenseDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  recordedBy: { 
    type: String, 
    default: "Admin" 
  }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;