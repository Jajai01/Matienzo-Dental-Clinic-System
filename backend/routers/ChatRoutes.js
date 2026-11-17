import express from 'express';

import { 
  getChatHistory, 
  sendMessage,
  getChats, 
  replyToChat,
  markMessagesAsRead
} from '../controllers/chatController.js';

const router = express.Router();

// ==========================================
// PATIENT-FACING ROUTES
// ==========================================
router.get('/patient/:patientId', getChatHistory);
router.post('/', sendMessage);
router.patch('/patient/:patientId/read', markMessagesAsRead);

// 🔑 Alias matching frontend calls to /api/chats/read/:patientId
router.route('/read/:patientId')
  .patch(markMessagesAsRead)
  .put(markMessagesAsRead)
  .post(markMessagesAsRead);

// ==========================================
// ADMIN-FACING ROUTES
// ==========================================
router.get('/', getChats);
router.post('/:id/message', replyToChat);

export default router;