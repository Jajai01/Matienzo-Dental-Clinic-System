import mongoose from 'mongoose';

const blockedDateSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Saved as YYYY-MM-DD
  reason: { type: String, default: 'Unavailable' }
});

export const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema);