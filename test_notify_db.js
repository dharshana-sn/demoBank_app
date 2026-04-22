import mongoose from 'mongoose';
import 'dotenv/config';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await mongoose.connection.db.collection('users').findOne({ id: 'user-1' });
    console.log(JSON.stringify(user, null, 2));
    process.exit();
}

check();
