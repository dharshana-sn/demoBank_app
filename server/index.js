import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import fixedDepositRoutes from './routes/fixedDeposits.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import kycRoutes from './routes/kyc.js';
import otpRoutes from './routes/otp.js';
import User from './models/User.js';
import { sendPushNotification } from './utils/notify.js';
import { authenticateToken } from './middleware/auth.js';
// ── External (Third-Party) API ────────────────────────────────────────
import externalAuthRoutes from './routes/external/auth.js';
import externalUserRoutes from './routes/external/users.js';
import { authenticateExternalToken } from './middleware/externalAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;


app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Unprotected Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/accounts', authenticateToken, accountRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/fixed-deposits', authenticateToken, fixedDepositRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/kyc', authenticateToken, kycRoutes);
app.use('/api/otp', authenticateToken, otpRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── External (Third-Party) API ────────────────────────────────────────
// Unprotected: register + get token
app.use('/external/api/auth', externalAuthRoutes);
// Protected: all data endpoints
app.use('/external/api/users', authenticateExternalToken, externalUserRoutes);
// External health check
app.get('/external/api/health', (req, res) => res.json({ status: 'ok', api: 'external' }));

// Send push notification (Test)
app.post('/api/notify', async (req, res) => {
    const { userId, title, body, data } = req.body;
    try {
        const user = await User.findOne({ id: userId });
        if (!user || !user.pushToken) {
            return res.status(404).json({ error: 'User or Push Token not found' });
        }
        await sendPushNotification(user.pushToken, { title, body, data });
        res.json({ status: 'sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../dist')));

// Serve the payment landing page
app.get('/pay', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pay.html'));
});

// Catch-all route to serve the React application for unhandled non-API routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`DemoBank API running on http://0.0.0.0:${PORT}`));
});
