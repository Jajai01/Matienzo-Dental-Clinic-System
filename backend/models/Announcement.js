import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  tags: [{
    type: String // e.g., 'Holiday', 'Promo', 'Urgent'
  }],
  author: {
    type: String,
    default: 'Clinic Admin'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt dates

export const Announcement = mongoose.model('Announcement', announcementSchema);