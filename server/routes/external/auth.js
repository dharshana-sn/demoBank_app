/**
 * server/routes/external/auth.js
 * External API authentication — completely separate from the UI login flow.
 *
 * POST /external/api/auth/register  — Register a third-party client, get an API key
 * POST /external/api/auth/token     — Exchange API key for a short-lived JWT (1h)
 */

import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const EXT_SECRET = process.env.EXT_JWT_SECRET || 'demobank_external_jwt_secret_2026';

// ── Register a client & get a long-lived JWT ──────────────────────────────────
// POST /external/api/auth/register
// Body: { clientName, email }
// Returns: { token }
router.post('/register', async (req, res) => {
    const { clientName, email } = req.body;
    if (!clientName || !email) {
        return res.status(400).json({ error: 'clientName and email are required.' });
    }
    try {
        // Generate a long-lived token (e.g., 1 year)
        const token = jwt.sign(
            { clientName, email },
            EXT_SECRET,
            { expiresIn: '365d' }
        );

        res.status(201).json({
            message: 'Registration successful. This token is valid for 1 year.',
            clientName,
            email,
            token,
            usage: 'Add header: Authorization: Bearer <token>'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
