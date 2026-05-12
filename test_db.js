import 'dotenv/config';
import mongoose from 'mongoose';

async function test() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Success!');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } catch (err) {
        console.error('Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
