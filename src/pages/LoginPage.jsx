/**
 * LoginPage.jsx
 * 
 * This is the entry point for users. It features a modern, split-panel design with 
 * a marketing hero area on the left and a functional login form on the right. 
 * Supports both standard email/password credentials and mock OAuth flows.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Eye, EyeOff, Building2, ShieldCheck, AlertCircle, RefreshCcw } from "lucide-react";
import "./LoginPage.css";

const DEMO_CREDENTIALS = { email: "testUser@gmail.com", password: "password123" };

function generateFrontendCaptcha() {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, 300, 150);

    // Add some noise lines
    for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = `rgba(5, 66, 121, 0.15)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 300, Math.random() * 150);
        ctx.lineTo(Math.random() * 300, Math.random() * 150);
        ctx.stroke();
    }

    const shapes = [
        { name: 'Red Square', draw: (x, y) => { ctx.fillStyle = '#ef4444'; ctx.fillRect(x-30, y-30, 60, 60); } },
        { name: 'Blue Circle', draw: (x, y) => { ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(x, y, 32, 0, Math.PI*2); ctx.fill(); } },
        { name: 'Green Triangle', draw: (x, y) => { ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.moveTo(x, y-35); ctx.lineTo(x-35, y+30); ctx.lineTo(x+35, y+30); ctx.fill(); } }
    ];

    // Shuffle shapes
    shapes.sort(() => Math.random() - 0.5);

    const positions = [
        { x: 50, y: 75, box: { x1: 10, x2: 90, y1: 35, y2: 115 } },
        { x: 150, y: 75, box: { x1: 110, x2: 190, y1: 35, y2: 115 } },
        { x: 250, y: 75, box: { x1: 210, x2: 290, y1: 35, y2: 115 } }
    ];

    const renderedShapes = [];
    for (let i = 0; i < 3; i++) {
        const shape = shapes[i];
        const pos = positions[i];
        shape.draw(pos.x, pos.y);
        renderedShapes.push({ name: shape.name, box: pos.box });
    }

    // Pick target
    const target = renderedShapes[Math.floor(Math.random() * renderedShapes.length)];

    return {
        image: canvas.toDataURL(),
        instruction: `Click on the ${target.name}`,
        targetBox: target.box
    };
}

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [formErrors, setFormErrors] = useState({});
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState("");
    
    // Captcha state
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaData, setCaptchaData] = useState(null);
    const [captchaError, setCaptchaError] = useState("");

    const validateForm = () => {
        const errorsFound = {};
        if (!formData.email) {
            errorsFound.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errorsFound.email = "Enter a valid email";
        }

        if (!formData.password) {
            errorsFound.password = "Password is required";
        }
        return errorsFound;
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
        setFormErrors(prevErrors => ({ ...prevErrors, [name]: "" }));
        setAuthErrorMessage("");
    };

    const refreshCaptcha = async () => {
        setIsSubmitting(true);
        // Simulate slight delay to make it feel secure
        await new Promise(resolve => setTimeout(resolve, 300));
        const data = generateFrontendCaptcha();
        setCaptchaData(data);
        setCaptchaError("");
        setIsSubmitting(false);
    };

    const executeLogin = async () => {
        setIsSubmitting(true);
        // Simulate a network delay for a more realistic feel
        await new Promise(resolve => setTimeout(resolve, 900));

        if (formData.email === DEMO_CREDENTIALS.email && formData.password === DEMO_CREDENTIALS.password) {
            login({
                name: "Test User",
                email: formData.email,
                avatar: "TU",
                loginMethod: "credentials"
            });
            navigate("/dashboard");
        } else {
            setAuthErrorMessage("Invalid email or password. Use testUser@gmail.com / password123");
            setShowCaptcha(false);
        }
        setIsSubmitting(false);
    };

    const handleCaptchaClick = async (e) => {
        if (!captchaData || !captchaData.targetBox) return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Map display size (240x120) to actual SVG size (300x150)
        const scaleX = 300 / rect.width;
        const scaleY = 150 / rect.height;
        const trueX = x * scaleX;
        const trueY = y * scaleY;
        
        const box = captchaData.targetBox;
        if (trueX >= box.x1 && trueX <= box.x2 && trueY >= box.y1 && trueY <= box.y2) {
            setCaptchaError("");
            await executeLogin();
        } else {
            setCaptchaError("Incorrect shape clicked. Please try again.");
            await refreshCaptcha();
        }
    };

    const handleCredentialSubmit = async (event) => {
        event.preventDefault();

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        if (!showCaptcha) {
            setIsSubmitting(true);
            await new Promise(resolve => setTimeout(resolve, 400));
            const data = generateFrontendCaptcha();
            setCaptchaData(data);
            setShowCaptcha(true);
            setCaptchaError("");
            setIsSubmitting(false);
            return;
        }

        setCaptchaError(`Please follow the instructions: ${captchaData.instruction || "Select the requested shape"}`);
    };

    const startOAuthFlow = (providerName) => {
        const queryParams = new URLSearchParams({
            provider: providerName,
            state: "mock_state_token_xyz"
        });
        navigate(`/oauth/callback?${queryParams}`);
    };

    return (
        <div className="login-page fade-in" data-testid="login-page">
            <div className="login-bg-decor">
                <div className="decor-circle decor-1" />
                <div className="decor-circle decor-2" />
                <div className="decor-circle decor-3" />
            </div>

            <div className="login-container">
                <div className="login-hero">
                    <div className="login-hero-content">
                        <div className="brand">
                            <Building2 size={36} color="white" />
                            <span className="brand-name">Test Bank</span>
                        </div>
                        <h1 className="hero-title">Secure. Smart.<br />Modern Banking.</h1>
                        <p className="hero-subtitle">
                            Your complete financial hub — manage accounts, track transactions,
                            and transfer funds with confidence.
                        </p>
                        <div className="hero-features">
                            {["256-bit SSL Encryption", "Real-time Notifications", "Multi-factor Authentication"].map(feature => (
                                <div key={feature} className="hero-feature">
                                    <ShieldCheck size={16} color="rgba(255,255,255,0.8)" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="login-form-panel">
                    <div className="login-form-card fade-in">
                        <h2 className="form-heading" data-testid="login-heading">Welcome Back</h2>
                        <p className="form-subheading">Sign in to your account</p>

                        <div className="oauth-buttons">
                            <button
                                className="oauth-btn"
                                data-testid="btn-oauth-google"
                                onClick={() => startOAuthFlow("google")}
                                title="Login with Google"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                Continue with Google
                            </button>
                            <button
                                className="oauth-btn"
                                data-testid="btn-oauth-github"
                                onClick={() => startOAuthFlow("github")}
                                title="Login with GitHub"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                                Continue with GitHub
                            </button>
                        </div>

                        <div className="divider-text"><span>or sign in with email</span></div>

                        {authErrorMessage && (
                            <div className="alert-error" data-testid="auth-error">
                                <AlertCircle size={16} />
                                {authErrorMessage}
                            </div>
                        )}

                        <form onSubmit={handleCredentialSubmit} data-testid="login-form" noValidate>
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className={`form-input ${formErrors.email ? "error" : ""}`}
                                    placeholder="testUser@gmail.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    autoComplete="email"
                                    data-testid="input-email"
                                />
                                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password</label>
                                <div className="input-pwd-wrap">
                                    <input
                                        id="password"
                                        name="password"
                                        type={isPasswordVisible ? "text" : "password"}
                                        className={`form-input ${formErrors.password ? "error" : ""}`}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        autoComplete="current-password"
                                        data-testid="input-password"
                                    />
                                    <button
                                        type="button"
                                        className="pwd-toggle"
                                        onClick={() => setIsPasswordVisible(prev => !prev)}
                                        data-testid="btn-toggle-password"
                                        title={isPasswordVisible ? "Hide password" : "Show password"}
                                    >
                                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {formErrors.password && <span className="form-error">{formErrors.password}</span>}
                            </div>

                            <div className="form-row-between">
                                <label className="remember-me">
                                    <input type="checkbox" data-testid="chk-remember" /> Remember me
                                </label>
                                <a href="#" className="forgot-link" data-testid="link-forgot-password">Forgot password?</a>
                            </div>

                            {showCaptcha && captchaData && (
                                <div className="form-group captcha-group fade-in" style={{ marginTop: '16px', marginBottom: '8px', padding: '16px', background: 'rgba(5, 66, 121, 0.05)', borderRadius: '12px', border: '1px solid rgba(5, 66, 121, 0.1)' }}>
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Security Check
                                        <button type="button" onClick={refreshCaptcha} title="Refresh Options" style={{ background: 'none', border: 'none', color: '#054279', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s', fontSize: '0.8rem', gap: '4px' }}>
                                            <RefreshCcw size={14} /> Refresh
                                        </button>
                                    </label>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#054279', fontWeight: 500 }}>
                                        {captchaData.instruction || "Select the requested shape"}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid #e1e4e8', display: 'inline-block', cursor: 'crosshair', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <img 
                                                src={captchaData.image} 
                                                alt="Security CAPTCHA" 
                                                onClick={handleCaptchaClick}
                                                style={{ height: '120px', width: '240px', display: 'block' }} 
                                            />
                                        </div>
                                    </div>
                                    {captchaError && <span className="form-error" style={{ display: 'block', marginTop: '6px', textAlign: 'center' }}>{captchaError}</span>}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-full btn-lg"
                                disabled={isSubmitting}
                                data-testid="btn-login-submit"
                                style={{ marginTop: 8 }}
                            >
                                {isSubmitting ? <span className="spinner" /> : null}
                                {isSubmitting ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <p className="demo-hint" data-testid="demo-hint">
                            🔑 Demo: <strong>testUser@gmail.com</strong> / <strong>password123</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

