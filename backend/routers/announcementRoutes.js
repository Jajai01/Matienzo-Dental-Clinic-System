import express from 'express';
import { 
  createAnnouncement, 
  getActiveAnnouncements, 
  deleteAnnouncement, 
  sendBroadcast 
} from '../controllers/announcementController.js';

const router = express.Router();

router.get('/', getActiveAnnouncements);
router.post('/', createAnnouncement);
router.delete('/:id', deleteAnnouncement);

// 🔑 Added Broadcast Route
router.post('/send-broadcast', sendBroadcast);

export default router;