import express from 'express';
import { getFinancialSummary, getAIInsights } from '../controllers/analyticsController.js';

const router = express.Router();

// Matches: axios.get('http://localhost:8000/api/analytics/summary')
router.get('/summary', getFinancialSummary);

// Matches: axios.get('http://localhost:8000/api/analytics/ai-summary')
router.get('/ai-summary', getAIInsights);

export default router;