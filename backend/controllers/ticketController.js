import Ticket from '../models/tickets.js';
import nodemailer from 'nodemailer';

/**
 * @desc    Create a new support ticket and send email notification
 * @route   POST /api/tickets
 * @access  Protected (Patient)
 */
export const createTicket = async (req, res) => {
  try {
    const { patientId, patientName, patientEmail, subject, message } = req.body;

    // 1. Save the ticket to the MongoDB Database
    const newTicket = new Ticket({
      patientId,
      patientName,
      patientEmail,
      subject,
      message
    });
    await newTicket.save();

    // 2. Smart Email Routing Logic
    let destinationEmail;
    if (subject === 'Account Settings') {
      destinationEmail = process.env.DEVELOPER_EMAIL || 'lucillerbnq@gmail.com';
    } else {
      destinationEmail = process.env.DENTIST_EMAIL || 'matienzo.dentalclinic@gmail.com';
    }

    // 3. Configure the Email Transporter (using the App Password you generated before)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 4. Format the Email Payload
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: destinationEmail,
      replyTo: patientEmail, // 🔑 Allows you or the dentist to hit "Reply" and email the patient directly!
      subject: `Support Ticket [${subject}] - from ${patientName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a;">New Support Ticket</h2>
          <p><strong>Patient Name:</strong> ${patientName}</p>
          <p><strong>Patient ID:</strong> ${patientId}</p>
          <p><strong>Contact Email:</strong> ${patientEmail}</p>
          <p><strong>Category:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Message Details:</strong></p>
          <p style="white-space: pre-wrap; color: #334155; background: #f8fafc; padding: 15px; border-radius: 8px;">${message}</p>
        </div>
      `
    };

    // 5. Send the email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      success: true, 
      message: "Ticket submitted and email sent successfully.", 
      ticket: newTicket 
    });

  } catch (error) {
    console.error("Error creating support ticket:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process your request. Please try again later." 
    });
  }
};