import 'dotenv/config';
import mongoose from 'mongoose';
import Account from '../server/models/Account.js';

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/testbank";

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to DB");

    const updates = [
        { id: "acc-alice-1", balance: 50000 },
        { id: "acc-bob-1", balance: 60000 },
        { id: "acc-catherine-1", balance: 70000 }
    ];

    for (const u of updates) {
        await Account.findOneAndUpdate({ id: u.id }, { balance: u.balance });
        console.log(`Account ${u.id} updated with balance ${u.balance}`);
    }

    console.log("Done");
    await mongoose.disconnect();
}

run().catch(console.error);
