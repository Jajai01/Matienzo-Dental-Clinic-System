import express from 'express';
import { createTicket } from '../controllers/ticketController.js';

const router = express.Router();

// Route: POST /api/tickets
router.post('/', createTicket);

export default router;