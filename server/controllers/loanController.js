import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import User from '../models/User.js';
import { supabase } from '../config/supabase.js';
import { mapDoc } from '../models/adapter.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';

// Helper to calculate due date based on payment frequency
const calculateDueDate = (baseDate, index, frequency) => {
  const date = new Date(baseDate);
  if (frequency === 'weekly') {
    date.setDate(date.getDate() + index * 7);
  } else if (frequency === 'quarterly') {
    date.setMonth(date.getMonth() + index * 3);
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + index);
  } else {
    // default: monthly
    date.setMonth(date.getMonth() + index);
  }
  return date;
};

// Get all loans for the logged-in user
export const getLoans = async (req, res) => {
  try {
    const userId = req.userId;
    const loans = await Loan.find({ userId }).sort({ status: 1, startDate: -1 });

    let updatedAny = false;
    for (let loan of loans) {
      if (loan.status === 'active') {
        const isCompleted = (loan.installmentsPaid >= loan.totalInstallments) || (Number(loan.remainingAmount) <= 0);
        if (isCompleted) {
          loan.status = 'completed';
          loan.nextDueDate = null;
          await loan.save();
          updatedAny = true;
        }
      }
    }

    const finalLoans = updatedAny ? await Loan.find({ userId }).sort({ status: 1, startDate: -1 }) : loans;

    res.status(200).json({
      success: true,
      data: finalLoans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add a new loan / debt
export const addLoan = async (req, res) => {
  try {
    const userId = req.userId;

    // Check tier limits for Basic users (Max 1 active loan)
    const user = await User.findById(userId);
    const subscription = getUserSubscription(user);
    if (!subscription.isPro) {
      const activeLoans = await Loan.find({ userId, status: 'active' });
      if (activeLoans.length >= 1) {
        return res.status(403).json({
          success: false,
          code: 'LIMIT_REACHED',
          message: 'Basic tier allows 1 active loan. Please upgrade to Pro for unlimited loans.',
          limit: 1,
          currentCount: activeLoans.length
        });
      }
    }

    const {
      title,
      type,
      mainCategory,
      subCategory,
      lenderName,
      totalAmount,
      interestRate,
      emiAmount,
      startDate,
      endDate,
      accountId, // optional payout link

      // New fields for Complete Loan/EMI system
      processingFee,
      totalInstallments,
      firstEmiDate,
      dueDayOfMonth,
      paymentFrequency,
      paymentSourceId,
      emiCategory,
      notes,
      reminder7Days,
      reminder3Days,
      reminder1Day,
      reminderDueDate,
      reminderDailyOverdue
    } = req.body;

    if (!title?.trim() || !type || !mainCategory || !subCategory || !lenderName?.trim() || totalAmount === undefined || Number(totalAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, type, mainCategory, subCategory, lenderName, totalAmount > 0)'
      });
    }

    const tInstallments = Number(totalInstallments) || 1;
    const fEmiDate = firstEmiDate ? new Date(firstEmiDate) : new Date();

    const loan = await Loan.create({
      userId,
      title: title.trim(),
      type,
      mainCategory,
      subCategory,
      lenderName: lenderName.trim(),
      totalAmount: Number(totalAmount),
      remainingAmount: Number(totalAmount),
      interestRate: Number(interestRate) || 0,
      emiAmount: Number(emiAmount) || 0,
      startDate: startDate || new Date(),
      endDate: endDate || undefined,

      // Save complete EMI parameters
      processingFee: Number(processingFee) || 0,
      totalInstallments: tInstallments,
      installmentsPaid: 0,
      firstEmiDate: fEmiDate,
      nextDueDate: fEmiDate, // initially next due date is first EMI date
      dueDayOfMonth: Number(dueDayOfMonth) || fEmiDate.getDate(),
      paymentFrequency: paymentFrequency || 'monthly',
      paymentSourceId: paymentSourceId || undefined,
      emiCategory: emiCategory || 'EMI',
      notes: notes || '',
      reminder7Days: reminder7Days !== false,
      reminder3Days: reminder3Days !== false,
      reminder1Day: reminder1Day !== false,
      reminderDueDate: reminderDueDate !== false,
      reminderDailyOverdue: reminderDailyOverdue !== false,
      status: 'active'
    });

    // Pre-generate installment records in database table
    const installments = [];
    for (let i = 1; i <= tInstallments; i++) {
      const dueDate = calculateDueDate(fEmiDate, i - 1, paymentFrequency);
      
      installments.push({
        loanId: loan._id,
        userId,
        installmentNumber: i,
        amount: Number(emiAmount) || 0,
        dueDate: dueDate.toISOString(),
        status: 'upcoming'
      });
    }

    if (installments.length > 0) {
      try {
        const { error: insErr } = await supabase
          .from('loan_installments')
          .insert(installments);
        if (insErr) {
          console.error('Supabase loan_installments insert warning:', insErr.message);
        }
      } catch (insE) {
        console.error('Failed to insert loan_installments:', insE.message);
      }
    }

    // Payout account linkage
    const finalAccountId = accountId || paymentSourceId;
    if (finalAccountId) {
      const account = await Account.findOne({ _id: finalAccountId, userId });
      if (account) {
        const isBorrowed = type === 'borrowed';
        await Transaction.create({
          userId,
          type: isBorrowed ? 'income' : 'expense',
          title: isBorrowed ? `Loan Payout: ${title.trim()}` : `Loan Disbursed: ${title.trim()}`,
          amount: Number(totalAmount),
          category: 'Other',
          paymentMethod: 'bank_transfer',
          accountId: finalAccountId,
          loanId: loan._id,
          description: `Initial disbursement of ${title.trim()} from ${lenderName.trim()}`,
          transactionDate: startDate || new Date()
        });

        account.balance += (isBorrowed ? Number(totalAmount) : -Number(totalAmount));
        await account.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Loan and installments created successfully',
      data: loan
    });
  } catch (error) {
    let msg = error.message || 'Failed to add loan';
    if (msg.includes('row-level security') || msg.includes('42501') || msg.includes('policy') || msg.includes('loan_installments')) {
      msg = 'Supabase Row-Level Security (RLS) is blocking "loan_installments". Please run: ALTER TABLE loan_installments DISABLE ROW LEVEL SECURITY; in Supabase SQL Editor.';
    }
    res.status(400).json({
      success: false,
      message: msg
    });
  }
};

// Update loan details
export const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      title,
      type,
      mainCategory,
      subCategory,
      lenderName,
      totalAmount,
      remainingAmount,
      interestRate,
      emiAmount,
      startDate,
      endDate,
      status,

      // Complete EMI variables
      processingFee,
      totalInstallments,
      installmentsPaid,
      firstEmiDate,
      dueDayOfMonth,
      paymentFrequency,
      paymentSourceId,
      emiCategory,
      notes,
      reminder7Days,
      reminder3Days,
      reminder1Day,
      reminderDueDate,
      reminderDailyOverdue
    } = req.body;

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Record properties to see if we need to regenerate upcoming installments
    const prevTotalInstallments = loan.totalInstallments;
    const prevFirstEmiDate = loan.firstEmiDate ? new Date(loan.firstEmiDate).toISOString() : null;
    const prevEmiAmount = loan.emiAmount;

    if (title !== undefined) loan.title = title.trim();
    if (type !== undefined) loan.type = type;
    if (mainCategory !== undefined) loan.mainCategory = mainCategory;
    if (subCategory !== undefined) loan.subCategory = subCategory;
    if (lenderName !== undefined) loan.lenderName = lenderName.trim();
    if (interestRate !== undefined) loan.interestRate = Number(interestRate);
    if (emiAmount !== undefined) loan.emiAmount = Number(emiAmount);
    if (startDate !== undefined) loan.startDate = startDate;
    if (endDate !== undefined) loan.endDate = endDate || undefined;

    if (processingFee !== undefined) loan.processingFee = Number(processingFee);
    if (totalInstallments !== undefined) loan.totalInstallments = Number(totalInstallments);
    if (installmentsPaid !== undefined) loan.installmentsPaid = Number(installmentsPaid);
    if (firstEmiDate !== undefined) loan.firstEmiDate = firstEmiDate;
    if (dueDayOfMonth !== undefined) loan.dueDayOfMonth = Number(dueDayOfMonth);
    if (paymentFrequency !== undefined) loan.paymentFrequency = paymentFrequency;
    if (paymentSourceId !== undefined) loan.paymentSourceId = paymentSourceId || null;
    if (emiCategory !== undefined) loan.emiCategory = emiCategory;
    if (notes !== undefined) loan.notes = notes;
    if (reminder7Days !== undefined) loan.reminder7Days = !!reminder7Days;
    if (reminder3Days !== undefined) loan.reminder3Days = !!reminder3Days;
    if (reminder1Day !== undefined) loan.reminder1Day = !!reminder1Day;
    if (reminderDueDate !== undefined) loan.reminderDueDate = !!reminderDueDate;
    if (reminderDailyOverdue !== undefined) loan.reminderDailyOverdue = !!reminderDailyOverdue;

    // Handle amount changes
    if (totalAmount !== undefined) {
      const diff = Number(totalAmount) - loan.totalAmount;
      loan.totalAmount = Number(totalAmount);
      loan.remainingAmount = Math.max(0, loan.remainingAmount + diff);
    }
    
    if (remainingAmount !== undefined) {
      loan.remainingAmount = Number(remainingAmount);
    }

    if (loan.remainingAmount <= 0 || loan.installmentsPaid >= loan.totalInstallments) {
      loan.status = 'completed';
      loan.nextDueDate = null;
    } else if (status !== undefined) {
      loan.status = status;
    } else {
      loan.status = 'active';
    }

    // Support editing EMI without losing previous paid records
    const newFirstEmiDateStr = firstEmiDate ? new Date(firstEmiDate).toISOString() : null;
    const isEmiChanged = 
      prevTotalInstallments !== loan.totalInstallments || 
      prevFirstEmiDate !== newFirstEmiDateStr ||
      prevEmiAmount !== loan.emiAmount;

    if (isEmiChanged) {
      // 1. Fetch paid installments to preserve them
      const { data: paidInstallments, error: fetchPaidErr } = await supabase
        .from('loan_installments')
        .select('*')
        .eq('loanId', loan._id)
        .eq('status', 'paid')
        .order('installmentNumber', { ascending: true });

      if (fetchPaidErr) throw new Error(fetchPaidErr.message);

      const paidCount = paidInstallments.length;
      loan.installmentsPaid = paidCount; // Sync count of actually paid installments

      // 2. Delete all unpaid (upcoming, overdue, missed) installments
      const { error: delErr } = await supabase
        .from('loan_installments')
        .delete()
        .eq('loanId', loan._id)
        .neq('status', 'paid');

      if (delErr) throw new Error(delErr.message);

      // 3. Regenerate remaining installments from paidCount + 1 to totalInstallments
      const installmentsToCreate = [];
      const baseDate = loan.firstEmiDate ? new Date(loan.firstEmiDate) : new Date();

      for (let i = paidCount + 1; i <= loan.totalInstallments; i++) {
        const dueDate = calculateDueDate(baseDate, i - 1, loan.paymentFrequency);

        installmentsToCreate.push({
          loanId: loan._id,
          userId,
          installmentNumber: i,
          amount: loan.emiAmount || 0,
          dueDate: dueDate.toISOString(),
          status: 'upcoming'
        });
      }

      if (installmentsToCreate.length > 0) {
        const { error: insErr } = await supabase
          .from('loan_installments')
          .insert(installmentsToCreate);
        if (insErr) throw new Error(insErr.message);
      }

      // 4. Update nextDueDate based on the first unpaid installment
      const { data: nextIns, error: nextErr } = await supabase
        .from('loan_installments')
        .select('dueDate')
        .eq('loanId', loan._id)
        .eq('status', 'upcoming')
        .order('installmentNumber', { ascending: true })
        .limit(1);

      if (!nextErr && nextIns && nextIns.length > 0) {
        loan.nextDueDate = nextIns[0].dueDate;
      } else {
        loan.nextDueDate = null;
      }
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: 'Loan updated successfully',
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a loan
export const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    const deleteTransactions = req.query.deleteTransactions === 'true';

    // Delete parent loan. Installments will be deleted by CASCADE in Supabase
    await Loan.deleteOne({ _id: id });

    // Conditional delete of linked transactions
    if (deleteTransactions) {
      await Transaction.deleteMany({ userId, loanId: id });
    }

    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Fetch all installments for a specific loan
export const getLoanInstallments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    const { data, error } = await supabase
      .from('loan_installments')
      .select('*')
      .eq('loanId', id)
      .order('installmentNumber', { ascending: true });

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: data.map(mapDoc)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark an installment as paid
export const payInstallment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const userId = req.userId;

    // Fetch the installment details
    const { data: installment, error: fetchErr } = await supabase
      .from('loan_installments')
      .select('*')
      .eq('id', installmentId)
      .eq('userId', userId)
      .single();

    if (fetchErr || !installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Installment is already paid'
      });
    }

    // Fetch parent loan
    const loan = await Loan.findOne({ _id: installment.loanId, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Parent loan not found'
      });
    }

    // Determine payment account (from body, loan setting, or default user account)
    let accountId = req.body?.accountId || loan.paymentSourceId;
    let account = null;

    if (accountId) {
      account = await Account.findOne({ _id: accountId, userId });
    }

    // Fallback: If no account specified or found, select user's default Cash or primary account
    if (!account) {
      account = await Account.findOne({ userId }).sort({ isDefault: -1, createdAt: 1 });
      if (!account) {
        account = await Account.create({
          userId,
          name: 'Cash Wallet',
          type: 'cash',
          balance: 0,
          isDefault: true
        });
      }
      accountId = account._id;
    }

    const isLent = loan.type === 'lent'; // Money given to someone (repayment received = income)
    const transactionType = isLent ? 'income' : 'expense';

    // 1. Create the auto-generated transaction
    const transaction = await Transaction.create({
      userId,
      type: transactionType,
      title: isLent 
        ? `${loan.title} - EMI Collected #${installment.installmentNumber}`
        : `${loan.title} - EMI Installment #${installment.installmentNumber}`,
      amount: Number(installment.amount),
      category: loan.emiCategory || (isLent ? 'Loan Repayment' : 'EMI'),
      paymentMethod: account.type === 'cash' ? 'cash' : 'bank_transfer',
      accountId: accountId,
      loanId: loan._id,
      description: isLent
        ? `EMI collection received for ${loan.title} (Installment ${installment.installmentNumber}/${loan.totalInstallments})`
        : `EMI payment paid for ${loan.title} (Installment ${installment.installmentNumber}/${loan.totalInstallments})`,
      transactionDate: new Date()
    });

    // 2. Adjust account balance: INCREASE for lent collection (+), DEDUCT for borrowed payment (-)
    if (isLent) {
      account.balance = Number(account.balance) + Number(installment.amount);
    } else {
      account.balance = Number(account.balance) - Number(installment.amount);
    }
    await account.save();

    // 3. Mark the installment as paid in Supabase if table accessible
    try {
      const { error: updateErr } = await supabase
        .from('loan_installments')
        .update({
          status: 'paid',
          paidDate: new Date().toISOString(),
          transactionId: transaction._id
        })
        .eq('id', installmentId);
      if (updateErr) console.error('Supabase installment update notice:', updateErr.message);
    } catch (supErr) {
      console.error('Supabase installment update notice:', supErr.message);
    }

    // 4. Update the parent loan stats
    loan.installmentsPaid = Number(loan.installmentsPaid) + 1;
    loan.remainingAmount = Math.max(0, Number(loan.remainingAmount) - Number(installment.amount));

    if (loan.installmentsPaid >= loan.totalInstallments || loan.remainingAmount <= 0) {
      loan.status = 'completed';
      loan.nextDueDate = null;
    } else {
      // Find the next upcoming/overdue installment to set the nextDueDate
      try {
        const { data: nextIns, error: nextErr } = await supabase
          .from('loan_installments')
          .select('dueDate')
          .eq('loanId', loan._id)
          .eq('status', 'upcoming')
          .order('installmentNumber', { ascending: true })
          .limit(1);

        if (!nextErr && nextIns && nextIns.length > 0) {
          loan.nextDueDate = nextIns[0].dueDate;
        } else {
          const currentDueDate = new Date(installment.dueDate || loan.firstEmiDate || new Date());
          currentDueDate.setMonth(currentDueDate.getMonth() + 1);
          loan.nextDueDate = currentDueDate;
        }
      } catch (err) {
        const currentDueDate = new Date(installment.dueDate || loan.firstEmiDate || new Date());
        currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        loan.nextDueDate = currentDueDate;
      }
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: isLent ? 'EMI collection logged & account balance updated!' : 'EMI payment logged & account balance updated!',
      data: {
        loan,
        transaction
      }
    });
  } catch (error) {
    let msg = error.message || 'Failed to process installment payment';
    if (msg.includes('row-level security') || msg.includes('42501') || msg.includes('policy') || msg.includes('loan_installments')) {
      msg = 'Supabase Row-Level Security (RLS) is blocking "loan_installments". Please run: ALTER TABLE loan_installments DISABLE ROW LEVEL SECURITY; in Supabase SQL Editor.';
    }
    res.status(400).json({
      success: false,
      message: msg
    });
  }
};

// Direct EMI Payment on Loan (works even if loan_installments table is empty)
export const payLoanDirect = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status === 'completed' || Number(loan.remainingAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This loan is already completely paid!'
      });
    }

    const nextInstallmentNum = Number(loan.installmentsPaid || 0) + 1;
    const emiAmount = Number(loan.emiAmount) || Number(loan.remainingAmount);

    // Determine account
    let accountId = req.body?.accountId || loan.paymentSourceId;
    let account = null;

    if (accountId) {
      account = await Account.findOne({ _id: accountId, userId });
    }

    if (!account) {
      account = await Account.findOne({ userId }).sort({ isDefault: -1, createdAt: 1 });
      if (!account) {
        account = await Account.create({
          userId,
          name: 'Cash Wallet',
          type: 'cash',
          balance: 0,
          isDefault: true
        });
      }
      accountId = account._id;
    }

    const isLent = loan.type === 'lent';
    const transactionType = isLent ? 'income' : 'expense';

    // 1. Create Transaction
    const transaction = await Transaction.create({
      userId,
      type: transactionType,
      title: isLent
        ? `${loan.title} - EMI Collected #${nextInstallmentNum}`
        : `${loan.title} - EMI Installment #${nextInstallmentNum}`,
      amount: emiAmount,
      category: loan.emiCategory || (isLent ? 'Loan Repayment' : 'EMI'),
      paymentMethod: account.type === 'cash' ? 'cash' : 'bank_transfer',
      accountId: accountId,
      loanId: loan._id,
      description: isLent
        ? `EMI collection received for ${loan.title} (Installment ${nextInstallmentNum}/${loan.totalInstallments})`
        : `EMI payment paid for ${loan.title} (Installment ${nextInstallmentNum}/${loan.totalInstallments})`,
      transactionDate: new Date()
    });

    // 2. Adjust account balance: INCREASE for lent collection (+), DEDUCT for borrowed payment (-)
    if (isLent) {
      account.balance = Number(account.balance) + emiAmount;
    } else {
      account.balance = Number(account.balance) - emiAmount;
    }
    await account.save();

    // 3. Update loan stats
    loan.installmentsPaid = nextInstallmentNum;
    loan.remainingAmount = Math.max(0, Number(loan.remainingAmount) - emiAmount);

    if (loan.installmentsPaid >= loan.totalInstallments || loan.remainingAmount <= 0) {
      loan.status = 'completed';
      loan.nextDueDate = null;
    } else {
      const baseDate = loan.firstEmiDate ? new Date(loan.firstEmiDate) : new Date();
      loan.nextDueDate = calculateDueDate(baseDate, nextInstallmentNum, loan.paymentFrequency);
    }

    await loan.save();

    // 4. Update matching row in Supabase if exists
    try {
      const { data: insts } = await supabase
        .from('loan_installments')
        .select('*')
        .eq('loanId', id)
        .eq('status', 'upcoming')
        .order('installmentNumber', { ascending: true })
        .limit(1);

      if (insts && insts.length > 0) {
        await supabase
          .from('loan_installments')
          .update({
            status: 'paid',
            paidDate: new Date().toISOString(),
            transactionId: transaction._id
          })
          .eq('id', insts[0].id);
      }
    } catch (supErr) {
      console.error('Supabase installment update notice:', supErr.message);
    }

    res.status(200).json({
      success: true,
      message: isLent ? 'EMI collection logged & account balance updated!' : 'EMI payment logged & account balance updated!',
      data: {
        loan,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process direct loan EMI payment'
    });
  }
};
