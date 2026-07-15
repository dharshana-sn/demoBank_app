/**
 * server/models/ApiKey.js
 * Stores third-party client registrations and their API keys.
 */

import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    key:        { type: String, required: true, unique: true },
    isActive:   { type: Boolean, default: true },
}, { timestamps: true });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;
