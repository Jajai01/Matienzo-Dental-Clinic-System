import mongoose from 'mongoose';
const chatSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  messages: [{
    sender: { type: String, enum: ['patient', 'doctor'] },
    text: String,
    time: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

export const Chat = mongoose.model('Chat', chatSchema);