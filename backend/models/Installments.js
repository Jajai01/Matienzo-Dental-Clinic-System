import mongoose from 'mongoose';

const monthlyInstallmentSchema = new mongoose.Schema({
  monthNumber: { type: Number, required: true }, // e.g., 1, 2, 3
  amountDue: { type: Number, required: true },    // e.g., total / duration
  isPaid: { type: Boolean, default: false },
  paidDate: { type: Date, default: null }
});

const installmentPlanSchema = new mongoose.Schema({
  patientName: { type: String, required: true, index: true }, // Free-text, searchable for legacy patients
  contactNumber: { type: String },                            // Optional reference
  totalLoan: { type: Number, required: true },
  remainingBalance: { type: Number, required: true },
  durationMonths: { type: Number, enum: [1, 3, 6], required: true },
  installments: [monthlyInstallmentSchema],
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' }
}, { timestamps: true });

export const InstallmentPlan = mongoose.model('InstallmentPlan', installmentPlanSchema);