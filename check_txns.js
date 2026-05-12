import 'dotenv/config';
import mongoose from 'mongoose';
import Transaction from './server/models/Transaction.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const txns = await Transaction.find({ userId: 'user-2' }).sort({ date: -1 });
        console.table(txns.map(t => ({
            date: t.date,
            desc: t.description,
            amount: t.amount,
            type: t.type,
            userId: t.userId
        })));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
