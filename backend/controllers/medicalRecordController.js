import { MedicalRecord } from '../models/MedicalData.js';
import { Chat } from '../models/Chat.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Appointment from '../models/appointments.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CLOUDFLARE R2 S3 CLIENT SETUP
// ==========================================
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// ==========================================
// BREVO HTTPS EMAIL HELPER (Bypasses Render SMTP Block)
// ==========================================
const sendBrevoEmail = async ({ senderName = 'Matienzo Dental Clinic', to, subject, html, attachments = [] }) => {
  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is missing in Render environment variables.');
  }

  const senderEmail = process.env.EMAIL_USER || 'matienzo.dentalclinic@gmail.com';

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [{ email: to }],
    subject,
    htmlContent: html
  };

  // Convert local file attachments to Brevo base64 format if provided
  if (attachments && attachments.length > 0) {
    payload.attachment = attachments.map(att => {
      const fileBuffer = fs.readFileSync(att.path);
      return {
        name: att.filename,
        content: fileBuffer.toString('base64')
      };
    });
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Brevo API Error (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
};

// ==========================================
// PATIENT DASHBOARD FUNCTIONS
// ==========================================

export const uploadMedicalPhoto = async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // 1. Generate unique file name for Cloudflare R2
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${fileExt}`;

    // 2. Push buffer directly to Cloudflare R2 (Bypasses Render disk wipe)
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // 3. Form the permanent public HTTPS URL
    const publicDomain = process.env.R2_PUBLIC_URL ? process.env.R2_PUBLIC_URL.replace(/\/$/, '') : '';
    const imageUrl = `${publicDomain}/${fileName}`;

    let recordQuery = { patientId: patientId };
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      recordQuery = { $or: [{ patientId }, { _id: patientId }] };
    }

    let record = await MedicalRecord.findOne(recordQuery);

    // Create medical record if it doesn't exist yet for this patient
    if (!record) {
      record = new MedicalRecord({
        patientId: patientId,
        history: [],
        prescriptions: [],
        photos: []
      });
    }

    if (!record.photos) {
      record.photos = [];
    }

    record.photos.push({
      url: imageUrl,
      date: new Date()
    });

    await record.save();

    // Respond immediately so upload never hangs or triggers CORS/timeout errors
    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully to Cloudflare R2!',
      imageUrl,
      photos: record.photos
    });

    // Dispatch Email Notification to Clinic asynchronously via Brevo
    setImmediate(async () => {
      try {
        const patient =
          (await User.findOne({ patientId: patientId })) ||
          (mongoose.Types.ObjectId.isValid(patientId)
            ? await User.findById(patientId).catch(() => null)
            : null);

        const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
        const patientEmail = patient ? patient.email : 'Not provided';
        const clinicEmail = process.env.DENTIST_EMAIL || process.env.EMAIL_USER || 'matienzo.dentalclinic@gmail.com';

        await sendBrevoEmail({
          senderName: 'Matienzo Dental Clinic',
          to: clinicEmail,
          subject: `📸 New Medical Photo Upload - ${patientName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #0f172a;">New Medical Photo Uploaded</h2>
              <p><strong>Patient Name:</strong> ${patientName}</p>
              <p><strong>Patient ID:</strong> ${patientId}</p>
              <p><strong>Email:</strong> ${patientEmail}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p>The patient has securely uploaded a new photo/x-ray to their Cloudflare R2 medical record storage.</p>
            </div>
          `
        });
        console.log(`✅ Admin photo email notification sent via Brevo for ${patientName}`);
      } catch (emailErr) {
        console.error("Failed to send admin photo email notification:", emailErr.message);
      }
    });
  } catch (error) {
    console.error("R2 Upload Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Server error uploading photo to cloud storage." });
    }
  }
};

export const getMedicalRecords = async (req, res) => {
  try {
    const requestedId = req.params.patientId;

    let queryConditions = { patientId: requestedId };
    if (requestedId && mongoose.Types.ObjectId.isValid(requestedId)) {
      queryConditions = { $or: [{ patientId: requestedId }, { _id: requestedId }] };
    }

    const record = await MedicalRecord.findOne(queryConditions);

    res.status(200).json({
      success: true,
      history: record ? record.history : [],
      prescriptions: record ? record.prescriptions : [],
      photos: record ? record.photos || [] : []
    });
  } catch (err) {
    console.error("Error fetching medical records:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ patientId: req.params.patientId });
    res.status(200).json({ success: true, messages: chat?.messages || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { patientId, sender, text } = req.body;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await Chat.findOneAndUpdate(
      { patientId },
      { $push: { messages: { sender, text, time } } },
      { upsert: true, returnDocument: 'after' }
    );
    res.status(200).json({ returnDocument: 'after' });
  } catch (err) {
    res.status(500).json({ returnDocument: 'before', message: err.message });
  }
};

// ==========================================
// ADMIN DASHBOARD FUNCTIONS
// ==========================================

export const getAllMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDiagnosis = async (req, res) => {
  try {
    const { patientId, historyId } = req.params;
    const { diagnosis } = req.body;

    let recordQuery = { patientId: patientId };
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      recordQuery = { $or: [{ patientId }, { _id: patientId }] };
    }

    const record = await MedicalRecord.findOneAndUpdate(
      { ...recordQuery, "history.id": historyId },
      { $set: { "history.$.diagnosis": diagnosis } },
      { returnDocument: 'after' }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Record or history entry not found." });
    }

    res.status(200).json({ returnDocument: 'after', record });
  } catch (err) {
    res.status(500).json({ returnDocument: 'before', message: err.message });
  }
};

export const addPrescription = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medicine, dosage, quantity, status, frequency, duration, notes, expiryDate } = req.body;

    const prescriptionId = `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const issueDate = new Date().toISOString();

    let query = { patientId: patientId };
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      query = { $or: [{ patientId: patientId }, { _id: patientId }] };
    }

    let record = await MedicalRecord.findOne(query);
    const patientUser =
      (await User.findOne({ patientId: patientId })) ||
      (mongoose.Types.ObjectId.isValid(patientId)
        ? await User.findById(patientId).catch(() => null)
        : null);

    const patientName = patientUser
      ? `${patientUser.firstName} ${patientUser.lastName}`
      : record?.patientName || 'Valued Patient';
    const patientEmail = patientUser?.email || null;
    const patientAge = patientUser?.age || 'N/A';
    const patientSex = patientUser?.sex || patientUser?.gender || 'N/A';
    const patientAddress = patientUser?.address || 'Philippines';

    const pdfFileName = `prescription-${prescriptionId}.pdf`;
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const pdfPath = path.join(uploadsDir, pdfFileName);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const pdfUrl = `${baseUrl}/uploads/${pdfFileName}`;

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 24 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // --- HEADER ---
      doc.font('Helvetica-Bold').fontSize(15).text('ANNE DUMAS MATIENZO, DMD', { align: 'center' });
      doc.font('Helvetica').fontSize(8.5).text('Matienzo Dental Clinic', { align: 'center' });
      doc.text('Sitio 1 Brgy San Juan Sta Cruz Laguna', { align: 'center' });
      doc.text('Monday - Sunday 8am to 5pm | Contact No.: 09279262535', { align: 'center' });
      doc.moveDown(0.6);

      // --- PATIENT INFO BOX ---
      doc.lineWidth(0.8).rect(24, doc.y, 375, 34).stroke();
      const currentY = doc.y + 5;
      doc.font('Helvetica-Bold').fontSize(9.5).text(`Name: ${patientName}`, 28, currentY);
      doc.text(`Age/Sex: ${patientAge} / ${patientSex}`, 260, currentY);
      doc.text(`Address: ${patientAddress}`, 28, currentY + 16, { width: 220, ellipsis: true });
      doc.text(`Date: ${new Date(issueDate).toLocaleDateString()}`, 260, currentY + 16);
      doc.y = currentY + 38;
      doc.moveDown(0.4);

      // --- RX SYMBOL ---
      doc.font('Helvetica-Bold').fontSize(20).text('Rx', 28, doc.y);
      doc.moveDown(0.3);

      // --- PRESCRIBED MEDICINE DETAILS ---
      doc.font('Helvetica-Bold').fontSize(11).text(`1. ${medicine}`);
      doc.font('Helvetica').fontSize(9.5).text(`    Dosage: ${dosage}`);
      if (frequency) doc.text(`    Frequency: ${frequency}`);
      if (duration) doc.text(`    Duration: ${duration}`);
      if (quantity) doc.text(`    Quantity: ${quantity}`);
      if (expiryDate) doc.text(`    Valid Until (Expiry): ${expiryDate}`);
      if (notes) doc.text(`    Instructions / Sig: ${notes}`);
      doc.moveDown(0.8);

      // --- DOCTOR SIGNATURE & LICENSE ---
      doc.fontSize(9).text('Next Follow Up: ______________________', 28, doc.y);
      doc.font('Helvetica-Bold').text('Anne Dumas Matienzo, DMD', 220, doc.y - 10, { align: 'right' });
      doc.font('Helvetica').fontSize(7.5).text('License No.  0043010', 220, doc.y + 2, { align: 'right' });
      doc.moveDown(0.8);

      // --- POST-EXTRACTION AND SURGERY INSTRUCTIONS ---
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('POST-EXTRACTION AND SURGERY INSTRUCTIONS', { align: 'center' });
      doc.moveDown(0.3);

      const instructions = [
        '• Bite firmly on the gauze for at least 30 minutes.',
        '• Minimize talking for 3-4 hours after surgery.',
        '• Avoid physically strenuous activities for 24 hours.',
        '• Stop any alcohol intake or smoking for a minimum of 3 days.',
        '• Avoid sucking on a straw when drinking.',
        '• If bleeding is more than a slight ooze, reapply a gauze pack directly over the area of extraction.',
        '• Swelling may occur, but will eventually resolve after a few days. (Apply ice packs first 3 days, warm compress after).',
        '• Observance of cool, soft and liquid diet for the first 12-24 hours. Avoid hot foods/drinks for 2-3 days.',
        '• Maintain proper oral hygiene: avoid brushing, chewing and touching the wound area.',
        '• Gentle rinsing of warm water with salt may be done on following days.',
        '• After one week, have a follow-up visit with your dentist.',
        '• Take medicine as prescribed and instructed by dentist.'
      ];

      doc.font('Helvetica').fontSize(6.5).fillColor('#334155');
      instructions.forEach((inst) => {
        doc.text(inst, { lineGap: 1 });
      });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const newPrescription = {
      id: prescriptionId,
      date: issueDate,
      medicine,
      dosage,
      frequency: frequency || '',
      duration: duration || '',
      notes: notes || '',
      quantity: quantity || '',
      expiryDate: expiryDate || '',
      status: status || 'Active',
      pdfUrl
    };

    if (!record) {
      record = new MedicalRecord({
        patientId: patientId,
        history: [],
        prescriptions: [newPrescription]
      });
      await record.save();
    } else {
      record.prescriptions.push(newPrescription);
      await record.save();
    }

    if (patientEmail) {
      const emailHtmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background-color: #0f172a; padding: 25px; text-align: center;">
              <h2 style="color: #D4AF37; margin: 0; font-size: 20px; letter-spacing: 1px;">Matienzo Dental Clinic</h2>
              <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Official Digital Prescription</p>
            </div>
            <div style="padding: 30px;">
              <p style="color: #0f172a; font-size: 15px; margin-top: 0;">Hello <strong>${patientName}</strong>,</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Dra. Anne Dumas Matienzo has issued a new prescription for your treatment. Your official prescription PDF is attached to this email and is also accessible anytime through your mobile app profile.
              </p>
              <div style="background-color: #f1f5f9; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Prescription Summary</p>
                <p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Medicine:</strong> ${medicine}</p>
                <p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Dosage:</strong> ${dosage}</p>
                ${frequency ? `<p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Frequency:</strong> ${frequency}</p>` : ''}
                ${duration ? `<p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Duration:</strong> ${duration}</p>` : ''}
                ${expiryDate ? `<p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Expiry Date:</strong> ${expiryDate}</p>` : ''}
                ${notes ? `<p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Instructions:</strong> ${notes}</p>` : ''}
                <p style="margin: 10px 0 0 0;"><a href="${pdfUrl}" target="_blank" style="color: #3b82f6; font-weight: bold; text-decoration: underline;">🔗 Download Prescription PDF</a></p>
              </div>
              <p style="color: #475569; font-size: 13px;">Please follow all medication instructions carefully and contact the clinic for any questions or follow-up scheduling.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">Sitio 1 Brgy San Juan Sta Cruz Laguna | Contact No.: 09279262535</p>
            </div>
          </div>
        </div>
      `;

      sendBrevoEmail({
        senderName: 'Matienzo Dental Clinic',
        to: patientEmail,
        subject: `Your Prescription from Matienzo Dental Clinic - ${prescriptionId}`,
        html: emailHtmlTemplate,
        attachments: [{ filename: pdfFileName, path: pdfPath }]
      })
        .then(() => {
          console.log(`✅ Prescription PDF email successfully sent via Brevo to patient: ${patientEmail}`);
        })
        .catch((err) => {
          console.error("🚨 Error sending prescription email via Brevo to patient:", err.message);
        });

      const clinicEmail = process.env.DENTIST_EMAIL || process.env.EMAIL_USER || 'matienzo.dentalclinic@gmail.com';
      sendBrevoEmail({
        senderName: 'Matienzo Dental System',
        to: clinicEmail,
        subject: `Prescription Issued to ${patientName} (${prescriptionId})`,
        html: `<p>Prescription was successfully issued to <strong>${patientName}</strong> (${patientEmail}).</p><p>Medicine: ${medicine} (${dosage})</p>`,
        attachments: [{ filename: pdfFileName, path: pdfPath }]
      }).catch(() => {});
    }

    return res.status(200).json({ success: true, record, pdfUrl });
  } catch (error) {
    console.error("🚨 DETAILED PRESCRIPTION SAVE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error saving prescription."
    });
  }
};