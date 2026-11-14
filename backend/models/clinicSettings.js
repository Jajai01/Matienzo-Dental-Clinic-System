import mongoose from 'mongoose';

const clinicSettingsSchema = new mongoose.Schema({
  businessName: { type: String, default: 'Matienzo Dental Clinic' },
  dentistName: { type: String, default: 'Dra. Anne Dumas-Matienzo' },
  prcNumber: { type: String, default: '0000000' },
  contactNumber: { type: String, default: '0927 926 2535' },
  address: { type: String, default: 'Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna' },
  email: { type: String, default: 'matienzo.dentalclinic@gmail.com' },
  operatingHours: { type: String, default: 'Monday - Sunday | 8:00 AM - 4:00 PM' }
}, { timestamps: true });

const ClinicSettings = mongoose.model('ClinicSettings', clinicSettingsSchema);
export default ClinicSettings;