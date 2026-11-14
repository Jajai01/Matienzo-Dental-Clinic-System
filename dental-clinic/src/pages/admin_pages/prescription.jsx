import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import AdminSidebar from '../adminsidebar';

const Prescription = ({ admin, setAdmin }) => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // MULTIPLE MEDICINES FORM STATE
  const [medicinesList, setMedicinesList] = useState([
    { medicine: '', dosage: '', quantity: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Feedback Modal State (Replaces native browser alert)
  const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '', isError: false });

  // Fetch patients on load
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/medical-records/admin/all`);
        if (res.data.success) {
          setPatients(res.data.records);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    const search = searchQuery.toLowerCase();
    const name = (p.patientName || '').toLowerCase();
    const id = (p.patientId || p._id || '').toLowerCase();
    return name.includes(search) || id.includes(search);
  });

  const handleMedicineChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...medicinesList];
    list[index][name] = value;
    setMedicinesList(list);
  };

  const handleAddMedicineRow = () => {
    setMedicinesList([...medicinesList, { medicine: '', dosage: '', quantity: '' }]);
  };

  const handleRemoveMedicineRow = (index) => {
    const list = [...medicinesList];
    list.splice(index, 1);
    setMedicinesList(list);
  };

  // 📄 MULTI-ITEM A5 PDF GENERATOR
  const generatePDF = (patientName) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // --- HEADER: CLINIC DETAILS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("DRA. ANNE DUMAS-MATIENZO", pageWidth / 2, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("General Dentistry", pageWidth / 2, 25, { align: "center" });
    doc.text("PRC Registration No: 0043010", pageWidth / 2, 30, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna", pageWidth / 2, 36, { align: "center" });
    doc.text("(In Front of Emilio Jacinto Shrine)", pageWidth / 2, 40, { align: "center" });
    doc.text("Clinic: Mon - Sun (8:00 AM - 4:00 PM) | 0927-926-2535 | matienzo.dentalclinic@gmail.com", pageWidth / 2, 44, { align: "center" });

    // Separator Line
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(15, 48, pageWidth - 15, 48);

    // --- PATIENT INFO ---
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Name:", 15, 58);
    doc.setFont("helvetica", "normal");
    doc.text(patientName || "Unregistered Patient", 45, 58);

    doc.setFont("helvetica", "bold");
    doc.text("Date:", pageWidth - 50, 58);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString(), pageWidth - 35, 58);

    // --- RX SYMBOL ---
    doc.setFont("times", "italic");
    doc.setFontSize(36);
    doc.text("Rx", 15, 76);

    // --- DYNAMIC PRESCRIPTION LIST LOOP ---
    let startY = 88;
    medicinesList.forEach((item, index) => {
      if (startY > 160) {
        doc.addPage();
        startY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${item.medicine}`, 22, startY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`Sig: ${item.dosage}`, 27, startY + 5);

      if (item.quantity) {
        doc.text(`Qty: #${item.quantity}`, 27, startY + 10);
        startY += 16;
      } else {
        startY += 12;
      }
    });

    // --- FOOTER & SIGNATURE ---
    doc.setDrawColor(150);
    doc.line(pageWidth - 70, 180, pageWidth - 15, 180);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Dra. Anne Dumas-Matienzo", pageWidth - 42.5, 185, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("License No: 0043010", pageWidth - 42.5, 189, { align: "center" });

    doc.save(`Prescription_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setFeedbackModal({ show: true, title: 'Patient Required', message: 'Please select a patient from the list first.', isError: true });
      return;
    }
    
    for (let i = 0; i < medicinesList.length; i++) {
      if (!medicinesList[i].medicine || !medicinesList[i].dosage) {
        setFeedbackModal({ show: true, title: 'Missing Fields', message: `Please fill out both medicine and dosage for item #${i + 1}.`, isError: true });
        return;
      }
    }

    setIsSubmitting(true);
    const patientIdentifier = selectedPatient.patientId || selectedPatient._id;

    try {
      // Loop and save each prescription to the database
      for (const item of medicinesList) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/medical-records/${patientIdentifier}/prescription`, {
          medicine: item.medicine,
          dosage: item.dosage,
          quantity: item.quantity || '',
          status: 'Active'
        });
      }

      generatePDF(selectedPatient.patientName);
      
      setMedicinesList([{ medicine: '', dosage: '', quantity: '' }]);
      setFeedbackModal({
        show: true,
        title: 'Success!',
        message: 'Prescriptions successfully saved to records and official A5 PDF downloaded.',
        isError: false
      });

    } catch (error) {
      console.error("Error saving prescriptions:", error);
      setFeedbackModal({
        show: true,
        title: 'Database Error',
        message: error.response?.data?.message || 'Failed to save prescription to database.',
        isError: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 pt-12.5 pr-8 pb-8 pl-25 min-h-screen">
        <div className="w-full max-w-6xl space-y-8">
          
          <div className="border-b border-slate-200 pb-6 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Prescription Pad</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Issue multiple digital prescriptions, save to patient files, and generate official A5 PDFs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PANE: Patient Search & List */}
            <div className="lg:col-span-5 bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col h-150">
              <h2 className="text-lg font-bold text-slate-950 mb-4">1. Select Patient</h2>
              
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Search by Name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:border-blue-600 focus:ring-0 outline-none transition-all pr-10 bg-slate-50"
                />
                <span className="absolute right-3 top-3 text-slate-400">🔍</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {filteredPatients.length > 0 ? filteredPatients.map(patient => (
                  <button
                    key={patient.patientId || patient._id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex flex-col ${
                      (selectedPatient?.patientId || selectedPatient?._id) === (patient.patientId || patient._id) 
                        ? 'border-blue-600 bg-blue-50 shadow-sm' 
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-bold text-slate-900">{patient.patientName || 'Unregistered Name'}</span>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5">{patient.patientId || patient._id}</span>
                  </button>
                )) : (
                  <div className="text-center py-8 text-sm text-slate-400 font-medium italic border-2 border-dashed border-slate-200 rounded-xl">
                    No patients found.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANE: Multi-Medicine Prescription Form */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-200/80 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 mb-2">2. Write Prescriptions</h2>
              
              {selectedPatient ? (
                <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Issuing To</span>
                    <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
                      {selectedPatient.patientName || 'Unregistered Name'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Date</span>
                    <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 pb-4 border-b border-slate-100 text-sm text-amber-600 font-bold bg-amber-50 p-3 rounded-lg border">
                  ⚠️ Please select a patient from the list first.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 max-h-87.5 overflow-y-auto pr-2">
                  {medicinesList.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 uppercase">Medicine #{index + 1}</span>
                        {medicinesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 rounded-lg border border-red-200 transition-all"
                          >
                            Remove 🗑️
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Generic / Brand Name *</label>
                        <input 
                          type="text" 
                          name="medicine" 
                          required
                          value={item.medicine} 
                          onChange={(e) => handleMedicineChange(index, e)}
                          disabled={!selectedPatient}
                          placeholder="e.g., Amoxicillin 500mg"
                          className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-blue-600 focus:ring-0 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sig (Instructions) *</label>
                        <input 
                          type="text" 
                          name="dosage" 
                          required
                          value={item.dosage} 
                          onChange={(e) => handleMedicineChange(index, e)}
                          disabled={!selectedPatient}
                          placeholder="e.g., Take 1 capsule every 8 hours for 7 days"
                          className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-blue-600 focus:ring-0 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity (Optional)</label>
                        <input 
                          type="number" 
                          name="quantity"
                          value={item.quantity} 
                          onChange={(e) => handleMedicineChange(index, e)}
                          disabled={!selectedPatient}
                          placeholder="e.g., 21"
                          className="w-full sm:w-1/3 border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-blue-600 focus:ring-0 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  disabled={!selectedPatient}
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Another Medicine
                </button>

                <div className="pt-4 border-t border-slate-100">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !selectedPatient}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold py-3.5 px-8 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 tracking-wide"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Save & Download A5 PDF</span>
                        <span>📄</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
                    This action securely records all prescriptions to the patient's console and generates an official multi-item PDF.
                  </p>
                </div>
              </form>

            </div>
          </div>

        </div>
      </main>

      {/* Custom Feedback Modal (Replaces browser alert) */}
      {feedbackModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm text-center">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl mb-4 ${feedbackModal.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {feedbackModal.isError ? '⚠️' : '✓'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{feedbackModal.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{feedbackModal.message}</p>
            <button 
              type="button" 
              onClick={() => setFeedbackModal({ show: false, title: '', message: '', isError: false })} 
              className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
            >
              Okay
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Prescription;