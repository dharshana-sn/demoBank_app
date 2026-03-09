import express from 'express';
import Account from '../models/Account.js';

const router = express.Router();

// GET /api/accounts — list all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await Account.find().sort({ id: 1 });
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

export default router;
