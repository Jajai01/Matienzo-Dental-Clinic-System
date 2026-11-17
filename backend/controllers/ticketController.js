import Ticket from '../models/tickets.js';

// ==========================================
// BREVO HTTPS EMAIL HELPER (Bypasses Render SMTP Block)
// ==========================================
const sendBrevoEmail = async ({ senderName = 'Matienzo Dental Support', to, subject, html, replyTo }) => {
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

  if (replyTo) {
    payload.replyTo = { email: replyTo };
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

/**
 * @desc    Create a new support ticket and send email notification via Brevo HTTPS API
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

    // 3. Handle Email Dispatch Asynchronously in the Background via Brevo HTTPS API
    setImmediate(async () => {
      try {
        // Smart Email Routing Logic
        let destinationEmail;
        if (subject === 'Account Settings') {
          destinationEmail = process.env.DEVELOPER_EMAIL || 'lucillerbnq@gmail.com';
        } else {
          destinationEmail = process.env.DENTIST_EMAIL || 'matienzo.dentalclinic@gmail.com';
        }

        const emailHtml = `
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
        `;

        const info = await sendBrevoEmail({
          senderName: 'Matienzo Dental Support',
          to: destinationEmail,
          replyTo: patientEmail || process.env.EMAIL_USER,
          subject: `Support Ticket [${subject}] - from ${patientName}`,
          html: emailHtml
        });

        console.log(`[Ticket System] Support email successfully dispatched via Brevo to: ${destinationEmail} (Message ID: ${info.messageId})`);
      } catch (emailError) {
        console.error("🚨 Background Brevo Email Dispatch Failed:", emailError.message);
      }
    });

  } catch (error) {
    console.error("🚨 Error creating support ticket:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process your request. Please try again later."
      });
    }
  }
};