import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNumber: { type: String, required: true },
  birthdate: { type: String, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  medicalConditions: { type: [String], default: [] },
  allergies: { type: String, default: "" },
  medications: { type: String, default: "" },
  emergencyName: { type: String, default: "" },
  emergencyRelationship: { type: String, default: "" },
  emergencyContact: { type: String, default: "" },
  patientStatus: { type: String, default: "Active" },
  patientId: { type: String, unique: true },
  isOnline: { type: Boolean, default: false },
  
  // 🔑 NEW: Notification & Marketing Preferences
  emailNotifications: { type: Boolean, default: true },
  promotions: { type: Boolean, default: false },

  allowClinicalResearch: {
  type: Boolean,
  default: true, // Opted-in by default
  },
  // 🔑 Fields for Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
});

// 🔑 Attached the pre-save hook BEFORE compiling the model
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Just use a standard return to stop execution
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // No next() call needed here anymore! Mongoose waits for the try block to finish.
  } catch (error) {
    throw error; // Throwing the error automatically passes it to your controller's catch block
  }
});

// 🔑 Compiled the final model after all hooks are locked in
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;