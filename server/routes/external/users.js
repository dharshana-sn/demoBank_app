/**
 * server/routes/external/users.js
 * External API — User data endpoints for third-party consumers.
 * Passwords are NEVER returned. Only safe public fields are exposed.
 *
 * GET /external/api/users                     — List all users
 * GET /external/api/users/:id                 — Single user profile
 * GET /external/api/users/:id/summary         — Full financial summary
 * GET /external/api/users/:id/accounts        — Bank accounts (excl. credit)
 * GET /external/api/users/:id/credit-cards    — Credit card details
 * GET /external/api/users/:id/fixed-deposits  — Fixed deposit details
 * GET /external/api/users/:id/transactions    — Transaction history
 */

import express from 'express';
import User from '../../models/User.js';
import Account from '../../models/Account.js';
import FixedDeposit from '../../models/FixedDeposit.js';
import Transaction from '../../models/Transaction.js';

const router = express.Router();

// Fields safe to expose externally (never include password)
const SAFE_USER_FIELDS = 'id name email phone address avatar memberSince preferences';

// ── List all users ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, SAFE_USER_FIELDS);
        res.json({ count: users.length, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Single user profile ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }, SAFE_USER_FIELDS);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Full financial summary ──────────────────────────────────────────────────
router.get('/:id/summary', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }, SAFE_USER_FIELDS);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const allAccounts = await Account.find({ userId: req.params.id }).sort({ id: 1 });

        let savingsTotal = 0, checkingTotal = 0, investmentTotal = 0, creditDueTotal = 0;

        const processedAccounts = allAccounts.map(acc => {
            const a = acc.toObject();
            if (a.type === 'savings')    savingsTotal    += a.balance;
            if (a.type === 'checking')   checkingTotal   += a.balance;
            if (a.type === 'investment') investmentTotal += a.balance;
            if (a.type === 'credit') {
                a.dueAmount       = Math.abs(Math.min(a.balance, 0));
                a.availableAmount = (a.limit || 0) + a.balance;
                creditDueTotal   += a.dueAmount;
            }
            return a;
        });

        const activeFDsCount = await FixedDeposit.countDocuments({ userId: req.params.id, status: 'active' });

        const transactions = await Transaction.find({ userId: req.params.id });
        let incomeTotal = 0, expenditureTotal = 0;
        transactions.forEach(t => {
            if (t.type === 'credit') incomeTotal      += t.amount;
            else                     expenditureTotal += Math.abs(t.amount);
        });

        res.json({
            user,
            accounts: processedAccounts,
            activeFixedDeposits: activeFDsCount,
            financials: {
                balances: {
                    savings:          savingsTotal,
                    checking:         checkingTotal,
                    investment:       investmentTotal,
                    creditDue:        creditDueTotal,
                    totalAssets:      savingsTotal + checkingTotal + investmentTotal,
                    totalLiabilities: creditDueTotal,
                    netWorth:         (savingsTotal + checkingTotal + investmentTotal) - creditDueTotal,
                },
                cashFlow: {
                    income:      incomeTotal,
                    expenditure: expenditureTotal,
                    net:         incomeTotal - expenditureTotal,
                },
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Bank accounts (excluding credit cards) ──────────────────────────────────
router.get('/:id/accounts', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }, 'id');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const accounts = await Account.find({ userId: req.params.id, type: { $ne: 'credit' } }).sort({ id: 1 });
        res.json({ count: accounts.length, accounts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Credit card details ─────────────────────────────────────────────────────
router.get('/:id/credit-cards', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }, 'id');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const cards = await Account.find({ userId: req.params.id, type: 'credit' }).sort({ id: 1 });
        const processed = cards.map(acc => {
            const a = acc.toObject();
            a.dueAmount       = Math.abs(Math.min(a.balance, 0));
            a.availableAmount = (a.limit || 0) + a.balance;
            return a;
        });
        res.json({ count: processed.length, creditCards: processed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Fixed deposit details ───────────────────────────────────────────────────
router.get('/:id/fixed-deposits', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }, 'id');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const fds = await FixedDeposit.find({ userId: req.params.id }).sort({ createdAt: -1 });
        res.json({ count: fds.length, fixedDeposits: fds });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Transaction history ─────────────────────────────────────────────────────
router.get('/:id/transactions', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id }, 'id');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const { limit = 50, page = 1, type, category } = req.query;
        const filter = { userId: req.params.id };
        if (type)     filter.type     = type;
        if (category) filter.category = category;

        const skip  = (Number(page) - 1) * Number(limit);
        const total = await Transaction.countDocuments(filter);
        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            total,
            page:  Number(page),
            limit: Number(limit),
            transactions,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
