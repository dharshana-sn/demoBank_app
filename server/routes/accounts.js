import express from 'express';
import Account from '../models/Account.js';

const router = express.Router();

// GET /api/accounts — list accounts for a specific user
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.userId) filter.userId = req.query.userId;
        const accounts = await Account.find(filter).sort({ id: 1 });
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/accounts/:id/balance — update balance
router.patch('/:id/balance', async (req, res) => {
    try {
        const { delta } = req.body; // delta can be positive (credit) or negative (debit)
        const account = await Account.findOne({ id: req.params.id });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        account.balance = Math.round((account.balance + delta) * 100) / 100;
        await account.save();
        res.json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/accounts/by-number/:number/balance — update balance by account number
router.patch('/by-number/:number/balance', async (req, res) => {
    try {
        const { delta } = req.body;
        const account = await Account.findOne({ number: req.params.number });
        if (!account) return res.status(404).json({ error: 'Account not found' });

        account.balance = Math.round((account.balance + delta) * 100) / 100;
        await account.save();
        res.json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/accounts/:id — update account details (status, limit, etc.)
router.patch('/:id', async (req, res) => {
    try {
        const account = await Account.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        if (!account) return res.status(404).json({ error: 'Account not found' });
        res.json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/accounts — create new account
router.post('/', async (req, res) => {
    try {
        const accountData = {
            ...req.body,
            id: req.body.id || `acc-${Date.now()}`
        };
        const newAccount = new Account(accountData);
        await newAccount.save();
        res.status(201).json(newAccount);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/accounts/:id — remove account
router.delete('/:id', async (req, res) => {
    try {
        const account = await Account.findOneAndDelete({ id: req.params.id });
        if (!account) return res.status(404).json({ error: 'Account not found' });
        res.json({ message: 'Account removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
