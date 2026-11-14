import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConsoleSidebar from '../sidebar';

const ProfileSettings = ({ user, setUser }) => {
  // ==========================================
  // 1. PROFILE STATE (Top Level Hooks Only)
  // ==========================================
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    birthdate: '',
    gender: '', 
    email: user?.email || '',
    contactNumber: '',
    streetAddress: '',
    city: '',
    province: '',
    zipCode: '',
    emergencyName: user?.emergencyName || '',
    emergencyContact: user?.emergencyContact || '',
    emergencyRelationship: user?.emergencyRelationship || ''
  });

  // UX States
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // ==========================================
  // 2. FETCH DATA ON LOAD
  // ==========================================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const patientId = user?.patientId || user?._id;
        if (!patientId) return;

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/${patientId}`);
        
        if (response.data.user) {
          const fetchedUser = response.data.user;
          
          // Split back the comma-separated address if it exists in the database
          const addressParts = fetchedUser.address ? fetchedUser.address.split(', ') : ['', '', '', ''];

          // ✅ Fixed: Using setProfileData instead of calling useState inside an async function!
          setProfileData({
            firstName: fetchedUser.firstName || '',
            lastName: fetchedUser.lastName || '',
            birthdate: fetchedUser.birthdate ? fetchedUser.birthdate.split('T')[0] : '', 
            gender: fetchedUser.gender || '',
            email: fetchedUser.email || '',
            contactNumber: fetchedUser.contactNumber || '', 
            streetAddress: addressParts[0] || '',
            city: addressParts[1] || '',
            province: addressParts[2] || '',
            zipCode: addressParts[3] || '',
            emergencyName: fetchedUser.emergencyName || '',
            emergencyContact: fetchedUser.emergencyContact || '',
            emergencyRelationship: fetchedUser.emergencyRelationship || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    
    try {
      const patientId = user?.patientId || user?._id;
      
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/profile/${patientId}`, profileData);

      if (response.status === 200) {
        setSuccessMessage('Profile saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        setUser(response.data.user);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert(error.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
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

      <main className="flex-1 pl-64 min-h-screen flex flex-col pb-12">
        <div className="max-w-4xl w-full mx-auto p-8 md:p-10 flex-1">
          
          <div className="border-b border-slate-200 pb-6 text-left mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Profile Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Update your personal details, contact information, and emergency contact.
            </p>
          </div>

          {/* SUCCESS BANNER */}
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-700 px-5 py-4 rounded-2xl text-sm font-bold border border-emerald-200 mb-6 flex items-center gap-3 animate-fadeIn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSaveChanges} className="space-y-8">
            
            {/* SECTION 1: PERSONAL IDENTITY */}
            <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                <div className="w-20 h-20 bg-slate-100 border-4 border-white shadow-md rounded-full flex items-center justify-center text-3xl font-bold text-slate-400 shrink-0 uppercase">
                  {profileData.firstName ? profileData.firstName.charAt(0) : '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950 tracking-tight">Personal Information</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Patient ID: {user?.patientId || user?._id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">First Name</label>
                  <input type="text" name="firstName" value={profileData.firstName} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Last Name</label>
                  <input type="text" name="lastName" value={profileData.lastName} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Date of Birth</label>
                  <input type="date" name="birthdate" value={profileData.birthdate} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Gender</label>
                  <select name="gender" value={profileData.gender} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium cursor-pointer">
                    <option value="" disabled hidden>Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTACT & LOCATION */}
            <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 tracking-tight mb-6">Contact & Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Email Address</label>
                  <input type="email" name="email" value={profileData.email} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Phone Number</label>
                  <input type="tel" name="contactNumber" value={profileData.contactNumber} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Street / Barangay</label>
                  <input type="text" name="streetAddress" value={profileData.streetAddress} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">City / Municipality</label>
                  <input type="text" name="city" value={profileData.city} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Province</label>
                  <input type="text" name="province" value={profileData.province} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Zip Code</label>
                  <input type="text" name="zipCode" value={profileData.zipCode} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
              </div>
            </div>

            {/* SECTION 3: EMERGENCY DETAILS */}
            <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 tracking-tight mb-6">Emergency Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Emergency Contact Name</label>
                  <input type="text" name="emergencyName" value={profileData.emergencyName} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Emergency Contact Number</label>
                  <input type="tel" name="emergencyContact" value={profileData.emergencyContact} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Relationship</label>
                  <input type="text" name="emergencyRelationship" value={profileData.emergencyRelationship} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium" placeholder="e.g. Spouse, Parent" />
                </div>
              </div>
            </div>

            {/* SUBMIT ACTION ROW */}
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              <button type="button" className="px-6 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all text-slate-600 hover:bg-slate-100 cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="bg-slate-950 text-[#D4AF37] hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-sm flex items-center gap-2 cursor-pointer">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

ProfileSettings.displayName = "ProfileSettings";

export default ProfileSettings;