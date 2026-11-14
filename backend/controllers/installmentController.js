import { InstallmentPlan } from '../models/Installments.js';

// 1. Create a new installment plan
export const createInstallmentPlan = async (req, res) => {
  try {
    const { patientName, contactNumber, totalLoan, durationMonths } = req.body;
    
    const duration = Number(durationMonths);
    const monthlyAmount = Number(totalLoan) / duration;

    // Generate monthly breakdown array
    const installments = [];
    for (let i = 1; i <= duration; i++) {
      installments.push({
        monthNumber: i,
        amountDue: Number(monthlyAmount.toFixed(2)),
        isPaid: false
      });
    }

    const newPlan = new InstallmentPlan({
      patientName,
      contactNumber,
      totalLoan: Number(totalLoan),
      remainingBalance: Number(totalLoan),
      durationMonths: duration,
      installments
    });

    await newPlan.save();
    res.status(201).json({ success: true, plan: newPlan });
  } catch (error) {
    console.error("Error creating installment plan:", error);
    res.status(500).json({ success: false, message: "Server error creating installment plan." });
  }
};

// 2. Get all plans (with name search support)
export const getInstallmentPlans = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query.patientName = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    const plans = await InstallmentPlan.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching installment plans:", error);
    res.status(500).json({ success: false, message: "Server error fetching plans." });
  }
};

// 3. Toggle payment checkbox for a specific month
export const toggleMonthPayment = async (req, res) => {
  try {
    const { planId, monthId } = req.params;
    
    const plan = await InstallmentPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Installment plan not found." });

    const monthItem = plan.installments.id(monthId);
    if (!monthItem) return res.status(404).json({ success: false, message: "Installment month record not found." });

    // Toggle status and adjust remaining balance
    if (!monthItem.isPaid) {
      monthItem.isPaid = true;
      monthItem.paidDate = new Date();
      plan.remainingBalance = Math.max(0, plan.remainingBalance - monthItem.amountDue);
    } else {
      monthItem.isPaid = false;
      monthItem.paidDate = null;
      plan.remainingBalance += monthItem.amountDue;
    }

    // Check if fully paid
    if (plan.remainingBalance === 0) {
      plan.status = 'Completed';
    } else {
      plan.status = 'Active';
    }

    await plan.save();
    res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error("Error updating installment status:", error);
    res.status(500).json({ success: false, message: "Server error updating payment." });
  }
};

