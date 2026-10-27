import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';

// Get all accounts (initializes defaults if they don't exist)
export const getAccounts = async (req, res) => {
  try {
    const userId = req.userId;

    // Check if Cash account exists
    let cashAccount = await Account.findOne({ userId, type: 'cash' });
    if (!cashAccount) {
      cashAccount = await Account.create({
        userId,
        type: 'cash',
        name: 'Cash',
        balance: 0
      });
    }

    // Check if any bank account exists. If not, create a default "State Bank of India" bank account
    let bankAccounts = await Account.find({ userId, type: 'bank' });
    if (bankAccounts.length === 0) {
      const defaultBank = await Account.create({
        userId,
        type: 'bank',
        name: 'State Bank of India',
        balance: 0
      });
      bankAccounts = [defaultBank];
    }

    // Re-fetch all accounts to be sorted and structured
    const allAccounts = await Account.find({ userId }).sort({ type: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: allAccounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add a new Bank Account
export const addBankAccount = async (req, res) => {
  try {
    const { name, balance } = req.body;
    const userId = req.userId;

    // Check tier limits for Basic users (Max 1 bank account)
    const user = await User.findById(userId);
    const subscription = getUserSubscription(user);
    if (!subscription.isPro) {
      const currentBankAccounts = await Account.find({ userId, type: 'bank' });
      if (currentBankAccounts.length >= 1) {
        return res.status(403).json({
          success: false,
          code: 'LIMIT_REACHED',
          message: 'Basic tier allows 1 bank account. Please upgrade to Pro for unlimited bank accounts.',
          limit: 1,
          currentCount: currentBankAccounts.length
        });
      }
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a bank name'
      });
    }

    const trimmedName = name.trim();

    // Check if a bank account with same name already exists for this user
    const existing = await Account.findOne({ userId, type: 'bank', name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A bank account with this name already exists'
      });
    }

    const newAccount = await Account.create({
      userId,
      type: 'bank',
      name: trimmedName,
      balance: Number(balance) || 0
    });

    res.status(201).json({
      success: true,
      message: 'Bank account added successfully',
      data: newAccount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update account (balance/name)
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, balance } = req.body;
    const userId = req.userId;

    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Cash account name cannot be updated
    if (account.type === 'cash' && name !== undefined && name !== 'Cash') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change the name of the Cash account'
      });
    }

    if (name !== undefined) {
      account.name = name.trim();
    }
    if (balance !== undefined) {
      account.balance = Number(balance);
    }

    await account.save();

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a bank account
export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    if (account.type === 'cash') {
      return res.status(400).json({
        success: false,
        message: 'Cash account cannot be deleted'
      });
    }

    // Cascade delete: delete the bank account and all transactions linked to it
    await Account.deleteOne({ _id: id });
    await Transaction.deleteMany({ userId, accountId: id });

    res.status(200).json({
      success: true,
      message: 'Bank account and all its associated transactions deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
