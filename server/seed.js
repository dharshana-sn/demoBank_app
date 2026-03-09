/**
 * server/seed.js
 * Run once with: node server/seed.js
 * Seeds MongoDB with all mockData accounts, transactions, and initial FDs.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Account from './models/Account.js';
import Transaction from './models/Transaction.js';
import FixedDeposit from './models/FixedDeposit.js';
import User from './models/User.js';

const ACCOUNTS = [
    { id: "acc-1", name: "Checking Account", number: "****4521", balance: 12450.75, type: "checking", color: "#1E40AF" },
    { id: "acc-2", name: "Savings Account", number: "****8832", balance: 56789, type: "savings", color: "#1D4ED8" },
    { id: "acc-3", name: "Credit Card", number: "****1192", balance: -3241.5, type: "credit", color: "#2563EB" },
    { id: "acc-4", name: "Investments", number: "****6650", balance: 98100.2, type: "investment", color: "#3B82F6" },
];

const INITIAL_FDS = [
    { id: "fd-1", principal: 50000, rate: 6.5, tenure: "1 Year", startDate: "2025-06-15", maturityDate: "2026-06-15", maturityAmount: 53250, status: "active" },
    { id: "fd-2", principal: 150000, rate: 7.5, tenure: "3 Years", startDate: "2024-02-10", maturityDate: "2027-02-10", maturityAmount: 183750, status: "active" },
    { id: "fd-3", principal: 300000, rate: 7.1, tenure: "5 Years", startDate: "2023-08-01", maturityDate: "2028-08-01", maturityAmount: 406500, status: "active" },
];

const INITIAL_USER = {
    id: "user-1",
    name: "Test User",
    email: "testUser@gmail.com",
    phone: "+1 (555) 012-3456",
    address: "123 Oak Street, New York, NY 10001",
    avatar: "TU",
    memberSince: "2022"
};

// All 100+ transactions from mockData.js
const TRANSACTIONS = [
    { id: "txn-001", customerId: "CID-331", date: "2026-01-19", description: "Transfers Payment #1", category: "Transfers", amount: -661.08, status: "Completed", type: "debit" },
    { id: "txn-002", customerId: "CID-626", date: "2026-01-31", description: "Deposits Payment #2", category: "Deposits", amount: 1568.13, status: "Completed", type: "credit" },
    { id: "txn-003", customerId: "CID-168", date: "2026-01-27", description: "Withdrawals Payment #3", category: "Withdrawals", amount: -142.75, status: "Completed", type: "debit" },
    { id: "txn-004", customerId: "CID-889", date: "2026-02-23", description: "Withdrawals Payment #4", category: "Withdrawals", amount: -382.08, status: "Completed", type: "debit" },
    { id: "txn-005", customerId: "CID-972", date: "2026-01-18", description: "Investments Payment #5", category: "Investments", amount: 1093.10, status: "Completed", type: "credit" },
    { id: "txn-006", customerId: "CID-903", date: "2026-02-25", description: "Dining Payment #6", category: "Dining", amount: -1887.85, status: "Completed", type: "debit" },
    { id: "txn-007", customerId: "CID-806", date: "2026-01-10", description: "Dining Payment #7", category: "Dining", amount: -1866.62, status: "Completed", type: "debit" },
    { id: "txn-008", customerId: "CID-797", date: "2026-02-10", description: "Salary Payment #8", category: "Salary", amount: 1527.55, status: "Completed", type: "credit" },
    { id: "txn-009", customerId: "CID-911", date: "2025-12-31", description: "Dining Payment #9", category: "Dining", amount: -2002.45, status: "Completed", type: "debit" },
    { id: "txn-010", customerId: "CID-461", date: "2026-02-19", description: "Bills Payment #10", category: "Bills", amount: -1819.81, status: "Completed", type: "debit" },
    { id: "txn-011", customerId: "CID-336", date: "2026-01-20", description: "Shopping Payment #11", category: "Shopping", amount: -1760.90, status: "Completed", type: "debit" },
    { id: "txn-012", customerId: "CID-585", date: "2026-02-23", description: "Salary Payment #12", category: "Salary", amount: 651.53, status: "Completed", type: "credit" },
    { id: "txn-013", customerId: "CID-162", date: "2026-01-20", description: "Deposits Payment #13", category: "Deposits", amount: 603.92, status: "Completed", type: "credit" },
    { id: "txn-014", customerId: "CID-706", date: "2026-02-01", description: "Dining Payment #14", category: "Dining", amount: -1920.47, status: "Completed", type: "debit" },
    { id: "txn-015", customerId: "CID-814", date: "2026-01-06", description: "Deposits Payment #15", category: "Deposits", amount: 1284.81, status: "Completed", type: "credit" },
    { id: "txn-016", customerId: "CID-567", date: "2026-02-12", description: "Bills Payment #16", category: "Bills", amount: -1563.09, status: "Completed", type: "debit" },
    { id: "txn-017", customerId: "CID-648", date: "2026-01-26", description: "Salary Payment #17", category: "Salary", amount: 391.32, status: "Completed", type: "credit" },
    { id: "txn-018", customerId: "CID-775", date: "2026-02-04", description: "Bills Payment #18", category: "Bills", amount: -1534.89, status: "Completed", type: "debit" },
    { id: "txn-019", customerId: "CID-860", date: "2026-01-24", description: "Investments Payment #19", category: "Investments", amount: 1539.36, status: "Completed", type: "credit" },
    { id: "txn-020", customerId: "CID-273", date: "2026-02-07", description: "Shopping Payment #20", category: "Shopping", amount: -1174.56, status: "Completed", type: "debit" },
    { id: "txn-021", customerId: "CID-604", date: "2026-01-01", description: "Investments Payment #21", category: "Investments", amount: 1987.04, status: "Completed", type: "credit" },
    { id: "txn-022", customerId: "CID-195", date: "2026-02-20", description: "Bills Payment #22", category: "Bills", amount: -1861.38, status: "Completed", type: "debit" },
    { id: "txn-023", customerId: "CID-297", date: "2026-01-09", description: "Salary Payment #23", category: "Salary", amount: 795.86, status: "Completed", type: "credit" },
    { id: "txn-024", customerId: "CID-325", date: "2026-02-10", description: "Deposits Payment #24", category: "Deposits", amount: 1285.30, status: "Completed", type: "credit" },
    { id: "txn-025", customerId: "CID-707", date: "2026-01-11", description: "Salary Payment #25", category: "Salary", amount: 893.58, status: "Completed", type: "credit" },
    { id: "txn-026", customerId: "CID-863", date: "2026-02-18", description: "Dining Payment #26", category: "Dining", amount: -848.98, status: "Completed", type: "debit" },
    { id: "txn-027", customerId: "CID-411", date: "2026-01-25", description: "Shopping Payment #27", category: "Shopping", amount: -1670.00, status: "Completed", type: "debit" },
    { id: "txn-028", customerId: "CID-121", date: "2026-02-21", description: "Dining Payment #28", category: "Dining", amount: -1148.65, status: "Completed", type: "debit" },
    { id: "txn-029", customerId: "CID-632", date: "2026-01-10", description: "Deposits Payment #29", category: "Deposits", amount: 587.44, status: "Completed", type: "credit" },
    { id: "txn-030", customerId: "CID-306", date: "2026-02-24", description: "Bills Payment #30", category: "Bills", amount: -1274.07, status: "Completed", type: "debit" },
    { id: "txn-031", customerId: "CID-533", date: "2026-01-17", description: "Investments Payment #31", category: "Investments", amount: 1738.75, status: "Completed", type: "credit" },
    { id: "txn-032", customerId: "CID-120", date: "2026-02-19", description: "Bills Payment #32", category: "Bills", amount: -1216.10, status: "Completed", type: "debit" },
    { id: "txn-033", customerId: "CID-579", date: "2026-01-02", description: "Bills Payment #33", category: "Bills", amount: -945.15, status: "Completed", type: "debit" },
    { id: "txn-034", customerId: "CID-487", date: "2026-02-23", description: "Bills Payment #34", category: "Bills", amount: -347.12, status: "Completed", type: "debit" },
    { id: "txn-035", customerId: "CID-419", date: "2026-01-22", description: "Investments Payment #35", category: "Investments", amount: 1183.70, status: "Completed", type: "credit" },
    { id: "txn-036", customerId: "CID-839", date: "2026-02-07", description: "Deposits Payment #36", category: "Deposits", amount: 734.08, status: "Completed", type: "credit" },
    { id: "txn-037", customerId: "CID-283", date: "2026-01-07", description: "Investments Payment #37", category: "Investments", amount: 630.01, status: "Completed", type: "credit" },
    { id: "txn-038", customerId: "CID-921", date: "2026-02-11", description: "Salary Payment #38", category: "Salary", amount: 563.21, status: "Completed", type: "credit" },
    { id: "txn-039", customerId: "CID-147", date: "2026-01-25", description: "Dining Payment #39", category: "Dining", amount: -788.34, status: "Completed", type: "debit" },
    { id: "txn-040", customerId: "CID-647", date: "2026-02-06", description: "Salary Payment #40", category: "Salary", amount: 920.10, status: "Completed", type: "credit" },
    { id: "txn-041", customerId: "CID-965", date: "2026-01-27", description: "Withdrawals Payment #41", category: "Withdrawals", amount: -1192.57, status: "Completed", type: "debit" },
    { id: "txn-042", customerId: "CID-828", date: "2026-02-19", description: "Deposits Payment #42", category: "Deposits", amount: 379.80, status: "Completed", type: "credit" },
    { id: "txn-043", customerId: "CID-444", date: "2026-01-17", description: "Dining Payment #43", category: "Dining", amount: -857.40, status: "Completed", type: "debit" },
    { id: "txn-044", customerId: "CID-319", date: "2026-02-18", description: "Transfers Payment #44", category: "Transfers", amount: -1768.26, status: "Completed", type: "debit" },
    { id: "txn-045", customerId: "CID-742", date: "2026-01-08", description: "Withdrawals Payment #45", category: "Withdrawals", amount: -922.08, status: "Completed", type: "debit" },
    { id: "txn-046", customerId: "CID-802", date: "2026-02-11", description: "Shopping Payment #46", category: "Shopping", amount: -314.70, status: "Completed", type: "debit" },
    { id: "txn-047", customerId: "CID-891", date: "2026-01-15", description: "Shopping Payment #47", category: "Shopping", amount: -505.63, status: "Completed", type: "debit" },
    { id: "txn-048", customerId: "CID-477", date: "2026-02-27", description: "Investments Payment #48", category: "Investments", amount: 1066.14, status: "Completed", type: "credit" },
    { id: "txn-049", customerId: "CID-131", date: "2026-01-06", description: "Deposits Payment #49", category: "Deposits", amount: 403.29, status: "Completed", type: "credit" },
    { id: "txn-050", customerId: "CID-359", date: "2026-02-24", description: "Salary Payment #50", category: "Salary", amount: 1108.35, status: "Completed", type: "credit" },
    { id: "txn-051", customerId: "CID-676", date: "2026-01-23", description: "Shopping Payment #51", category: "Shopping", amount: -1834.44, status: "Completed", type: "debit" },
    { id: "txn-052", customerId: "CID-787", date: "2026-02-19", description: "Withdrawals Payment #52", category: "Withdrawals", amount: -1027.18, status: "Completed", type: "debit" },
    { id: "txn-053", customerId: "CID-736", date: "2026-01-01", description: "Deposits Payment #53", category: "Deposits", amount: 909.68, status: "Completed", type: "credit" },
    { id: "txn-054", customerId: "CID-564", date: "2026-02-10", description: "Withdrawals Payment #54", category: "Withdrawals", amount: -1741.91, status: "Completed", type: "debit" },
    { id: "txn-055", customerId: "CID-137", date: "2026-01-09", description: "Withdrawals Payment #55", category: "Withdrawals", amount: -1876.65, status: "Completed", type: "debit" },
    { id: "txn-056", customerId: "CID-442", date: "2026-02-20", description: "Deposits Payment #56", category: "Deposits", amount: 1122.56, status: "Completed", type: "credit" },
    { id: "txn-057", customerId: "CID-935", date: "2026-01-20", description: "Withdrawals Payment #57", category: "Withdrawals", amount: -1958.81, status: "Completed", type: "debit" },
    { id: "txn-058", customerId: "CID-568", date: "2026-02-15", description: "Shopping Payment #58", category: "Shopping", amount: -740.29, status: "Completed", type: "debit" },
    { id: "txn-059", customerId: "CID-658", date: "2026-01-05", description: "Bills Payment #59", category: "Bills", amount: -367.35, status: "Completed", type: "debit" },
    { id: "txn-060", customerId: "CID-592", date: "2026-02-13", description: "Transfers Payment #60", category: "Transfers", amount: 1286.48, status: "Completed", type: "credit" },
    { id: "txn-061", customerId: "CID-695", date: "2026-01-05", description: "Salary Payment #61", category: "Salary", amount: 1935.69, status: "Completed", type: "credit" },
    { id: "txn-062", customerId: "CID-457", date: "2026-02-21", description: "Investments Payment #62", category: "Investments", amount: 547.10, status: "Completed", type: "credit" },
    { id: "txn-063", customerId: "CID-804", date: "2026-01-23", description: "Transfers Payment #63", category: "Transfers", amount: 464.82, status: "Completed", type: "credit" },
    { id: "txn-064", customerId: "CID-861", date: "2026-01-31", description: "Bills Payment #64", category: "Bills", amount: -448.13, status: "Completed", type: "debit" },
    { id: "txn-065", customerId: "CID-387", date: "2026-01-26", description: "Shopping Payment #65", category: "Shopping", amount: -920.18, status: "Completed", type: "debit" },
    { id: "txn-066", customerId: "CID-957", date: "2026-02-23", description: "Deposits Payment #66", category: "Deposits", amount: 1859.44, status: "Completed", type: "credit" },
    { id: "txn-067", customerId: "CID-737", date: "2026-01-18", description: "Investments Payment #67", category: "Investments", amount: 93.96, status: "Completed", type: "credit" },
    { id: "txn-068", customerId: "CID-515", date: "2026-02-13", description: "Deposits Payment #68", category: "Deposits", amount: 1055.66, status: "Completed", type: "credit" },
    { id: "txn-069", customerId: "CID-628", date: "2026-01-26", description: "Withdrawals Payment #69", category: "Withdrawals", amount: -478.08, status: "Completed", type: "debit" },
    { id: "txn-070", customerId: "CID-668", date: "2026-02-01", description: "Deposits Payment #70", category: "Deposits", amount: 1510.66, status: "Completed", type: "credit" },
    { id: "txn-071", customerId: "CID-310", date: "2026-01-23", description: "Deposits Payment #71", category: "Deposits", amount: 902.20, status: "Completed", type: "credit" },
    { id: "txn-072", customerId: "CID-274", date: "2026-02-04", description: "Withdrawals Payment #72", category: "Withdrawals", amount: -1525.55, status: "Completed", type: "debit" },
    { id: "txn-073", customerId: "CID-441", date: "2026-01-15", description: "Dining Payment #73", category: "Dining", amount: -1800.00, status: "Completed", type: "debit" },
    { id: "txn-074", customerId: "CID-759", date: "2026-02-02", description: "Withdrawals Payment #74", category: "Withdrawals", amount: -649.29, status: "Completed", type: "debit" },
    { id: "txn-075", customerId: "CID-646", date: "2025-12-31", description: "Investments Payment #75", category: "Investments", amount: 1216.43, status: "Completed", type: "credit" },
    { id: "txn-076", customerId: "CID-955", date: "2026-02-07", description: "Bills Payment #76", category: "Bills", amount: -480.98, status: "Completed", type: "debit" },
    { id: "txn-077", customerId: "CID-183", date: "2026-01-06", description: "Salary Payment #77", category: "Salary", amount: 1048.32, status: "Completed", type: "credit" },
    { id: "txn-078", customerId: "CID-245", date: "2026-02-14", description: "Shopping Payment #78", category: "Shopping", amount: -622.50, status: "Completed", type: "debit" },
    { id: "txn-079", customerId: "CID-378", date: "2026-01-29", description: "Dining Payment #79", category: "Dining", amount: -1345.20, status: "Completed", type: "debit" },
    { id: "txn-080", customerId: "CID-512", date: "2026-02-08", description: "Salary Payment #80", category: "Salary", amount: 2100.00, status: "Completed", type: "credit" },
    { id: "txn-081", customerId: "CID-614", date: "2026-01-13", description: "Bills Payment #81", category: "Bills", amount: -890.75, status: "Completed", type: "debit" },
    { id: "txn-082", customerId: "CID-723", date: "2026-02-16", description: "Deposits Payment #82", category: "Deposits", amount: 1450.00, status: "Completed", type: "credit" },
    { id: "txn-083", customerId: "CID-834", date: "2026-01-28", description: "Transfers Payment #83", category: "Transfers", amount: -560.00, status: "Completed", type: "debit" },
    { id: "txn-084", customerId: "CID-945", date: "2026-02-03", description: "Investments Payment #84", category: "Investments", amount: 780.50, status: "Completed", type: "credit" },
    { id: "txn-085", customerId: "CID-156", date: "2026-01-14", description: "Shopping Payment #85", category: "Shopping", amount: -430.25, status: "Completed", type: "debit" },
    { id: "txn-086", customerId: "CID-267", date: "2026-02-22", description: "Dining Payment #86", category: "Dining", amount: -670.80, status: "Completed", type: "debit" },
    { id: "txn-087", customerId: "CID-389", date: "2026-01-03", description: "Salary Payment #87", category: "Salary", amount: 1875.00, status: "Completed", type: "credit" },
    { id: "txn-088", customerId: "CID-492", date: "2026-02-09", description: "Bills Payment #88", category: "Bills", amount: -320.60, status: "Completed", type: "debit" },
    { id: "txn-089", customerId: "CID-573", date: "2026-01-21", description: "Withdrawals Payment #89", category: "Withdrawals", amount: -945.00, status: "Completed", type: "debit" },
    { id: "txn-090", customerId: "CID-681", date: "2026-02-17", description: "Deposits Payment #90", category: "Deposits", amount: 2250.00, status: "Completed", type: "credit" },
    { id: "txn-091", customerId: "CID-792", date: "2026-01-16", description: "Investments Payment #91", category: "Investments", amount: 1680.00, status: "Completed", type: "credit" },
    { id: "txn-092", customerId: "CID-814", date: "2026-02-26", description: "Shopping Payment #92", category: "Shopping", amount: -875.30, status: "Completed", type: "debit" },
    { id: "txn-093", customerId: "CID-923", date: "2026-01-04", description: "Dining Payment #93", category: "Dining", amount: -510.45, status: "Completed", type: "debit" },
    { id: "txn-094", customerId: "CID-134", date: "2026-02-05", description: "Salary Payment #94", category: "Salary", amount: 3200.00, status: "Completed", type: "credit" },
    { id: "txn-095", customerId: "CID-245", date: "2026-01-30", description: "Bills Payment #95", category: "Bills", amount: -1120.75, status: "Completed", type: "debit" },
    { id: "txn-096", customerId: "CID-356", date: "2026-02-28", description: "Transfers Payment #96", category: "Transfers", amount: -750.00, status: "Completed", type: "debit" },
    { id: "txn-097", customerId: "CID-467", date: "2026-01-08", description: "Deposits Payment #97", category: "Deposits", amount: 640.00, status: "Completed", type: "credit" },
    { id: "txn-098", customerId: "CID-578", date: "2026-02-01", description: "Investments Payment #98", category: "Investments", amount: 1320.75, status: "Completed", type: "credit" },
    { id: "txn-099", customerId: "CID-689", date: "2026-01-19", description: "Shopping Payment #99", category: "Shopping", amount: -285.50, status: "Completed", type: "debit" },
    { id: "txn-100", customerId: "CID-790", date: "2026-02-25", description: "Salary Payment #100", category: "Salary", amount: 4500.00, status: "Completed", type: "credit" },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        // Clear existing data
        await Account.deleteMany({});
        await Transaction.deleteMany({});
        await FixedDeposit.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing collections');

        // Insert fresh seed data
        await Account.insertMany(ACCOUNTS);
        console.log(`Seeded ${ACCOUNTS.length} accounts`);

        await Transaction.insertMany(TRANSACTIONS);
        console.log(`Seeded ${TRANSACTIONS.length} transactions`);

        await FixedDeposit.insertMany(INITIAL_FDS);
        console.log(`Seeded ${INITIAL_FDS.length} fixed deposits`);

        await User.create(INITIAL_USER);
        console.log('Seeded initial user profile');

        console.log('Seed complete!');
    } catch (err) {
        console.error('Seed error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
