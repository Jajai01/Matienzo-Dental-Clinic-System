import Appointment from '../models/appointments.js'; 
import nodemailer from 'nodemailer';
import { MedicalRecord } from '../models/MedicalData.js';
import User from '../models/user.js';
import PDFDocument from 'pdfkit';

// ==========================================
// EMAIL CONFIGURATION (SAFE TRANSPORTER)
// ==========================================
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'matienzo.dentalclinic@gmail.com',
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : ''
    }
  });
};

/**
 * @desc    Create a new appointment reservation slot
 * @route   POST /api/appointments
 * @access  Protected (Patient)
 */
export const createAppointment = async (req, res) => {
  try {
    const { 
      patientId, 
      patientName, 
      patientEmail,
      dentist, 
      service, 
      selectedDate, 
      selectedTimeSlot, 
      notes 
    } = req.body;

    console.log("==== EMAIL DIAGNOSTICS ====");
    console.log("1. Is Patient Email captured?:", patientEmail || "MISSING!");
    console.log("2. Is the App Password loaded?:", process.env.EMAIL_PASS ? "YES - LOADED" : "NO - UNDEFINED");
    console.log("===========================");

    if (!patientId || !patientName || !dentist || !service || !selectedDate || !selectedTimeSlot) {
      return res.status(400).json({ 
        returnDocument: 'before',
        message: "Missing required booking details. Please verify your form selections." 
      });
    }

    const slotOccupied = await Appointment.findOne({
      selectedDate,
      selectedTimeSlot,
      status: { $in: ["Pending Review", "Confirmed", "Completed"] }
    });

    if (slotOccupied) {
      return res.status(400).json({ 
        success: false, 
        message: "This specific 30-minute time window has just been reserved by another patient. Please select a different hour." 
      });
    }

    const appointment = new Appointment({
      patientId,
      patientName,
      patientEmail,
      dentist,
      service,
      selectedDate,
      selectedTimeSlot,
      notes
    });

    const savedAppointment = await appointment.save();
    
    // ==========================================
    // TRIGGER EMAIL NOTIFICATIONS
    // ==========================================

    const patientHtmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #D4AF37;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Matienzo Dental Clinic</h1>
            <p style="color: #D4AF37; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Appointment Request Received</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #0f172a; margin-top: 0;">Hello ${patientName},</h2>
            <p style="color: #475569; line-height: 1.6; font-size: 15px;">
              Thank you for choosing Matienzo Dental Clinic. We have successfully received your appointment request. Our admin team will review it shortly and send you a final confirmation once approved.
            </p>
            <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Reservation Details</p>
              <p style="margin: 5px 0; color: #0f172a; font-size: 15px;"><strong>Service:</strong> ${service}</p>
              <p style="margin: 5px 0; color: #0f172a; font-size: 15px;"><strong>Date:</strong> ${selectedDate}</p>
              <p style="margin: 5px 0; color: #0f172a; font-size: 15px;"><strong>Time:</strong> ${selectedTimeSlot}</p>
              <p style="margin: 5px 0; color: #0f172a; font-size: 15px;"><strong>Dentist:</strong> ${dentist}</p>
              <p style="margin: 15px 0 0 0; color: #0f172a; font-size: 14px; border-top: 1px solid #cbd5e1; padding-top: 10px;"><strong>Reference Code:</strong> <span style="color: #3b82f6; font-family: monospace; font-size: 16px;">${savedAppointment.referenceCode || savedAppointment._id}</span></p>
            </div>
            <p style="color: #475569; font-size: 13px; line-height: 1.5;">
              <strong>Clinic Guideline Reminder:</strong> Please arrive 15 minutes prior to your scheduled time. If you need to cancel, kindly do so through your patient dashboard at least 24 hours in advance.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna</p>
            <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">This is an automated message, please do not reply directly to this email.</p>
          </div>
        </div>
      </div>
    `;

    const clinicHtmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <div style="background-color: #D4AF37; padding: 20px; text-align: center;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px; letter-spacing: 1px;">New Action Required</h2>
            <p style="color: #0f172a; margin: 5px 0 0 0; font-size: 13px; opacity: 0.8;">A new appointment is pending review</p>
          </div>
          <div style="padding: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 120px;">Patient Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold;">${patientName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Service</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Requested Date</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #3b82f6; font-weight: bold;">${selectedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Time Slot</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #3b82f6; font-weight: bold;">${selectedTimeSlot}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Reference</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-family: monospace;">${savedAppointment.referenceCode || savedAppointment._id}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; background-color: #f1f5f9; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Medical Notes / Symptoms</p>
              <p style="margin: 8px 0 0 0; color: #0f172a; font-size: 14px; font-style: italic;">"${notes || 'None provided.'}"</p>
            </div>
            <div style="margin-top: 30px; text-align: center;">
              <p style="color: #475569; font-size: 13px;">Please log in to the Clinic Master Schedule dashboard to review, confirm, or reschedule this reservation.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const activeTransporter = createTransporter();
    const emailPromises = [];

    emailPromises.push(
      activeTransporter.sendMail({
        from: '"Matienzo Dental System" <matienzo.dentalclinic@gmail.com>',
        to: 'matienzo.dentalclinic@gmail.com',
        subject: `New Appointment Request: ${patientName}`,
        html: clinicHtmlTemplate
      })
    );

    if (patientEmail) {
      emailPromises.push(
        activeTransporter.sendMail({
          from: '"Matienzo Dental Clinic" <matienzo.dentalclinic@gmail.com>',
          to: patientEmail, 
          subject: `Appointment Request Received: ${service}`,
          html: patientHtmlTemplate
        })
      );
    }

    Promise.all(emailPromises)
      .then(() => console.log("All appointment notifications dispatched successfully."))
      .catch((err) => console.error("Email notification dispatch failed:", err));

    return res.status(201).json({ 
      success: true, 
      message: "Appointment created successfully.", 
      appointment: savedAppointment 
    });

  } catch (error) {
    console.error("Error inside createAppointment controller:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error processing the appointment request.", 
      error: error.message 
    });
  }
};

/**
 * @desc    Get complete historical and upcoming appointment list for a single patient
 * @route   GET /api/appointments/patient/:patientId
 * @access  Protected (Patient/Admin)
 */
export const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });

  } catch (error) {
    console.error("Error inside getPatientAppointments controller:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error retrieving patient ledger logs.", 
      error: error.message 
    });
  }
};

/**
 * @desc    Soft-cancel an appointment request
 * @route   PATCH /api/appointments/:id/cancel
 * @access  Protected (Patient/Admin)
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientEmail } = req.body; 

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: "Target appointment reference file not found." 
      });
    }

    if (appointment.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an operation that has already been marked as clinically completed."
      });
    }

    appointment.status = "Cancelled";
    const updatedAppointment = await appointment.save();

    let recipientEmail = patientEmail || appointment.patientEmail;
    if (!recipientEmail && appointment.patientId) {
      const userDoc = await User.findOne({ patientId: appointment.patientId });
      if (userDoc) recipientEmail = userDoc.email;
    }

    const patientCancelTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <div style="background-color: #ef4444; padding: 30px; text-align: center; border-bottom: 4px solid #b91c1c;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Matienzo Dental Clinic</h1>
            <p style="color: #fee2e2; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Appointment Cancelled</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #0f172a; margin-top: 0;">Hello ${appointment.patientName},</h2>
            <p style="color: #475569; line-height: 1.6; font-size: 15px;">
              Your appointment reservation has been successfully cancelled as requested.
            </p>
          </div>
        </div>
      </div>
    `;

    const activeTransporter = createTransporter();
    const emailPromises = [
      activeTransporter.sendMail({
        from: '"Matienzo Dental System" <matienzo.dentalclinic@gmail.com>',
        to: 'matienzo.dentalclinic@gmail.com',
        subject: `Cancelled Appointment: ${appointment.patientName}`,
        html: `<p>Appointment ID ${appointment._id} was cancelled.</p>`
      })
    ];

    if (recipientEmail) {
      emailPromises.push(
        activeTransporter.sendMail({
          from: '"Matienzo Dental Clinic" <matienzo.dentalclinic@gmail.com>',
          to: recipientEmail,
          subject: `Appointment Cancelled: ${appointment.service}`,
          html: patientCancelTemplate
        })
      );
    }

    Promise.all(emailPromises).catch(err => console.error("Email dispatch failed:", err));

    return res.status(200).json({
      success: true,
      message: "Appointment registration cancelled successfully.",
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error("Error inside cancelAppointment controller:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get ALL appointments for the Admin Calendar
 * @route   GET /api/admin/appointments
 * @access  Protected (Admin)
 */
export const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({});
    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error("Error fetching admin calendar data:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error fetching master schedule." 
    });
  }
};

/**
 * @desc    Update appointment status and send email if cancelled by admin
 * @route   PATCH /api/appointments/admin/appointments/:id/status
 * @access  Protected (Admin)
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const incomingStatus = req.body.newStatus || req.body.status; 
    const cancellationReason = req.body.cancellationReason;

    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Target appointment not found." });
    }

    console.log("========== STATUS UPDATE TRIGGERED ==========");
    console.log("1. Appointment Found for ID:", appointment._id);
    console.log("2. Patient Name currently stored as:", appointment.patientName);
    console.log("3. Target Status:", incomingStatus);

    appointment.status = incomingStatus;
    await appointment.save();

    // 🔑 HANDLE ADMIN CANCELLATION & EMAIL NOTIFICATION
    if (incomingStatus === "Cancelled") {
      let recipientEmail = appointment.patientEmail || req.body.patientEmail;
      
      if (!recipientEmail && appointment.patientId) {
        const userDoc = await User.findOne({ patientId: appointment.patientId });
        if (userDoc) recipientEmail = userDoc.email;
      }

      console.log("========== EMAIL DEBUG LOGS ==========");
      console.log("1. Target Appointment ID:", appointment._id);
      console.log("2. Patient Name:", appointment.patientName);
      console.log("3. Recipient Email Resolved as:", recipientEmail || "❌ NULL / UNDEFINED");
      console.log("4. EMAIL_PASS status:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ UNDEFINED");
      console.log("======================================");

      const adminCancelTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background-color: #ef4444; padding: 30px; text-align: center; border-bottom: 4px solid #b91c1c;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Matienzo Dental Clinic</h1>
              <p style="color: #fee2e2; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase;">Appointment Cancelled by Clinic</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #0f172a; margin-top: 0;">Hello ${appointment.patientName},</h2>
              <p style="color: #475569; line-height: 1.6; font-size: 15px;">
                We regret to inform you that your appointment has been cancelled by the clinic administration due to unforeseen schedule changes.
              </p>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 13px;"><strong>Reason:</strong> ${cancellationReason || 'Doctor emergency / schedule conflict'}</p>
              </div>
              <p style="color: #475569; font-size: 14px;">Service: <strong>${appointment.service}</strong><br/>Date: <strong>${appointment.selectedDate} (${appointment.selectedTimeSlot})</strong></p>
            </div>
          </div>
        </div>
      `;

      if (recipientEmail) {
        try {
          const activeTransporter = createTransporter();
          const info = await activeTransporter.sendMail({
            from: '"Matienzo Dental Clinic" <matienzo.dentalclinic@gmail.com>',
            to: recipientEmail,
            subject: `Important: Appointment Cancelled - ${appointment.service}`,
            html: adminCancelTemplate
          });
          console.log("✅ Email successfully sent! Response:", info.response);
        } catch (emailErr) {
          console.error("🚨 NODEMAILER CRASH ERROR:", emailErr);
        }
      } else {
        console.log("❌ Skipping email: No recipient email address found for this patient.");
      }
    }

    if (incomingStatus === "Completed") {
      const historyEntry = {
        id: appointment.referenceCode, 
        date: appointment.selectedDate,
        diagnosis: "Pending Notes", 
        treatment: appointment.service,
        dentist: appointment.dentist
      };

      console.log("4. Attempting to push to Medical Records...");
      const updatedRecord = await MedicalRecord.findOneAndUpdate(
        { patientId: appointment.patientId },
        { 
          $push: { history: historyEntry },
          $set: { patientName: appointment.patientName || "Fallback Name Inserted" } 
        },
        { upsert: true, returnDocument: 'after' } 
      );
      console.log("6. Successfully saved Medical Record!");
    }

    return res.status(200).json({ 
      success: true, 
      message: "Status updated successfully", 
      appointment 
    });

  } catch (error) {
    console.error("🚨 CRASH in updateAppointmentStatus:", error);
    return res.status(500).json({ returnDocument: 'before', message: "Internal server error" });
  }
};

export const updateBillingAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { billingAmount } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: { billingAmount: Number(billingAmount) } },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ returnDocument: 'before', message: "Appointment not found." });
    return res.status(200).json({ returnDocument: 'after', appointment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error updating billing." });
  }
};

export const markAsPaid = async (req, res) => {
  try {
    const { 
      paymentStatus, 
      billingAmount, 
      discountApplied, 
      finalAmountPaid, 
      paymentReference 
    } = req.body;

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: paymentStatus || 'Paid',
        billingAmount: billingAmount,
        discountApplied: discountApplied,
        finalAmountPaid: finalAmountPaid,
        paymentReference: paymentReference,
        paymentDate: Date.now()
      },
      { returnDocument: 'after' } 
    );
    
    if (!updatedAppointment) {
      return res.status(404).json({ returnDocument: 'before', message: "Appointment not found" });
    }
    
    res.status(200).json({ returnDocument: 'after', appointment: updatedAppointment });
  } catch (error) {
    console.error("Payment processing error:", error); 
    res.status(500).json({ returnDocument: 'before', message: "Server error processing payment." });
  }
};

export const generateReceiptPDF = async (req, res) => {
  try {
    const { patientName, selectedDate, services, totalAmount, referenceCode } = req.body;
    const doc = new PDFDocument({ size: 'A5', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Official_Receipt_${patientName.replace(/\s+/g, '_')}.pdf"`);

    doc.pipe(res);
    doc.rect(0, 0, doc.page.width, 10).fill('#D4AF37');
    doc.moveDown(2);

    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Matienzo Dental Clinic', { align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna', { align: 'center' });
    doc.fontSize(7).text('(In Front of Emilio Jacinto Shrine)', { align: 'center' });
    doc.fontSize(8).text('Tel: 0927 926 2535', { align: 'center' });
    doc.moveDown(2);

    doc.fillColor('#0f172a').fontSize(10).font('Helvetica');
    doc.text(`Date: ${selectedDate}`);
    doc.text(`Patient: ${patientName}`);
    doc.text(`Reference: ${referenceCode}`);
    doc.moveDown(1);

    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#94a3b8').text('OPERATIONS / SERVICES').moveDown(0.5);
    doc.fillColor('#0f172a').fontSize(10).font('Helvetica');

    if (services && services.length > 0) {
      services.forEach(svc => {
        const yPos = doc.y;
        const displayName = svc.quantity > 1 ? `${svc.quantity}x ${svc.name}` : svc.name;
        doc.text(displayName, 40, yPos, { width: 200 });
        doc.text(`PHP ${Number(svc.cost).toFixed(2)}`, 240, yPos, { width: 139, align: 'right' });
      });
    }

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1);

    const finalY = doc.y;
    doc.font('Helvetica-Bold').fontSize(12).text('GRAND TOTAL', 40, finalY);
    doc.fillColor('#D4AF37').fontSize(16).text(`PHP ${Number(totalAmount).toFixed(2)}`, 200, finalY - 2, { width: 179, align: 'right' });

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};

export const submitPaymentIntent = async (req, res) => {
  try {
    const { paymentMethod, paymentReference, paymentStatus } = req.body;
    await Appointment.findByIdAndUpdate(req.params.id, { paymentMethod, paymentReference, paymentStatus });
    res.status(200).json({ returnDocument: 'after', message: "Payment info submitted." });
  } catch (error) {
    res.status(500).json({ returnDocument: 'before', message: "Server error processing payment." });
  }
};