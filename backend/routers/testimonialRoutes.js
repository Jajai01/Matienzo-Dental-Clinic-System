import express from 'express';
import { 
  createTestimonial, 
  getApprovedTestimonials, 
  getAllTestimonialsAdmin, 
  updateTestimonialStatus 
} from '../controllers/testimonialController.js';

const router = express.Router();

router.post('/', createTestimonial);
router.get('/approved', getApprovedTestimonials);
router.get('/admin-all', getAllTestimonialsAdmin);
router.patch('/status/:id', updateTestimonialStatus);

export default router;