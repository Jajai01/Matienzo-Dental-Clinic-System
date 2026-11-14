import express from 'express';
import { BlockedDate } from '../models/BlockedDate.js';
import User from '../models/user.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'matienzo.dentalclinic@gmail.com',
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : ''
    }
  });
};

router.get('/', async (req, res) => {
  const dates = await BlockedDate.find().sort({ date: 1 });
  res.json({ success: true, blockedDates: dates });
});

router.post('/', async (req, res) => {
  try {
    const { date, reason } = req.body;
    const newDate = await BlockedDate.create({ date, reason });

    // 📧 Asynchronously notify all patients about the blocked date
    try {
      const users = await User.find({ role: { $ne: 'admin' } });
      const transporter = createTransporter();

      const formattedDate = new Date(date).toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      users.forEach(async (user) => {
        if (user.email) {
          const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <div style="background-color: #0f172a; padding: 25px; text-align: center;">
                  <h2 style="color: #D4AF37; margin: 0; font-size: 20px; letter-spacing: 1px;">Matienzo Dental Clinic</h2>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Schedule Unavailability Notice</p>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #0f172a; font-size: 15px; margin-top: 0;">Hello <strong>${user.firstName || 'Valued Patient'}</strong>,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    Please be informed that Dra. Anne Dumas Matienzo will be unavailable on <strong>${formattedDate}</strong>.
                  </p>
                  <div style="background-color: #f1f5f9; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Unavailability Details</p>
                    <p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                    <p style="margin: 3px 0; color: #0f172a; font-size: 14px;"><strong>Reason:</strong> ${newDate.reason || 'Doctor not available'}</p>
                  </div>
                  <p style="color: #475569; font-size: 13px;">If you have an appointment or were planning to book on this date, please choose an alternative open slot through your patient portal. Thank you for understanding.</p>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">Sitio 1 Brgy San Juan Sta Cruz Laguna | Contact No.: 09279262535</p>
                </div>
              </div>
            </div>
          `;

          await transporter.sendMail({
            from: '"Matienzo Dental Clinic" <matienzo.dentalclinic@gmail.com>',
            to: user.email,
            subject: `Clinic Schedule Notice: Doctor Unavailable on ${formattedDate}`,
            html: emailHtml
          }).catch(mailErr => {
            console.error(`Failed to send blocked date email to ${user.email}:`, mailErr);
          });
        }
      });
    } catch (emailError) {
      console.error("Error dispatching blocked date notification emails:", emailError);
    }

    res.json({ success: true, blockedDate: newDate });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Date might already be blocked.' });
  }
});

router.delete('/:id', async (req, res) => {
  await BlockedDate.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;