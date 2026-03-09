import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    number: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    type: { type: String, enum: ['checking', 'savings', 'credit', 'investment'], required: true },
    color: { type: String, default: '#3B82F6' },
}, { timestamps: true });

export default mongoose.model('Account', accountSchema);
