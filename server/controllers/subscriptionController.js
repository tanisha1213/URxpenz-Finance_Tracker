import Subscription from '../models/Subscription.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';

// Auto-process pending subscriptions where billing date is due and autoDeduct is enabled
export const processAutoDeductions = async (userId) => {
  try {
    const subscriptions = await Subscription.find({ userId, status: 'active' }).catch(err => {
      console.warn('processAutoDeductions: subscriptions query notice:', err.message);
      return [];
    });
    if (!subscriptions || subscriptions.length === 0) return [];

    const now = new Date();
    const processed = [];

    for (const sub of subscriptions) {
      if (!sub.autoDeduct) continue;
      
      const nextDueDate = new Date(sub.nextBillingDate);
      if (isNaN(nextDueDate.getTime())) continue;

      // Check if due date has arrived
      if (nextDueDate <= now) {
        // Prevent duplicate deductions on the same date
        if (sub.lastDeductedDate) {
          const lastDeducted = new Date(sub.lastDeductedDate);
          if (
            lastDeducted.getFullYear() === now.getFullYear() &&
            lastDeducted.getMonth() === now.getMonth() &&
            lastDeducted.getDate() === now.getDate()
          ) {
            continue;
          }
        }

        // Find or fallback payment account
        let accountId = sub.accountId;
        if (typeof accountId === 'object') accountId = accountId._id || accountId.id;

        let account = accountId ? await Account.findById(accountId) : null;
        if (!account) {
          account = await Account.findOne({ userId, type: 'bank' });
        }
        if (!account) {
          account = await Account.findOne({ userId, type: 'cash' });
        }

        const amount = Number(sub.amount) || 0;
        if (amount > 0 && account) {
          // 1. Deduct balance from account
          const currentBal = Number(account.balance) || 0;
          account.balance = currentBal - amount;
          await account.save();

          // 2. Create expense transaction record
          const transaction = await Transaction.create({
            userId,
            type: 'expense',
            title: `${sub.title} (Auto-Deduct)`,
            amount,
            category: sub.category || 'Subscriptions',
            paymentMethod: account.type === 'cash' ? 'cash' : 'bank_transfer',
            accountId: account._id,
            description: `Monthly auto-debit subscription payment for ${sub.title}`,
            transactionDate: now
          });

          // 3. Automatically advance next billing date to same day of next month
          const newNextDate = new Date(nextDueDate);
          newNextDate.setMonth(newNextDate.getMonth() + 1);

          sub.lastDeductedDate = now;
          sub.nextBillingDate = newNextDate;
          await sub.save();

          processed.push({
            id: sub._id,
            title: sub.title,
            amount,
            accountName: account.name,
            transactionId: transaction._id
          });
        }
      }
    }

    return processed;
  } catch (err) {
    console.warn('processAutoDeductions background task notice:', err.message);
    return [];
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    // Run auto deductions check on fetch safely
    await processAutoDeductions(req.userId).catch(err => {
      console.warn('getSubscriptions: auto deductions notice:', err.message);
    });

    const subscriptions = await Subscription.find({ userId: req.userId })
      .populate('accountId', 'name type balance')
      .sort({ nextBillingDate: 1 })
      .catch(err => {
        console.warn('Subscriptions table query failed, returning empty array. Error:', err.message);
        return [];
      });

    const activeSubs = (subscriptions || []).filter(s => s.status === 'active');
    
    // Calculate monthly commitment total
    const totalMonthlyCommitment = activeSubs.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0);
    const totalYearlyCommitment = totalMonthlyCommitment * 12;

    res.status(200).json({
      success: true,
      data: {
        subscriptions: subscriptions || [],
        stats: {
          totalCount: (subscriptions || []).length,
          activeCount: activeSubs.length,
          totalMonthlyCommitment: Math.round(totalMonthlyCommitment),
          totalYearlyCommitment: Math.round(totalYearlyCommitment)
        }
      }
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        subscriptions: [],
        stats: {
          totalCount: 0,
          activeCount: 0,
          totalMonthlyCommitment: 0,
          totalYearlyCommitment: 0
        }
      }
    });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { title, category, planType, amount, startDate, accountId, autoDeduct, description } = req.body;

    // Check tier limits for Basic users (Max 2 active subscriptions)
    const user = await User.findById(req.userId);
    const subscriptionInfo = getUserSubscription(user);
    if (!subscriptionInfo.isPro) {
      const currentSubs = await Subscription.find({ userId: req.userId, status: 'active' });
      if (currentSubs.length >= 2) {
        return res.status(403).json({
          success: false,
          code: 'LIMIT_REACHED',
          message: 'Basic tier allows up to 2 active subscriptions. Please upgrade to Pro for unlimited subscriptions.',
          limit: 2,
          currentCount: currentSubs.length
        });
      }
    }

    if (!title?.trim() || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid subscription title and monthly amount greater than zero'
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let nextDate = new Date(start);
    if (isNaN(nextDate.getTime())) nextDate = new Date();

    let finalAccountId = accountId;
    if (typeof finalAccountId === 'object') finalAccountId = finalAccountId._id || finalAccountId.id;

    if (!finalAccountId) {
      const defaultBank = await Account.findOne({ userId: req.userId, type: 'bank' });
      const defaultCash = await Account.findOne({ userId: req.userId, type: 'cash' });
      finalAccountId = defaultBank?._id || defaultCash?._id || defaultBank?.id || defaultCash?.id;
    }

    const subscription = await Subscription.create({
      userId: req.userId,
      title: title.trim(),
      category: category?.trim() || 'Subscriptions',
      billingCycle: planType || 'monthly',
      amount: Number(amount),
      startDate: start,
      nextBillingDate: nextDate,
      accountId: finalAccountId,
      autoDeduct: autoDeduct !== false,
      status: 'active',
      description: description?.trim()
    });

    const populated = await Subscription.findById(subscription._id).populate('accountId', 'name type balance');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: populated
    });
  } catch (error) {
    let msg = error.message || 'Failed to create subscription';
    if (msg.includes('row-level security') || msg.includes('42501') || msg.includes('policy')) {
      msg = 'Supabase Row-Level Security (RLS) is blocking inserts on "subscriptions". Please run: ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY; in Supabase SQL Editor.';
    } else if (msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('42P01')) {
      msg = 'Database table "subscriptions" does not exist in your Supabase project yet. Please open Supabase SQL Editor and run server/schema_subscriptions.sql once to enable subscriptions.';
    }
    res.status(400).json({
      success: false,
      message: msg
    });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, billingCycle, amount, nextBillingDate, accountId, autoDeduct, status, description } = req.body;

    const subscription = await Subscription.findOne({ _id: id, userId: req.userId });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (title !== undefined) subscription.title = title.trim();
    if (category !== undefined) subscription.category = category.trim();
    if (billingCycle !== undefined) subscription.billingCycle = billingCycle;
    if (amount !== undefined) subscription.amount = Number(amount);
    if (nextBillingDate !== undefined) subscription.nextBillingDate = new Date(nextBillingDate);
    if (accountId !== undefined) subscription.accountId = accountId;
    if (autoDeduct !== undefined) subscription.autoDeduct = !!autoDeduct;
    if (status !== undefined) subscription.status = status;
    if (description !== undefined) subscription.description = description?.trim();

    await subscription.save();

    const populated = await Subscription.findById(subscription._id).populate('accountId', 'name type balance');

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const triggerDeductionNow = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOne({ _id: id, userId: req.userId });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    let accountId = subscription.accountId;
    if (typeof accountId === 'object') accountId = accountId._id || accountId.id;

    let account = accountId ? await Account.findById(accountId) : null;
    if (!account) account = await Account.findOne({ userId: req.userId, type: 'bank' });
    if (!account) account = await Account.findOne({ userId: req.userId, type: 'cash' });

    const amount = Number(subscription.amount) || 0;
    if (!account || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Unable to process payment. Please verify account balance or amount.'
      });
    }

    // Deduct balance
    const currentBal = Number(account.balance) || 0;
    account.balance = currentBal - amount;
    await account.save();

    // Create transaction record
    const now = new Date();
    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'expense',
      title: `${subscription.title} (Payment)`,
      amount,
      category: subscription.category || 'Subscriptions',
      paymentMethod: account.type === 'cash' ? 'cash' : 'bank_transfer',
      accountId: account._id,
      description: `Manual subscription payment for ${subscription.title}`,
      transactionDate: now
    });

    // Advance next billing date
    const nextDueDate = new Date(subscription.nextBillingDate || now);
    if (subscription.billingCycle === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    else if (subscription.billingCycle === 'quarterly') nextDueDate.setMonth(nextDueDate.getMonth() + 3);
    else nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    subscription.lastDeductedDate = now;
    subscription.nextBillingDate = nextDueDate;
    await subscription.save();

    const populated = await Subscription.findById(subscription._id).populate('accountId', 'name type balance');

    res.status(200).json({
      success: true,
      message: `Successfully paid ₹${amount} for ${subscription.title}`,
      data: {
        subscription: populated,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findOne({ _id: id, userId: req.userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await Subscription.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
