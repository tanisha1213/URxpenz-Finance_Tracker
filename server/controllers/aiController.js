import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Investment from '../models/Investment.js';
import Insurance from '../models/Insurance.js';
import Loan from '../models/Loan.js';
import Account from '../models/Account.js';
import User from '../models/User.js';
import { generateAIInsights, predictExpense } from '../services/aiService.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';

export const generateInsights = async (req, res) => {
  try {
    const userId = req.userId;

    // Check Pro subscription
    const user = await User.findById(userId);
    const subscription = getUserSubscription(user);
    if (!subscription.isPro) {
      return res.status(403).json({
        success: false,
        code: 'PRO_REQUIRED',
        message: 'AI Financial Insights & Advice require an active Pro subscription.'
      });
    }

    const [transactions, budget] = await Promise.all([
      Transaction.find({ userId }).catch(() => []),
      Budget.findOne({ userId }).catch(() => null)
    ]);

    const result = await generateAIInsights({
      transactions: transactions || [],
      budget: budget || null
    });

    res.status(200).json({
      success: true,
      data: result,
      insights: result.insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate insights'
    });
  }
};

export const predictSpending = async (req, res) => {
  try {
    const userId = req.userId;

    // Check Pro subscription
    const user = await User.findById(userId);
    const subscription = getUserSubscription(user);
    if (!subscription.isPro) {
      return res.status(403).json({
        success: false,
        code: 'PRO_REQUIRED',
        message: 'AI Forecasts, Cashflow Burn Runway, and Alternatives require an active Pro subscription.'
      });
    }

    const [transactions, budget, investments, insurances, loans, accounts] = await Promise.all([
      Transaction.find({ userId }).catch(() => []),
      Budget.findOne({ userId }).catch(() => null),
      Investment.find({ userId }).catch(() => []),
      Insurance.find({ userId }).catch(() => []),
      Loan.find({ userId }).catch(() => []),
      Account.find({ userId }).catch(() => [])
    ]);

    const prediction = await predictExpense({
      transactions: transactions || [],
      budget: budget || null,
      investments: investments || [],
      insurances: insurances || [],
      loans: loans || [],
      accounts: accounts || []
    });

    res.status(200).json({
      success: true,
      data: prediction,
      prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to predict spending'
    });
  }
};