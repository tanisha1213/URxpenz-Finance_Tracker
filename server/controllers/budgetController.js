import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';

export const setBudget = async (req, res) => {
  try {
    const { monthlyBudget, dailyBudget, categoryBudgets } = req.body;

    if (monthlyBudget === undefined || monthlyBudget === null || monthlyBudget === '' || Number(monthlyBudget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid monthly budget'
      });
    }

    const user = await User.findById(req.userId);
    const subscription = getUserSubscription(user);
    const isPro = !!subscription.isPro;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const computedDailyBudget = isPro
      ? (dailyBudget !== undefined && dailyBudget !== null && dailyBudget !== ''
          ? Number(dailyBudget)
          : Math.round(Number(monthlyBudget) / daysInMonth))
      : 0;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId },
      {
        monthlyBudget: Number(monthlyBudget),
        dailyBudget: computedDailyBudget,
        categoryBudgets: categoryBudgets || [],
        updatedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBudget = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const subscription = getUserSubscription(user);
    const isPro = !!subscription.isPro;

    const budget = await Budget.findOne({ userId: req.userId });

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyLimit = Number(budget?.monthlyBudget || 0);
    const dailyTarget = isPro
      ? (Number(budget?.dailyBudget) || (monthlyLimit > 0 ? Math.round(monthlyLimit / daysInMonth) : 0))
      : 0;

    let todaySpent = 0;
    let todayRemaining = 0;
    let todaySaved = 0;
    let isOverspentToday = false;

    if (isPro && dailyTarget > 0) {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const todayExpenses = await Transaction.find({
        userId: req.userId,
        type: 'expense',
        transactionDate: { $gte: startOfToday, $lt: endOfToday }
      }).catch(() => []);

      todaySpent = todayExpenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      todayRemaining = dailyTarget - todaySpent;
      isOverspentToday = todaySpent > dailyTarget;
      todaySaved = todaySpent <= dailyTarget ? Math.max(0, dailyTarget - todaySpent) : 0;
    }

    res.status(200).json({
      success: true,
      data: {
        ...(budget ? (budget._doc || budget) : {}),
        monthlyBudget: monthlyLimit,
        categoryBudgets: budget?.categoryBudgets || [],
        dailyBudget: isPro ? dailyTarget : 0,
        todaySpent,
        todayRemaining,
        todaySaved,
        isOverspentToday,
        daysInMonth,
        isDailyBudgetLocked: !isPro
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { monthlyBudget, categoryBudgets } = req.body;

    if (monthlyBudget === undefined || monthlyBudget === null || monthlyBudget === '' || Number(monthlyBudget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid monthly budget'
      });
    }

    const user = await User.findById(req.userId);
    const subscription = getUserSubscription(user);
    const isPro = !!subscription.isPro;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const computedDailyBudget = isPro
      ? (req.body.dailyBudget !== undefined && req.body.dailyBudget !== null && req.body.dailyBudget !== ''
          ? Number(req.body.dailyBudget)
          : Math.round(Number(monthlyBudget) / daysInMonth))
      : 0;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId },
      {
        monthlyBudget: Number(monthlyBudget),
        dailyBudget: computedDailyBudget,
        categoryBudgets,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};