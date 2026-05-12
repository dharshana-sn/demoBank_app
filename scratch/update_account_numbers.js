import 'dotenv/config';
import mongoose from 'mongoose';
import Account from '../server/models/Account.js';

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/testbank";

async function run() {
    await mongoose.connect(uri);
    console.log("Connected to DB");

    const updates = [
        { id: "acc-alice-1", number: "4528172635" },
        { id: "acc-bob-1", number: "9823746150" },
        { id: "acc-catherine-1", number: "6152437890" }
    ];

    for (const u of updates) {
        await Account.findOneAndUpdate({ id: u.id }, { number: u.number });
        console.log(`Account ${u.id} updated with number ${u.number}`);
    }

    console.log("Done");
    await mongoose.disconnect();
}

run().catch(console.error);
