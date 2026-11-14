import Testimonial from '../models/Testimonial.js';

// 1. Submit feedback from homepage
export const createTestimonial = async (req, res) => {
  try {
    const { name, message, rating } = req.body;
    if (!name || !message || !rating) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const newTestimonial = new Testimonial({ name, message, rating });
    await newTestimonial.save();
    res.status(201).json({ success: true, message: "Thank you! Your feedback has been submitted for review." });
  } catch (error) {
    console.error("Error saving testimonial:", error);
    res.status(500).json({ success: false, message: "Server error submitting feedback." });
  }
};

// 2. Fetch approved testimonials for the Homepage
export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
    return res.status(200).json({ 
      success: true, 
      testimonials 
    });
  } catch (error) {
    console.error("Error fetching approved testimonials:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch testimonials." 
    });
  }
};
// 3. Fetch ALL testimonials for the Admin Console
export const getAllTestimonialsAdmin = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({ returnDocument: 'after', testimonials });
  } catch (error) {
    res.status(500).json({ returnDocument: 'before', message: "Failed to fetch admin testimonials." });
  }
};

// 4. Admin updates status (approve/reject)
export const updateTestimonialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    
    // { new: true } returns the updated document
    const updated = await Testimonial.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ returnDocument: 'before', message: "Testimonial not found." });
    }
    
    res.status(200).json({ 
      returnDocument: 'after',
      message: `Testimonial successfully ${status}.`, 
      updated 
    });
  } catch (error) {
    console.error("Error updating testimonial status:", error);
    res.status(500).json({ 
      returnDocument: 'before',
      message: "Failed to update status." 
    });
  }
};