import express from 'express';
import User from '../models/User.js';

const router = express.Router();

const MOCK_PROFILES = {
    google: {
        name: "Google Explorer",
        email: "google.user@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Google",
        provider: "google",
        providerId: "google-123"
    },
    github: {
        name: "GitHub Developer",
        email: "github.user@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GitHub",
        provider: "github",
        providerId: "github-456"
    }
};

// OAuth Callback Simulation
router.post('/oauth-callback', async (req, res) => {
    const { provider, code } = req.body;

    // In a real app, 'code' would be exchanged for tokens.
    // Here we use it to select a mock profile.
    const profile = MOCK_PROFILES[provider] || MOCK_PROFILES.google;

    try {
        // UPSERT: Find by provider + providerId, or create new
        const user = await User.findOneAndUpdate(
            { provider: profile.provider, providerId: profile.providerId },
            {
                $set: {
                    name: profile.name,
                    email: profile.email,
                    avatar: profile.avatar,
                    id: `user-${profile.provider}-${Date.now().toString().slice(-4)}`
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
