import crypto from 'crypto';
import Appointment from '../models/appointments.js';
import { MedicalRecord } from '../models/MedicalData.js';
import User from '../models/user.js';
import mongoose from 'mongoose';
import ClinicSettings from '../models/clinicSettings.js';

// ==========================================
// BREVO HTTPS EMAIL HELPER (Bypasses Render SMTP Block)
// ==========================================
const sendBrevoEmail = async ({ senderName = 'Matienzo Dental Admin', to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is missing in Render environment variables.');
  }

  const senderEmail = process.env.EMAIL_USER || 'matienzo.dentalclinic@gmail.com';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Brevo API Error (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
};

/**
 * @desc    Export system data for research and analytics (Strictly excludes opted-out patients)
 * @route   POST /api/settings/export
 * @access  Protected (Admin)
 */
export const exportResearchData = async (req, res) => {
  try {
    const {
      includeAppointments,
      includeMedicalHistory,
      includeFinancials,
      anonymizeData,
      format
    } = req.body;

    let payload = {};

    const optedOutUsers = await User.find({ allowClinicalResearch: false }).select('_id email name');
    const optedOutIds = optedOutUsers.map(u => u._id.toString());
    const optedOutEmails = optedOutUsers.map(u => u.email).filter(Boolean);

    console.log(`🔒 Excluding ${optedOutUsers.length} opted-out patient(s) from research export.`);

    const isOptedOut = (record) => {
      const refId = record.patientId || record.patient || record.userId || record.user;
      const refEmail = record.email || record.patientEmail;

      if (refId && optedOutIds.includes(String(refId))) return true;
      if (refEmail && optedOutEmails.includes(refEmail)) return true;
      return false;
    };

    // 1. Process Appointments & Financials
    if (includeAppointments || includeFinancials) {
      let appointments = await Appointment.find({}).lean();
      appointments = appointments.filter(apt => !isOptedOut(apt));

      payload.appointments = appointments.map(apt => {
        let processed = { ...apt };
        if (!includeFinancials) {
          delete processed.billingAmount;
          delete processed.paymentStatus;
          delete processed.paymentMethod;
          delete processed.paymentDate;
        }
        if (anonymizeData) {
          if (processed.patientId || processed.patient) {
            const rawId = String(processed.patientId || processed.patient);
            processed.patientId = crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 12);
            delete processed.patient;
          }
          processed.patientName = "ANONYMIZED_SUBJECT";
          delete processed.dentist;
        }
        return processed;
      });
    }

    // 2. Process Clinical Medical Records
    if (includeMedicalHistory) {
      let records = await MedicalRecord.find({}).lean();
      records = records.filter(rec => !isOptedOut(rec));

      payload.medicalRecords = records.map(rec => {
        let processed = { ...rec };
        if (anonymizeData) {
          if (processed.patientId || processed.patient) {
            const rawId = String(processed.patientId || processed.patient);
            processed.patientId = crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 12);
            delete processed.patient;
          }
          processed.patientName = "ANONYMIZED_SUBJECT";
        }
        return processed;
      });
    }

    // 3. Format and Dispatch File
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="clinic_research_export.json"');
      return res.status(200).send(JSON.stringify(payload, null, 2));
    }

    if (format === 'csv') {
      if (!payload.appointments || payload.appointments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No appointment data available to generate CSV based on current filters."
        });
      }

      const headers = Object.keys(payload.appointments[0]).join(',');
      const rows = payload.appointments
        .map(apt =>
          Object.values(apt)
            .map(val => JSON.stringify(val ?? ''))
            .join(',')
        )
        .join('\n');
      const csvString = `${headers}\n${rows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="clinic_research_export.csv"');
      return res.status(200).send(csvString);
    }
  } catch (error) {
    console.error("Data Export Error:", error);
    return res.status(500).json({ success: false, message: "Server error during data extraction." });
  }
};

/**
 * @desc    Send IT Support Ticket to Developer via Brevo HTTPS API
 * @route   POST /api/settings/support-ticket
 * @access  Protected (Admin)
 */
export const submitSupportTicket = async (req, res) => {
  try {
    const { subject, urgency, message, adminName } = req.body;

    if (!process.env.BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY environment variable is missing on the server!");
      return res.status(500).json({ success: false, message: "Server email configuration (BREVO_API_KEY) is missing." });
    }

    const developerEmail = process.env.DEVELOPER_EMAIL || 'lucillerbnq@gmail.com';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #D4AF37;">New IT Support Ticket</h2>
        <p><strong>Urgency Level:</strong> <span style="color: ${urgency === 'Critical' ? 'red' : 'black'}; font-weight: bold;">${urgency}</span></p>
        <p><strong>Submitted By:</strong> ${adminName || 'Admin'}</p>
        <hr style="border: 1px solid #eee; margin: 15px 0;" />
        <p><strong>Issue Description:</strong></p>
        <p style="background-color: #f8fafc; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
      </div>
    `;

    const info = await sendBrevoEmail({
      senderName: 'Matienzo Dental Admin',
      to: developerEmail,
      subject: `🚨 IT Ticket [${urgency}]: ${subject}`,
      html: htmlContent
    });

    console.log(`[Admin Ticket] Support ticket sent via Brevo for: ${subject} (Message ID: ${info.messageId})`);

    return res.status(200).json({ success: true, message: "Ticket sent securely to the developer." });
  } catch (error) {
    console.error("Support Ticket Email Error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Server failed to dispatch email." });
  }
};

export const getClinicSettings = async (req, res) => {
  try {
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = await ClinicSettings.create({});
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Fetch Settings Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load clinic parameters." });
  }
};

export const updateClinicSettings = async (req, res) => {
  try {
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = new ClinicSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    return res.status(200).json({ success: true, settings, message: "Clinic parameters updated successfully!" });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update clinic parameters." });
  }
};

/**
 * @desc    Update Patient Research Privacy Preference
 * @route   PUT /api/patient/research-preference
 */
export const updateResearchPreference = async (req, res) => {
  try {
    const { allowClinicalResearch } = req.body;

    console.log("📥 Updating research preference for User ID:", req.user?._id, "Value:", allowClinicalResearch);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized: User ID missing from session." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { allowClinicalResearch },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User record not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Research preference updated successfully.",
      allowClinicalResearch: updatedUser.allowClinicalResearch
    });
  } catch (error) {
    console.error("Update Research Preference Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update preference." });
  }
};