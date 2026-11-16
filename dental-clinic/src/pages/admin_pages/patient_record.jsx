import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';

const AdminRecords = ({ admin, setAdmin }) => {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for Editing Diagnosis
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [draftDiagnosis, setDraftDiagnosis] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // 🔑 3 Category Accordion States for the Master File Modal
  const [openSections, setOpenSections] = useState({
    history: true,
    prescriptions: false,
    photos: false
  });

  // 🔑 Helper to prevent timezone off-by-one date shifts
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;

    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      const [year, month, day] = dateString.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // 🔑 Helper to fix localhost vs production image URLs
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      return url;
    }
    const cleanedPath = url.replace(/^https?:\/\/[^/]+/, '');
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${cleanedPath.startsWith('/') ? '' : '/'}${cleanedPath}`;
  };

  // Fetch all medical records on page load
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/medical-records/admin/all`);
        if (res.data.success) {
          setRecords(res.data.records);
        }
      } catch (error) {
        console.error("Failed to fetch medical records:", error);
        toast.error("Failed to load patient records.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // RESET PAGINATION: If the admin types in the search bar, jump back to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 1. FILTERING
  const filteredRecords = records.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = record.patientName && record.patientName.toLowerCase().includes(searchLower);
    const idMatch = record.patientId && record.patientId.toLowerCase().includes(searchLower);
    return nameMatch || idMatch;
  });

  // 2. SORTING (Latest Transaction at the top)
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const aDates = a.history ? a.history.map(h => new Date(h.date).getTime()).filter(t => !isNaN(t)) : [];
    const bDates = b.history ? b.history.map(h => new Date(h.date).getTime()).filter(t => !isNaN(t)) : [];
    
    const aLatest = aDates.length > 0 ? Math.max(...aDates) : 0;
    const bLatest = bDates.length > 0 ? Math.max(...bDates) : 0;
    
    return bLatest - aLatest; 
  });

  // 3. PAGINATION MATH
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openModal = (patientRecord) => {
    setSelectedPatient(patientRecord);
    setIsModalOpen(true);
    setEditingHistoryId(null);
    setOpenSections({ history: true, prescriptions: false, photos: false });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
    setEditingHistoryId(null);
  };

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleSaveNote = async (historyId) => {
    if (!draftDiagnosis.trim()) {
      toast.error("Diagnosis note cannot be empty.");
      return;
    }
    setIsSavingNote(true);

    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/medical-records/${selectedPatient.patientId}/history/${historyId}`, {
        diagnosis: draftDiagnosis
      });

      if (res.data.success) {
        const updatedPatient = { ...selectedPatient };
        const targetHistory = updatedPatient.history.find(h => h.id === historyId);
        if (targetHistory) {
          targetHistory.diagnosis = draftDiagnosis;
        }
        setSelectedPatient(updatedPatient);

        setRecords(records.map(rec => 
          rec.patientId === selectedPatient.patientId ? updatedPatient : rec
        ));

        setEditingHistoryId(null);
        
        toast.success("Diagnosis saved and updated successfully!", {
          position: "top-right",
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '13px',
            borderRadius: '12px'
          }
        });
      }
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error(error.response?.data?.message || "Error saving the clinical note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 pt-12.5 pr-8 pb-8 pl-25 min-h-screen">
        <div className="w-full max-w-6xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Records System</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Search and review comprehensive clinical histories and completed transactions.</p>
            </div>
            <div className="w-full md:w-80">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Search Patient</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search by Name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl py-2 px-4 text-sm font-medium focus:border-blue-600 focus:ring-0 outline-none transition-all pr-10 bg-white"
                />
                <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-slate-500 font-medium text-sm">
                <span className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></span>
                Loading database...
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 px-6">Patient Identifier</th>
                        <th className="py-4 px-6">Total Visits</th>
                        <th className="py-4 px-6">Last Active Date</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentRecords.length > 0 ? currentRecords.map((record, idx) => {
                        const historyDates = record.history ? record.history.map(h => new Date(h.date)) : [];
                        const lastVisit = historyDates.length > 0 
                          ? formatDate(Math.max(...historyDates)) 
                          : 'No completed visits';

                        return (
                          <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="py-4 px-6 flex flex-col">
                              <span className="text-sm font-bold text-slate-900">
                                {record.patientName || 'Unregistered Name'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {record.patientId}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md">
                                {record.history?.length || 0} procedures
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm font-medium text-slate-600">
                              {lastVisit}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => openModal(record)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                              >
                                View Master File
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-sm text-slate-500 font-medium italic">
                            No patient records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION FOOTER */}
                {totalPages > 1 && (
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing <strong className="text-slate-800">{indexOfFirstRecord + 1}</strong> to <strong className="text-slate-800">{Math.min(indexOfLastRecord, sortedRecords.length)}</strong> of <strong className="text-slate-800">{sortedRecords.length}</strong> records
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </main>

      {/* MODAL SYSTEM */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-slate-950 p-6 flex justify-between items-start border-b border-slate-800 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                  {selectedPatient.patientName || 'Clinical Master File'}
                </h2>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  ID: <span className="text-white">{selectedPatient.patientId}</span>
                </p>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 space-y-6">
              
              {/* ========================================== */}
              {/* CATEGORY 1: COMPLETED TREATMENT HISTORY    */}
              {/* ========================================== */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('history')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-100 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      📁 1. Completed Treatment History
                    </span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {selectedPatient.history?.length || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {openSections.history ? '▲ Collapse' : '▼ Expand'}
                  </span>
                </button>

                {openSections.history && (
                  <div className="p-6 space-y-4 bg-slate-50/50">
                    {selectedPatient.history && selectedPatient.history.length > 0 ? (
                      [...selectedPatient.history].reverse().map((visit, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {formatDate(visit.date)}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">Ref: {visit.id}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                              Attending: {visit.dentist}
                            </span>
                          </div>
                          
                          <div className="mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Procedure</span>
                            <p className="text-base font-bold text-slate-900">{visit.treatment}</p>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mt-3">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Diagnosis / Notes</span>
                              
                              {editingHistoryId === visit.id ? (
                                <div className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => setEditingHistoryId(null)}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleSaveNote(visit.id)}
                                    disabled={isSavingNote}
                                    className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-md shadow-sm disabled:opacity-50 cursor-pointer"
                                  >
                                    {isSavingNote ? 'Saving...' : 'Save Note'}
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setEditingHistoryId(visit.id);
                                    setDraftDiagnosis(visit.diagnosis === "Pending Notes" ? "" : visit.diagnosis);
                                  }}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  Edit Note
                                </button>
                              )}
                            </div>

                            {editingHistoryId === visit.id ? (
                              <textarea 
                                autoFocus
                                rows="3"
                                value={draftDiagnosis}
                                onChange={(e) => setDraftDiagnosis(e.target.value)}
                                placeholder="Type the official clinical diagnosis here..."
                                className="w-full text-sm p-2.5 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 resize-none font-medium text-slate-800 bg-white"
                              />
                            ) : (
                              <p className={`text-sm font-medium leading-relaxed ${visit.diagnosis === "Pending Notes" ? 'text-amber-600 italic' : 'text-slate-700'}`}>
                                {visit.diagnosis || 'No additional clinical notes provided.'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-sm text-slate-500 italic border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                        No historical treatments recorded for this patient.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* CATEGORY 2: ISSUED PRESCRIPTIONS           */}
              {/* ========================================== */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('prescriptions')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-100 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      💊 2. Issued Prescriptions
                    </span>
                    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {selectedPatient.prescriptions?.length || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {openSections.prescriptions ? '▲ Collapse' : '▼ Expand'}
                  </span>
                </button>

                {openSections.prescriptions && (
                  <div className="p-6 bg-slate-50/50">
                    {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedPatient.prescriptions.map((script, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-300 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-bold text-slate-900">{script.medicine}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">{formatDate(script.date)}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mb-2">Dosage: {script.dosage}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              script.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {script.status || 'Archived'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 italic font-medium border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                        No prescriptions issued for this patient.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* CATEGORY 3: PATIENT UPLOADED PHOTOS        */}
              {/* ========================================== */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('photos')}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-100 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      📸 3. Patient Uploaded Photos & Images
                    </span>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {selectedPatient.photos?.length || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {openSections.photos ? '▲ Collapse' : '▼ Expand'}
                  </span>
                </button>

                {openSections.photos && (
                  <div className="p-6 bg-slate-50/50">
                    {selectedPatient.photos && selectedPatient.photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedPatient.photos.map((photo, index) => {
                          const resolvedUrl = getImageUrl(photo.url || photo);
                          return (
                            <div key={index} className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-col gap-2 shadow-sm">
                              <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-100">
                                <img 
                                  src={resolvedUrl} 
                                  alt="Patient uploaded medical document" 
                                  className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </a>
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {photo.date ? formatDate(photo.date) : 'Uploaded Image'}
                                </span>
                                <a 
                                  href={resolvedUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] font-bold text-blue-600 hover:underline"
                                >
                                  View Full
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 italic font-medium border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                        No photos have been uploaded by this patient yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminRecords;