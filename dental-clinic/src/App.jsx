import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import HomePage from './front_page/home_page';
import ContactPage from './front_page/contact_page';
import LoginPage from './pages/login_page';
import RegisterPage from './pages/register_page';
import ServicePage from './front_page/service_page';
import AboutPage from './front_page/about_page';
import AdminPage from './pages/admin_page';
import Dashboard from './pages/user_pages/dashboard';
import AdminDashboard from './pages/admin_pages/dashboard_admin'; 
import Appointment from './pages/user_pages/appointment';
import ListAppointments from './pages/user_pages/list_appointments';
import MedicalRecord from './pages/user_pages/medical_record';
import ProfileSettings from './pages/user_pages/profile_settings';
import HelpSupport from './pages/user_pages/help_support';
import AccountPreference from './pages/user_pages/account_preferences';
import AppointmentsAdmin from './pages/admin_pages/appointments_admin';
import AdminBillings from './pages/admin_pages/billing_invoices';
import AdminSupport from './pages/admin_pages/help_support';
import AdminGuard from './pages/admin_pages/admin_guard';
import AdminRecords from './pages/admin_pages/patient_record';
import Prescription from './pages/admin_pages/prescription';
import AdminReceipts from './pages/admin_pages/receipt';
import AdminSettings from './pages/admin_pages/settings';
import AdminStatistics from './pages/admin_pages/statistics_analytics';
import AdminWalkInAppointments from './pages/admin_pages/walk_in_appointments';
import ForgotPassword from './pages/forgot_password';
import ResetPassword from './pages/reset_password';
import AdminEmailBroadcast from './pages/admin_pages/adminemailpreferences'; 
import AdminTestimonials from './pages/admin_pages/adminTestimonials';
import Receipts from './pages/user_pages/receipts';
import AdminInventory from './pages/admin_pages/AdminInventory'; 
import InstallmentManager from './pages/admin_pages/InstallmentManager'; // 🔑 Imported Installment Manager

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('userData');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [admin, setAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('adminData'); 
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });

  useEffect(() => {
    const storedAdminToken = localStorage.getItem('adminToken');
    const storedAdminData = localStorage.getItem('adminData');

    if (storedAdminToken && storedAdminData) {
      setAdmin(JSON.parse(storedAdminData)); 
    }
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Unified Login & Registration */}
        <Route path="/login" element={<LoginPage user={user} setUser={setUser} setAdmin={setAdmin} />} />
        <Route path="/register" element={<RegisterPage user={user} setUser={setUser} />} />
        <Route path="/services" element={<ServicePage />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminPage admin={admin} setAdmin={setAdmin} />} />
        <Route path="/admin-appointments" element={ admin ? <AppointmentsAdmin admin={admin} setAdmin={setAdmin} /> : <AdminGuard/> } />
        <Route path="/admin-billings" element={ admin ? <AdminBillings admin={admin} setAdmin={setAdmin} /> : <AdminGuard/> } />
        <Route path="/admin-support" element={admin ? <AdminSupport admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-records" element={admin ? <AdminRecords admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-prescriptions" element={admin ? <Prescription admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-receipts" element={admin ? <AdminReceipts admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-settings" element={admin ? <AdminSettings admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-statistics" element={admin ? <AdminStatistics admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-walk-in" element={admin ? <AdminWalkInAppointments admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-dashboard" element={admin ? <AdminDashboard admin={admin} setAdmin={setAdmin} user={user} /> : <AdminGuard/>} />
        <Route path="/admin-testimonials" element={admin ? <AdminTestimonials admin={admin} setAdmin={setAdmin} /> : <AdminGuard/>} />
        <Route path="/admin-broadcast" element={admin ? <AdminEmailBroadcast admin={admin} setAdmin={setAdmin} /> : <AdminGuard/>} />
        <Route path="/admin-inventory" element={admin ? <AdminInventory admin={admin} setAdmin={setAdmin} /> : <AdminGuard/>} />
        
        {/* 🔑 NEW INSTALLMENT MANAGER ROUTE */}
        <Route path="/admin/installments" element={admin ? <InstallmentManager admin={admin} setAdmin={setAdmin} /> : <AdminGuard/>} />

        {/* USER ROUTES */}
        <Route path={`/user/dashboard/${user?.patientId}`} element={user ? <Dashboard user={user} setUser={setUser} /> : <LoginPage/>} />
        <Route path={`/user/appointment/${user?.patientId}`} element={user ? <Appointment user={user} setUser={setUser} /> : <LoginPage/>} />
        <Route path={`/user/list-appointments/${user?.patientId}`} element={user ? <ListAppointments user={user} setUser={setUser} /> : <LoginPage/>} />
        <Route path={`/user/medical-record/${user?.patientId}`} element={user ? <MedicalRecord user={user} setUser={setUser} /> : <LoginPage/>} />
        
        <Route path={`/user/profile-settings/${user?.patientId}`} element={user ? <ProfileSettings user={user} setUser={setUser} /> : <LoginPage/>} />
        <Route path={`/user/help-support/${user?.patientId}`} element={user ? <HelpSupport user={user} setUser={setUser} /> : <LoginPage/>} />
        <Route path={`/user/account-preference/${user?.patientId}`} element={user ? <AccountPreference user={user} setUser={setUser} /> : <LoginPage/>} />
        <Route path={`/user/receipts`} element={user ? <Receipts user={user} setUser={setUser} /> : <LoginPage/>} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="*" element={<div className="text-center mt-20 text-2xl font-semibold text-red-600">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;