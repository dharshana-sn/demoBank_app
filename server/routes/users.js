import express from 'express';
import User from '../models/User.js';
import Account from '../models/Account.js';
import FixedDeposit from '../models/FixedDeposit.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user summary (accounts, credit card metrics, active FDs, financial aggregates)
router.get('/:id/summary', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const allAccounts = await Account.find({ userId: req.params.id }).sort({ id: 1 });
        
        let savingsTotal = 0;
        let checkingTotal = 0;
        let investmentTotal = 0;
        let creditDueTotal = 0;

        const processedAccounts = allAccounts.map(acc => {
            const accObj = acc.toObject();
            if (accObj.type === 'savings') savingsTotal += accObj.balance;
            if (accObj.type === 'checking') checkingTotal += accObj.balance;
            if (accObj.type === 'investment') investmentTotal += accObj.balance;

            if (accObj.type === 'credit') {
                accObj.dueAmount = Math.abs(Math.min(accObj.balance, 0));
                accObj.availableAmount = (accObj.limit || 0) + accObj.balance;
                creditDueTotal += accObj.dueAmount;
            }
            return accObj;
        });

        const totalAssets = savingsTotal + checkingTotal + investmentTotal;
        const totalLiabilities = creditDueTotal;

        const activeFDsCount = await FixedDeposit.countDocuments({ 
            userId: req.params.id, 
            status: 'active' 
        });

        const transactions = await Transaction.find({ userId: req.params.id });
        let incomeTotal = 0;
        let expenditureTotal = 0;

        transactions.forEach(txn => {
            if (txn.type === 'credit') {
                incomeTotal += txn.amount;
            } else if (txn.type === 'debit') {
                expenditureTotal += Math.abs(txn.amount);
            }
        });

        res.json({
            user: user,
            accounts: processedAccounts,
            activeFixedDeposits: activeFDsCount,
            financials: {
                balances: {
                    savings: savingsTotal,
                    checking: checkingTotal,
                    investment: investmentTotal,
                    creditDue: creditDueTotal,
                    totalAssets: totalAssets,
                    totalLiabilities: totalLiabilities
                },
                cashFlow: {
                    income: incomeTotal,
                    expenditure: expenditureTotal
                }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user accounts (excluding credit cards)
router.get('/:id/accounts', async (req, res) => {
    try {
        const accounts = await Account.find({ userId: req.params.id, type: { $ne: 'credit' } }).sort({ id: 1 });
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user credit cards
router.get('/:id/credit-cards', async (req, res) => {
    try {
        const creditCards = await Account.find({ userId: req.params.id, type: 'credit' }).sort({ id: 1 });
        const processedCards = creditCards.map(acc => {
            const accObj = acc.toObject();
            accObj.dueAmount = Math.abs(Math.min(accObj.balance, 0));
            accObj.availableAmount = (accObj.limit || 0) + accObj.balance;
            return accObj;
        });
        res.json(processedCards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user fixed deposits
router.get('/:id/fixed-deposits', async (req, res) => {
    try {
        const fds = await FixedDeposit.find({ userId: req.params.id }).sort({ createdAt: -1 });
        res.json(fds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET user profile
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.id });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE user profile
router.patch('/:id', async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
