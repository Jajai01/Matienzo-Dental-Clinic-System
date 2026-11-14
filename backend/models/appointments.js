import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // Relational Link: Ties this appointment to a specific logged-in user
  patientId: { 
    type: String, 
    required: true 
  },
  
  // The Auto-Generated Transaction Reference (e.g., APT-8F3K9A)
  referenceCode: { 
    type: String, 
    unique: true 
  },
  
  dentist: { type: String, required: true },
  patientName: { type: String, required: true },
  service: { type: String, required: true },
  
  selectedDate: { type: String, required: true },
  selectedTimeSlot: { type: String, required: true },
  
  notes: { type: String, default: "" },
  
  // Locked down with Enums so you never get typos in your database
  status: { 
    type: String, 
    enum: ["Pending Review", "Confirmed", "Rescheduled", "Completed", "Cancelled"],
    default: "Pending Review" 
  },
  
  // 🔑 CHANGED: Removed "Verifying" since payments are handled manually over the counter
  paymentStatus: { 
    type: String, 
    enum: ["Unpaid", "Paid"],
    default: "Unpaid" 
  },
  
  // The original standard price of the service
  billingAmount: { 
    type: Number, 
    default: null 
  },

  // 🔑 NEW: To track the discounts your client wants to give
  discountApplied: {
    type: Number,
    default: 0
  },

  // 🔑 NEW: The actual amount handed to the cashier / sent via GCash
  finalAmountPaid: {
    type: Number,
    default: null
  },

  // 🔑 NEW: A place for the admin to type the GCash Ref No. or Paper Receipt No.
  paymentReference: {
    type: String,
    default: null
  },
  
  paymentDate: { type: Date, default: null },
  
}, { timestamps: true });

// 🔑 PRE-SAVE HOOK: Generates the APT-XXXXXX code automatically before saving
appointmentSchema.pre('save', async function() {
  if (this.isNew && !this.referenceCode) {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referenceCode = `APT-${randomStr}`;
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;