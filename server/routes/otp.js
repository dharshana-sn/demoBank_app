import express from 'express';
import twilio from 'twilio';
import User from '../models/User.js';

const router = express.Router();

// In-memory store for OTPs: { userId: { otp, expiresAt } }
// In a real production app, use Redis or MongoDB for this.
const otpStore = new Map();

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Route to send SMS
router.post('/send-sms', async (req, res) => {
    try {
        const userId = req.body.userId || req.user?.id;
        
        // Find user to get phone number
        const user = await User.findOne({ id: userId });
        if (!user || !user.phone) {
            return res.status(400).json({ message: 'User phone number not found in profile.' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
        
        otpStore.set(userId.toString(), { otp, expiresAt });

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            console.warn(`Twilio credentials missing. Generated OTP for ${user.phone}: ${otp}`);
            return res.json({ message: 'OTP generated but not sent via SMS (Missing Twilio Config in .env)' });
        }

        const client = twilio(accountSid, authToken);
        
        // Clean phone number (remove spaces, parentheses, dashes)
        let recipientPhone = user.phone.trim().replace(/[\s\-\(\)]/g, '');
        
        // Automatically prepend +91 for Indian numbers if no country code is provided
        if (!recipientPhone.startsWith('+')) {
            if (recipientPhone.length === 10) {
                recipientPhone = '+91' + recipientPhone;
            } else if (recipientPhone.startsWith('91') && recipientPhone.length === 12) {
                recipientPhone = '+' + recipientPhone;
            } else {
                // Default fallback to prepending +91
                recipientPhone = '+91' + recipientPhone;
            }
        }

        console.log(`Sending Twilio SMS to formatted number: ${recipientPhone}`);

        await client.messages.create({
            body: `Test Bank: Your OTP for Fixed Deposit creation is ${otp}. It expires in 5 minutes.`,
            from: fromNumber,
            to: recipientPhone
        });

        res.json({ message: 'OTP sent successfully to your phone.' });
    } catch (err) {
        console.error('Error sending SMS via Twilio:', err.message);

        // Check if the error is a Twilio phone number validation error (invalid format, unverified number, etc.)
        const isTwilioValidationError = 
            err.code === 21211 || // Invalid 'To' Phone Number
            err.code === 21614 || // 'To' number is not a valid mobile number
            err.code === 21608 || // 'To' number is unverified (for trial accounts)
            err.status === 400 ||
            (err.message && (err.message.includes("Invalid 'To'") || err.message.includes("not a valid") || err.message.includes("unverified")));

        const statusCode = isTwilioValidationError ? 400 : 500;
        const userFriendlyMessage = isTwilioValidationError
            ? `Failed to send SMS: The phone number provided is invalid or not verified. (${err.message})`
            : `Failed to send SMS: ${err.message}`;

        res.status(statusCode).json({ 
            error: userFriendlyMessage,
            message: userFriendlyMessage 
        });
    }
});

// Route to verify SMS
router.post('/verify-sms', (req, res) => {
    const userId = req.body.userId || req.user?.id;
    const { otp } = req.body;
    
    const stored = otpStore.get(userId.toString());
    
    if (!stored) {
        return res.status(400).json({ message: 'No OTP requested. Please send OTP first.' });
    }
    
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(userId.toString());
        return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    
    if (stored.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    // OTP verified successfully
    otpStore.delete(userId.toString());
    res.json({ success: true, message: 'OTP verified successfully.' });
});

export default router;
