import mongoose from 'mongoose';
import User from '../models/user.js';

// 🔑 1. Create a tiny DB schema on-the-fly just to remember if the doctor is online
const doctorStatusSchema = new mongoose.Schema({
  systemId: { type: String, default: 'matienzo-admin' },
  isOnline: { type: Boolean, default: false }
});

// Avoid recompiling the model if this file gets hot-reloaded
const DoctorStatus = mongoose.models.DoctorStatus || mongoose.model('DoctorStatus', doctorStatusSchema);

// Update user (patient) online/offline status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    
    await User.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { patientId: id }] },
      { isOnline: status === 'online' }
    );
    res.status(200).json({ returnDocument: 'after' });
  } catch (error) {
    res.status(500).json({ returnDocument: 'before', message: error.message });
  }
};

// 🔑 2. Handle both GET and POST with permanent database storage
export const getDoctorStatus = async (req, res) => {
  try {
    if (req.method === 'POST') {
      // Update the status in the database. 
      // 'upsert: true' means it will automatically create the record if it doesn't exist yet!
      await DoctorStatus.findOneAndUpdate(
        { systemId: 'matienzo-admin' }, 
        { isOnline: req.body.isActive },
        { upsert: true, new: true }
      );
      
      return res.status(200).json({ returnDocument: 'after', isActive: req.body.isActive });
    }

    // GET request from the Patient side: Read the real status from the database
    const statusDoc = await DoctorStatus.findOne({ systemId: 'matienzo-admin' });
    const currentStatus = statusDoc ? statusDoc.isOnline : false;

    res.status(200).json({ returnDocument: 'after', isActive: currentStatus });
  } catch (error) {
    res.status(500).json({ returnDocument: 'before', message: error.message });
  }
};