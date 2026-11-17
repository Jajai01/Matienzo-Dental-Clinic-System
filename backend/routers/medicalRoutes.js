import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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

// ESM equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure an uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max limit to prevent memory crashes on Render
});

// 🔑 ADMIN ROUTE: Must go BEFORE the patientId route so Express doesn't get confused
router.get('/admin/all', getAllMedicalRecords);
router.patch('/:patientId/history/:historyId', updateDiagnosis);

// 🔑 UPLOAD ROUTE: Handles patient image/photo submissions (maps to /api/medical-records/upload)
router.post('/upload', (req, res, next) => {
  const uploadHandler = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]);

  uploadHandler(req, res, (err) => {
    if (err) {
      console.error("🚨 Multer Upload Error:", err.message);
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