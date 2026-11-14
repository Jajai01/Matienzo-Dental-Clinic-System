import express from 'express';
import { 
  getClinicSettings, 
  updateClinicSettings, 
  exportResearchData, 
  submitSupportTicket 
} from '../controllers/settingsController.js'; // Adjust path to match your controller file name

const router = express.Router();

router.get('/clinic', getClinicSettings);
router.put('/clinic', updateClinicSettings);
router.post('/export', exportResearchData);
router.post('/support-ticket', submitSupportTicket);

export default router;