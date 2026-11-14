import express from 'express';
import { updateUserStatus, getDoctorStatus } from '../controllers/statusController.js';

const router = express.Router();

// Allow both fetching and updating the doctor status
router.get('/doctor-status', getDoctorStatus);
router.post('/doctor-status', getDoctorStatus); 

router.route('/:id')
  .get(updateUserStatus)
  .put(updateUserStatus)
  .patch(updateUserStatus)
  .post(updateUserStatus);

export default router;