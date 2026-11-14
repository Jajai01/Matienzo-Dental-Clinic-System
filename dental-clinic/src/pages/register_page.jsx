import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // 🔑 FIX 1: Imported axios
import logo_no_bg from "../assets/logo_no_bg.png";

const RegisterPage = () => {
  // Tracking the active step (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('Male'); // Set default to match select layout
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [weight, setWeight] = useState('');
  const [patientStatus, setPatientStatus] = useState('new');
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 🔑 FIX 2: Added missing checkbox toggle handler logic
  const handleMedicalConditionChange = (condition, isChecked) => {
    if (isChecked) {
      setMedicalConditions((prev) => [...prev, condition]);
    } else {
      setMedicalConditions((prev) => prev.filter((item) => item !== condition));
    }
  };

  const HandleSubmitForm = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Point this to your backend url (adjust port if necessary)
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/register`, {
        email,
        password,
        firstName,
        middleName,
        lastName,
        birthdate,
        gender,
        contactNumber,
        address,
        weight,
        patientStatus,
        medicalConditions,
        allergies,
        medications,
        emergencyName,
        emergencyRelationship,
        emergencyContact,
      });

      if (response.data.success) {
        setSuccessMessage(`Registration successful! Patient ID: ${response.data.patientId}`);
        console.log("Registration successful:", response.data);
        // Optional: clear state or redirect user here
      }
      setErrorMessage(''); // Clear any previous error messages
    } catch (error) {
      console.error("Error during registration:", error);
      setErrorMessage(error.response?.data?.message || "Server error during registration.");
    }
  };

  // Helper functions to navigate through steps smoothly
  const nextStep = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 py-12 font-sans">
      
      {/* Top Back-to-Home link */}
      <div className="mb-6">
        <Link 
          to="/" 
          className="text-xs font-semibold text-slate-500 hover:text-[#D4AF37] transition-colors flex items-center gap-2"
        >
          ← Back to Homepage
        </Link>
      </div>

      {/* Main Registration Card Frame */}
      <div className="bg-white w-full max-w-2xl p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden">
        
        {/* Top accent border line in gold */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D4AF37]"></div>

        {/* Branding Logo Block */}
        <div className="w-24 h-24 flex items-center justify-center mb-2">
          <img 
            src={logo_no_bg} 
            alt="Matienzo Dental Clinic Logo" 
            className="max-w-full max-h-full object-contain scale-110"
          />
        </div>

        {/* Heading Typography Area */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Patient Account
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Please fill out your credentials and brief medical background
          </p>
        </div>

        {/* Status Alerts Notification Ribbon */}
        {errorMessage && (
          <div className="w-full max-w-md bg-red-50 text-red-600 text-xs font-semibold rounded-xl p-3 mb-4 border border-red-100 text-center animate-fadeIn">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="w-full max-w-md bg-green-50 text-green-600 text-xs font-semibold rounded-xl p-3 mb-4 border border-green-100 text-center animate-fadeIn">
            {successMessage}
          </div>
        )}

        {/* --- DYNAMIC STEP INDICATOR BAR --- */}
        <div className="w-full flex items-center justify-center gap-2 mb-8 max-w-md select-none">
          {/* Step 1 Indicator */}
          <div className={`flex items-center gap-2 text-xs font-bold transition-colors duration-300 ${currentStep >= 1 ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all duration-300 ${currentStep >= 1 ? 'bg-[#1A1510] border-[#D4AF37]' : 'bg-slate-100 border-slate-300'}`}>1</span>
            <span>Personal</span>
          </div>
          
          {/* Connecting Line 1 */}
          <div className={`h-[1px] grow transition-colors duration-500 ${currentStep >= 2 ? 'bg-[#D4AF37]' : 'bg-slate-200'}`}></div>
          
          {/* Step 2 Indicator */}
          <div className={`flex items-center gap-2 text-xs font-bold transition-colors duration-300 ${currentStep >= 2 ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all duration-300 ${currentStep >= 2 ? 'bg-[#1A1510] border-[#D4AF37]' : 'bg-slate-100 border-slate-300'}`}>2</span>
            <span>Medical History</span>
          </div>
          
          {/* Connecting Line 2 */}
          <div className={`h-[1px] grow transition-colors duration-500 ${currentStep === 3 ? 'bg-[#D4AF37]' : 'bg-slate-200'}`}></div>
          
          {/* Step 3 Indicator */}
          <div className={`flex items-center gap-2 text-xs font-bold transition-colors duration-300 ${currentStep === 3 ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] transition-all duration-300 ${currentStep === 3 ? 'bg-[#1A1510] border-[#D4AF37]' : 'bg-slate-100 border-slate-300'}`}>3</span>
            <span>Emergency</span>
          </div>
        </div>

        {/* Form Fields Container */}
        {/* 🔑 FIX 3: Connected onSubmit mapping */}
        <form onSubmit={HandleSubmitForm} className="w-full space-y-6">

          {/* ==============================================================
              STEP 1: Account Credentials & Demographics
              ============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase border-b border-slate-100 pb-2">
                Step 1: Account & Demographic Details
              </h3>

              {/* Email & Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com" 
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Full Name Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">First Name</label>
                  <input type="text" required placeholder="John" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                   value={firstName}
                   onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Middle Name</label>
                  <input type="text" placeholder="Santos" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                   value={middleName}
                   onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Last Name</label>
                  <input type="text" required placeholder="Dela Cruz" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                   value={lastName}
                   onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* Birthdate, Weight, Gender, Contact Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Birthdate</label>
                  <input type="date" required
                   className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37] text-slate-600" 
                   value={birthdate}
                   onChange={(e) => setBirthdate(e.target.value)}
                />
                </div>
                              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Weight (kg)</label>
                <input 
                  type="number" 
                  placeholder="60" 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                  value={weight}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Keeps it as a string while typing so they can backspace freely, 
                    // or saves it as a number if it's valid.
                    setWeight(val === '' ? '' : Number(val));
                  }} 
                />
              </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Gender</label>
                  <select className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37] text-slate-700"
                   value={gender}
                   onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-800 block">Contact Number</label>
                  <input type="tel" placeholder="0917XXXXXXX" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                   value={contactNumber}
                   onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Complete Address Field */}
              {/* 🔑 FIX 4: Corrected value and state mapper from completeAddress to address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Complete Address</label>
                <input type="text" placeholder="House No., Street, Barangay, City, Province" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                 value={address}
                 onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Patient System Classification Check */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-800 block">Patient Status</label>
                <div className="flex gap-6 text-sm">
                  <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                    <input type="radio"
                     name="patientStatus"
                      value="new"
                      checked={patientStatus === "new"}
                      onChange={(e) => setPatientStatus(e.target.value)}
                      className="w-4 h-4 accent-[#1A1510]" /> New Patient
                  </label>
                  <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                    <input type="radio" 
                     name="patientStatus" 
                      value="returning"
                      checked={patientStatus === "returning"}
                      onChange={(e) => setPatientStatus(e.target.value)}
                      className="w-4 h-4 accent-[#1A1510]" /> Returning / Has Physical Record
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              STEP 2: Critical Medical Screening History
              ============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase border-b border-slate-100 pb-2">
                Step 2: Medical Conditions & Safety Screen
              </h3>

              {/* Checkbox Medical Conditions Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Check any existing conditions that apply to you:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" 
                     className="w-4 h-4 accent-[#1A1510] rounded" 
                     checked={medicalConditions.includes('high-blood-pressure')}
                     onChange={(e) => handleMedicalConditionChange('high-blood-pressure', e.target.checked)}
                    /> High Blood Pressure (Hypertension)
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" 
                     className="w-4 h-4 accent-[#1A1510] rounded" 
                     checked={medicalConditions.includes('diabetes')}
                     onChange={(e) => handleMedicalConditionChange('diabetes', e.target.checked)}
                    /> Diabetes / Delayed Healing
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" 
                     className="w-4 h-4 accent-[#1A1510] rounded" 
                     checked={medicalConditions.includes('heart-condition')}
                     onChange={(e) => handleMedicalConditionChange('heart-condition', e.target.checked)}
                    /> Heart Conditions / Pacemaker
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" 
                     className="w-4 h-4 accent-[#1A1510] rounded" 
                     checked={medicalConditions.includes('asthma')}
                     onChange={(e) => handleMedicalConditionChange('asthma', e.target.checked)}
                    /> Asthma / Respiratory Illness
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" 
                     className="w-4 h-4 accent-[#1A1510] rounded" 
                     checked={medicalConditions.includes('bleeding-disorder')}
                     onChange={(e) => handleMedicalConditionChange('bleeding-disorder', e.target.checked)}
                    /> Bleeding Disorders
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" 
                     className="w-4 h-4 accent-[#1A1510] rounded" 
                     checked={medicalConditions.includes('pregnant-nursing')}
                     onChange={(e) => handleMedicalConditionChange('pregnant-nursing', e.target.checked)}
                      /> Is pregnant or nursing (Females)
                  </label>
                </div>
              </div>

              {/* Critical Allergies and Current Medications inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Allergies (Antibiotics, Latex, Local Anesthetics)</label>
                  <input type="text"
                   placeholder="e.g., Penicillin, Latex (Leave blank if none)" 
                   className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                   value={allergies}
                   onChange={(e) => setAllergies(e.target.value)}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Current Maintenance Medications</label>
                  <input type="text" placeholder="e.g., Blood thinners, Aspirin (Leave blank if none)" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]"
                   value={medications}
                   onChange={(e) => setMedications(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              STEP 3: Emergency Contact Profile
              ============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase border-b border-slate-100 pb-2">
                Step 3: Emergency Contact Info
              </h3>

              {/* 🔑 FIX 5: Standardized emergency state assignments to match top hooks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Emergency Contact Name</label>
                  <input type="text" placeholder="Jane Dela Cruz" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]" 
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Relationship</label>
                  <input type="text" placeholder="Spouse / Parent / Sibling" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]"
                   value={emergencyRelationship}
                   onChange={(e) => setEmergencyRelationship(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Emergency Mobile No.</label>
                  <input type="tel" placeholder="0915XXXXXXX" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37]"
                   value={emergencyContact}
                   onChange={(e) => setEmergencyContact(e.target.value)} />
                </div>
              </div>

              {/* Terms & Privacy Acknowledgement */}
              <div className="pt-2">
                <label className="flex items-start gap-3 text-xs font-medium text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" required className="w-4 h-4 accent-[#1A1510] rounded border-slate-300 mt-0.5 shrink-0" />
                  <span>
                    I certify that the information provided is accurate to the best of my knowledge and understand it will be handled under strict clinical data privacy laws.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* --- WIZARD NAVIGATION CONTROLS --- */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8 max-w-md mx-auto gap-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={prevStep}
              className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                currentStep === 1 
                  ? 'opacity-0 pointer-events-none' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Back
            </button>

            {/* Next / Submit Button */}
            {/* 🔑 FIX 6: Swapped final stage button to type="submit" so form triggers properly */}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-[#1A1510] text-[#D4AF37] hover:bg-[#2A231B] px-8 py-2.5 rounded-full font-bold text-xs tracking-wide transition-all shadow-sm active:scale-[0.98]"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                className="bg-[#1A1510] text-[#D4AF37] hover:bg-[#2A231B] px-8 py-2.5 rounded-full font-bold text-xs tracking-wide transition-all shadow-md active:scale-[0.98]"
              >
                Complete Registration
              </button>
            )}
          </div>

        </form>

        {/* Footer Redirect Navigation */}
        <div className="text-xs text-slate-500 text-center mt-8 font-medium">
          Already have a patient profile account?{' '}
          <Link 
            to="/login" 
            className="text-[#D4AF37] hover:underline font-bold transition-all ml-1"
          >
            Login here
          </Link>
        </div>

      </div>

      {/* Corporate Compliance Notice */}
      <p className="text-[10px] text-slate-400 text-center mt-6 tracking-wider">
        © 2026 Matienzo Dental Clinic. All rights reserved.
      </p>

    </div>
  );
};

export default RegisterPage;