import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import fixedDepositRoutes from './routes/fixedDeposits.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fixed-deposits', fixedDepositRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

connectDB().then(() => {
    app.listen(PORT, () => console.log(`DemoBank API running on http://localhost:${PORT}`));
});
