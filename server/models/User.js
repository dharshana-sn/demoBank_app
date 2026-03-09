import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    avatar: { type: String },
    provider: { type: String, default: 'local' },
    providerId: { type: String },
    memberSince: { type: String, default: "2022" }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
