import mongoose from 'mongoose';

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Error out faster for debugging
        });
        console.log(' MongoDB connected successfully');
    } catch (err) {
        console.error(' MongoDB connection error details:', err);
        process.exit(1);
    }
}
