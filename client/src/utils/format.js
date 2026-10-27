export const formatCurrency = (value = 0) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const categories = [
  'Salary',
  'Freelance',
  'Food',
  'Clothes',
  'Rent',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Education',
  'Investments',
  'Grocery',
  'Home Appliance',
  'EMI',
  'Insurance',
  'Municipal Tax and Other',
  'Income Tax and Other',
  'Electricity',
  'Telephone (Wifi, Recharge)',
  'Other'
]

export const paymentMethods = ['cash', 'card', 'bank_transfer', 'upi', 'wallet', 'other']
