import express from 'express';

// 🔑 Now, EVERYTHING imports from the chatController so they share the same database!
import { 
  getChatHistory, 
  sendMessage,
  getChats, 
  replyToChat 
} from '../controllers/chatController.js';

const router = express.Router();

// ==========================================
// PATIENT-FACING ROUTES
// ==========================================
router.get('/patient/:patientId', getChatHistory);
router.post('/', sendMessage);

// ==========================================
// ADMIN-FACING ROUTES
// ==========================================
router.get('/', getChats);
router.post('/:id/message', replyToChat);

export default router;