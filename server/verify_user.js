import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ id: "user-1" });
        console.log('User found in DB:', user);
    } catch (err) {
        console.error('Verify error:', err);
    } finally {
        await mongoose.disconnect();
    }
}
verify();
