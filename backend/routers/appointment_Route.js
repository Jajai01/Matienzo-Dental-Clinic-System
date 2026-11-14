import express from 'express';
import { 
  createAppointment, 
  getPatientAppointments, 
  cancelAppointment,
  getAdminAppointments,
  updateAppointmentStatus,
  updateBillingAmount,
  markAsPaid,
  generateReceiptPDF
  ,submitPaymentIntent// 🔑 ADDED: Import the admin controller
} from '../controllers/appointmentController.js'; 

const router = express.Router();

// Patient Routes
router.post('/', createAppointment);
router.get('/patient/:patientId', getPatientAppointments);
router.patch('/:id/cancel', cancelAppointment);
router.get('/', getAdminAppointments);
// 🔑 ADDED: Admin Route for the Calendar
router.get('/appointments', getAdminAppointments);
// Don't forget to import updateAppointmentStatus at the top!
router.patch('/admin/appointments/:id/status', updateAppointmentStatus);
router.patch('/:id/billing', updateBillingAmount);
router.patch('/:id/pay', markAsPaid);
router.put('/:id/payment-intent', submitPaymentIntent);
router.post('/generate-receipt', generateReceiptPDF);
export default router;