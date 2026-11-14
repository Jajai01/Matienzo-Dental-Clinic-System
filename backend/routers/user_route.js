import express from 'express';
import { 
    registerUser, 
    loginUser, 
    adminAuth, 
    getPatientProfile, 
    logoutUser,
    updateOnlineStatus,
    forgotPassword, // 🔑 NEW: Import forgot password
    resetPassword   // 🔑 NEW: Import reset password
} from '../controllers/authControllers.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/admin', adminAuth);
router.get('/profile/:patientId', getPatientProfile); 

// STATUS ROUTE:
router.patch('/status/:patientId', updateOnlineStatus);

// ==========================================
// 🔑 NEW: PASSWORD RESET ROUTES
// ==========================================
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;