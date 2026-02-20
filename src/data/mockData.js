export const mockAccounts = [
  { id: "acc-1", name: "Checking Account", number: "****4521", balance: 12450.75, type: "checking", color: "#1E40AF" },
  { id: "acc-2", name: "Savings Account", number: "****8832", balance: 56789.00, type: "savings", color: "#1D4ED8" },
  { id: "acc-3", name: "Credit Card", number: "****1192", balance: -3241.50, type: "credit", color: "#2563EB" },
  { id: "acc-4", name: "Investments", number: "****6650", balance: 98100.20, type: "investment", color: "#3B82F6" },
];

export const mockTransactions = [
  { id: "txn-01", customerId: "CID-101", date: "2026-02-20", description: "Salary Deposit - TechCorp", category: "Salary", amount: 5200.00, status: "Completed", type: "credit" },
  { id: "txn-02", customerId: "CID-202", date: "2026-02-19", description: "Amazon.com Purchase", category: "Shopping", amount: -134.99, status: "Completed", type: "debit" },
  { id: "txn-03", customerId: "CID-101", date: "2026-02-18", description: "Transfer to Savings", category: "Transfers", amount: -500.00, status: "Completed", type: "debit" },
  { id: "txn-04", customerId: "CID-303", date: "2026-02-18", description: "Netflix Subscription", category: "Bills", amount: -15.99, status: "Completed", type: "debit" },
  { id: "txn-05", customerId: "CID-101", date: "2026-02-17", description: "ATM Withdrawal", category: "Withdrawals", amount: -200.00, status: "Completed", type: "debit" },
  { id: "txn-06", customerId: "CID-202", date: "2026-02-16", description: "Electricity Bill", category: "Bills", amount: -88.50, status: "Completed", type: "debit" },
  { id: "txn-07", customerId: "CID-404", date: "2026-02-15", description: "Freelance Payment Received", category: "Deposits", amount: 1800.00, status: "Completed", type: "credit" },
  { id: "txn-08", customerId: "CID-303", date: "2026-02-14", description: "Restaurant - The Grand Buffet", category: "Dining", amount: -67.20, status: "Completed", type: "debit" },
  { id: "txn-09", customerId: "CID-101", date: "2026-02-13", description: "Insurance Premium", category: "Bills", amount: -220.00, status: "Pending", type: "debit" },
  { id: "txn-10", customerId: "CID-202", date: "2026-02-13", description: "Dividend Income", category: "Deposits", amount: 312.45, status: "Completed", type: "credit" },
  { id: "txn-11", customerId: "CID-303", date: "2026-02-12", description: "Grocery Store - FreshMart", category: "Shopping", amount: -95.30, status: "Completed", type: "debit" },
  { id: "txn-12", customerId: "CID-101", date: "2026-02-11", description: "Bank Transfer Received", category: "Transfers", amount: 2000.00, status: "Completed", type: "credit" },
  { id: "txn-13", customerId: "CID-404", date: "2026-02-10", description: "Gym Membership", category: "Bills", amount: -49.99, status: "Completed", type: "debit" },
  { id: "txn-14", customerId: "CID-202", date: "2026-02-09", description: "Online Shopping - Flipkart", category: "Shopping", amount: -450.00, status: "Completed", type: "debit" },
  { id: "txn-15", customerId: "CID-101", date: "2026-02-08", description: "Bus Pass Renewal", category: "Bills", amount: -75.00, status: "Completed", type: "debit" },
  { id: "txn-16", customerId: "CID-303", date: "2026-02-07", description: "Bonus Payment", category: "Salary", amount: 3000.00, status: "Completed", type: "credit" },
  { id: "txn-17", customerId: "CID-202", date: "2026-02-06", description: "Mortgage Payment", category: "Bills", amount: -1800.00, status: "Completed", type: "debit" },
  { id: "txn-18", customerId: "CID-101", date: "2026-02-05", description: "Phone Bill", category: "Bills", amount: -55.00, status: "Pending", type: "debit" },
  { id: "txn-19", customerId: "CID-404", date: "2026-02-04", description: "Interest on Savings", category: "Deposits", amount: 25.80, status: "Completed", type: "credit" },
  { id: "txn-20", customerId: "CID-202", date: "2026-02-03", description: "Medical Expense", category: "Withdrawals", amount: -185.00, status: "Completed", type: "debit" },
  { id: "txn-21", customerId: "CID-303", date: "2026-02-02", description: "Fuel Fill-up", category: "Shopping", amount: -60.00, status: "Completed", type: "debit" },
  { id: "txn-22", customerId: "CID-101", date: "2026-02-01", description: "Rent Transfer", category: "Transfers", amount: -1200.00, status: "Completed", type: "debit" },
];

export const transactionCategories = ["Salary", "Deposits", "Withdrawals", "Transfers", "Bills", "Shopping", "Dining"];
