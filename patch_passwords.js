/**
 * patch_passwords.js
 * One-time script: Sets password = 'password123' for all users that have no password.
 * Run with: node patch_passwords.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from './server/models/User.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
        { $or: [{ password: { $exists: false } }, { password: null }, { password: '' }] },
        { $set: { password: 'password123' } }
    );

    console.log(`✅ Patched ${result.modifiedCount} user(s) with password = 'password123'`);

    await mongoose.disconnect();
    console.log('Done.');
}

run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
