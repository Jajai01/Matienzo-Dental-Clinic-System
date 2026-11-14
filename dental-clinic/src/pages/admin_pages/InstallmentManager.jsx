import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';

const InstallmentManager = ({ admin, setAdmin }) => {
  const [plans, setPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Plan Form State
  const [form, setForm] = useState({
    patientName: '',
    contactNumber: '',
    totalLoan: '',
    durationMonths: '3'
  });

  // Feedback Modal State
  const [feedback, setFeedback] = useState({ show: false, title: '', message: '', isError: false });

  // Fetch Plans on Load & Search Query Change
  useEffect(() => {
    fetchPlans();
  }, [searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, durationFilter]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/installments${searchQuery ? `?search=${searchQuery}` : ''}`);
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (error) {
      console.error("Error fetching installment plans:", error);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.totalLoan) {
      setFeedback({ show: true, title: 'Missing Fields', message: 'Please provide the patient name and total loan amount.', isError: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/installments`, form);
      if (res.data.success) {
        setPlans([res.data.plan, ...plans]);
        setForm({ patientName: '', contactNumber: '', totalLoan: '', durationMonths: '3' });
        setIsModalOpen(false);
        setFeedback({ show: true, title: 'Success!', message: 'Installment plan successfully created.', isError: false });
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      setFeedback({ show: true, title: 'Error', message: 'Failed to create installment plan.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMonth = async (planId, monthId) => {
    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/installments/${planId}/installment/${monthId}`);
      if (res.data.success) {
        setPlans(plans.map(p => p._id === planId ? res.data.plan : p));
      }
    } catch (error) {
      console.error("Error updating installment status:", error);
      setFeedback({ show: true, title: 'Update Failed', message: 'Could not update payment status.', isError: true });
    }
  };

  // Apply Status & Duration Filtering
  const filteredPlans = plans.filter(plan => {
    const matchesStatus = statusFilter === 'All' || plan.status === statusFilter;
    const matchesDuration = durationFilter === 'All' || String(plan.durationMonths) === durationFilter;
    return matchesStatus && matchesDuration;
  });

  // Pagination Logic (20 items per page)
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPlans = filteredPlans.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 pt-12.5 pr-8 pb-8 pl-25 min-h-screen">
        <div className="w-full max-w-6xl space-y-8">
          
          {/* Header & Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Installment & Loan Manager</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Track active patient payment plans, legacy accounts, and monthly settlements.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold px-5 py-3 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+ New Installment Plan</span>
            </button>
          </div>

          {/* Search and Filters Section */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            
            {/* Search Bar */}
            <div className="relative w-full md:max-w-xs">
              <input 
                type="text" 
                placeholder="Search patient name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:border-blue-600 focus:ring-0 outline-none transition-all pr-10 bg-white shadow-sm"
              />
              <span className="absolute right-3.5 top-3 text-slate-400">🔍</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Status Filter */}
              <div className="flex bg-slate-200/70 p-1 rounded-xl">
                {['All', 'Active', 'Completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Duration Filter */}
              <div className="flex bg-slate-200/70 p-1 rounded-xl">
                {[
                  { label: 'All Durations', value: 'All' },
                  { label: '1M', value: '1' },
                  { label: '3M', value: '3' },
                  { label: '6M', value: '6' }
                ].map(dur => (
                  <button
                    key={dur.value}
                    onClick={() => setDurationFilter(dur.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${durationFilter === dur.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPlans.length > 0 ? currentPlans.map(plan => (
              <div key={plan._id} className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">{plan.patientName}</h3>
                      <p className="text-xs text-slate-500 font-medium">Contact: {plan.contactNumber || 'Not provided'}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${plan.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {plan.status}
                    </span>
                  </div>

                  {/* Loan Metrics Bar */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Loan</span>
                      <span className="text-base font-black text-slate-900">PHP {plan.totalLoan.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                      <span className="text-base font-black text-blue-600">PHP {plan.remainingBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Monthly Breakdown Checkboxes */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Monthly Installments ({plan.durationMonths} Months)</span>
                    {plan.installments.map(inst => (
                      <label 
                        key={inst._id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${inst.isPaid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={inst.isPaid}
                            onChange={() => handleToggleMonth(plan._id, inst._id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <span className={`text-xs font-bold block ${inst.isPaid ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                              Month {inst.monthNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Due: PHP {inst.amountDue.toLocaleString()} {inst.paidDate && `• Paid on ${new Date(inst.paidDate).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${inst.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {inst.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-16 text-sm text-slate-400 font-medium italic border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                No installment plans match your selected filters.
              </div>
            )}
          </div>

          {/* Pagination Controls (Always Visible) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredPlans.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredPlans.length)} of {filteredPlans.length} plans
            </span>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous
              </button>

              {/* Clickable Numbered Pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === num ? 'bg-slate-950 text-amber-400 shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* New Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Create Installment Plan</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Add a new active or legacy patient loan plan.</p>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Patient Name *</label>
                <input 
                  type="text" 
                  name="patientName"
                  required
                  placeholder="e.g., Juan Dela Cruz"
                  value={form.patientName}
                  onChange={handleInputChange}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-medium focus:border-blue-600 outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Number (Optional)</label>
                <input 
                  type="text" 
                  name="contactNumber"
                  placeholder="e.g., 09123456789"
                  value={form.contactNumber}
                  onChange={handleInputChange}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-medium focus:border-blue-600 outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Total Loan Amount (PHP) *</label>
                <input 
                  type="number" 
                  name="totalLoan"
                  required
                  placeholder="e.g., 6000"
                  value={form.totalLoan}
                  onChange={handleInputChange}
                  className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm font-medium focus:border-blue-600 outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Plan Duration *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 3, 6].map(months => (
                    <button
                      type="button"
                      key={months}
                      onClick={() => setForm({ ...form, durationMonths: String(months) })}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${form.durationMonths === String(months) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                    >
                      {months} {months === 1 ? 'Month' : 'Months'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedback.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm text-center">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl mb-4 ${feedback.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {feedback.isError ? '⚠️' : '✓'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{feedback.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{feedback.message}</p>
            <button 
              type="button" 
              onClick={() => setFeedback({ show: false, title: '', message: '', isError: false })} 
              className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstallmentManager;