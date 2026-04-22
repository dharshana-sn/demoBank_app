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
import User from './models/User.js';
import { sendPushNotification } from './utils/notify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fixed-deposits', fixedDepositRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

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
