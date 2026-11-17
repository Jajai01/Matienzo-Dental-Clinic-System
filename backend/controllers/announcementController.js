import { Announcement } from '../models/Announcement.js';
import User from '../models/user.js';

// @desc    Create a new clinic announcement
// @route   POST /api/announcements
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, tags, author } = req.body;

    const newAnnouncement = new Announcement({
      title,
      message,
      tags,
      author
    });

    const savedAnnouncement = await newAnnouncement.save();
    return res.status(201).json({ success: true, announcement: savedAnnouncement });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({ success: false, message: "Server error creating announcement" });
  }
};

// @desc    Get all active announcements (For Admin & Patient Dashboards)
// @route   GET /api/announcements
export const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({ success: false, message: "Server error fetching announcements" });
  }
};

// @desc    Archive/Delete an announcement
// @route   DELETE /api/announcements/:id
export const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Announcement removed." });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ success: false, message: "Failed to delete." });
  }
};

// @desc    Send email broadcast based on patient notification/marketing preferences via Brevo HTTPS API
// @route   POST /api/admin/send-broadcast
export const sendBroadcast = async (req, res) => {
  try {
    const { subject, message, targetGroup } = req.body;
    console.log("📥 Received broadcast request:", { subject, targetGroup });

    if (!subject || !message || !targetGroup) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Ensure Brevo API key is configured in Render Environment Variables
    const brevoApiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';
    if (!brevoApiKey) {
      console.error("❌ BREVO_API_KEY environment variable is missing on the server.");
      return res.status(500).json({
        success: false,
        message: "Email service credential (BREVO_API_KEY) is not configured on Render environment variables."
      });
    }

    // Filter patients based on their toggle preferences in the database
    let queryFilter = {};
    if (targetGroup === 'notifications') {
      queryFilter = { $or: [{ emailNotifications: true }, { emailNotifications: { $exists: false } }] };
    } else if (targetGroup === 'promotions') {
      queryFilter = { promotions: true };
    } else {
      return res.status(400).json({ success: false, message: "Invalid target group specified." });
    }

    // Fetch only users who opted in
    const eligibleUsers = await User.find(queryFilter).select('email');
    console.log(`👥 Found ${eligibleUsers.length} matching user(s) in database.`);

    const recipientEmails = [...new Set(eligibleUsers.map(user => user.email).filter(Boolean))];
    console.log("📧 Target Recipient Emails:", recipientEmails);

    if (recipientEmails.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Broadcast complete. No patients have opted into this group yet."
      });
    }

    const senderEmail = process.env.EMAIL_USER || 'matienzo.dentalclinic@gmail.com';

    const htmlContent = `
      <div style="background-color: #f1f5f9; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 1px; margin: 0;">MATIENZO DENTAL CLINIC</h1>
              <p style="color: #cbd5e1; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Patient Care & Excellence</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px;">Dear Valued Patient,</p>
              
              <div style="font-size: 15px; line-height: 1.7; color: #475569; white-space: pre-wrap; margin-bottom: 30px;">${message}</div>
              
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #64748b; margin: 0;">Warm regards,</p>
                <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 5px 0 0 0;">The Matienzo Dental Clinic Team</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0;">
                You are receiving this email because you opted into <strong>${targetGroup === 'notifications' ? 'Account Notifications' : 'Marketing & Promotional Offers'}</strong> via your Patient Portal preferences.<br>
                © ${new Date().getFullYear()} Matienzo Dental Clinic. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </div>
    `;

    // Brevo requires at least one 'to' recipient; using senderEmail in 'to' and patients in 'bcc' protects patient privacy
    const brevoPayload = {
      sender: {
        name: 'Matienzo Dental Clinic',
        email: senderEmail
      },
      to: [{ email: senderEmail, name: 'Matienzo Dental Clinic' }],
      bcc: recipientEmails.map(email => ({ email })),
      subject: subject,
      htmlContent: htmlContent
    };

    console.log("🚀 Sending broadcast via Brevo HTTPS API...");
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(brevoPayload)
    });

    const brevoData = await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error("❌ Brevo API Error:", brevoResponse.status, brevoData);
      return res.status(502).json({
        success: false,
        message: `Brevo delivery failed: ${brevoData.message || 'Check sender verification and API key.'}`
      });
    }

    console.log("✅ Broadcast emails sent successfully via Brevo! Message ID:", brevoData.messageId);

    return res.status(200).json({
      success: true,
      message: `Broadcast successfully dispatched to ${recipientEmails.length} patient(s)!`
    });

  } catch (error) {
    console.error("❌ Broadcast dispatch error:", error);
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};