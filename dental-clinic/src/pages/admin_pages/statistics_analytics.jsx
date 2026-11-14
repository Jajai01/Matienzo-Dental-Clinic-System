import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const AdminStatistics = ({ admin, setAdmin }) => {
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyNetProfit: 0,
    patientsThisMonth: 0,
    totalLifetimePatients: 0,
    outstandingBalance: 0,
    busiestMonth: { month: 'N/A', count: 0 }
  });
  
  const [chartData, setChartData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [serviceIncomeContribution, setServiceIncomeContribution] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Miscellaneous' });
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const DONUT_COLORS = ['#0f172a', '#D4AF37', '#10b981', '#64748b'];

  useEffect(() => {
    fetchStatistics();
    fetchAIInsights();
  }, []);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/summary`);
      if (res.data) {
        setStats({
          monthlyRevenue: res.data.monthlyRevenue || 0,
          monthlyExpenses: res.data.monthlyExpenses || 0,
          monthlyNetProfit: res.data.monthlyNetProfit || 0,
          patientsThisMonth: res.data.patientsThisMonth || 0,
          totalLifetimePatients: res.data.totalLifetimePatients || 0,
          outstandingBalance: res.data.outstandingBalance || 0,
          busiestMonth: res.data.busiestMonth || { month: 'N/A', count: 0 }
        });
        setChartData(res.data.chartData || []);
        setServiceData(res.data.serviceBreakdown || []);
        setServiceIncomeContribution(res.data.serviceIncomeContribution || []);
        setRecentExpenses(res.data.recentExpenses || []);
        setPaymentMethods(res.data.paymentMethods || []);
      }
    } catch (error) {
      toast.error("Failed to load statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/analytics/ai-summary`);
      if (res.data && res.data.aiSummary) setAiSummary(res.data.aiSummary);
    } catch (error) {
      setAiSummary("Unable to connect to AI engine.");
    }
  };

  // 🔑 COMPREHENSIVE TEXT & TABLE PDF EXPORT (Includes Annual Trajectory, Expenses, & Payment Methods Breakdown)
  const handleExportReport = () => {
    setIsExporting(true);
    toast.loading("Compiling Comprehensive PDF Report...", { id: 'export' });

    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

      // --- PAGE 1: EXECUTIVE OVERVIEW & METRICS ---
      pdf.setFillColor(15, 23, 42); // Slate 900
      pdf.rect(0, 0, pageWidth, 25, 'F');

      pdf.setTextColor(212, 175, 55); // Gold
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("MATIENZO DENTAL CLINIC", 15, 12);

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Comprehensive Intelligence & Financial Report — ${monthName}`, 15, 19);

      let currentY = 33;

      // Section 1: Executive KPI Metrics
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Executive Summary Metrics", 15, currentY);
      currentY += 6;

      const kpiData = [
        ["Monthly Revenue", formatCurrency(stats.monthlyRevenue)],
        ["Monthly Expenses", formatCurrency(stats.monthlyExpenses)],
        ["Net Profit", formatCurrency(stats.monthlyNetProfit)],
        ["Outstanding Balance", formatCurrency(stats.outstandingBalance)],
        ["Patients This Month", stats.patientsThisMonth.toString()],
        ["Total Patient Base", `${stats.totalLifetimePatients} (Peak: ${stats.busiestMonth.month})`]
      ];

      let startX = 15;
      let cardWidth = 42;
      let cardHeight = 18;

      kpiData.forEach((kpi, idx) => {
        if (idx > 0 && idx % 6 === 0) {
          currentY += cardHeight + 5;
          startX = 15;
        }
        
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(startX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(kpi[0].toUpperCase(), startX + 4, currentY + 6);

        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(kpi[1], startX + 4, currentY + 13);
        pdf.setFont("helvetica", "normal");

        startX += cardWidth + 4;
      });

      currentY += cardHeight + 10;

      // Section 2: Gemini AI Insights Block
      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(15, currentY, pageWidth - 30, 18, 2, 2, 'FD');

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text("GEMINI OPERATIONAL INSIGHT:", 20, currentY + 6);

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      
      const splitInsight = pdf.splitTextToSize(aiSummary || "No insights available.", pageWidth - 45);
      pdf.text(splitInsight, 20, currentY + 12);

      currentY += 26;

      // Section 3: Payment Methods Breakdown (Cash vs GCash Analysis)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Payment Method Dominance (Cash vs. GCash)", 15, currentY);
      currentY += 6;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.text("Payment Channel", 20, currentY + 5.5);
      pdf.text("Total Revenue Collected", 110, currentY + 5.5);
      pdf.text("Performance Status", 200, currentY + 5.5);

      currentY += 8;

      // Determine top payment method
      const sortedPaymentMethods = [...paymentMethods].sort((a, b) => b.value - a.value);
      const topMethodName = sortedPaymentMethods.length > 0 ? sortedPaymentMethods[0].name : "None";

      pdf.setFont("helvetica", "normal");
      if (paymentMethods.length > 0) {
        paymentMethods.forEach((pm, idx) => {
          pdf.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
          pdf.rect(15, currentY, pageWidth - 30, 8, 'F');

          pdf.setTextColor(15, 23, 42);
          pdf.text(pm.name, 20, currentY + 5.5);
          pdf.text(formatCurrency(pm.value), 110, currentY + 5.5);
          
          if (pm.name === topMethodName) {
            pdf.setTextColor(16, 185, 129); // Emerald
            pdf.text("Dominant Channel (Highest Yield)", 200, currentY + 5.5);
          } else {
            pdf.setTextColor(100, 116, 139);
            pdf.text("Alternative Channel", 200, currentY + 5.5);
          }
          currentY += 8;
        });
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
        pdf.setTextColor(100, 116, 139);
        pdf.text("No payment transactions recorded for this period.", 20, currentY + 5.5);
        currentY += 8;
      }

      // --- PAGE 2: ANNUAL TRAJECTORY & EXPENSES ---
      pdf.addPage();
      currentY = 20;

      // Section 4: Annual Financial Trajectory Table
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Annual Financial Trajectory Matrix (Monthly Breakdown)", 15, currentY);
      currentY += 6;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.text("Month", 20, currentY + 5.5);
      pdf.text("Monthly Revenue", 80, currentY + 5.5);
      pdf.text("Monthly Expenses", 150, currentY + 5.5);
      pdf.text("Patient Volume", 220, currentY + 5.5);

      currentY += 8;

      pdf.setFont("helvetica", "normal");
      chartData.forEach((row, idx) => {
        pdf.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        pdf.rect(15, currentY, pageWidth - 30, 7, 'F');

        pdf.setTextColor(15, 23, 42);
        pdf.text(row.month, 20, currentY + 5);
        pdf.text(formatCurrency(row.revenue), 80, currentY + 5);
        pdf.text(formatCurrency(row.expense), 150, currentY + 5);
        pdf.text(`${row.patients || 0} Patients`, 220, currentY + 5);

        currentY += 7;
      });

      currentY += 10;

      // Section 5: Recent Ledger Expenses
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Recent Clinic Expenses Log", 15, currentY);
      currentY += 6;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.text("Description", 20, currentY + 5.5);
      pdf.text("Category", 110, currentY + 5.5);
      pdf.text("Date", 170, currentY + 5.5);
      pdf.text("Amount", 230, currentY + 5.5);

      currentY += 8;

      pdf.setFont("helvetica", "normal");
      if (recentExpenses.length > 0) {
        recentExpenses.forEach((exp, idx) => {
          pdf.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
          pdf.rect(15, currentY, pageWidth - 30, 8, 'F');

          pdf.setTextColor(15, 23, 42);
          pdf.text(exp.description, 20, currentY + 5.5);
          pdf.text(exp.category, 110, currentY + 5.5);
          pdf.text(new Date(exp.expenseDate).toLocaleDateString(), 170, currentY + 5.5);
          pdf.text(`- ${formatCurrency(exp.amount)}`, 230, currentY + 5.5);

          currentY += 8;
        });
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
        pdf.setTextColor(100, 116, 139);
        pdf.text("No expense records found.", 20, currentY + 5.5);
        currentY += 8;
      }

      // --- PAGE 3: YEARLY SERVICE INCOME CONTRIBUTION MATRIX ---
      pdf.addPage();
      currentY = 20;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Yearly Service Income Contribution & Demand Matrix", 15, currentY);
      currentY += 6;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.text("Service Name", 20, currentY + 5.5);
      pdf.text("Total Yearly Bookings", 110, currentY + 5.5);
      pdf.text("Total Income Generated", 160, currentY + 5.5);
      pdf.text("Income Share", 230, currentY + 5.5);

      currentY += 8;

      pdf.setFont("helvetica", "normal");
      if (serviceIncomeContribution.length > 0) {
        serviceIncomeContribution.forEach((row, index) => {
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
          pdf.rect(15, currentY, pageWidth - 30, 8, 'F');

          pdf.setTextColor(15, 23, 42);
          pdf.text(row.service, 20, currentY + 5.5);
          pdf.text(`${row.count} Treatments`, 110, currentY + 5.5);
          pdf.text(formatCurrency(row.income), 160, currentY + 5.5);
          pdf.text(`${row.percentage}%`, 230, currentY + 5.5);

          currentY += 8;
        });
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(15, currentY, pageWidth - 30, 8, 'F');
        pdf.setTextColor(100, 116, 139);
        pdf.text("No yearly treatment records found.", 20, currentY + 5.5);
      }

      pdf.save(`Matienzo_Clinic_Complete_Report_${monthName.replace(' ', '_')}.pdf`);
      toast.success("Comprehensive Report Downloaded!", { id: 'export', style: { border: '1px solid #D4AF37' } });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate PDF.", { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSavingExpense(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/expenses/add`, expenseForm);
      toast.success("Expense added successfully!");
      setExpenseForm({ description: '', amount: '', category: 'Miscellaneous' });
      setIsExpenseModalOpen(false);
      fetchStatistics(); 
    } catch (error) {
      toast.error("Failed to save expense.");
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to remove this expense record?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/expenses/${id}`);
      toast.success("Expense removed successfully.");
      fetchStatistics();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete expense.");
    }
  };

  const formatCurrency = (value) => `₱${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 flex flex-col p-8 h-full overflow-y-auto relative">
        
        <div id="report-content" className="p-2 space-y-6">
          
          <header className="mb-2 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics Overview</h1>
              <p className="text-sm text-slate-500 mt-1">Financial performance and clinic intelligence metrics for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
            </div>
            
            <button 
              onClick={handleExportReport}
              disabled={isExporting}
              className="bg-slate-900 text-[#D4AF37] font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              {isExporting ? 'GENERATING...' : 'EXPORT REPORT PDF'}
            </button>
          </header>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-[#D4AF37] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* PRIMARY KPI CARDS (6 Blocks) */}
              <div className="grid grid-cols-6 gap-4">
                {[
                  { label: "Revenue", value: formatCurrency(stats.monthlyRevenue) },
                  { label: "Expenses", value: formatCurrency(stats.monthlyExpenses) },
                  { label: "Net Profit", value: formatCurrency(stats.monthlyNetProfit), highlight: true },
                  { label: "Outstanding", value: formatCurrency(stats.outstandingBalance), warning: true },
                  { label: "Patients (Month)", value: stats.patientsThisMonth },
                  { label: "Total Patient Base", value: stats.totalLifetimePatients, badge: `Peak: ${stats.busiestMonth.month}` }
                ].map((kpi, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                      kpi.highlight ? 'border-[#D4AF37]/40 bg-[#fffdf5]' : 
                      kpi.warning ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
                    }`}>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{kpi.label}</p>
                      <p className={`text-xl font-black tracking-tight ${
                          kpi.highlight ? 'text-[#a1811a]' : 
                          kpi.warning ? 'text-rose-600' : 'text-slate-900'
                        }`}>{kpi.value}</p>
                    </div>
                    {kpi.badge && (
                      <span className="mt-3 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md self-start">
                        {kpi.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* TRAJECTORY CHART & GEMINI INSIGHTS */}
              <div className="grid grid-cols-3 gap-6 h-[380px]">
                <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-sm font-semibold text-slate-900 mb-6">Annual Financial Trajectory</h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `₱${val/1000}k`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                          formatter={(value) => [`₱${value.toLocaleString()}`, undefined]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-span-1 bg-slate-900 p-6 rounded-2xl shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37] opacity-20 blur-3xl rounded-full"></div>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Gemini Insights</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-200 font-light">{aiSummary || "Generating insights..."}</p>
                  </div>
                </div>
              </div>

              {/* SECONDARY ROW: EXPENSES, TOP SERVICES, PAYMENT METHODS */}
              <div className="grid grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold text-slate-900">Recent Expenses</h3>
                    <button 
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="text-xs font-bold text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      Add New +
                    </button>
                  </div>
                  <div className="space-y-4 flex-1">
                    {recentExpenses.length > 0 ? recentExpenses.map((exp, idx) => (
                      <div key={exp._id || idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-100 group">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{exp.description}</p>
                          <p className="text-xs text-slate-400">{exp.category} • {new Date(exp.expenseDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900">- {formatCurrency(exp.amount)}</span>
                          <button 
                            onClick={() => handleDeleteExpense(exp._id)}
                            title="Undo / Delete Expense"
                            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs p-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-400 italic">No expenses recorded yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-sm font-semibold text-slate-900 mb-6">Top Services (This Month)</h3>
                  <div className="space-y-5 mt-2 flex-1">
                    {serviceData.length > 0 ? serviceData.map((svc, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-700">{svc._id}</span>
                          <span className="font-semibold text-slate-900">{svc.count} <span className="font-normal text-slate-400 text-xs">Apts</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-[#D4AF37] h-1.5 rounded-full" style={{ width: `${stats.patientsThisMonth > 0 ? (svc.count / stats.patientsThisMonth) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-400 italic">Not enough data for breakdown.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Revenue by Payment Method</h3>
                  <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
                    {paymentMethods.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={paymentMethods} 
                            cx="50%" cy="50%" 
                            innerRadius={50} outerRadius={70} 
                            paddingAngle={5} 
                            dataKey="value"
                            stroke="none"
                          >
                            {paymentMethods.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`₱${value.toLocaleString()}`, "Revenue"]}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-slate-400 italic mt-10">No payments recorded yet.</p>
                    )}
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {paymentMethods.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}></div>
                        <span className="text-xs font-medium text-slate-600">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* YEARLY SERVICE INCOME CONTRIBUTION MATRIX */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Yearly Service Income Contribution & Demand Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Service Name</th>
                        <th className="py-3 px-4">Total Yearly Bookings</th>
                        <th className="py-3 px-4">Total Income Generated</th>
                        <th className="py-3 px-4 text-right">Income Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {serviceIncomeContribution.length > 0 ? serviceIncomeContribution.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{row.service}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">{row.count} Treatments</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">{formatCurrency(row.income)}</td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs">
                              {row.percentage}%
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-slate-400 italic">No yearly treatment records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Add Expense Modal */}
        {isExpenseModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Add New Expense</h2>
                <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <input type="text" required value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] transition" placeholder="e.g., Gloves & Masks" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount (₱)</label>
                  <input type="number" required value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] transition" placeholder="0.00" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] transition font-medium">
                    <option value="Dental Supplies">Dental Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Staff Salaries">Staff Salaries</option>
                    <option value="Equipment Repair">Equipment Repair</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                
                <button type="submit" disabled={isSavingExpense} className="w-full mt-6 bg-slate-900 text-[#D4AF37] font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg cursor-pointer">
                  {isSavingExpense ? 'SAVING...' : 'SAVE EXPENSE'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminStatistics;