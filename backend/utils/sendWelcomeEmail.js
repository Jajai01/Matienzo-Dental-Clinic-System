import nodemailer from 'nodemailer';

const sendWelcomeEmail = async (userEmail, userName, patientId) => {
  try {
    // 1. Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define the email options with a clean HTML layout
    const mailOptions = {
      from: `"Matienzo Dental Clinic" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to Matienzo Dental Clinic! ✨',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
          <h2 style="color: #2563eb; text-align: center;">Welcome to Matienzo Dental Clinic!</h2>
          <p>Hi <strong>${userName, patientId}</strong>,</p>
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
      `,
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email successfully sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Note: Don't crash your server if the email fails; just log it!
  }
};

export default sendWelcomeEmail;