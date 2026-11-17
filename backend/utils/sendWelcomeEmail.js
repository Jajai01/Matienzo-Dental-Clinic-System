const sendWelcomeEmail = async (userEmail, userName, patientId) => {
  try {
    const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';
    if (!apiKey) {
      console.error('❌ BREVO_API_KEY is missing in Render environment variables.');
      return;
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
          name: 'Matienzo Dental Clinic',
          email: senderEmail
        },
        to: [{ email: userEmail }],
        subject: 'Welcome to Matienzo Dental Clinic! ✨',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb; text-align: center;">Welcome to Matienzo Dental Clinic!</h2>
            <p>Hi <strong>${userName || 'Valued Patient'}</strong> (Patient ID: ${patientId}),</p>
            <p>Thank you for registering an account with us. We are absolutely thrilled to welcome you to our family!</p>
            <p>With your new account, you can now easily:</p>
            <ul>
              <li>Book and manage your dental appointments online.</li>
              <li>View your digital treatment history.</li>
              <li>Receive instant billing notifications and digital receipts.</li>
            </ul>
            <p style="margin-top: 20px;">Your journey to a healthier, brighter smile starts here. If you have any questions, feel free to reply directly to this email or call us at the clinic.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777; text-align: center;">
              &copy; ${new Date().getFullYear()} Matienzo Dental Clinic. All rights reserved.
            </p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Brevo API Error (${response.status}): ${JSON.stringify(data)}`);
    }

    console.log(`✅ Welcome email successfully sent via Brevo to ${userEmail} (Message ID: ${data.messageId})`);
  } catch (error) {
    console.error('🚨 Error sending welcome email via Brevo:', error.message);
    // Note: Doesn't crash server if email fails, just logs it securely.
  }
};

export default sendWelcomeEmail;