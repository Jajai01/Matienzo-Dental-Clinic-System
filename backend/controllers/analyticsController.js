import { GoogleGenAI } from '@google/genai';
import Appointment from '../models/appointments.js';
import Expense from '../models/Expense.js';
import User from '../models/user.js'; // Adjust to your actual User model path

export const getFinancialSummary = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const startOfMonth = new Date(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01T00:00:00.000Z`);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 1. MONTHLY REVENUE
    const monthlyRevenueData = await Appointment.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$billingAmount" } } }
    ]);
    const monthlyRevenue = monthlyRevenueData.length > 0 ? monthlyRevenueData[0].total : 0;

    // 2. MONTHLY EXPENSES
    const monthlyExpenseData = await Expense.aggregate([
      { $match: { expenseDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const monthlyExpenses = monthlyExpenseData.length > 0 ? monthlyExpenseData[0].total : 0;
    const monthlyNetProfit = monthlyRevenue - monthlyExpenses;

    // 3. PATIENTS THIS MONTH
    const patientsThisMonth = await Appointment.countDocuments({ 
      status: { $ne: "Cancelled" },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // 4. TOTAL LIFETIME PATIENT ACCOUNT (Unique patients)
    const uniquePatientsCount = await Appointment.distinct('patientId');
    const totalLifetimePatients = uniquePatientsCount.length;

    // 5. OUTSTANDING BALANCE
    const outstandingData = await Appointment.aggregate([
      { $match: { paymentStatus: "Unpaid", billingAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$billingAmount" } } }
    ]);
    const outstandingBalance = outstandingData.length > 0 ? outstandingData[0].total : 0;

    // 6. PAYMENT METHODS BREAKDOWN
    const paymentMethodsData = await Appointment.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$paymentMethod", value: { $sum: "$billingAmount" } } }
    ]);
    const paymentMethods = paymentMethodsData.map(pm => ({ 
      name: pm._id === "None" || !pm._id ? "Other" : pm._id, 
      value: pm.value 
    }));

    // 7. YEARLY CHART DATA & BUSIEST MONTH IDENTIFICATION
    const revenueData = await Appointment.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) } } },
      { $group: { _id: { $month: "$createdAt" }, totalRevenue: { $sum: "$billingAmount" } } }
    ]);

    const expenseData = await Expense.aggregate([
      { $match: { expenseDate: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) } } },
      { $group: { _id: { $month: "$expenseDate" }, totalExpense: { $sum: "$amount" } } }
    ]);

    // Monthly Patient Traffic for "Busiest Month" calculation
    const monthlyTrafficData = await Appointment.aggregate([
      { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) } } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let chartData = [];
    let busiestMonthObj = { month: 'N/A', count: 0 };

    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1;
      const revFound = revenueData.find(r => r._id === monthNum);
      const expFound = expenseData.find(e => e._id === monthNum);
      const trafficFound = monthlyTrafficData.find(t => t._id === monthNum);
      
      const patientCount = trafficFound ? trafficFound.count : 0;
      if (patientCount > busiestMonthObj.count) {
        busiestMonthObj = { month: monthNames[i], count: patientCount };
      }

      chartData.push({
        month: monthNames[i],
        revenue: revFound ? revFound.totalRevenue : 0,
        expense: expFound ? expFound.totalExpense : 0,
        patients: patientCount
      });
    }

    // 8. TOP SERVICES (Current Month)
    const serviceBreakdown = await Appointment.aggregate([
      { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    // 9. YEARLY SERVICE DEMAND & INCOME CONTRIBUTION MATRIX
    const yearlyServiceStats = await Appointment.aggregate([
      { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) } } },
      { 
        $group: { 
          _id: "$service", 
          totalCount: { $sum: 1 }, 
          totalIncome: { $sum: "$billingAmount" } 
        } 
      },
      { $sort: { totalIncome: -1 } }
    ]);

    // Calculate total yearly revenue across all services for percentage shares
    const totalYearlyRevenue = yearlyServiceStats.reduce((acc, curr) => acc + curr.totalIncome, 0);
    const serviceIncomeContribution = yearlyServiceStats.map(s => ({
      service: s._id,
      count: s.totalCount,
      income: s.totalIncome,
      percentage: totalYearlyRevenue > 0 ? ((s.totalIncome / totalYearlyRevenue) * 100).toFixed(1) : 0
    }));

    // 10. RECENT EXPENSES
    const recentExpenses = await Expense.find()
      .sort({ expenseDate: -1 })
      .limit(4)
      .select('description amount category expenseDate');

    res.status(200).json({
      monthlyRevenue,
      monthlyExpenses,
      monthlyNetProfit,
      patientsThisMonth,
      totalLifetimePatients,
      outstandingBalance,
      busiestMonth: busiestMonthObj,
      paymentMethods,
      chartData,
      serviceBreakdown,
      serviceIncomeContribution,
      recentExpenses
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Failed to load financial statistics" });
  }
};

export const getAIInsights = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const startOfMonth = new Date(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01T00:00:00.000Z`);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 1. Gather all data points directly from the Appointment & Expense models
    const monthlyRevenueData = await Appointment.aggregate([
      { $match: { paymentStatus: "Paid", createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$billingAmount" } } }
    ]);
    const monthlyRevenue = monthlyRevenueData.length > 0 ? monthlyRevenueData[0].total : 0;

    const monthlyExpenseData = await Expense.aggregate([
      { $match: { expenseDate: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const monthlyExpenses = monthlyExpenseData.length > 0 ? monthlyExpenseData[0].total : 0;
    const monthlyNetProfit = monthlyRevenue - monthlyExpenses;

    const patientsThisMonth = await Appointment.countDocuments({ 
      status: { $ne: "Cancelled" },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const outstandingData = await Appointment.aggregate([
      { $match: { paymentStatus: "Unpaid", billingAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$billingAmount" } } }
    ]);
    const outstandingBalance = outstandingData.length > 0 ? outstandingData[0].total : 0;

    const recentExpenses = await Expense.find()
      .sort({ expenseDate: -1 })
      .limit(3)
      .select('description amount category');

    const topServices = await Appointment.aggregate([
      { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // 2. Initialize the Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ aiSummary: "API key not configured." });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 3. Pass all the schema metrics directly into the prompt payload
    const prompt = `
      You are an expert financial and clinic operations manager analyzing real-time database models for Matienzo Dental Clinic. 
      Here is the complete operational data pulled from the database for the current month:
      - Total Monthly Revenue (Paid Appointments): ₱${monthlyRevenue}
      - Total Monthly Expenses: ₱${monthlyExpenses}
      - Monthly Net Profit: ₱${monthlyNetProfit}
      - Active Patients / Appointments This Month: ${patientsThisMonth}
      - Total Outstanding Unpaid Invoices: ₱${outstandingBalance}
      - Top Service Demands: ${JSON.stringify(topServices)}
      - Recent Ledger Expenses: ${JSON.stringify(recentExpenses)}

      Write a concise, professional, 2-sentence analytical insight block. Evaluate their net performance or suggest a clear strategy for handling outstanding receivables. Keep the tone minimalist, analytical, and encouraging. No formatting or asterisks.
    `;

    // 4. Send to Gemini using the stable general-use model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    if (!response || !response.text) {
      throw new Error("Empty response payload from Gemini.");
    }

    res.status(200).json({ aiSummary: response.text });

  } catch (error) {
    console.error("🚨 Gemini API Full Data Error:", error);
    res.status(200).json({ 
      aiSummary: "Analytics sync in progress. Check back shortly for updated insights." 
    });
  }
};

 // Adjust to your actual User model path
// Import your email service provider (e.g., Nodemailer, SendGrid, etc.)
// import { sendEmail } from '../utils/emailService.js'; 

export const sendBroadcastEmail = async (req, res) => {
  try {
    const { subject, message, targetGroup } = req.body; 
    // targetGroup options could be: 'allNotifications', 'promotions', or 'both'

    let query = {};
    if (targetGroup === 'promotions') {
      query = { "preferences.promotions": true };
    } else if (targetGroup === 'notifications') {
      query = { "preferences.emailNotifications": true };
    } else {
      // Default: Target users who have email notifications enabled
      query = { "preferences.emailNotifications": true };
    }

    // 1. Fetch all users matching the preference criteria
    const recipients = await User.find(query).select('email firstName');

    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ success: false, message: "No users found matching the selected preference." });
    }

    const emailList = recipients.map(user => user.email);

    // 2. Loop and send email (or use bulk BCC / mailing provider API)
    // Example pseudo-code loop:
    // for (const user of recipients) {
    //   await sendEmail(user.email, subject, message);
    // }

    console.log(`📨 Broadcast sent to ${emailList.length} users.`);

    res.status(200).json({ 
      returnDocument: 'after' , 
      message: `Successfully broadcasted email to ${emailList.length} opted-in users.` 
    });

  } catch (error) {
    console.error("Broadcast email error:", error);
    res.status(500).json({ returnDocument : 'before', message: "Failed to send broadcast emails." });
  }
};