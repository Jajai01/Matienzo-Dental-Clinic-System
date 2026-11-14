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
  uploadMedicalPhoto,
 // 🔑 Imported the photo upload controller function
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
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 🔑 ADMIN ROUTE: Must go BEFORE the patientId route so Express doesn't get confused
router.get('/admin/all', getAllMedicalRecords);
router.patch('/:patientId/history/:historyId', updateDiagnosis);

// 🔑 NEW UPLOAD ROUTE: Handles patient image/photo submissions (maps to /api/medical-records/upload)
router.post('/upload', upload.single('image'), uploadMedicalPhoto);
router.post('/medical-records/:patientId/prescription', addPrescription);
// EXISTING PATIENT ROUTES
router.get('/:patientId', getMedicalRecords);
router.get('/chat/:patientId', getChatHistory);
router.post('/chat', sendMessage);
router.post('/:patientId/prescription', addPrescription);

export default router;