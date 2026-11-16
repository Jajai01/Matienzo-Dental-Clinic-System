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

    console.log(`[Ticket System] Processing support ticket from: ${patientName} (${patientEmail})`);

    // 1. Save the ticket to the MongoDB Database FIRST
    const newTicket = new Ticket({
      patientId,
      patientName,
      patientEmail,
      subject,
      message
    });
    await newTicket.save();
    console.log(`[Ticket System] Ticket successfully saved to database with ID: ${newTicket._id}`);

    // 2. Respond immediately to the client to prevent any HTTP timeout
    res.status(201).json({ 
      success: true, 
      message: "Ticket submitted successfully.", 
      ticket: newTicket 
    });

    // 3. Handle Email Dispatch Asynchronously in the Background (Non-blocking)
    setImmediate(async () => {
      try {
        // Smart Email Routing Logic
        let destinationEmail;
        if (subject === 'Account Settings') {
          destinationEmail = process.env.DEVELOPER_EMAIL || 'lucillerbnq@gmail.com';
        } else {
          destinationEmail = process.env.DENTIST_EMAIL || 'matienzo.dentalclinic@gmail.com';
        }

        // Configure the Email Transporter with explicit timeouts
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for port 465
          family: 4,    // Forces IPv4 to prevent hanging on cloud hosting like Render
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          connectionTimeout: 10000, // 10 seconds max connection wait
          socketTimeout: 10000      // 10 seconds max socket wait
        });

        // Format the Email Payload
        const mailOptions = {
          from: `"Matienzo Dental Support" <${process.env.EMAIL_USER}>`,
          to: destinationEmail,
          replyTo: patientEmail || process.env.EMAIL_USER,
          subject: `Support Ticket [${subject}] - from ${patientName}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0;">New Support Ticket Received</h2>
              <p><strong>Patient Name:</strong> ${patientName}</p>
              <p><strong>Patient ID:</strong> ${patientId || 'N/A'}</p>
              <p><strong>Contact Email:</strong> ${patientEmail}</p>
              <p><strong>Category:</strong> ${subject}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p><strong>Message Details:</strong></p>
              <p style="white-space: pre-wrap; color: #334155; background: #f8fafc; padding: 15px; border-radius: 8px; line-height: 1.5;">${message}</p>
            </div>
          `
        };

        // Send the email in the background
        await transporter.sendMail(mailOptions);
        console.log(`[Ticket System] Support email successfully dispatched to: ${destinationEmail}`);
      } catch (emailError) {
        console.error("🚨 Background Email Dispatch Failed:", emailError.message);
      }
    });

  } catch (error) {
    console.error("🚨 Error creating support ticket:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to process your request. Please try again later." 
    });
  }
};