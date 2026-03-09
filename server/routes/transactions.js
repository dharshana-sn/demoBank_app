import express from 'express';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// GET /api/transactions — list all, with optional filters
// Query params: ?category=Bills&from=2026-01-01&to=2026-03-05
router.get('/', async (req, res) => {
    try {
        const filter = {};
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

export default router;
