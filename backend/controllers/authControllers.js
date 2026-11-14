import Counter from '../models/counter.js';
import User from '../models/user.js';       
import sendWelcomeEmail from '../utils/sendWelcomeEmail.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 🔑 NEW IMPORTS for Password Reset
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// 🔑 FIX: Updated to Port 587 and used process.env variables to bypass Google blocks
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const registerUser = async (req, res) => {
  const { 
    email,
    password,
    firstName,
    middleName,
    lastName,
    birthdate,
    gender,
    contactNumber,
    address,
    weight,
    patientStatus,
    medicalConditions,
    allergies,
    medications,
    emergencyName,
    emergencyRelationship,
    emergencyContact 
  } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    
    // 2. Generate Serialized Patient ID
    const counter = await Counter.findOneAndUpdate(
      { id: "patient_id_tracker" }, 
      { $inc: { seq: 1 } },        
      { returnDocument: 'after', upsert: true }
    );

    const nextAvailableNumber = counter.seq;
    const assignedPatientId = String(nextAvailableNumber).padStart(4, '0');

    // 3. Create and save new user to MongoDB
    const newUser = new User({ 
      email,
      password, 
      firstName,
      middleName,
      lastName,
      birthdate,
      gender,
      contactNumber,
      address,
      weight,
      patientStatus,
      medicalConditions,
      allergies,
      medications,
      emergencyName,
      emergencyRelationship,
      emergencyContact,
      patientId: assignedPatientId 
    });
    
    await newUser.save();

    // 4. TRIGGER WELCOME EMAIL (Run asynchronously in the background)
    sendWelcomeEmail(newUser.email, newUser.firstName, newUser.patientId);

    // 5. Respond to frontend
    res.status(201).json({
      returnDocument: 'after',
      message: 'Registration successful! A welcome email has been sent.',
      patientId: assignedPatientId
    });

  } catch (error) {
    console.error("Error during registration:", error); 
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ==========================================
// 🔑 UNIFIED LOGIN FUNCTION (Handles both Admin & Patient)
// ==========================================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validate inputs exist FIRST
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // 2. Check if credentials belong to the Admin via environmental variables
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { role: 'admin', email: process.env.ADMIN_EMAIL },
        process.env.JWT_SECRET || 'fallback_secret_key',     
        { expiresIn: '24h' } 
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Admin login successful.', 
        role: 'admin',
        token,
        user: {
          email: process.env.ADMIN_EMAIL,
          role: 'admin',
          firstName: 'System',
          lastName: 'Administrator'
        }
      });
    }

    // 3. If not admin, check for a regular Patient account in the database
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failure: Account matching ${email} does not exist.`);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 4. Securely compare the hashed password using bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Password does not match with email.' });
    }

    // Update status to online upon successful password match
    await User.findByIdAndUpdate(user._id, { isOnline: true });

    // 5. Generate a JWT token for session management
    const token = jwt.sign(
      { userId: user._id, patientId: user.patientId, role: 'patient' },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' } 
    );

    // 6. Respond with success, role, token, and non-sensitive user data
    return res.status(200).json({
      returnDocument: 'after',
      message: 'Login successful.',
      role: 'patient',
      token,
      user: {
        id: user._id,
        patientId: user.patientId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        app_version: process.env.APP_VERSION || '0.1',
        emergencyName: user.emergencyName,
        emergencyContact: user.emergencyContact,
        emergencyRelationship: user.emergencyRelationship
      },
    });

  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// Kept as standalone reference if your app references it elsewhere, 
// but it now points directly to the logic above or acts as a direct alias.
export const adminAuth = async (req, res) => {
  return loginUser(req, res);
};

export const getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const user = await User.findOne({ patientId }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { userId } = req.body; 
    if (userId) {
      await User.findByIdAndUpdate(userId, { isOnline: false });
    }
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateOnlineStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { isOnline } = req.body; 
    
    await User.findOneAndUpdate({ patientId }, { isOnline });
    res.status(200).json({ returnDocument: 'after' });
  } catch (error) {
    res.status(500).json({ returnDocument: 'before' });
  }
};

// ==========================================
// 🔑 PASSWORD RESET FUNCTIONS
// ==========================================

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Return 200 even if user not found to prevent email fishing/scraping
      return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
    }

    // Generate a secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set it to user document alongside an expiration (e.g., 30 minutes)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; 
    await user.save();

    // Create the reset URL pointing to your React frontend
    const resetUrl = `${import.meta.env.VITE_API_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send the email
    await transporter.sendMail({
      from: `"Matienzo Dental Clinic" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request - Matienzo Dental Clinic',
      html: `
        <h3>Hello ${user.firstName},</h3>
        <p>You recently requested a password reset for your Patient Portal account.</p>
        <p>Please click the link below to set a new password. This link will expire in 30 minutes.</p>
        <a href="${resetUrl}" style="background-color: #D4AF37; color: #1A1510; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; margin-top: 10px; margin-bottom: 10px;">Reset My Password</a>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `
    });

    res.status(200).json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
  } catch (error) {
    console.log("Forgot password error:", error);
    res.status(500).json({ message: "Email could not be sent. Please try again later." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    // Hash the token from the URL to compare with the one saved in the database
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() } // Ensure token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset token." });
    }

    user.password = req.body.password;
    
    // Clear the reset token fields so they can't be reused
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully! Redirecting to login..." });
  } catch (error) {
    console.log("Reset password error:", error);
    res.status(500).json({ message: "Server error updating password." });
  }
};