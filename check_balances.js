import 'dotenv/config';
import mongoose from 'mongoose';
import Account from './server/models/Account.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const accounts = await Account.find({});
        console.table(accounts.map(a => ({
            id: a.id,
            name: a.name,
            number: a.number,
            balance: a.balance,
            userId: a.userId
        })));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
