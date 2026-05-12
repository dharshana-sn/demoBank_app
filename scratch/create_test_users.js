import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../server/models/User.js';
import Account from '../server/models/Account.js';

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/testbank";

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to DB");

    const users = [
        { id: "usr-1", name: "Alice Johnson", email: "alice.johnson@email.com" },
        { id: "usr-2", name: "Bob Williams", email: "bob.williams@email.com" },
        { id: "usr-3", name: "Catherine Lee", email: "catherine.lee@email.com" }
    ];

    const accounts = [
        { id: "acc-alice-1", name: "Savings Account", number: "1111111111", balance: 500000, type: "savings", userId: "usr-1" },
        { id: "acc-bob-1", name: "Savings Account", number: "2222222222", balance: 600000, type: "savings", userId: "usr-2" },
        { id: "acc-catherine-1", name: "Savings Account", number: "3333333333", balance: 700000, type: "savings", userId: "usr-3" }
    ];

    for (const u of users) {
        await User.findOneAndUpdate({ id: u.id }, u, { upsert: true, new: true });
        console.log(`User ${u.name} created/updated`);
    }

    for (const a of accounts) {
        await Account.findOneAndUpdate({ id: a.id }, a, { upsert: true, new: true });
        console.log(`Account ${a.number} created/updated with balance ${a.balance}`);
    }

    console.log("Done");
    await mongoose.disconnect();
}

run().catch(console.error);
