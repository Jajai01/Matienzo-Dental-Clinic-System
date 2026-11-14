import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile,
  getPreferences,
  updatePreferences,
  changePassword, 
  getPatientExportData
} from '../controllers/profileController.js';

const router = express.Router();

// 🔑 1. ALL SPECIFIC ROUTES MUST COME FIRST
router.get('/:patientId/export', getPatientExportData);
router.get('/:id/preferences', getPreferences);
router.put('/:id/preferences', updatePreferences);
router.put('/:id/change-password', changePassword);

// 🔑 2. GENERIC ID ROUTES COME LAST
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);

export default router;