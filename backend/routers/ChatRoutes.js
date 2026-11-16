import express from 'express';

import { 
  getChatHistory, 
  sendMessage,
  getChats, 
  replyToChat,
  markMessagesAsRead // 🔑 Imported missing markMessagesAsRead controller
} from '../controllers/chatController.js';

const router = express.Router();

// ==========================================
// PATIENT-FACING ROUTES
// ==========================================
router.get('/patient/:patientId', getChatHistory);
router.post('/', sendMessage);
router.patch('/patient/:patientId/read', markMessagesAsRead); // 🔑 Registered route to clear red badges

// ==========================================
// ADMIN-FACING ROUTES
// ==========================================
router.get('/', getChats);
router.post('/:id/message', replyToChat);

export default router;