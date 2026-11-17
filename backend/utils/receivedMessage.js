import express from 'express';

const router = express.Router();

// ==========================================
// BREVO HTTPS EMAIL HELPER (Bypasses Render SMTP Block)
// ==========================================
const sendBrevoEmail = async ({ senderName = 'Matienzo Dental Website', to, subject, html, replyTo }) => {
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

router.post('/', async (req, res) => {
  const { fullName, email, reason, concern, target } = req.body;

  if (!fullName || !email || !concern) {
    return res.status(400).json({
      success: false,
      message: 'Full name, email, and message concern are required.'
    });
  }

  // Determine recipient with safe fallback addresses so destinationEmail is never undefined
  let destinationEmail;
  if (target === 'dentist') {
    destinationEmail = process.env.DENTIST_EMAIL || process.env.EMAIL_USER || 'matienzo.dentalclinic@gmail.com';
  } else if (target === 'developer') {
    destinationEmail = process.env.DEVELOPER_EMAIL || process.env.EMAIL_USER || 'matienzo.dentalclinic@gmail.com';
  } else {
    return res.status(400).json({ success: false, message: 'Invalid contact target.' });
  }

  // Respond immediately so the frontend never hits a 500 or timeout error
  res.status(200).json({
    success: true,
    message: 'Message sent successfully.'
  });

  // Dispatch email asynchronously in the background via Brevo HTTPS API
  setImmediate(async () => {
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #D4AF37;">New Message from the Contact Page</h2>
          <p><strong>Patient Name:</strong> ${fullName}</p>
          <p><strong>Reply-To Email:</strong> ${email}</p>
          <p><strong>Category:</strong> ${reason || 'General'}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h3 style="margin-bottom: 10px; color: #1e293b;">Message Content:</h3>
          <p style="background-color: #f8fafc; padding: 15px; border-radius: 8px; white-space: pre-wrap; color: #334155;">${concern}</p>
        </div>
      `;

      const info = await sendBrevoEmail({
        senderName: `${fullName} (Website Form)`,
        to: destinationEmail,
        replyTo: email,
        subject: `New Website Inquiry: ${reason || 'General'}`,
        html: emailHtml
      });

      console.log(`✅ Contact email delivered to ${destinationEmail} via Brevo (Message ID: ${info.messageId})`);
    } catch (error) {
      console.error('🚨 Background Brevo Contact Email Error:', error.message);
    }
  });
});

export default router;