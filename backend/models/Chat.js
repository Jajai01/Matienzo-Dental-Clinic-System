import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  patientName: { type: String }, // Optional: helpful for admin lists
  messages: [{
    sender: { type: String, enum: ['patient', 'doctor'], required: true },
    text: { type: String, required: true },
    time: { type: String },     // e.g., "09:30 PM"
    date: { type: String },     // 🔑 Added: e.g., "Nov 16, 2026" for explicit chat date tracking
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false } // Tracks read status for red notification badges
  }]
}, { timestamps: true });

export const Chat = mongoose.model('Chat', chatSchema);