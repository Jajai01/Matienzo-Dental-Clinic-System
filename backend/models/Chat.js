import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  messages: [{
    sender: { type: String, enum: ['patient', 'doctor'] },
    text: String,
    time: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false } // 🔑 Tracks read status for red notification badges
  }]
});

export const Chat = mongoose.model('Chat', chatSchema);