import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ConsoleSidebar from '../sidebar';

const MedicalRecord = ({ user, setUser }) => {
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isDoctorActive, setIsDoctorActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State to handle the floating chat window toggle
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // State for Photo Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // BULLETPROOF DATA FETCHING
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      const patientId = user?.patientId || user?._id;
      
      if (!patientId) {
        setIsLoading(false);
        return;
      }

      try {
        const [profileRes, medicalRes, chatRes, statusRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/profile/${patientId}`).catch(e => e.response || { data: {} }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/medical-records/${patientId}`).catch(e => e.response || { data: {} }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/chats/patient/${patientId}`).catch(e => e.response || { data: {} }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/admin/doctor-status`).catch(e => e.response || { data: { isActive: false } })
        ]);

        if (profileRes.data && profileRes.data.user) {
          setUser(prevUser => ({ ...prevUser, ...profileRes.data.user }));
        }

        if (chatRes.data && chatRes.data.success) {
          setMessages(chatRes.data.messages || []);
        }

        if (medicalRes.data && medicalRes.data.success) {
          setTreatmentHistory([...(medicalRes.data.history || [])].reverse());
          setPrescriptions([...(medicalRes.data.prescriptions || [])].reverse());
        }

        setIsDoctorActive(statusRes.data?.isActive || false);
        
      } catch (error) {
        console.error("Critical error in data fetching pipeline:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, [user?.patientId, setUser]);

  // STATUS UPDATE EFFECT
  useEffect(() => {
    const patientId = user?.patientId || user?._id;
    if (patientId) {
      axios.put(`${import.meta.env.VITE_API_URL}/api/status/${patientId}`, { status: "online" })
        .catch(err => console.error("Status update failed", err));
    }
  }, [user?.patientId]);

  // Scroll to bottom when messages change OR when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const patientId = user?.patientId || user?._id;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageToSend = newMessage;
    const tempMessage = { id: Date.now(), sender: 'patient', text: messageToSend, time: currentTime };
    
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/chats`, { 
        patientId, 
        sender: 'patient', 
        message: messageToSend,
        text: messageToSend,
        time: currentTime
      });
    } catch (error) {
      console.error("Failed to send chat message:", error);
    }
  };

  // ⏱️ ROBUST TIME-BASED & STATUS PRESCRIPTION SORTING
  const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
  const today = new Date().getTime();

  const activePrescriptions = prescriptions.filter(rx => {
    if (rx.status && rx.status !== 'Active') return false;
    
    const issueDate = new Date(rx.date).getTime();
    if (isNaN(issueDate)) return true; // Fallback if format is localized text
    
    return (today - issueDate) <= THIRTY_DAYS_IN_MS;
  });

  const pastPrescriptions = prescriptions.filter(rx => {
    if (rx.status === 'Archived' || rx.status === 'Expired') return true;
    
    const issueDate = new Date(rx.date).getTime();
    if (isNaN(issueDate)) return false;
    
    return (today - issueDate) > THIRTY_DAYS_IN_MS;
  });

  // 📸 PHOTO UPLOAD HANDLER
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const patientId = user?.patientId || user?._id;
    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append('patientId', patientId);

    setIsUploading(true);
    try {
      // Adjust this endpoint to match your backend route!
      await axios.post(`${import.meta.env.VITE_API_URL}/api/medical-records/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage('Photo uploaded successfully!');
      setUploadFile(null); // Clear the input after success
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadMessage('Failed to upload photo.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(''), 4000); // Hide message after 4s
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full min-h-screen bg-slate-50 items-center justify-center">
        <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      <ConsoleSidebar user={user} setUser={setUser} />
      
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <div className="max-w-7xl w-full mx-auto p-8 md:p-10 space-y-8">
          
          <div className="border-b border-slate-200 pb-6 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Medical Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Patient Info & Prescriptions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Patient Info Card */}
              <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-100 border-2 border-slate-200 rounded-full flex items-center justify-center text-2xl font-bold text-slate-400 shrink-0 uppercase">
                            {user?.firstName?.charAt(0) || 'P'}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-950 tracking-tight">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Patient ID: {user?.patientId}</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 rounded-full flex items-center gap-2 border border-slate-200">
                        <div className={`w-2 h-2 rounded-full ${user?.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{user?.isOnline ? 'Active Now' : 'Offline'}</span>
                    </div>
                </div>
                
                {/* Personal Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label><p className="text-sm font-bold text-slate-800">{user?.birthdate || 'N/A'}</p></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label><p className="text-sm font-bold text-slate-800">{user?.gender || 'N/A'}</p></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label><p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p></div>
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label><p className="text-sm font-bold text-slate-800">{user?.contactNumber || 'N/A'}</p></div>
                    <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</label><p className="text-sm font-bold text-slate-800">{[user?.address, user?.city, user?.province, user?.zipCode].filter(Boolean).join(', ') || 'Address not provided'}</p></div>
                </div>
              </div>

              {/* PRESCRIPTIONS MODULE */}
              <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                
                {/* ACTIVE PRESCRIPTIONS */}
                <div>
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Prescriptions
                  </h3>
                  
                  {activePrescriptions.length > 0 ? activePrescriptions.map((rx) => (
                      <div key={rx._id || rx.id} className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4 flex flex-col mb-3">
                          <div className="flex justify-between items-center mb-3">
                              <div>
                                  <h4 className="text-sm font-bold text-slate-900">{rx.medicine}</h4>
                                  <p className="text-xs text-slate-600 mt-0.5">{rx.dosage}</p>
                              </div>
                              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Active</span>
                          </div>
                          <div className="pt-3 border-t border-emerald-100 flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500">Issued: {rx.date}</span>
                          </div>
                      </div>
                  )) : <div className="text-center py-4 text-xs text-slate-400 font-medium italic">No active prescriptions currently.</div>}
                </div>

                {/* PAST / EXPIRED PRESCRIPTIONS */}
                {pastPrescriptions.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Past Prescriptions</h3>
                    
                    {pastPrescriptions.map((rx) => (
                        <div key={rx._id || rx.id} className="border border-slate-100 bg-slate-50 opacity-75 rounded-xl p-4 flex flex-col mb-3">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 line-through decoration-slate-300">{rx.medicine}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{rx.dosage}</p>
                                </div>
                                <span className="text-[10px] font-extrabold uppercase bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md">Expired</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400">Issued: {rx.date}</span>
                            </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PHOTO UPLOAD MODULE */}
              <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm mt-6">
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="text-lg">📸</span> Upload Medical Photo
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  Securely send an image (like a dental x-ray or physical symptom) directly to the doctor's dashboard.
                </p>
                
                <form onSubmit={handleFileUpload} className="flex flex-col gap-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <p className="mb-2 text-sm text-slate-500 font-semibold truncate max-w-[200px]">
                          {uploadFile ? uploadFile.name : "Click to upload a photo"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PNG, JPG or JPEG</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg" 
                        onChange={(e) => setUploadFile(e.target.files[0])} 
                      />
                    </label>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={!uploadFile || isUploading} 
                    className="w-full bg-[#D4AF37] hover:bg-amber-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm uppercase tracking-wide"
                  >
                    {isUploading ? 'Uploading to Clinic...' : 'Submit Photo to Doctor'}
                  </button>
                  
                  {uploadMessage && (
                    <p className={`text-xs text-center font-bold ${uploadMessage.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>
                      {uploadMessage}
                    </p>
                  )}
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN: Ledger */}
            <div className="lg:col-span-5">
              <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4">Diagnosis & Treatment Ledger</h3>
                {treatmentHistory.length > 0 ? treatmentHistory.map((record, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm hover:border-blue-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-slate-950 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide shadow-sm">
                            {record.date}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Ref: {record.id}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                          👩‍⚕️ {record.dentist}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Performed Procedure</span>
                        <p className="text-sm font-bold text-slate-900">{record.treatment}</p>
                      </div>

                      <div className={`p-3 rounded-xl border ${
                        record.diagnosis === "Pending Notes" || !record.diagnosis 
                          ? 'bg-amber-50 border-amber-200 border-dashed' 
                          : 'bg-blue-50/50 border-blue-200'
                      }`}>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                          🩺 Official Doctor's Diagnosis
                        </span>
                        <p className={`text-xs font-medium leading-relaxed ${
                          record.diagnosis === "Pending Notes" || !record.diagnosis 
                            ? 'text-amber-700/80 italic' 
                            : 'text-slate-800'
                        }`}>
                          {record.diagnosis === "Pending Notes" || !record.diagnosis 
                            ? 'The clinical notes for this procedure have not been finalized by the doctor yet.' 
                            : record.diagnosis}
                        </p>
                      </div>
                    </div>
                )) : <div className="text-center py-6 text-xs text-slate-400 italic font-medium border-2 border-dashed border-slate-200 rounded-2xl">No clinical records found yet.</div>}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* FLOATING CHAT MODULE */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        
        {isChatOpen && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl mb-4 overflow-hidden flex flex-col w-[350px] h-[500px] animate-fadeIn transition-all">
            
            <div className="bg-slate-950 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Dra. Anne-Dumas Matienzo</h3>
                {isDoctorActive ? (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span> Offline
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  Start a conversation with the doctor.
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg._id || msg.id} className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl text-sm font-medium shadow-sm max-w-[85%] ${msg.sender === 'patient' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <input 
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="Type a message..." 
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-[#D4AF37] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </div>
            </form>
          </div>
        )}

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 ${isChatOpen ? 'bg-slate-800 text-white' : 'bg-[#D4AF37] hover:bg-amber-500 text-white'}`}
        >
          {isChatOpen ? (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          )}
        </button>

      </div>

    </div>
  );
};

export default MedicalRecord;