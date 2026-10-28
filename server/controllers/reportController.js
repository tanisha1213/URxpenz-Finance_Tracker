import PDFDocument from 'pdfkit';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';

const formatCurrency = (value) => `INR ${Math.round(value || 0).toLocaleString('en-IN')}`;

const safeFormatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short' });
  } catch (err) {
    return '-';
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    const isWeekly = req.query.type === 'weekly';
    const isYearly = req.query.type === 'yearly';
    // Only flag as custom if explicitly requested with valid date strings and not weekly/yearly/monthly
    const isCustom = !isWeekly && !isYearly && !!(req.query.startDate && req.query.endDate && req.query.startDate !== 'undefined' && req.query.endDate !== 'undefined');

    // PDF export, custom date range reports, and yearly reports require Pro subscription
    // Monthly reports and weekly reports are 100% available for all users including Basic/Free tier
    if (req.query.format === 'pdf' || isCustom || isYearly) {
      const user = await User.findById(req.userId);
      const subscription = getUserSubscription(user);
      if (!subscription.isPro) {
        if (req.query.format === 'pdf') {
          return res.status(403).json({
            success: false,
            code: 'PRO_REQUIRED',
            message: 'PDF Statement & Report export requires an active Pro subscription. Please upgrade to Pro.'
          });
        }
        if (isCustom || isYearly) {
          return res.status(403).json({
            success: false,
            code: 'PRO_REQUIRED',
            message: 'Report generation with custom date ranges or yearly view requires an active Pro subscription or trial. Basic tier includes monthly and weekly reports.'
          });
        }
      }
    }

    const now = new Date();
    let start, end, periodStr;

    if (isCustom) {
      start = new Date(req.query.startDate);
      const tempEnd = new Date(req.query.endDate);
      if (isNaN(start.getTime()) || isNaN(tempEnd.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate or endDate parameters'
        });
      }
      end = new Date(tempEnd.getFullYear(), tempEnd.getMonth(), tempEnd.getDate() + 1);
      periodStr = `${safeFormatDate(start)} to ${safeFormatDate(tempEnd)}`;
    } else if (req.query.type === 'yearly') {
      const year = Number(req.query.year) || now.getFullYear();
      start = new Date(year, 0, 1);
      end = new Date(year + 1, 0, 1);
      periodStr = `${year} (Yearly)`;
    } else if (req.query.type === 'weekly') {
      const weekOffset = Number(req.query.weekOffset) || 0;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
      const day = targetDate.getDay();
      const diffToMonday = targetDate.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(targetDate.getFullYear(), targetDate.getMonth(), diffToMonday);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      const weekLabel = weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Weeks Ago`;
      periodStr = `${weekLabel} (${safeFormatDate(start)} to ${safeFormatDate(new Date(end.getTime() - 1))})`;
    } else {
      const year = Number(req.query.year) || now.getFullYear();
      const month = Number(req.query.month) || now.getMonth() + 1;
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 1);
      periodStr = `${year}-${String(month).padStart(2, '0')}`;
    }

    const transactions = await Transaction.find({
      userId: req.userId,
      transactionDate: { $gte: start, $lt: end }
    })
    .populate('accountId', 'name type')
    .populate('toAccountId', 'name type')
    .sort({ transactionDate: -1 });

    const budget = await Budget.findOne({ userId: req.userId });
    const summary = summarizeTransactions(transactions, budget);

    const report = {
      period: periodStr,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      savings: summary.savings,
      budgetRemaining: summary.budgetRemaining,
      categoryBreakdown: summary.categoryBreakdown,
      fullCategoryBreakdown: summary.fullCategoryBreakdown,
      monthlyTrend: summary.monthlyTrend,
      transactions
    };

    if (req.query.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=finance-report-${report.period.replace(/\s+/g, '')}.pdf`);

      const doc = new PDFDocument({ margin: 48 });
      doc.pipe(res);

      // 1. App Header Block
      doc.fillColor('#4f46e5').fontSize(24).font('Helvetica-Bold').text('Xpenz', 48, 48);
      doc.fillColor('#475569').fontSize(10).font('Helvetica').text('Personal Finance Tracker Statement', 48, 76);
      
      // Period Right-Aligned
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(`Statement Period: ${report.period}`, 350, 48, { align: 'right', width: 212 });
      
      // Decorative horizontal divider line
      doc.moveDown(0.5);
      doc.strokeColor('#e2e8f0').lineWidth(1.5).moveTo(48, 96).lineTo(562, 96).stroke();

      // Report Header Title
      doc.y = 115;
      doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text(isYearly ? 'Yearly Financial Report' : 'Monthly Financial Report', 48, doc.y);
      doc.moveDown(1.2);

      // 2. Summary Statistics Grid Cards
      const startY = doc.y;
      const cardW = 118;
      const cardH = 55;
      const gap = 12;

      // Card 1: Total Income
      doc.rect(48, startY, cardW, cardH).fill('#ecfdf5');
      doc.fillColor('#065f46').fontSize(9).font('Helvetica-Bold').text('TOTAL INCOME', 58, startY + 12);
      doc.fillColor('#047857').fontSize(12).font('Helvetica-Bold').text(formatCurrency(report.totalIncome), 58, startY + 28);

      // Card 2: Total Expense
      doc.rect(48 + cardW + gap, startY, cardW, cardH).fill('#fef2f2');
      doc.fillColor('#991b1b').fontSize(9).font('Helvetica-Bold').text('TOTAL EXPENSE', 48 + cardW + gap + 10, startY + 12);
      doc.fillColor('#b91c1c').fontSize(12).font('Helvetica-Bold').text(formatCurrency(report.totalExpense), 48 + cardW + gap + 10, startY + 28);

      // Card 3: Net Savings
      doc.rect(48 + (cardW + gap) * 2, startY, cardW, cardH).fill('#eff6ff');
      doc.fillColor('#1e40af').fontSize(9).font('Helvetica-Bold').text('NET SAVINGS', 48 + (cardW + gap) * 2 + 10, startY + 12);
      doc.fillColor('#1d4ed8').fontSize(12).font('Helvetica-Bold').text(formatCurrency(report.savings), 48 + (cardW + gap) * 2 + 10, startY + 28);

      // Card 4: Budget Left
      doc.rect(48 + (cardW + gap) * 3, startY, cardW, cardH).fill('#f5f3ff');
      doc.fillColor('#5b21b6').fontSize(9).font('Helvetica-Bold').text('BUDGET LEFT', 48 + (cardW + gap) * 3 + 10, startY + 12);
      doc.fillColor('#6d28d9').fontSize(12).font('Helvetica-Bold').text(formatCurrency(report.budgetRemaining), 48 + (cardW + gap) * 3 + 10, startY + 28);

      // Reset coordinates and colors after drawing cards
      doc.y = startY + cardH + 25;
      doc.x = 48;

      // 3. Tabular Report Section: Categorical Breakdown
      doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold').text('Categorical Breakdown Statement', 48, doc.y);
      doc.moveDown(0.5);

      // Draw table header
      const tableTop = doc.y;
      doc.rect(48, tableTop, 514, 20).fill('#f8fafc');
      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('Category', 58, tableTop + 5);
      doc.text('Type', 280, tableTop + 5);
      doc.text('Total Amount', 450, tableTop + 5, { align: 'right', width: 100 });
      doc.y = tableTop + 20;

      // Draw rows
      if (report.fullCategoryBreakdown && report.fullCategoryBreakdown.length > 0) {
        report.fullCategoryBreakdown.forEach((item) => {
          doc.strokeColor('#f1f5f9').lineWidth(1).moveTo(48, doc.y).lineTo(562, doc.y).stroke();
          doc.moveDown(0.3);
          
          const rowY = doc.y;
          doc.fillColor('#1e293b').fontSize(9.5).font('Helvetica-Bold').text(item.category, 58, rowY);
          
          const typeColor = item.type === 'income' ? '#059669' : '#b91c1c';
          doc.fillColor(typeColor).font('Helvetica').text(item.type === 'income' ? 'Income' : 'Expense', 280, rowY);
          
          const amountColor = item.type === 'income' ? '#059669' : '#b91c1c';
          doc.fillColor(amountColor).font('Helvetica-Bold').text(formatCurrency(item.amount), 450, rowY, { align: 'right', width: 100 });
          
          doc.y = rowY + 16;
        });
      } else {
        doc.fillColor('#94a3b8').fontSize(9.5).font('Helvetica').text('No transaction logs recorded in this period.', 58, doc.y + 5);
        doc.y += 20;
      }

      // Draw final balance summary at the bottom of the table
      doc.strokeColor('#cbd5e1').lineWidth(1.5).moveTo(48, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.4);
      const balanceY = doc.y;
      doc.fillColor('#1e293b').fontSize(10.5).font('Helvetica-Bold').text('FINAL NET BALANCE', 58, balanceY);
      const balanceColor = report.savings >= 0 ? '#059669' : '#dc2626';
      doc.fillColor(balanceColor).text(formatCurrency(report.savings), 450, balanceY, { align: 'right', width: 100 });
      
      doc.y = balanceY + 25;

      // 4. Detailed Ledger Section
      doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('Detailed Ledger Statement', 48, doc.y);
      doc.moveDown(0.5);
      
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(48, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.6);

      if (report.transactions && report.transactions.length > 0) {
        report.transactions.slice(0, 150).forEach((item) => {
          if (doc.y > 720) {
            doc.addPage();
          }
          
          const dateStr = safeFormatDate(item.transactionDate);
          const typeStr = item.type === 'income' ? 'Income' : item.type === 'expense' ? 'Expense' : 'Transfer';
          
          let accountInfo = item.accountId?.name || 'Cash';
          if (item.type === 'transfer') {
            accountInfo = `${item.accountId?.name || 'Cash'} -> ${item.toAccountId?.name || 'Cash'}`;
          }

          const txDesc = `${dateStr}  |  ${item.title || 'Untitled'}  [${typeStr} - ${accountInfo}]`;
          const txAmount = formatCurrency(item.amount);

          const rowY = doc.y;
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(txDesc, 48, rowY, { width: 380 });
          
          const amountColor = item.type === 'income' ? '#059669' : item.type === 'expense' ? '#dc2626' : '#475569';
          doc.fillColor(amountColor).font('Helvetica-Bold').text(txAmount, 430, rowY, { align: 'right', width: 132 });
          
          doc.y = rowY + 16;
        });
      } else {
        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('No transaction logs recorded in this period.');
      }

      doc.end();
      return;
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};