import { Chat } from '../models/Chat.js'; 
import User from '../models/user.js';
import { MedicalRecord } from '../models/MedicalData.js';
import mongoose from 'mongoose';

// ==========================================
// PATIENT ACTIONS
// ==========================================

// @desc    Patient gets their chat history
// @route   GET /api/chats/patient/:patientId
export const getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ patientId: req.params.patientId });
    if (!chat) {
      return res.status(200).json({ success: true, messages: [] });
    }
    res.status(200).json({ success: true, messages: chat.messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Patient sends a message
// @route   POST /api/chats
export const sendMessage = async (req, res) => {
  try {
    const { patientId, text, message, time } = req.body;
    
    // Safely grab the text whether the frontend sent 'text' or 'message'
    const finalMessageText = text || message;

    // Find the existing chat thread, or create a new one if it's the first message
    let chat = await Chat.findOne({ patientId });
    
    if (!chat) {
      chat = new Chat({ patientId, messages: [] });
    }

    chat.messages.push({
      sender: 'patient',
      text: finalMessageText,
      time: time
    });

    await chat.save();
    res.status(200).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ADMIN ACTIONS
// ==========================================

// @desc    Get all chat threads for the Admin Dashboard (Enriched with Patient Names)
// @route   GET /api/chats
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({}).sort({ updatedAt: -1 });

    // Enrich each chat thread with the patient's full name
    const enrichedChats = await Promise.all(chats.map(async (chat) => {
      let patientName = null;

      // 1. Try finding the name from MedicalRecord model
      const record = await MedicalRecord.findOne({ patientId: chat.patientId }).catch(() => null);
      if (record && record.patientName) {
        patientName = record.patientName;
      }

      // 2. If not found, try finding from User model
      if (!patientName) {
        const user = await User.findOne({
          $or: [
            { patientId: chat.patientId },
            ...(mongoose.Types.ObjectId.isValid(chat.patientId) ? [{ _id: chat.patientId }] : [])
          ]
        }).catch(() => null);

        if (user) {
          patientName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      }

      return {
        ...chat.toObject(),
        patientName: patientName && patientName !== chat.patientId ? patientName : `Patient ${chat.patientId}`
      };
    }));

    res.status(200).json({ success: true, chats: enrichedChats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin sends a reply
// @route   POST /api/chats/:id/message
export const replyToChat = async (req, res) => {
  try {
    const { text, time } = req.body;
    
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    chat.messages.push({
      sender: 'doctor',
      text,
      time
    });

    await chat.save();
    res.status(200).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};