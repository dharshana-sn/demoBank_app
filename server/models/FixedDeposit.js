import mongoose from 'mongoose';

const fixedDepositSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    principal: { type: Number, required: true },
    rate: { type: Number, required: true },
    tenure: { type: String, required: true },
    startDate: { type: String, required: true },
    maturityDate: { type: String, required: true },
    maturityAmount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'matured', 'withdrawn'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('FixedDeposit', fixedDepositSchema);
