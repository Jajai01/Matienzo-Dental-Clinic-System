import { MedicalRecord } from '../models/MedicalData.js';
import { Chat } from '../models/Chat.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Appointment from '../models/appointments.js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// EMAIL TRANSPORTER CONFIGURATION
// ==========================================
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'matienzo.dentalclinic@gmail.com',
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : ''
    }
  });
};

// ==========================================
// PATIENT DASHBOARD FUNCTIONS
// ==========================================

export const uploadMedicalPhoto = async (req, res) => {
    try {
        const { patientId } = req.body;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${req.file.filename}`;

        // 🔑 Safe query builder for MedicalRecord
        let recordQuery = { patientId: patientId };
        if (mongoose.Types.ObjectId.isValid(patientId)) {
            recordQuery = { $or: [{ patientId }, { _id: patientId }] };
        }

        const record = await MedicalRecord.findOne(recordQuery);
        
        if (!record) {
            return res.status(404).json({ success: false, message: 'Patient medical record not found' });
        }

        if (!record.photos) {
            record.photos = [];
        }

        record.photos.push({
            url: imageUrl,
            date: new Date()
        });

        await record.save();

        // 🔑 Safe user lookup to prevent CastErrors on findById
        const patient = await User.findOne({ patientId: patientId }) || 
                        (mongoose.Types.ObjectId.isValid(patientId) ? await User.findById(patientId).catch(() => null) : null);
        
        const patientName = patient ? `${patient.firstName} ${patient.lastName}` : (record.patientName || 'Unknown Patient');
        const patientEmail = patient ? patient.email : 'Not provided';

        const adminPhotoNotificationTemplate = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              <div style="background-color: #D4AF37; padding: 25px; text-align: center;">
                <h2 style="color: #0f172a; margin: 0; font-size: 20px; letter-spacing: 1px;">New Medical Photo Upload</h2>
                <p style="color: #0f172a; margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">A patient has submitted a new image</p>
              </div>
              <div style="padding: 30px;">
                <p style="color: #0f172a; font-size: 15px; margin-top: 0;">Hello Admin / Dra. Matienzo,</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                  Patient <strong>${patientName}</strong> (ID: ${patientId || 'N/A'}) has securely uploaded a new medical photo or x-ray to their profile.
                </p>
                <div style="background-color: #f1f5f9; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Submission Details</p>
                  <p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Patient Name:</strong> ${patientName}</p>
                  <p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Patient Email:</strong> ${patientEmail}</p>
                  <p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>File Name:</strong> ${req.file.originalname}</p>
                  <p style="margin: 10px 0 0 0;"><a href="${imageUrl}" target="_blank" style="color: #3b82f6; font-weight: bold; text-decoration: underline;">🔗 View Uploaded Image</a></p>
                </div>
                <p style="color: #475569; font-size: 13px;">Please log in to the clinic management dashboard to review the image and update clinical notes.</p>
              </div>
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">Matienzo Dental Clinic System - Automated Notification</p>
              </div>
            </div>
          </div>
        `;

        const activeTransporter = createTransporter();
        activeTransporter.sendMail({
          from: '"Matienzo Dental System" <matienzo.dentalclinic@gmail.com>',
          to: 'matienzo.dentalclinic@gmail.com',
          subject: `New Medical Photo Upload: ${patientName}`,
          html: adminPhotoNotificationTemplate
        }).catch((err) => {
          console.error("🚨 Photo upload email dispatch failed:", err);
        });

        res.status(200).json({ 
            success: true, 
            message: 'Photo uploaded successfully', 
            imageUrl,
            photos: record.photos 
        });

    } catch (error) {
        console.error("Error uploading medical record photo:", error);
        res.status(500).json({ success: false, message: 'Server error during file upload' });
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
      prescriptions: record ? record.prescriptions : [] 
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

    // 🔑 Safe query builder for MedicalRecord update
    let recordQuery = { patientId: patientId };
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      recordQuery = { $or: [{ patientId }, { _id: patientId }] };
    }

    const record = await MedicalRecord.findOneAndUpdate(
      { ...recordQuery, "history.id": historyId },
      { $set: { "history.$.diagnosis": diagnosis } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Record or history entry not found." });
    }

    res.status(200).json({ returnDocument : 'after', record });
  } catch (err) {
    res.status(500).json({ returnDocument : 'before', message: err.message });
  }
};

export const addPrescription = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medicine, dosage, quantity, status, frequency, duration, notes } = req.body;

    const prescriptionId = `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const issueDate = new Date().toISOString();

    let query = { patientId: patientId };
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      query = { $or: [{ patientId: patientId }, { _id: patientId }] };
    }

    let record = await MedicalRecord.findOne(query);
    const patientUser = await User.findOne({ patientId: patientId }) || (mongoose.Types.ObjectId.isValid(patientId) ? await User.findById(patientId).catch(() => null) : null);

    const patientName = patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : (record?.patientName || 'Valued Patient');
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
    const pdfUrl = `${import.meta.env.VITE_API_URL}/uploads/${pdfFileName}`;

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
      if (notes) doc.text(`    Instructions / Sig: ${notes}`);
      doc.moveDown(0.8);

      // --- DOCTOR SIGNATURE & LICENSE ---
      doc.fontSize(9).text('Next Follow Up: ______________________', 28, doc.y);
      doc.font('Helvetica-Bold').text('Anne Dumas Matienzo, DMD', 220, doc.y - 10, { align: 'right' });
      doc.font('Helvetica').fontSize(7.5).text('License No.  0043010', 220, doc.y + 2, { align: 'right' });
      doc.moveDown(0.8);

      // --- POST-EXTRACTION AND SURGERY INSTRUCTIONS (Bottom Section) ---
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
      instructions.forEach(inst => {
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

      const transporter = createTransporter();
      transporter.sendMail({
        from: '"Matienzo Dental Clinic" <matienzo.dentalclinic@gmail.com>',
        to: patientEmail,
        subject: `Your Prescription from Matienzo Dental Clinic - ${prescriptionId}`,
        html: emailHtmlTemplate,
        attachments: [
          {
            filename: pdfFileName,
            path: pdfPath
          }
        ]
      }).then(() => {
        console.log(`✅ Prescription PDF email successfully sent to patient: ${patientEmail}`);
      }).catch(err => {
        console.error("🚨 Error sending prescription email to patient:", err);
      });

      transporter.sendMail({
        from: '"Matienzo Dental System" <matienzo.dentalclinic@gmail.com>',
        to: 'matienzo.dentalclinic@gmail.com',
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