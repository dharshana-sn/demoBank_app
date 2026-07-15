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
import { Eye, EyeOff, Building2, ShieldCheck, AlertCircle /*, RefreshCcw */ } from "lucide-react";
import { checkHealth, loginUser } from "../api.js";
import "./LoginPage.css";

const DEMO_USERS = [
    { id: "user-1", name: "Test User", email: "testUser@gmail.com", password: "password123", avatar: "TU" },
    { id: "user-2", name: "John Doe", email: "john.doe@example.com", password: "password123", avatar: "JD" },
    { id: "usr-1", name: "Alice Johnson", email: "alice.johnson@email.com", password: "password123", avatar: "A" },
    { id: "usr-2", name: "Bob Williams", email: "bob.williams@email.com", password: "password123", avatar: "B" },
    { id: "usr-3", name: "Catherine Lee", email: "catherine.lee@email.com", password: "password123", avatar: "C" }
];

/*
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
*/

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [formErrors, setFormErrors] = useState({});
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState("");
    
    // Captcha state
    // const [showCaptcha, setShowCaptcha] = useState(false);
    // const [captchaData, setCaptchaData] = useState(null);
    // const [captchaError, setCaptchaError] = useState("");

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

    /*
    const refreshCaptcha = async () => {
        setIsSubmitting(true);
        // Simulate slight delay to make it feel secure
        await new Promise(resolve => setTimeout(resolve, 300));
        const data = generateFrontendCaptcha();
        setCaptchaData(data);
        setCaptchaError("");
        setIsSubmitting(false);
    };
    */

    const executeLogin = async () => {
        setIsSubmitting(true);
        setAuthErrorMessage("");

        // 1. Check if backend is reachable
        const isUp = await checkHealth();
        if (!isUp) {
            setAuthErrorMessage("Server is unreachable. Please make sure the server is running.");
            setIsSubmitting(false);
            return;
        }

        // 2. Call the backend login endpoint to get a JWT token
        try {
            const response = await loginUser(formData.email, formData.password);
            // response = { user, token }
            login(response); // stores user + token in sessionStorage via AuthContext
            navigate("/dashboard");
        } catch (err) {
            setAuthErrorMessage(err.message || "Invalid email or password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    /*
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
    */

    const handleCredentialSubmit = async (event) => {
        event.preventDefault();

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        await executeLogin();
        // if (!showCaptcha) {
        //     setIsSubmitting(true);
        //     await new Promise(resolve => setTimeout(resolve, 400));
        //     const data = generateFrontendCaptcha();
        //     setCaptchaData(data);
        //     setShowCaptcha(true);
        //     setCaptchaError("");
        //     setIsSubmitting(false);
        //     return;
        // }

        // setCaptchaError(`Please follow the instructions: ${captchaData.instruction || "Select the requested shape"}`);
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

                            {/* {showCaptcha && captchaData && (
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
                            )} */}

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
                            🔑 Demo 1: <strong>testUser@gmail.com</strong> / <strong>password123</strong><br/>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

