import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';

const AdminTestimonials = ({ admin, setAdmin }) => {
  const [testimonials, setTestimonials] = useState([]);

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/testimonials/admin-all?_t=${Date.now()}`);
      if (res.data.success) setTestimonials(res.data.testimonials);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load feedback records.");
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      // 🔑 OPTIMISTIC UPDATE: Update UI instantly before waiting for server response
      setTestimonials(prevTestimonials => 
        prevTestimonials.map(item => 
          item._id === id ? { ...item, status: status } : item
        )
      );

      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/testimonials/status/${id}`, { status });
      
      if (res.data.success) {
        toast.success(res.data.message || "Status updated successfully.");
      } else {
        toast.error(res.data.message || "Action failed.");
        fetchTestimonials(); // Revert if server failed
      }
    } catch (error) {
      // 🔑 Log the exact server error message in your browser console (Press F12 -> Console)
      console.error("Status update error details:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Action failed.");
      fetchTestimonials(); // Revert UI on failure
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      <main className="flex-1 flex flex-col p-8 h-full overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Patient Testimonials</h1>
          <p className="text-sm text-slate-500 mt-1">Review feedback submissions. Approved entries will display live on the homepage.</p>
        </header>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <th className="p-4">Patient Name</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Message</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {testimonials.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-slate-900">{item.name}</td>
                  <td className="p-4 text-amber-500 font-bold">{"★".repeat(item.rating)}</td>
                  <td className="p-4 text-slate-600 max-w-md truncate">{item.message}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                      item.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {item.status !== 'approved' && (
                      <button onClick={() => handleStatusChange(item._id, 'approved')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-emerald-700 transition cursor-pointer">
                        Approve
                      </button>
                    )}
                    {item.status !== 'rejected' && (
                      <button onClick={() => handleStatusChange(item._id, 'rejected')} className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-rose-100 transition cursor-pointer">
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {testimonials.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">No feedback submissions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminTestimonials;