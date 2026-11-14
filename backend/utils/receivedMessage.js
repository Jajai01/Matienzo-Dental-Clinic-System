import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/', async (req, res) => {
  const { fullName, email, reason, concern, target } = req.body;

  // 🔑 DEBUG LOGS: This will print in your backend terminal when you submit the form
  console.log("=== EMAIL DEBUG LOG ===");
  console.log("Email User loaded:", process.env.EMAIL_USER || "MISSING");
  console.log("Email Pass length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : "MISSING");
  console.log("Target:", target);
  console.log("=======================");

  try {
    // 1. Explicit SMTP Configuration (More reliable than service: 'gmail')
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 2. Determine who receives this specific message
    let destinationEmail;
    if (target === 'dentist') {
      destinationEmail = process.env.DENTIST_EMAIL;
    } else if (target === 'developer') {
      destinationEmail = process.env.DEVELOPER_EMAIL;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid contact target.' });
    }

    // 3. Format the email content
    const mailOptions = {
      from: `"${fullName} (Website Form)" <${process.env.EMAIL_USER}>`,
      to: destinationEmail,
      subject: `New Website Inquiry: ${reason}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-w-600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #D4AF37;">New Message from the Contact Page</h2>
          <p><strong>Patient Name:</strong> ${fullName}</p>
          <p><strong>Reply-To Email:</strong> ${email}</p>
          <p><strong>Category:</strong> ${reason}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h3 style="margin-bottom: 10px; color: #1e293b;">Message Content:</h3>
          <p style="background-color: #f8fafc; padding: 15px; border-radius: 8px; white-space: pre-wrap; color: #334155;">${concern}</p>
        </div>
      `,
      replyTo: email // Allows you to hit "Reply" in Gmail and email the patient back directly!
    };

    // 4. Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully.' });

  } catch (error) {
    console.error('Email Delivery Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message. Check server logs.' });
  }
});

export default router;