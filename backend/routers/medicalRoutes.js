import express from 'express';
import multer from 'multer';
import { 
  getMedicalRecords, 
  getChatHistory, 
  sendMessage,
  getAllMedicalRecords,
  updateDiagnosis,
  addPrescription,
  uploadMedicalPhoto
} from '../controllers/medicalRecordController.js';

const router = express.Router();

// 🔑 Configure Multer for IN-MEMORY storage (bypasses Render's local disk wipe)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ADMIN ROUTE: Must go BEFORE the patientId route so Express doesn't get confused
router.get('/admin/all', getAllMedicalRecords);
router.patch('/:patientId/history/:historyId', updateDiagnosis);

// UPLOAD ROUTE: Handles patient image/photo submissions straight to Cloudflare R2
router.post('/upload', (req, res, next) => {
  const uploadHandler = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]);

  uploadHandler(req, res, (err) => {
    if (err) {
      console.error("🚨 Multer Memory Storage Error:", err.message);
      return res.status(400).json({ 
        success: false, 
        message: `Upload error: ${err.message}` 
      });
    }

    // Normalize req.file so uploadMedicalPhoto controller works regardless of frontend field name
    if (req.files) {
      req.file = req.files.image?.[0] || req.files.photo?.[0] || req.files.file?.[0];
    }

    next();
  });
}, uploadMedicalPhoto);

router.post('/medical-records/:patientId/prescription', addPrescription);

// EXISTING PATIENT ROUTES
router.get('/:patientId', getMedicalRecords);
router.get('/chat/:patientId', getChatHistory);
router.post('/chat', sendMessage);
router.post('/:patientId/prescription', addPrescription);

export default router;