import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    address: { type: String },
    avatar: { type: String },
    provider: { type: String, default: 'local' },
    providerId: { type: String },
    memberSince: { type: String, default: "2022" },
    pushToken: { type: String },
    preferences: {
        currency: { type: String },
        branch: { type: String },
        notifications: [{ type: String }]
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
