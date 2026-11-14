import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Account from '../models/Account.js';
import Loan from '../models/Loan.js';
import Investment from '../models/Investment.js';
import Insurance from '../models/Insurance.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';
import { processAutoDeductions } from './subscriptionController.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.userId;

    // 0. Fire background auto-deductions asynchronously without blocking page response
    processAutoDeductions(userId).catch(err => {
      console.warn('Dashboard: auto-deductions background notice:', err.message);
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // 1. Fetch Accounts, Transactions (6-mo single scan), Budget, Loans, Investments, Insurances, Subscriptions, and User in ONE parallel burst
    const [
      rawAccounts,
      trendTransactions,
      budget,
      loans,
      investments,
      insurances,
      subscriptions,
      user
    ] = await Promise.all([
      Account.find({ userId }).sort({ type: 1, name: 1 }),
      Transaction.find({
        userId,
        transactionDate: { $gte: sixMonthsAgoStart, $lt: currentMonthEnd }
      }),
      Budget.findOne({ userId }),
      Loan.find({ userId, status: 'active' }).catch(err => {
        console.warn('Dashboard: loans query notice:', err.message);
        return [];
      }),
      Investment.find({ userId }).catch(err => {
        console.warn('Dashboard: investments query notice:', err.message);
        return [];
      }),
      Insurance.find({ userId, status: 'active' }).catch(err => {
        console.warn('Dashboard: insurances query notice:', err.message);
        return [];
      }),
      Subscription.find({ userId, status: 'active' }).catch(err => {
        console.warn('Dashboard: subscriptions query notice:', err.message);
        return [];
      }),
      User.findById(userId).catch(() => null)
    ]);

    // 2. Ensure default cash & bank accounts exist
    let accounts = Array.isArray(rawAccounts) ? [...rawAccounts] : [];
    let cashAccount = accounts.find(acc => acc.type === 'cash');
    if (!cashAccount) {
      cashAccount = await Account.create({
        userId,
        type: 'cash',
        name: 'Cash',
        balance: 0
      });
      accounts.push(cashAccount);
    }

    let bankAccount = accounts.find(acc => acc.type === 'bank');
    if (!bankAccount) {
      const defaultBank = await Account.create({
        userId,
        type: 'bank',
        name: 'State Bank of India',
        balance: 0
      });
      accounts.push(defaultBank);
    }

    // Build quick in-memory account map for instant zero-overhead population
    const accountMap = new Map();
    accounts.forEach(acc => {
      const idKey = String(acc.id || acc._id);
      accountMap.set(idKey, { name: acc.name, type: acc.type, id: idKey, _id: idKey });
    });

    // In-memory filter for current month transactions & populate accountId in memory
    const currentMonthTime = currentMonthStart.getTime();
    const currentMonthEndTime = currentMonthEnd.getTime();

    const currentMonthTransactions = [];
    const populatedTrendTransactions = [];

    (trendTransactions || []).forEach(tx => {
      const txObj = typeof tx.toObject === 'function' ? tx.toObject() : { ...tx };
      // In-memory account resolution
      if (txObj.accountId && typeof txObj.accountId === 'string') {
        txObj.accountId = accountMap.get(String(txObj.accountId)) || { name: 'Account', type: 'bank' };
      }
      populatedTrendTransactions.push(txObj);

      const txDate = new Date(tx.transactionDate).getTime();
      if (txDate >= currentMonthTime && txDate < currentMonthEndTime) {
        currentMonthTransactions.push(txObj);
      }
    });

    // Recent 5 transactions derived directly from populated transactions
    const recentTransactions = [...populatedTrendTransactions]
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 5);

    const totalBalance = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const cashBalance = accounts.filter(acc => acc.type === 'cash').reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const bankBalance = accounts.filter(acc => acc.type === 'bank').reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

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

    // User Subscription verification (user was fetched in parallel above)
    const subscription = getUserSubscription(user);
    const isPro = !!subscription.isPro;

    // Compute Daily Budget & Today's Outflow
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyLimit = Number(budget?.monthlyBudget || 0);
    const dailyBudget = Number(budget?.dailyBudget) || (monthlyLimit > 0 ? Math.round(monthlyLimit / daysInMonth) : 0);

    let todaySpent = 0;
    let todayRemaining = 0;
    let todaySaved = 0;
    let isOverspentToday = false;

    if (dailyBudget > 0) {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const todayExpenses = (currentMonthTransactions || []).filter(t => {
        const d = new Date(t.transactionDate);
        return t.type === 'expense' && d >= startOfToday && d < endOfToday;
      });
      todaySpent = todayExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      todayRemaining = dailyBudget - todaySpent;
      todaySaved = todaySpent <= dailyBudget ? Math.max(0, dailyBudget - todaySpent) : 0;
      isOverspentToday = todaySpent > dailyBudget;
    }

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
        isDailyBudgetLocked: !isPro,
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