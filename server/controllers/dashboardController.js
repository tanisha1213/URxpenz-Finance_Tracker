import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Account from '../models/Account.js';
import Loan from '../models/Loan.js';
import Investment from '../models/Investment.js';
import Insurance from '../models/Insurance.js';
import Subscription from '../models/Subscription.js';
import { processAutoDeductions } from './subscriptionController.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

export const getDashboardSummary = async (req, res) => {
  try {
    // 0. Process auto deductions for recurring subscriptions
    await processAutoDeductions(req.userId).catch(err => {
      console.warn('Dashboard: auto-deductions check skipped. Error:', err.message);
    });

    // 1. Initialize default accounts if they don't exist
    let cashAccount = await Account.findOne({ userId: req.userId, type: 'cash' });
    if (!cashAccount) {
      cashAccount = await Account.create({
        userId: req.userId,
        type: 'cash',
        name: 'Cash',
        balance: 0
      });
    }

    let bankAccounts = await Account.find({ userId: req.userId, type: 'bank' });
    if (bankAccounts.length === 0) {
      const defaultBank = await Account.create({
        userId: req.userId,
        type: 'bank',
        name: 'State Bank of India',
        balance: 0
      });
      bankAccounts = [defaultBank];
    }

    // 2. Run Migration in background to prevent blocking page load
    Transaction.updateMany(
      { userId: req.userId, accountId: { $exists: false } },
      { $set: { accountId: cashAccount._id } }
    ).catch(err => console.error('Migration background run failed:', err));

    // 3. Fetch accounts and compute balance sums
    const accounts = await Account.find({ userId: req.userId }).sort({ type: 1, name: 1 });
    const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const cashBalance = accounts.filter(acc => acc.type === 'cash').reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const bankBalance = accounts.filter(acc => acc.type === 'bank').reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

    // 4. Optimize queries by filtering for current month and limiting recent fetches
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      currentMonthTransactions,
      trendTransactions,
      recentTransactions,
      budget,
      loans,
      investments,
      insurances,
      subscriptions
    ] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        transactionDate: { $gte: currentMonthStart, $lt: currentMonthEnd }
      }).populate('accountId', 'name type'),
      
      Transaction.find({
        userId: req.userId,
        transactionDate: { $gte: sixMonthsAgoStart, $lt: currentMonthEnd }
      }),
      
      Transaction.find({ userId: req.userId })
        .populate('accountId', 'name type')
        .sort({ transactionDate: -1 })
        .limit(5),
        
      Budget.findOne({ userId: req.userId }),

      Loan.find({ userId: req.userId, status: 'active' }).catch(err => {
        console.warn('Dashboard: loans table query failed, using empty array. Error:', err.message);
        return [];
      }),
      Investment.find({ userId: req.userId }).catch(err => {
        console.warn('Dashboard: investments table query failed, using empty array. Error:', err.message);
        return [];
      }),
      Insurance.find({ userId: req.userId, status: 'active' }).catch(err => {
        console.warn('Dashboard: insurances table query failed, using empty array. Error:', err.message);
        return [];
      }),
      Subscription.find({ userId: req.userId, status: 'active' }).catch(err => {
        console.warn('Dashboard: subscriptions table query failed, using empty array. Error:', err.message);
        return [];
      })
    ]);

    // Summarize current month's spending
    const summary = summarizeTransactions(currentMonthTransactions, budget);
    
    // Summarize last 6 months for the trend chart
    const trendSummary = summarizeTransactions(trendTransactions, budget);

    // 5. Compile Unified Upcoming Payments List
    const upcomingPayments = [];

    // Add Loan EMIs
    loans.forEach(loan => {
      if (loan.nextDueDate && Number(loan.emiAmount) > 0) {
        upcomingPayments.push({
          id: loan._id,
          type: 'loan_emi',
          title: `${loan.title} EMI`,
          amount: Number(loan.emiAmount),
          dueDate: loan.nextDueDate,
          frequency: loan.paymentFrequency || 'monthly'
        });
      }
    });

    // Add Investment SIPs
    investments.forEach(inv => {
      if (inv.sipDueDate && Number(inv.monthlySipAmount) > 0) {
        upcomingPayments.push({
          id: inv._id,
          type: 'investment_sip',
          title: `${inv.title} SIP`,
          amount: Number(inv.monthlySipAmount),
          dueDate: inv.sipDueDate,
          frequency: 'monthly'
        });
      }
    });

    // Add Insurance Premiums
    insurances.forEach(ins => {
      if (ins.renewalDate && Number(ins.premiumAmount) > 0) {
        upcomingPayments.push({
          id: ins._id,
          type: 'insurance_premium',
          title: `${ins.insurer} ${ins.title}`,
          amount: Number(ins.premiumAmount),
          dueDate: ins.renewalDate,
          frequency: ins.paymentFrequency || 'yearly'
        });
      }
    });

    // Add Recurring Subscriptions
    (subscriptions || []).forEach(sub => {
      if (sub.nextBillingDate && Number(sub.amount) > 0) {
        upcomingPayments.push({
          id: sub._id,
          type: 'subscription',
          title: `${sub.title} Renewal`,
          amount: Number(sub.amount),
          dueDate: sub.nextBillingDate,
          frequency: sub.billingCycle || 'monthly'
        });
      }
    });

    // Sort by due date ascending
    upcomingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Compute Daily Budget & Today's Outflow
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyLimit = Number(budget?.monthlyBudget || 0);
    const dailyBudget = Number(budget?.dailyBudget) || (monthlyLimit > 0 ? Math.round(monthlyLimit / daysInMonth) : 0);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const todayExpenses = (currentMonthTransactions || []).filter(t => {
      const d = new Date(t.transactionDate);
      return t.type === 'expense' && d >= startOfToday && d < endOfToday;
    });
    const todaySpent = todayExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const todayRemaining = dailyBudget - todaySpent;
    const todaySaved = todaySpent <= dailyBudget ? Math.max(0, dailyBudget - todaySpent) : 0;
    const isOverspentToday = todaySpent > dailyBudget && dailyBudget > 0;

    res.status(200).json({
      success: true,
      data: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        savings: summary.savings, // Current month savings (Net Savings card)
        totalBalance, // Real-time actual accounts sum (Total Balance hero card)
        cashBalance,
        bankBalance,
        accounts,
        monthlyBudget: summary.monthlyBudget || budget?.monthlyBudget || 0,
        budgetRemaining: summary.budgetRemaining,
        dailyBudget,
        todaySpent,
        todayRemaining,
        todaySaved,
        isOverspentToday,
        daysInMonth,
        monthlyTrend: trendSummary.monthlyTrend,
        categoryBreakdown: summary.categoryBreakdown,
        recentTransactions,
        upcomingPayments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};