import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowRight, CheckCircle, AlertCircle,
    ShieldCheck, Zap, Star, Gift, Shield, Lock, BellRing,
    Smartphone, Settings2, ChevronRight, X, PlusCircle, FileText, History as HistoryIcon,
    RefreshCcw, CreditCard as CardIcon
} from 'lucide-react';
import { updateAccount, updateAccountBalance, createAccount, getAccounts, deleteAccount, getTransactions, createTransaction } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './CreditCardPage.css';

export default function CreditCardPage({ accounts: initialAccounts = [], onTransferComplete, onAccountsRefresh }) {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState(initialAccounts);
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showStatement, setShowStatement] = useState(false);
    const [showManualTxnModal, setShowManualTxnModal] = useState(false);
    const [newLimit, setNewLimit] = useState('');
    const [statementTxns, setStatementTxns] = useState([]);
    const [manualTxn, setManualTxn] = useState({ description: '', category: 'Shopping', amount: '' });

    const lastParentAccounts = useRef(initialAccounts);

    // Sync from parent only when the prop actually changes from what we last processed
    useEffect(() => {
        if (JSON.stringify(initialAccounts) !== JSON.stringify(lastParentAccounts.current)) {
            setAccounts(initialAccounts);
            lastParentAccounts.current = initialAccounts;
        }
    }, [initialAccounts]);

    const creditCard    = accounts.find(acc => acc.type === 'credit');
    const fundingAccounts = accounts.filter(acc => acc.type === 'checking' || acc.type === 'savings');

    // Auto-select first funding account
    useEffect(() => {
        if (fundingAccounts.length > 0 && !sourceAccountId) {
            setSourceAccountId(fundingAccounts[0].id);
        }
    }, [accounts]);

    // Auto-clear status notifications after 30 seconds
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => {
                setStatus({ type: '', message: '' });
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const sourceAccount = fundingAccounts.find(a => a.id === sourceAccountId);
    const dueAmount = creditCard ? Math.max(0, -creditCard.balance) : 0;
    const availableLimit = creditCard ? Math.min(creditCard.limit || 0, (creditCard.limit || 0) + creditCard.balance) : 0;


    const refreshData = async (silent = false) => {
        if (!user?.id) return;
        setIsProcessing(true);
        try {
            const data = await getAccounts({ userId: user.id });
            lastParentAccounts.current = data; 
            setAccounts(data);
            if (onAccountsRefresh) onAccountsRefresh(data);
            if (!silent) setStatus({ type: 'success', message: 'Data refreshed successfully' });
        } catch (err) {
            if (!silent) setStatus({ type: 'error', message: 'Failed to refresh data' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        const payAmount = parseFloat(amount);
        if (dueAmount <= 0) { setStatus({ type: 'error', message: 'No pending amount due' }); return; }
        if (!payAmount || payAmount <= 0) { setStatus({ type: 'error', message: 'Please enter a valid amount' }); return; }
        if (!creditCard) { setStatus({ type: 'error', message: 'No credit card found' }); return; }
        if (creditCard.status === 'blocked') { setStatus({ type: 'error', message: 'This card is blocked' }); return; }
        if (!sourceAccount || sourceAccount.balance < payAmount) {
            setStatus({ type: 'error', message: 'Insufficient funds in source account' }); return;
        }
        setIsProcessing(true);
        setStatus({ type: '', message: '' });
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Debit transaction — money leaves the source (checking/savings) account
            const debitTxn = {
                id: `txn-cc-debit-${Date.now()}`,
                userId: user.id,
                date: today,
                description: `Credit Card Payment - ${creditCard.name}`,
                category: 'Credit Card',
                amount: -payAmount,         // negative = money going out
                status: 'Completed',
                type: 'debit',
                fromAccountId: sourceAccountId,
                toAccountId: creditCard.id,
                accountId: sourceAccountId  // belongs to the source account's ledger
            };

            // 2. Credit transaction — payment reduces the outstanding balance on the card
            const creditTxn = {
                id: `txn-cc-credit-${Date.now() + 1}`,
                userId: user.id,
                date: today,
                description: `Payment Received - ${sourceAccount.name}`,
                category: 'Credit Card',
                amount: +payAmount,         // positive = debt reduced / money coming in
                status: 'Completed',
                type: 'credit',
                fromAccountId: sourceAccountId,
                toAccountId: creditCard.id,
                accountId: creditCard.id    // belongs to the credit card's ledger
            };

            // Save both transaction records
            await createTransaction(debitTxn);
            await createTransaction(creditTxn);

            // Update both account balances in the DB
            const [updatedSource, updatedCard] = await Promise.all([
                updateAccountBalance(sourceAccountId, -payAmount),  // debit source
                updateAccountBalance(creditCard.id, +payAmount),    // credit card (debt reduces)
            ]);

            // Update local state immediately for snappy UI
            const updatedAccounts = accounts.map(acc => {
                if (acc.id === sourceAccountId) return updatedSource;
                if (acc.id === creditCard.id) return updatedCard;
                return acc;
            });
            setAccounts(updatedAccounts);
            lastParentAccounts.current = updatedAccounts;
            if (onAccountsRefresh) onAccountsRefresh(updatedAccounts);

            setStatus({ type: 'success', message: `Successfully paid $${payAmount.toLocaleString()} to ${creditCard.name}` });
            setAmount('');
            await refreshData(true); // Silent refresh to sync with DB
        } catch (err) {
            setStatus({ type: 'error', message: 'Payment failed. Please try again.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateLimit = async () => {
        if (!newLimit || isNaN(newLimit)) { setStatus({ type: 'error', message: 'Please enter a valid number' }); return; }
        try {
            setIsProcessing(true);
            const updatedAccount = await updateAccount(creditCard.id, { limit: parseFloat(newLimit) });
            
            // Update local state immediately
            const updatedAccounts = accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc);
            setAccounts(updatedAccounts);
            lastParentAccounts.current = updatedAccounts;
            
            // Notify parent
            if (onAccountsRefresh) onAccountsRefresh(updatedAccounts);

            setStatus({ type: 'success', message: `Your credit limit for ${creditCard.name} has been increased to $${parseFloat(newLimit).toLocaleString()}!` });
            setShowLimitModal(false);
            setNewLimit('');
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to update limit: ' + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRequestStatement = async () => {
        if (!creditCard || !user?.id) return;
        setIsProcessing(true);
        try {
            const allTxns = await getTransactions({ userId: user.id });
            // Filter for transactions belonging to this card
            // We check both fromAccountId and toAccountId (for payments)
            const cardTxns = allTxns.filter(t => 
                t.accountId === creditCard.id || 
                t.fromAccountId === creditCard.id || 
                t.toAccountId === creditCard.id
            ).sort((a, b) => new Date(b.date) - new Date(a.date));

            setStatementTxns(cardTxns);
            setShowStatement(true);
            setStatus({ type: 'success', message: `Found ${cardTxns.length} transactions for your ${creditCard.name}.` });
            
            // Scroll to statement after a short delay to allow render
            setTimeout(() => {
                const element = document.getElementById('cc-statement-section');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to fetch statement.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualTransaction = async (e) => {
        e.preventDefault();
        const amt = parseFloat(manualTxn.amount);
        if (!amt || amt <= 0) { setStatus({ type: 'error', message: 'Please enter a valid amount' }); return; }
        if (!manualTxn.description) { setStatus({ type: 'error', message: 'Please enter a description' }); return; }
        
        setIsProcessing(true);
        try {
            const newTxn = {
                id: `txn-man-${Date.now()}`,
                customerId: 'CID-001',
                userId: user.id,
                date: new Date().toISOString().split('T')[0],
                description: manualTxn.description,
                category: manualTxn.category,
                amount: -amt, // Purchase is negative
                status: 'Completed',
                type: 'debit',
                accountId: creditCard.id
            };
            
            // 1. Create transaction record
            await createTransaction(newTxn);
            
            // 2. Update card balance in DB
            const updatedAccount = await updateAccount(creditCard.id, { balance: creditCard.balance - amt });
            
            // 3. Update local state immediately
            const updatedAccounts = accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc);
            setAccounts(updatedAccounts);
            lastParentAccounts.current = updatedAccounts;
            if (onAccountsRefresh) onAccountsRefresh(updatedAccounts);

            setStatus({ type: 'success', message: `Recorded ${manualTxn.description} of $${amt.toLocaleString()} on ${creditCard.name}` });
            setManualTxn({ description: '', category: 'Shopping', amount: '' });
            setShowManualTxnModal(false);
            
            // 4. Refresh other data (like transactions) silently
            await refreshData(true);
            if (showStatement) await handleRequestStatement(); 
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to record transaction: ' + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyNewCard = async (type) => {
        try {
            setIsProcessing(true);
            const cardNames = { gold: 'Gold Rewards Card', platinum: 'Platinum Credit Card', travel: 'Global Traveler Card' };
            const newCard = {
                id: `acc-${Date.now()}`,
                name: cardNames[type],
                number: `****${Math.floor(1000 + Math.random() * 9000)}`,
                balance: 0,
                type: 'credit',
                limit: type === 'gold' ? 30000 : type === 'platinum' ? 70000 : 50000,
                color: type === 'gold' ? '#F59E0B' : type === 'platinum' ? '#4F46E5' : '#10B981',
                status: 'active',
                userId: user.id
            };
            const savedCard = await createAccount(newCard);
            const cardToAdd = savedCard?.id ? savedCard : newCard;
            const updatedAccounts = [...accounts, cardToAdd];
            lastParentAccounts.current = updatedAccounts; 
            setAccounts(updatedAccounts);
            if (onAccountsRefresh) onAccountsRefresh(updatedAccounts);
            setStatus({ type: 'success', message: `Your application for ${cardToAdd.name} has been approved!` });
            setShowApplyModal(false);
        } catch (err) {
            setStatus({ type: 'error', message: `Application failed: ${err.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="credit-card-page fade-in">

            {/* Status Banner */}
            {status.message && (
                <div
                    className={`notif-item ${status.type === 'success' ? 'notif-read' : 'notif-unread'}`}
                    style={{ marginBottom: '24px', borderRadius: '12px', padding: '14px 18px' }}
                >
                    {status.type === 'success'
                        ? <CheckCircle size={20} color="var(--success)" />
                        : <AlertCircle size={20} color="var(--danger)" />}
                    <div className="notif-body">
                        <div className="notif-item-message" style={{ fontWeight: 600 }}>{status.message}</div>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setStatus({ type: '', message: '' })}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Top Row: Card Visual + Info */}
            <div className="cc-top-grid">

                {/* Credit Card Visual */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)' }}>
                        <h2 className="card-title">My Credit Card</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-outline btn-sm" onClick={refreshData} disabled={isProcessing}>
                                <RefreshCcw size={15} className={isProcessing ? 'spin' : ''} />
                                <span style={{ marginLeft: 6 }}>Refresh</span>
                            </button>
                            {!creditCard && (
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowApplyModal(true)}>
                                    <PlusCircle size={15} style={{ marginRight: 6 }} /> Apply Now
                                </button>
                            )}
                        </div>
                    </div>

                    {creditCard ? (
                        <div style={{ padding: '28px 24px 24px' }}>
                            {/* Physical Card */}
                            <div
                                className={`cc-card ${creditCard.status === 'blocked' ? 'blocked' : ''}`}
                                style={{
                                    background: creditCard.color
                                        ? `linear-gradient(135deg, ${creditCard.color} 0%, ${creditCard.color}cc 100%)`
                                        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    width: '100%',
                                    maxWidth: '420px',
                                    margin: '0 auto',
                                    opacity: creditCard.status === 'blocked' ? 0.75 : 1
                                }}
                            >
                                <div className="cc-card-header">
                                    <span className="cc-bank-name">{creditCard.name.toUpperCase()}</span>
                                    <CardIcon size={32} />
                                </div>
                                <div className="cc-chip"></div>
                                <div className="cc-number">{creditCard.number}</div>
                                <div className="cc-footer">
                                    <div className="cc-holder">
                                        <div className="cc-holder-label">Card Holder</div>
                                        <div className="cc-holder-name">{user?.name?.toUpperCase() || 'TEST USER'}</div>
                                    </div>
                                    <div className="cc-expiry">
                                        <div className="cc-expiry-label">Expires</div>
                                        <div className="cc-expiry-date">12/28</div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance & Limit Info */}
                            <div className="cc-info-grid" style={{ marginTop: '24px' }}>
                                <div className="cc-info-item balance-item">
                                    <div className="cc-info-label">Amount Due</div>
                                    <div className="cc-info-value debit">
                                        ${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="cc-info-item limit-item">
                                    <div className="cc-info-label">Total Credit Limit</div>
                                    <div className="cc-info-value" style={{ color: 'var(--gray-700)' }}>
                                        ${(creditCard.limit || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="cc-info-item limit-item">
                                    <div className="cc-info-label">Available Limit</div>
                                    <div className="cc-info-value credit">
                                        ${availableLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                            <AlertCircle size={48} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--blue-400)' }} />
                            <h3 style={{ color: 'var(--blue-700)', marginBottom: '8px' }}>No Credit Card Found</h3>
                            <p style={{ color: 'var(--gray-500)', marginBottom: '20px' }}>Apply for a card to get started.</p>
                            <button className="btn btn-secondary" onClick={() => setShowApplyModal(true)}>
                                <PlusCircle size={16} style={{ marginRight: 8 }} /> Apply Now
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Pay */}
                <div className="card cc-payment-card">
                    <div className="cc-payment-header">
                        <Zap size={22} color="var(--blue-600)" />
                        <h2 className="cc-payment-title">Quick Pay</h2>
                    </div>

                    <form onSubmit={handlePayment}>
                        <div className="cc-form-group">
                            <label className="cc-label">Pay From Account</label>
                            <select
                                className="cc-select"
                                value={sourceAccountId}
                                onChange={(e) => setSourceAccountId(e.target.value)}
                                disabled={!fundingAccounts.length || !creditCard || creditCard.status === 'blocked'}
                            >
                                {fundingAccounts.length ? fundingAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.number}) — ${acc.balance.toLocaleString()}
                                    </option>
                                )) : <option>No funding accounts available</option>}
                            </select>
                        </div>

                        <div className="cc-form-group">
                            <label className="cc-label">Amount to Pay</label>
                            <div className="fd-amount-input-wrap">
                                <span className="fd-rupee-sign">$</span>
                                <input
                                    type="number"
                                    className="cc-input"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={!creditCard || creditCard.status === 'blocked'}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setAmount(dueAmount.toString())}
                                    disabled={!creditCard || creditCard.status === 'blocked' || dueAmount <= 0}
                                >
                                    Pay Full
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setAmount((dueAmount * 0.1).toFixed(2))}
                                    disabled={!creditCard || creditCard.status === 'blocked' || dueAmount <= 0}
                                >
                                    Pay Min (10%)
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="cc-pay-btn"
                            disabled={isProcessing || !amount || !creditCard || creditCard.status === 'blocked' || dueAmount <= 0}
                        >
                            {isProcessing ? 'Processing...' : 'Make Payment'}
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="fd-summary-note" style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <ShieldCheck size={14} color="var(--success)" />
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Secure Transaction</span>
                        </div>
                        <p style={{ fontSize: '0.82rem' }}>
                            Payments are processed instantly and your available limit updates immediately.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Perks + Card Settings */}
            <div className="cc-bottom-grid" style={{ marginTop: '28px' }}>

                {/* Card Benefits */}
                <div className="card" style={{ padding: '24px' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h2 className="card-title">
                            <Star size={18} style={{ marginRight: 8, color: '#f59e0b' }} />
                            Card Benefits &amp; Perks
                        </h2>
                    </div>
                    <div className="perks-list">
                        <div className="perk-item">
                            <div className="perk-icon"><Gift size={20} /></div>
                            <div className="perk-content">
                                <div className="perk-title">5x Reward Points</div>
                                <div className="perk-desc">Earn points for every $1 spent on dining.</div>
                            </div>
                        </div>
                        <div className="perk-item">
                            <div className="perk-icon"><Shield size={20} /></div>
                            <div className="perk-content">
                                <div className="perk-title">Zero Liability</div>
                                <div className="perk-desc">No responsibility for unauthorized charges.</div>
                            </div>
                        </div>
                        <div className="perk-item">
                            <div className="perk-icon"><Smartphone size={20} /></div>
                            <div className="perk-content">
                                <div className="perk-title">Contactless Pay</div>
                                <div className="perk-desc">Tap and pay securely worldwide.</div>
                            </div>
                        </div>
                        <div className="perk-item">
                            <div className="perk-icon"><BellRing size={20} /></div>
                            <div className="perk-content">
                                <div className="perk-title">Instant Alerts</div>
                                <div className="perk-desc">Real-time notifications for every transaction.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Settings */}
                <div className="card" style={{ padding: '24px' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h2 className="card-title">
                            <Settings2 size={18} style={{ marginRight: 8, color: 'var(--blue-600)' }} />
                            Card Settings
                        </h2>
                    </div>

                    {creditCard ? (
                        <div className="management-actions">
                            <button
                                className="management-btn"
                                onClick={() => setShowLimitModal(true)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ArrowRight size={18} /> <span>Manage Credit Limit</span>
                                </div>
                                <ChevronRight size={16} />
                            </button>
                                <button className="management-btn" onClick={handleRequestStatement}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FileText size={18} /> <span>View Card Statement</span>
                                    </div>
                                    <ChevronRight size={16} />
                                </button>
                                <button className="management-btn" style={{ color: 'var(--blue-600)' }} onClick={() => setShowManualTxnModal(true)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <PlusCircle size={18} /> <span>Record New Purchase</span>
                                    </div>
                                    <ChevronRight size={16} />
                                </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <p style={{ color: 'var(--gray-400)', marginBottom: '16px' }}>No active credit card.</p>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowApplyModal(true)}>
                                <PlusCircle size={15} style={{ marginRight: 6 }} /> Apply for a Card
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Statement Section ── */}
            {showStatement && (
                <div id="cc-statement-section" className="card fade-in" style={{ marginTop: '24px', padding: '24px' }}>
                    <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="card-title">
                            <HistoryIcon size={20} style={{ marginRight: 8, color: 'var(--blue-600)' }} />
                            Card Statement — {creditCard?.name}
                        </h2>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowStatement(false)}>
                            Close Statement
                        </button>
                    </div>

                    <div className="cc-statement-container">
                        {statementTxns.length > 0 ? (
                            <table className="cc-statement-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statementTxns.map((txn, idx) => (
                                        <tr key={txn.id || idx}>
                                            <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{txn.date}</td>
                                            <td style={{ fontWeight: 600 }}>{txn.description}</td>
                                            <td>
                                                <span className="badge badge-outline">{txn.category}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: txn.amount < 0 ? 'var(--danger)' : 'var(--success)' }}>
                                                {txn.amount < 0 ? '-' : '+'}${Math.abs(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
                                No transactions found for this billing period.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Manage Limit Modal */}
            {showLimitModal && creditCard && (
                <div className="fd-modal-overlay" onClick={() => setShowLimitModal(false)}>
                    <div className="fd-modal" onClick={e => e.stopPropagation()}>
                        <div className="fd-modal-header">
                            <h2>Manage Credit Limit</h2>
                            <button className="fd-modal-close" onClick={() => setShowLimitModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '16px', color: 'var(--gray-600)' }}>
                                Current Limit: <strong>${creditCard.limit?.toLocaleString()}</strong>
                            </p>
                            <div className="cc-form-group">
                                <label className="cc-label">New Requested Limit ($)</label>
                                <input
                                    type="number"
                                    className="cc-input"
                                    value={newLimit}
                                    onChange={(e) => setNewLimit(e.target.value)}
                                    placeholder="Enter new limit"
                                />
                            </div>
                            <button className="cc-pay-btn" onClick={handleUpdateLimit} disabled={isProcessing}>
                                {isProcessing ? 'Updating...' : 'Update Limit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Apply New Card Modal */}
            {showApplyModal && (
                <div className="fd-modal-overlay" onClick={() => setShowApplyModal(false)}>
                    <div className="fd-modal" onClick={e => e.stopPropagation()}>
                        <div className="fd-modal-header">
                            <h2>Apply for a Credit Card</h2>
                            <button className="fd-modal-close" onClick={() => setShowApplyModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '20px', color: 'var(--gray-600)' }}>Instant approval for eligible customers!</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { type: 'platinum', label: 'Platinum Credit Card', color: '#6366F1', detail: 'Limit: $70,000 · Premium rewards & travel perks' },
                                    { type: 'gold', label: 'Gold Rewards Card', color: '#D4AF37', detail: 'Limit: $30,000 · Great for everyday spending' },
                                    { type: 'travel', label: 'Global Traveler Card', color: '#10B981', detail: 'Limit: $50,000 · Zero forex fees worldwide' },
                                ].map(({ type, label, color, detail }) => (
                                    <div
                                        key={type}
                                        className="card"
                                        style={{ padding: '16px', cursor: 'pointer', border: '1px solid var(--gray-200)', transition: 'border-color 0.2s' }}
                                        onClick={() => handleApplyNewCard(type)}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = color}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-200)'}
                                    >
                                        <div style={{ fontWeight: 700, color, marginBottom: '4px' }}>{label}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{detail}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Purchase Modal */}
            {showManualTxnModal && creditCard && (
                <div className="fd-modal-overlay" onClick={() => setShowManualTxnModal(false)}>
                    <div className="fd-modal" onClick={e => e.stopPropagation()}>
                        <div className="fd-modal-header">
                            <h2>Record New Purchase</h2>
                            <button className="fd-modal-close" onClick={() => setShowManualTxnModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleManualTransaction} style={{ padding: '20px' }}>
                            <div className="cc-form-group">
                                <label className="cc-label">Description</label>
                                <input
                                    type="text"
                                    className="cc-input"
                                    value={manualTxn.description}
                                    onChange={(e) => setManualTxn({ ...manualTxn, description: e.target.value })}
                                    placeholder="e.g. Apple Store, Starbucks"
                                    required
                                />
                            </div>
                            <div className="cc-form-group">
                                <label className="cc-label">Category</label>
                                <select
                                    className="cc-select"
                                    value={manualTxn.category}
                                    onChange={(e) => setManualTxn({ ...manualTxn, category: e.target.value })}
                                >
                                    <option value="Shopping">Shopping</option>
                                    <option value="Dining">Dining</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Groceries">Groceries</option>
                                    <option value="Bills">Bills</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="cc-form-group">
                                <label className="cc-label">Amount ($)</label>
                                <input
                                    type="number"
                                    className="cc-input"
                                    value={manualTxn.amount}
                                    onChange={(e) => setManualTxn({ ...manualTxn, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <button type="submit" className="cc-pay-btn" disabled={isProcessing}>
                                {isProcessing ? 'Recording...' : 'Add Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
