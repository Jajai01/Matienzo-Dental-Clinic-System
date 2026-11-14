import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, 
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  
  subject: { type: String, required: true },
  message: { type: String, required: true },
  
  // Tracks the progress of the ticket for the admin dashboard
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open' 
  }
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;