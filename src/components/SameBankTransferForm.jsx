/**
 * SameBankTransferForm.jsx
 * 
 * Handles transfers to other accounts within the same bank using account numbers.
 * Provides manual input for recipient details.
 */

import { useState, useEffect } from "react";
import { Building2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { sameBankTransfer } from "../api.js";
import "./TransferForm.css"; // Reuse common transfer styles

export default function SameBankTransferForm({ onTransferComplete, accounts = [], user }) {
    const filteredAccounts = accounts.filter(acc => acc.type !== 'credit' && acc.type !== 'investment');
    
    const [formData, setFormData] = useState({
        fromAccountId: "",
        recipientAccount: "",
        recipientName: "",
        amount: "",
        note: ""
    });

    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successName, setSuccessName] = useState('');

    useEffect(() => {
        if (filteredAccounts.length > 0 && !formData.fromAccountId) {
            setFormData(prev => ({ ...prev, fromAccountId: filteredAccounts[0].id }));
        }
    }, [filteredAccounts]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
        setIsSuccess(false);
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.fromAccountId) newErrors.fromAccountId = "Select source account";
        if (!formData.recipientAccount) newErrors.recipientAccount = "Enter recipient account number";
        if (formData.recipientAccount.length < 8) newErrors.recipientAccount = "Account number too short";
        if (!formData.recipientName) newErrors.recipientName = "Enter recipient name";
        if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
            newErrors.amount = "Enter a valid amount";
        } else {
            const fromAcc = filteredAccounts.find(a => a.id === formData.fromAccountId);
            if (fromAcc && fromAcc.balance < Number(formData.amount)) {
                newErrors.amount = `Insufficient funds. Available: $${fromAcc.balance.toFixed(2)}`;
            }
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsProcessing(true);
        try {
            const result = await sameBankTransfer({
                fromAccountId: formData.fromAccountId,
                toAccountNum: formData.recipientAccount,
                amount: Number(formData.amount),
                senderUserId: user?.id,
                senderName: user?.name,
                note: formData.note || '',
                date: new Date().toISOString().split('T')[0],
            });

            // Notify parent (Dashboard) to update sender's local balance
            if (onTransferComplete) {
                await onTransferComplete({
                    id: result.debitTxn?.id || `txn-sb-${Date.now()}`,
                    fromAccountId: formData.fromAccountId,
                    toAccountNum: formData.recipientAccount,
                    amount: -Number(formData.amount),
                    category: 'Transfers',
                    type: 'debit',
                    status: 'Completed',
                    date: new Date().toISOString().split('T')[0],
                    description: formData.note || `Transfer to ${formData.recipientName}`,
                    _serverHandled: true, // flag so Dashboard skips creating transaction again
                });
            }

            setSuccessName(formData.recipientName || `account ${formData.recipientAccount}`);
            setIsSuccess(true);
            setFormData(prev => ({
                ...prev,
                recipientAccount: '',
                recipientName: '',
                amount: '',
                note: ''
            }));
        } catch (err) {
            setErrors({ submit: err.message || 'Transfer failed. Please try again.' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="card same-bank-transfer" data-testid="same-bank-transfer-section">
            <div className="card-header">
                <h2 className="card-title">Transfer to Account</h2>
                <Building2 size={20} color="var(--blue-600)" />
            </div>

            {isSuccess && (
                <div className="transfer-success" data-testid="sb-transfer-success-msg" style={{ marginBottom: '20px' }}>
                    <CheckCircle2 size={20} color="var(--success)" />
                    <span>Transfer completed! <strong>{successName}</strong>'s account has been credited.</span>
                </div>
            )}
            {errors.submit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#FEE2E2', borderRadius: '10px', color: '#DC2626', marginBottom: '16px', fontSize: '0.9rem' }}>
                    <AlertCircle size={18} />
                    <span>{errors.submit}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label className="form-label">From Account</label>
                    <select
                        name="fromAccountId"
                        className="form-input form-select"
                        value={formData.fromAccountId}
                        onChange={handleInputChange}
                        data-testid="select-sb-from-account"
                    >
                        {filteredAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} — ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="transfer-row">
                    <div className="form-group" style={{ flex: 1.5 }}>
                        <label className="form-label">Recipient Account Number</label>
                        <input
                            type="text"
                            name="recipientAccount"
                            className={`form-input ${errors.recipientAccount ? "error" : ""}`}
                            placeholder="Enter 10-12 digit account number"
                            value={formData.recipientAccount}
                            onChange={handleInputChange}
                            data-testid="input-sb-recipient-acc"
                        />
                        {errors.recipientAccount && <span className="form-error">{errors.recipientAccount}</span>}
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Recipient Name</label>
                        <input
                            type="text"
                            name="recipientName"
                            className={`form-input ${errors.recipientName ? "error" : ""}`}
                            placeholder="e.g. John Doe"
                            value={formData.recipientName}
                            onChange={handleInputChange}
                            data-testid="input-sb-recipient-name"
                        />
                        {errors.recipientName && <span className="form-error">{errors.recipientName}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Amount ($)</label>
                    <input
                        type="number"
                        name="amount"
                        className={`form-input ${errors.amount ? "error" : ""}`}
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleInputChange}
                        data-testid="input-sb-amount"
                    />
                    {errors.amount && <span className="form-error">{errors.amount}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label">Note (Optional)</label>
                    <input
                        type="text"
                        name="note"
                        className="form-input"
                        placeholder="e.g. Rent, Gift..."
                        value={formData.note}
                        onChange={handleInputChange}
                        maxLength={100}
                        data-testid="input-sb-note"
                    />
                </div>

                <div className="transfer-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isProcessing}
                        data-testid="btn-sb-transfer-submit"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {isProcessing ? <span className="spinner" /> : <Send size={16} />}
                        {isProcessing ? "Processing..." : "Transfer Funds"}
                    </button>
                </div>
            </form>
        </div>
    );
}
