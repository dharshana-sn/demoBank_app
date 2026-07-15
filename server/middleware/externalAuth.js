/**
 * server/middleware/externalAuth.js
 * Middleware for the external API — validates JWT issued by the external /auth/token endpoint.
 * Uses a SEPARATE secret (EXT_JWT_SECRET) so UI tokens cannot access external routes.
 */

import jwt from 'jsonwebtoken';

const EXT_SECRET = process.env.EXT_JWT_SECRET || 'demobank_external_jwt_secret_2026';

export const authenticateExternalToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'External API: No token provided. Use POST /external/api/auth/token to get one.' });
    }

    try {
        const decoded = jwt.verify(token, EXT_SECRET);
        req.client = decoded; // { clientName, email, apiKeyId }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'External API: Invalid or expired token.' });
    }
};
