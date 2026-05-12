import express from 'express';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET /api/transactions — list all, with optional filters
// Query params: ?category=Bills&from=2026-01-01&to=2026-03-05
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.category) filter.category = req.query.category;
        if (req.query.from || req.query.to) {
            filter.date = {};
            if (req.query.from) filter.date.$gte = req.query.from;
            if (req.query.to) filter.date.$lte = req.query.to;
        }
        const transactions = await Transaction.find(filter).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/transactions — create a new transaction
router.post('/', async (req, res) => {
    try {
        const txnData = {
            ...req.body,
            id: req.body.id || `txn-${Date.now()}`,
        };
        const txn = new Transaction(txnData);
        await txn.save();
        res.status(201).json(txn);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/transactions/same-bank-transfer — atomic same-bank transfer
// Debits sender, credits recipient by account number, creates both transactions
router.post('/same-bank-transfer', async (req, res) => {
    const { fromAccountId, toAccountNum, amount, senderUserId, senderName, note, date } = req.body;

    if (!fromAccountId || !toAccountNum || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Missing required fields: fromAccountId, toAccountNum, amount' });
    }

    try {
        const Account = (await import('../models/Account.js')).default;

        // 1. Find sender account
        const senderAcc = await Account.findOne({ id: fromAccountId });
        if (!senderAcc) return res.status(404).json({ error: 'Sender account not found' });
        if (senderAcc.balance < amount) return res.status(400).json({ error: 'Insufficient funds' });

        // 2. Find recipient account by number
        const recipientAcc = await Account.findOne({ number: toAccountNum });
        if (!recipientAcc) return res.status(404).json({ error: `No account found with number ${toAccountNum}` });
        if (recipientAcc.id === fromAccountId) return res.status(400).json({ error: 'Cannot transfer to same account' });

        const txnDate = date || new Date().toISOString().split('T')[0];

        // 3. Debit sender
        senderAcc.balance = Math.round((senderAcc.balance - amount) * 100) / 100;
        await senderAcc.save();

        // 4. Credit recipient
        recipientAcc.balance = Math.round((recipientAcc.balance + amount) * 100) / 100;
        await recipientAcc.save();

        // 5. Create debit transaction for sender
        const debitTxn = new Transaction({
            id: `txn-sb-debit-${Date.now()}`,
            date: txnDate,
            description: note || `Transfer to account ${toAccountNum}`,
            category: 'Transfers',
            amount: -amount,
            status: 'Completed',
            type: 'debit',
            fromAccountId,
            toAccountNum,
            accountId: fromAccountId,
            userId: senderUserId,
            note: note || '',
            customerId: 'CID-SB',
        });
        await debitTxn.save();

        // 6. Create credit transaction for recipient
        const creditTxn = new Transaction({
            id: `txn-sb-credit-${Date.now() + 1}`,
            date: txnDate,
            description: `Transfer from ${senderName || 'Another Account'}`,
            category: 'Deposits',
            amount: amount,
            status: 'Completed',
            type: 'credit',
            accountId: recipientAcc.id,
            userId: recipientAcc.userId,
            note: note || '',
            customerId: 'CID-SB',
        });
        await creditTxn.save();

        res.json({
            success: true,
            senderBalance: senderAcc.balance,
            recipientBalance: recipientAcc.balance,
            recipientUserId: recipientAcc.userId,
            recipientAccountId: recipientAcc.id,
            debitTxn,
            creditTxn,
        });

    } catch (err) {
        console.error('Same-bank transfer error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
