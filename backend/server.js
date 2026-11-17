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
import blockedDateRoutes from './routers/BlockedDates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "https://matienzo-dental-clinic-system.vercel.app",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:19006"
];

// 🌐 CORS Configuration (Must be first)
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// Express body parser middleware with increased limit for uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Connect Database
connectDB();

// 🔑 ROUTE MANAGEMENT
app.use('/', userRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);

app.use('/api/contact', contactRoutes);
app.use('/api/appointments', AppointmentRoute);
app.use('/api/profile', profileRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/medical-records', medicalRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/chat', chatRoutes); // Alias to prevent singular/plural 404s
app.use('/api/announcements', announcementRoutes);
app.use('/api/analytics', analyticsRoute);
app.use('/api/expenses', expenseRoute);
app.use('/api/settings', settingsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Blocked dates, installments, admin, status, testimonials
app.use('/api/blocked-dates', blockedDateRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/admin', announcementRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/admin', statusRoutes);
app.use('/api/users/status', statusRoutes);
app.use('/api/testimonials', testimonialRoutes);

// Global Fallback Error Handler (Preserves CORS headers on 500 errors)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack || err.message);
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});