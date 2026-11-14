import User from '../models/user.js'; 
import bcrypt from 'bcrypt';
import Appointment from '../models/appointments.js';
import { MedicalRecord } from '../models/MedicalData.js';

// 🔑 Helper function to look up a user by either MongoDB _id or custom patientId
const findUserQuery = (id) => {
  const isMongoId = id && id.match(/^[0-9a-fA-F]{24}$/);
  return isMongoId ? { $or: [{ _id: id }, { patientId: id }] } : { patientId: id };
};

/**
 * @desc    Get user profile data
 * @route   GET /api/profile/:id
 * @access  Protected (Patient)
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne(findUserQuery(req.params.id)).select('-password'); 
    
    if (!user) {
      return res.status(404).json({ returnDocument: 'before', message: "User not found." });
    }

    res.status(200).json({ returnDocument: 'after', user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ returnDocument: 'before', message: "Server error retrieving profile." });
  }
};

/**
 * @desc    Update user profile & dependents
 * @route   PUT /api/profile/:id
 * @access  Protected (Patient)
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { 
      firstName, middleName, lastName, email, 
      contactNumber, birthdate, gender, 
      streetAddress, city, province, zipCode,
      emergencyName, emergencyRelationship, emergencyContact 
    } = req.body;

    const updateData = {
      firstName,
      middleName,
      lastName,
      email,
      contactNumber,
      birthdate,
      gender,
      address: `${streetAddress}, ${city}, ${province}, ${zipCode}`,
      emergencyName,
      emergencyRelationship,
      emergencyContact
    };

    const updatedUser = await User.findOneAndUpdate(
      findUserQuery(req.params.id), 
      { $set: updateData },
      { 
        returnDocument: 'after', 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ returnDocument: 'before', message: "User not found." });
    }

    res.status(200).json({ 
      returnDocument: 'after',
      message: "Profile updated successfully.", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ 
      returnDocument: 'before',
      message: "Server error updating profile.", 
      error: error.message 
    });
  }
};

/**
 * @desc    Get user preferences
 * @route   GET /api/profile/:id/preferences
 */
export const getPreferences = async (req, res) => {
  try {
    const user = await User.findOne(findUserQuery(req.params.id));
    if (!user) return res.status(404).json({ returnDocument: 'before', message: "User not found." });

    const rawPrefs = user.preferences || {};
    const preferences = {
      notifyEmail: rawPrefs.notifyEmail ?? true,
      notifyMarketing: rawPrefs.notifyMarketing ?? false,
      twoFactorAuth: rawPrefs.twoFactorAuth ?? false,
      // 🔑 Checks root level first, then preferences sub-object, then legacy keys, defaulting to true
      allowClinicalResearch: user.allowClinicalResearch ?? rawPrefs.allowClinicalResearch ?? rawPrefs.shareMedicalData ?? true
    };

    res.status(200).json({ returnDocument: 'after', preferences });
  } catch (error) {
    console.error("Get Preferences Error:", error);
    res.status(500).json({ returnDocument: 'before', message: "Failed to fetch preferences" });
  }
};

/**
 * @desc    Update user preferences
 * @route   PUT /api/profile/:id/preferences
 */
export const updatePreferences = async (req, res) => {
  try {
    const { notifyEmail, notifyMarketing, twoFactorAuth, allowClinicalResearch } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      findUserQuery(req.params.id), 
      { 
        // 🔑 Save at the root level for admin export and inside preferences for frontend UI sync
        allowClinicalResearch: allowClinicalResearch,
        preferences: {
          notifyEmail,
          notifyMarketing,
          twoFactorAuth,
          allowClinicalResearch
        } 
      }, 
      { new: true }
    );
    
    if (!updatedUser) return res.status(404).json({ returnDocument: 'before', message: "User not found." });

    const preferences = {
      notifyEmail: updatedUser.preferences?.notifyEmail ?? notifyEmail,
      notifyMarketing: updatedUser.preferences?.notifyMarketing ?? notifyMarketing,
      twoFactorAuth: updatedUser.preferences?.twoFactorAuth ?? twoFactorAuth,
      allowClinicalResearch: updatedUser.allowClinicalResearch
    };

    res.status(200).json({ returnDocument: 'after', preferences });
  } catch (error) {
    console.error("Update Preferences Error:", error);
    res.status(500).json({ returnDocument: 'before', message: "Failed to update preferences" });
  }
};

/**
 * @desc    Change Password Securely
 * @route   PUT /api/profile/:id/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findOne(findUserQuery(req.params.id)).select('+password');
    if (!user) return res.status(404).json({ returnDocument: 'before', message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ returnDocument: 'before', message: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate(findUserQuery(req.params.id), { password: hashedPassword });

    res.status(200).json({ returnDocument: 'after', message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ returnDocument: 'before', message: error.message });
  }
};

/**
 * @desc    Export patient data to PDF package
 * @route   GET /api/profile/:patientId/export
 */
export const getPatientExportData = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });
    let medicalRecord = await MedicalRecord.findOne({ patientId });

    if (!medicalRecord) {
      medicalRecord = { history: [], prescriptions: [] };
    }

    return res.status(200).json({
      success: true,
      appointments,
      medicalRecord
    });
  } catch (error) {
    console.error("Error generating export data:", error);
    return res.status(500).json({ success: false, message: "Server error fetching export data." });
  }
};