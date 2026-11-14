import mongoose from 'mongoose';

const medicalSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String },
  history: [{
    id: String,
    date: String,
    diagnosis: String,
    treatment: String,
    dentist: String
  }],
  prescriptions: [{
    id: String,
    date: String,
    medicine: String,
    dosage: String,
    status: String
  }],
  photos: [{
    url: String,
    date: { type: Date, default: Date.now }
  }]
});

export const MedicalRecord = mongoose.model('MedicalRecord', medicalSchema);