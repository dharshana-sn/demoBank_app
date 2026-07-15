import express from 'express';
import User from '../models/User.js';
import svgCaptcha from 'svg-captcha';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ── Credentials Login ─────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'demobank_secure_jwt_secret_2026',
            { expiresIn: '24h' }
        );
        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


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

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'demobank_secure_jwt_secret_2026',
            { expiresIn: '24h' }
        );

        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Captcha Generation Route (SVG Shape Puzzle)
router.get('/captcha', async (req, res) => {
    try {
        const shapes = [
            { type: 'circle', color: '#ef4444', name: 'Red Circle', render: (x, y) => `<circle cx="${x}" cy="${y}" r="30" fill="#ef4444" />`, box: (x, y) => ({x1: x-30, y1: y-30, x2: x+30, y2: y+30}) },
            { type: 'square', color: '#3b82f6', name: 'Blue Square', render: (x, y) => `<rect x="${x-30}" y="${y-30}" width="60" height="60" fill="#3b82f6" rx="8" />`, box: (x, y) => ({x1: x-30, y1: y-30, x2: x+30, y2: y+30}) },
            { type: 'triangle', color: '#22c55e', name: 'Green Triangle', render: (x, y) => `<polygon points="${x},${y-30} ${x+35},${y+30} ${x-35},${y+30}" fill="#22c55e" stroke-linejoin="round" />`, box: (x, y) => ({x1: x-35, y1: y-30, x2: x+35, y2: y+30}) }
        ];
        
        // Shuffle shapes
        shapes.sort(() => Math.random() - 0.5);
        
        const positions = [{x: 50, y: 75}, {x: 150, y: 75}, {x: 250, y: 75}];
        
        let svgContent = `<svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">`;
        svgContent += `<rect width="100%" height="100%" fill="#f8fafc" rx="12" />`;
        
        const renderedShapes = [];
        for (let i = 0; i < 3; i++) {
            const shape = shapes[i];
            const pos = positions[i];
            svgContent += shape.render(pos.x, pos.y);
            renderedShapes.push({ ...shape, box: shape.box(pos.x, pos.y) });
        }
        
        svgContent += `</svg>`;
        
        const targetShape = renderedShapes[Math.floor(Math.random() * renderedShapes.length)];
        
        res.json({
            image: `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`,
            instruction: `Click on the ${targetShape.name}`,
            targetBox: targetShape.box
        });
    } catch (err) {
        console.error("Captcha error:", err);
        res.status(500).json({ error: "Failed to generate captcha" });
    }
});

export default router;
