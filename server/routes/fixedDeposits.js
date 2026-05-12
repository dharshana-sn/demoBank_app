import express from 'express';
import FixedDeposit from '../models/FixedDeposit.js';

const router = express.Router();

// GET /api/fixed-deposits — list all active FDs
router.get('/', async (req, res) => {
    try {
        const fds = await FixedDeposit.find({ status: 'active' }).sort({ createdAt: -1 });
        res.json(fds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/fixed-deposits — book a new FD
router.post('/', async (req, res) => {
    try {
        const fdData = {
            ...req.body,
            id: req.body.id || `fd-${Date.now()}`,
            status: 'active',
        };
        const fd = new FixedDeposit(fdData);
        await fd.save();
        res.status(201).json(fd);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/fixed-deposits/:id — remove an FD by custom id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await FixedDeposit.findOneAndDelete({ id: req.params.id });
        if (!deleted) return res.status(404).json({ error: 'FD not found' });
        res.json({ message: 'Deleted', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
