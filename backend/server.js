import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';

// Import your routes
import userRoutes from './routers/user_route.js';
import contactRoutes from './utils/receivedMessage.js';
import AppointmentRoute from './routers/appointment_Route.js';
import profileRoutes from './routers/profile_route.js';
import ticketRoutes from './routers/ticketRoutes.js';
import chatRoutes from './routers/ChatRoutes.js';
import medicalRoutes from './routers/medicalRoutes.js';
import announcementRoutes from './routers/announcementRoutes.js';
import analyticsRoute from './routers/analytics_Route.js';
import expenseRoute from './routers/expense_Route.js';
import settingsRoutes from './routers/settingsRoutes.js';
import statusRoutes from './routers/statusRoutes.js';
import testimonialRoutes from './routers/testimonialRoutes.js';
import inventoryRoutes from './routers/inventory.js';
import installmentRoutes from './routers/installmentRoutes.js';

// 📅 NEW: Import blocked dates route
import blockedDateRoutes from './routers/BlockedDates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🌐 CORS Configuration
app.use(cors({
  origin: [
    "https://matienzo-dental-clinic-system.vercel.app", 
    "http://localhost:5173" // allows local development too
  ],
  credentials: true,             // Required for cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express body parser middleware
app.use(express.json());

// Connect Database
connectDB();

// 🔑 ROUTE MANAGEMENT: Unique homes for every module
app.use('/', userRoutes);
app.use('/api/auth', userRoutes); // Enables /api/auth/forgot-password and /api/auth/reset-password
app.use('/api/users', userRoutes); // 🔑 FIXED: Maps /api/users/login and user endpoints correctly!

app.use('/api/contact', contactRoutes);
app.use('/api/appointments', AppointmentRoute);
app.use('/api/profile', profileRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/medical-records', medicalRoutes); 
app.use('/api/chats', chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/analytics', analyticsRoute);
app.use('/api/expenses', expenseRoute);
app.use('/api/settings', settingsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📅 NEW: Mount the blocked dates route
app.use('/api/blocked-dates', blockedDateRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/admin', announcementRoutes);

// Status & Admin Status Routes
app.use('/api/status', statusRoutes);
app.use('/api/admin', statusRoutes); // Handles /api/admin/doctor-status cleanly
app.use('/api/users/status', statusRoutes);
app.use('/api/testimonials', testimonialRoutes);

// Global Fallback Error Handler (Prevents unhandled crashes and ensures JSON response with CORS)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});