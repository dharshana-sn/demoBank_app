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

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve the React application for unhandled non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`DemoBank API running on http://localhost:${PORT}`));
});
