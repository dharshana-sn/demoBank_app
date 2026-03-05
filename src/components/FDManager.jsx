import React, { useState, useMemo, useEffect } from 'react';
import { PiggyBank, Calculator, TrendingUp, Lock, Globe, Shield, Calendar, Percent, IndianRupee, Clock, Award, ChevronRight, X, CheckCircle, Info } from 'lucide-react';
import './FDManager.css';

// Interest rates: tenure key -> { general, senior }
const INTEREST_RATE_SLABS = [
    { key: '7d_45d', label: '7 Days – 45 Days', minDays: 7, maxDays: 45, general: 3.50, senior: 4.00 },
    { key: '46d_6m', label: '46 Days – 6 Months', minDays: 46, maxDays: 180, general: 4.50, senior: 5.00 },
    { key: '6m_1y', label: '6 Months – 1 Year', minDays: 181, maxDays: 365, general: 5.75, senior: 6.25 },
    { key: '1y_2y', label: '1 Year – 2 Years', minDays: 366, maxDays: 730, general: 6.50, senior: 7.00 },
    { key: '2y_3y', label: '2 Years – 3 Years', minDays: 731, maxDays: 1095, general: 6.80, senior: 7.30 },
    { key: '3y_5y', label: '3 Years – 5 Years', minDays: 1096, maxDays: 1825, general: 7.10, senior: 7.60 },
    { key: '5y_10y', label: '5 Years – 10 Years', minDays: 1826, maxDays: 3650, general: 6.75, senior: 7.25 },
];

// Best rate display cards (grouped)
const RATE_DISPLAY_GROUPS = [
    { label: '1Y to 2Y', slabKey: '1y_2y' },
    { label: '3Y to 5Y', slabKey: '3y_5y' },
    { label: '5Y to 10Y', slabKey: '5y_10y' },
];

const MOCK_ACTIVE_FDS = [
    { id: 'fd-1', principal: 50000, rate: 6.5, tenure: '1 Year', startDate: '2025-06-15', maturityDate: '2026-06-15', maturityAmount: 53250 },
    { id: 'fd-2', principal: 150000, rate: 7.5, tenure: '3 Years', startDate: '2024-02-10', maturityDate: '2027-02-10', maturityAmount: 183750 },
    { id: 'fd-3', principal: 300000, rate: 7.1, tenure: '5 Years', startDate: '2023-08-01', maturityDate: '2028-08-01', maturityAmount: 406500 },
];

const PAYOUT_OPTIONS = [
    { id: 'maturity', label: 'At Maturity', compoundPerYear: 4 },
    { id: 'quarterly', label: 'Quarterly', compoundPerYear: 4 },
    { id: 'monthly', label: 'Monthly', compoundPerYear: 12 },
];

function formatINR(num) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
}

function formatINRFull(num) {
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

function addDaysToDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function durationString(days) {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;
    let parts = [];
    if (years > 0) parts.push(`${years}Y`);
    if (months > 0) parts.push(`${months}M`);
    if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays}D`);
    return parts.join(' ');
}

/**
 * Calculate interest based on payout type.
 * - maturity: compound quarterly
 * - quarterly: simple interest paid every quarter (P × r/4 per quarter)
 * - monthly: simple interest paid every month (P × r/12 per month)
 * Returns { maturityAmount, totalInterest, payoutPerPeriod, effectiveYield }
 */
function calcFD(principal, annualRatePct, durationDays, payoutId) {
    const r = annualRatePct / 100;
    const t = durationDays / 365;

    if (payoutId === 'maturity') {
        // Compound quarterly for maturity payout
        const maturityAmount = principal * Math.pow(1 + r / 4, 4 * t);
        const totalInterest = maturityAmount - principal;
        const effectiveYield = (Math.pow(1 + r / 4, 4) - 1) * 100;
        return {
            maturityAmount: Math.round(maturityAmount),
            totalInterest: Math.round(totalInterest),
            payoutPerPeriod: null,
            effectiveYield: effectiveYield.toFixed(2),
        };
    } else if (payoutId === 'quarterly') {
        // Simple interest; principal returned at end
        const totalInterest = principal * r * t;
        const numPeriods = Math.max(1, Math.round(t * 4)); // number of quarters
        const payoutPerPeriod = Math.round(totalInterest / numPeriods);
        return {
            maturityAmount: Math.round(principal + totalInterest),
            totalInterest: Math.round(totalInterest),
            payoutPerPeriod,
            effectiveYield: (r * 100).toFixed(2),
        };
    } else {
        // monthly
        const totalInterest = principal * r * t;
        const numPeriods = Math.max(1, Math.round(t * 12)); // number of months
        const payoutPerPeriod = Math.round(totalInterest / numPeriods);
        return {
            maturityAmount: Math.round(principal + totalInterest),
            totalInterest: Math.round(totalInterest),
            payoutPerPeriod,
            effectiveYield: (r * 100).toFixed(2),
        };
    }
}

export default function FDManager() {
    const [customerType, setCustomerType] = useState('general');
    const [amount, setAmount] = useState(500000);
    const [durationDays, setDurationDays] = useState(1095);
    const [payoutOption, setPayoutOption] = useState('maturity');
    const [showRatesModal, setShowRatesModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [openedFD, setOpenedFD] = useState(null);
    // Load persisted FDs from localStorage on mount
    const [activeFDs, setActiveFDs] = useState(() => {
        try {
            const saved = localStorage.getItem('demobank_active_fds');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return [
            { id: 'fd-1', principal: 50000, rate: 6.5, tenure: '1 Year', startDate: '2025-06-15', maturityDate: '2026-06-15', maturityAmount: 53250 },
            { id: 'fd-2', principal: 150000, rate: 7.5, tenure: '3 Years', startDate: '2024-02-10', maturityDate: '2027-02-10', maturityAmount: 183750 },
            { id: 'fd-3', principal: 300000, rate: 7.1, tenure: '5 Years', startDate: '2023-08-01', maturityDate: '2028-08-01', maturityAmount: 406500 },
        ];
    });

    // Persist activeFDs to localStorage whenever it changes
    useEffect(() => {
        try { localStorage.setItem('demobank_active_fds', JSON.stringify(activeFDs)); } catch (e) { }
    }, [activeFDs]);

    // Close modal on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setShowRatesModal(false); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    // Find matching slab
    const matchedSlab = useMemo(() => {
        return INTEREST_RATE_SLABS.find(s => durationDays >= s.minDays && durationDays <= s.maxDays) || INTEREST_RATE_SLABS[3];
    }, [durationDays]);

    const interestRate = customerType === 'senior' ? matchedSlab.senior : matchedSlab.general;

    // Main calculation
    const calculation = useMemo(() => {
        const maturityDate = addDaysToDate(new Date(), durationDays);
        const result = calcFD(amount, interestRate, durationDays, payoutOption);
        return {
            interestRate,
            ...result,
            duration: durationString(durationDays),
            maturityDate: formatDate(maturityDate),
        };
    }, [amount, durationDays, interestRate, payoutOption]);

    // Find highest rate among display groups
    const highestRateKey = useMemo(() => {
        let maxRate = 0, maxKey = '';
        RATE_DISPLAY_GROUPS.forEach(g => {
            const slab = INTEREST_RATE_SLABS.find(s => s.key === g.slabKey);
            const rate = customerType === 'senior' ? slab.senior : slab.general;
            if (rate > maxRate) { maxRate = rate; maxKey = g.slabKey; }
        });
        return maxKey;
    }, [customerType]);

    const handleAmountSlider = (e) => setAmount(Number(e.target.value));
    const handleAmountInput = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val === '') { setAmount(10000); return; }
        const num = parseInt(val, 10);
        setAmount(Math.min(Math.max(num, 10000), 50000000));
    };

    const handleDurationSlider = (e) => setDurationDays(Number(e.target.value));

    // Clicking a rate card sets duration to mid-point of that slab
    const handleRateCardClick = (slab) => {
        const midDays = Math.round((slab.minDays + slab.maxDays) / 2);
        setDurationDays(midDays);
    };

    const handleOpenFD = () => {
        const today = new Date().toISOString().split('T')[0];
        const matDate = new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0];
        const fd = {
            id: `fd-${Date.now()}`,
            principal: amount,
            rate: interestRate,
            tenure: calculation.duration,
            startDate: today,
            maturityDate: matDate,
            maturityAmount: calculation.maturityAmount,
        };
        setActiveFDs(prev => [fd, ...prev]);
        setOpenedFD(fd);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
    };

    const handleViewAllRates = () => setShowRatesModal(true);

    // Progress calculation for active FDs
    const getProgress = (startDate, maturityDate) => {
        const start = new Date(startDate).getTime();
        const end = new Date(maturityDate).getTime();
        const now = new Date('2026-03-05').getTime();
        const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        return Math.round(progress);
    };

    // Payout label helpers
    const payoutLabel = payoutOption === 'maturity' ? 'Interest at Maturity' :
        payoutOption === 'quarterly' ? 'Quarterly Payout' : 'Monthly Payout';

    // Summary totals
    const fdTotals = useMemo(() => {
        return activeFDs.reduce((acc, fd) => {
            acc.totalPrincipal += fd.principal;
            acc.totalMaturity += fd.maturityAmount;
            return acc;
        }, { totalPrincipal: 0, totalMaturity: 0 });
    }, [activeFDs]);

    return (
        <>
            <div className="page-content fade-in" data-testid="fd-manager-page">
                {/* Summary Strip */}
                <section className="summary-strip">
                    <div className="summary-card">
                        <span className="summary-label">Total FD Value</span>
                        <span className="summary-value">{formatINRFull(fdTotals.totalPrincipal)}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Active Deposits</span>
                        <span className="summary-value">{activeFDs.length}</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Best Rate Available</span>
                        <span className="summary-value credit">7.60% p.a.</span>
                    </div>
                    <div className="summary-card">
                        <span className="summary-label">Projected Earnings</span>
                        <span className="summary-value credit credit-earnings">
                            +{formatINRFull(fdTotals.totalMaturity - fdTotals.totalPrincipal)}
                        </span>
                    </div>
                </section>

                {/* FD Calculator */}
                <div className="section fd-calc-section fade-in" style={{ animationDelay: '0.05s' }}>
                    <div className="fd-calculator-layout">
                        {/* Left: Calculator Controls */}
                        <div className="card fd-calc-controls">
                            <div className="card-header">
                                <h2 className="card-title">
                                    <Calculator size={20} style={{ marginRight: 8, color: 'var(--blue-600)' }} />
                                    FD Calculator
                                </h2>
                            </div>

                            {/* Customer Type Toggle */}
                            <div className="fd-toggle-group">
                                <button
                                    className={`fd-toggle-btn ${customerType === 'general' ? 'fd-toggle-active' : ''}`}
                                    onClick={() => setCustomerType('general')}
                                    data-testid="btn-type-general"
                                >
                                    General
                                </button>
                                <button
                                    className={`fd-toggle-btn ${customerType === 'senior' ? 'fd-toggle-active' : ''}`}
                                    onClick={() => setCustomerType('senior')}
                                    data-testid="btn-type-senior"
                                >
                                    Senior Citizen
                                </button>
                            </div>

                            {/* Amount Slider */}
                            <div className="fd-control-block">
                                <div className="fd-control-label">
                                    <span><IndianRupee size={14} /> Investment Amount</span>
                                    <div className="fd-amount-input-wrap">
                                        <span className="fd-rupee-sign">₹</span>
                                        <input
                                            type="text"
                                            className="fd-amount-input"
                                            value={amount.toLocaleString('en-IN')}
                                            onChange={handleAmountInput}
                                            data-testid="input-fd-amount"
                                        />
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    className="fd-slider"
                                    min="10000"
                                    max="50000000"
                                    step="10000"
                                    value={amount}
                                    onChange={handleAmountSlider}
                                    data-testid="slider-fd-amount"
                                />
                                <div className="fd-slider-labels">
                                    <span>₹10K</span>
                                    <span>₹50 Cr</span>
                                </div>
                            </div>

                            {/* Duration Slider */}
                            <div className="fd-control-block">
                                <div className="fd-control-label">
                                    <span><Clock size={14} /> Investment Duration</span>
                                    <span className="fd-duration-display">{durationString(durationDays)}</span>
                                </div>
                                <input
                                    type="range"
                                    className="fd-slider"
                                    min="7"
                                    max="3650"
                                    step="1"
                                    value={durationDays}
                                    onChange={handleDurationSlider}
                                    data-testid="slider-fd-duration"
                                />
                                <div className="fd-slider-labels">
                                    <span>7 Days</span>
                                    <span>10 Years</span>
                                </div>
                            </div>

                            {/* Payout Option */}
                            <div className="fd-control-block">
                                <div className="fd-control-label">
                                    <span><Percent size={14} /> Interest Payout</span>
                                </div>
                                <div className="fd-payout-pills">
                                    {PAYOUT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            className={`fd-payout-pill ${payoutOption === opt.id ? 'fd-payout-active' : ''}`}
                                            onClick={() => setPayoutOption(opt.id)}
                                            data-testid={`btn-payout-${opt.id}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rate Display Cards */}
                            <div className="fd-control-block">
                                <div className="fd-control-label">
                                    <span><TrendingUp size={14} /> Best Rates & Duration</span>
                                    <span className="fd-rate-payout-badge">
                                        {payoutOption === 'maturity' ? '🔒 At Maturity' :
                                            payoutOption === 'quarterly' ? '📅 Quarterly' : '📆 Monthly'}
                                    </span>
                                </div>
                                <div className="fd-rate-cards">
                                    {RATE_DISPLAY_GROUPS.map(group => {
                                        const slab = INTEREST_RATE_SLABS.find(s => s.key === group.slabKey);
                                        const rate = customerType === 'senior' ? slab.senior : slab.general;
                                        const isHighest = group.slabKey === highestRateKey;
                                        const avgDays = Math.round((slab.minDays + slab.maxDays) / 2);
                                        const cardResult = calcFD(amount, rate, avgDays, payoutOption);

                                        const isSelected = durationDays >= slab.minDays && durationDays <= slab.maxDays;

                                        return (
                                            <div
                                                key={group.slabKey}
                                                className={`fd-rate-card ${isHighest ? 'fd-rate-card-best' : ''} ${isSelected ? 'fd-rate-card-selected' : ''}`}
                                                data-testid={`rate-card-${group.slabKey}`}
                                                onClick={() => handleRateCardClick(slab)}
                                                style={{ cursor: 'pointer' }}
                                                title={`Click to select ${group.label} duration`}
                                            >
                                                {isHighest && <span className="fd-rate-badge">BEST</span>}
                                                {isSelected && !isHighest && <span className="fd-rate-badge fd-rate-badge-selected">SELECTED</span>}
                                                <div className="fd-rate-value">{rate.toFixed(2)}%</div>
                                                <div className="fd-rate-tenure">{group.label}</div>
                                                <div className="fd-rate-est">
                                                    {payoutOption === 'monthly' ? 'Monthly:' :
                                                        payoutOption === 'quarterly' ? 'Quarterly:' : 'Total Int.:'}
                                                    <span>
                                                        {payoutOption === 'maturity'
                                                            ? ` ${formatINR(cardResult.totalInterest)}`
                                                            : ` ${formatINR(cardResult.payoutPerPeriod)}`
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right: Summary Panel */}
                        <div className="fd-summary-panel" data-testid="fd-summary-panel">
                            <div className="fd-summary-header">
                                <Award size={22} />
                                <span>Your Returns</span>
                            </div>

                            <div className="fd-summary-highlight">
                                <div className="fd-summary-rate-label">Interest Rate</div>
                                <div className="fd-summary-rate-value">{calculation.interestRate.toFixed(2)}%<span> Per Annum</span></div>
                            </div>

                            <div className="fd-summary-grid">
                                <div className="fd-summary-row">
                                    <span className="fd-summary-key">Payout Type</span>
                                    <span className="fd-summary-val">{payoutLabel}</span>
                                </div>
                                <div className="fd-summary-row">
                                    <span className="fd-summary-key">Effective Yield</span>
                                    <span className="fd-summary-val">{calculation.effectiveYield}% <small>p.a.</small></span>
                                </div>
                                <div className="fd-summary-row">
                                    <span className="fd-summary-key">Maturity Amount</span>
                                    <span className="fd-summary-val fd-summary-val-lg">{formatINRFull(calculation.maturityAmount)}</span>
                                </div>
                                <div className="fd-summary-row">
                                    <span className="fd-summary-key">Total Interest</span>
                                    <span className="fd-summary-val fd-summary-val-accent">{formatINRFull(calculation.totalInterest)}</span>
                                </div>
                                {calculation.payoutPerPeriod != null && (
                                    <div className="fd-summary-row">
                                        <span className="fd-summary-key">
                                            {payoutOption === 'quarterly' ? 'Quarterly Payout' : 'Monthly Payout'}
                                        </span>
                                        <span className="fd-summary-val fd-summary-val-accent">
                                            {formatINRFull(calculation.payoutPerPeriod)}
                                        </span>
                                    </div>
                                )}
                                <div className="fd-summary-row">
                                    <span className="fd-summary-key">Duration</span>
                                    <span className="fd-summary-val">{calculation.duration}</span>
                                </div>
                                <div className="fd-summary-row">
                                    <span className="fd-summary-key">Maturity Date</span>
                                    <span className="fd-summary-val">{calculation.maturityDate}</span>
                                </div>
                            </div>

                            <div className="fd-summary-actions">
                                <button className="btn fd-btn-open" data-testid="btn-open-fd" onClick={handleOpenFD}>
                                    Open Fixed Deposit <ChevronRight size={16} />
                                </button>
                                <button className="btn fd-btn-rates" data-testid="btn-view-rates" onClick={handleViewAllRates}>
                                    View All Interest Rates
                                </button>
                            </div>

                            <div className="fd-summary-note">
                                <p>* Calculations are indicative and do not include TDS deductions.</p>
                                <p>* Effective Yield reflects annual return including compounding effects.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Active Deposits and Benefits in 2-col */}
                <div className="section fd-bottom-section fade-in" style={{ padding: '0 28px 20px', animationDelay: '0.1s' }}>
                    <div className="fd-bottom-grid">
                        {/* Active Deposits */}
                        <div className="card fd-active-card">
                            <div className="card-header">
                                <h2 className="card-title">
                                    <PiggyBank size={20} style={{ marginRight: 8, color: 'var(--blue-600)' }} />
                                    Your Active Deposits
                                </h2>
                                <span className="badge badge-blue">{activeFDs.length} Active</span>
                            </div>
                            <div className="fd-list">
                                {activeFDs.map(fd => {
                                    const progress = getProgress(fd.startDate, fd.maturityDate);
                                    // Calculate current period interest for payout display
                                    const fdRate = fd.rate;
                                    const fdPrincipal = fd.principal;
                                    const quarterlyPayout = Math.round(fdPrincipal * (fdRate / 100) / 4);
                                    const monthlyPayout = Math.round(fdPrincipal * (fdRate / 100) / 12);

                                    return (
                                        <div key={fd.id} className="fd-item" data-testid={`fd-item-${fd.id}`}>
                                            <div className="fd-item-main">
                                                <div className="fd-item-icon">
                                                    <Lock size={18} />
                                                </div>
                                                <div className="fd-item-info">
                                                    <div className="fd-item-name">{formatINRFull(fd.principal)} Deposit</div>
                                                    <div className="fd-item-meta">{fd.tenure} @ {fd.rate}% p.a.</div>
                                                    <div className="fd-item-payouts">
                                                        <span className="fd-payout-chip">
                                                            📅 Quarterly: {formatINRFull(quarterlyPayout)}
                                                        </span>
                                                        <span className="fd-payout-chip">
                                                            📆 Monthly: {formatINRFull(monthlyPayout)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="fd-item-val" style={{ minWidth: '120px' }}>
                                                    <div className="maturity-label">
                                                        <Calendar size={12} style={{ marginRight: 4 }} />
                                                        Matures {new Date(fd.maturityDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div className="maturity-amt">{formatINRFull(fd.maturityAmount)}</div>
                                                </div>
                                            </div>
                                            <div className="fd-progress-box">
                                                <div className="fd-progress-bar">
                                                    <div className="fd-progress-fill" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <span className="fd-progress-text">{progress}% completed</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Benefits Section */}
                        <div className="card fd-benefits-card">
                            <div className="card-header">
                                <h2 className="card-title">Why Choose Our Fixed Deposits?</h2>
                                <TrendingUp size={20} color="var(--success)" />
                            </div>
                            <div className="fd-benefits-list">
                                <div className="benefit-item">
                                    <div className="benefit-icon-wrap">
                                        <Shield size={20} />
                                    </div>
                                    <div className="benefit-text">
                                        <h3>Assured Returns</h3>
                                        <p>Predetermined and protected from market volatility.</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <div className="benefit-icon-wrap">
                                        <Lock size={20} />
                                    </div>
                                    <div className="benefit-text">
                                        <h3>Capital Safety</h3>
                                        <p>Principal is secure with institutional-grade protection.</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <div className="benefit-icon-wrap">
                                        <Globe size={20} />
                                    </div>
                                    <div className="benefit-text">
                                        <h3>Flexible Terms</h3>
                                        <p>Duration from 7 days to 10 years to match your goals.</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <div className="benefit-icon-wrap">
                                        <Percent size={20} />
                                    </div>
                                    <div className="benefit-text">
                                        <h3>Compounding Power</h3>
                                        <p>Reinvest interest for maximum wealth generation.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="fd-benefit-promo">
                                <Award size={16} />
                                <span>Voted #1 Fixed Deposit Provider 2025</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Success Toast ────────────── */}
            {showSuccessToast && (
                <div className="fd-toast fd-toast-success">
                    <CheckCircle size={18} />
                    <div>
                        <strong>Fixed Deposit Booked!</strong>
                        <p>{formatINRFull(openedFD?.principal)} @ {openedFD?.rate}% for {openedFD?.tenure}</p>
                    </div>
                    <button className="fd-toast-close" onClick={() => setShowSuccessToast(false)}><X size={14} /></button>
                </div>
            )}

            {/* ── All Interest Rates Modal ─── */}
            {showRatesModal && (
                <div className="fd-modal-overlay" onClick={() => setShowRatesModal(false)}>
                    <div className="fd-modal" onClick={e => e.stopPropagation()}>
                        <div className="fd-modal-header">
                            <h2><Info size={18} /> All Interest Rate Slabs</h2>
                            <button className="fd-modal-close" onClick={() => setShowRatesModal(false)}><X size={20} /></button>
                        </div>
                        <p className="fd-modal-subtitle">Rates effective March 2026. Senior citizen rates include an additional +0.50%.</p>
                        <div className="fd-modal-table-wrap">
                            <table className="fd-rates-table">
                                <thead>
                                    <tr>
                                        <th>Tenure</th>
                                        <th>General Rate</th>
                                        <th>Senior Citizen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {INTEREST_RATE_SLABS.map(slab => {
                                        const isCurrentSlab = durationDays >= slab.minDays && durationDays <= slab.maxDays;
                                        return (
                                            <tr
                                                key={slab.key}
                                                className={isCurrentSlab ? 'fd-rates-row-active' : ''}
                                                onClick={() => { handleRateCardClick(slab); setShowRatesModal(false); }}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to apply this tenure"
                                            >
                                                <td>{slab.label}</td>
                                                <td className="fd-rate-cell">{slab.general.toFixed(2)}% <small>p.a.</small></td>
                                                <td className="fd-rate-cell fd-rate-senior">{slab.senior.toFixed(2)}% <small>p.a.</small></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="fd-modal-note">* Click any row to apply that tenure in the calculator.</p>
                    </div>
                </div>
            )}
        </>
    );
}
