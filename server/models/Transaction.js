import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    customerId: { type: String, default: 'CID-001' },
    date: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'Completed' },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    note: { type: String, default: '' },
    accountId: { type: String, default: '' },
    userId: { type: String, required: true },
}, { timestamps: true });

// Index for fast date-range + category queries
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });

export default mongoose.model('Transaction', transactionSchema);
