/**
 * PayToUser.jsx
 * 
 * Enables paying other users from a selectable list.
 * Includes amount input, optional note, and a confirmation step
 * before completing the transfer.
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { mockUsers } from "../data/mockData.js";
import { Send, CheckCircle2, X, Users } from "lucide-react";
import PayQRCode from "./PayQRCode.jsx";
import "./PayToUser.css";

export default function PayToUser({ onPaymentComplete }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showConfirm) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [showConfirm]);

    const filteredUsers = mockUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setError("");
        setIsSuccess(false);
    };

    const handleInitiatePayment = () => {
        if (!selectedUser) { setError("Please select a recipient"); return; }
        if (!amount || isNaN(amount) || Number(amount) <= 0) { setError("Enter a valid amount"); return; }
        setError("");
        setShowConfirm(true);
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 1200));

        const newTransaction = {
            id: `txn-pay-${Date.now()}`,
            customerId: selectedUser.id,
            date: new Date().toISOString().split("T")[0],
            description: `Payment to ${selectedUser.name}`,
            category: "Transfers",
            amount: -Number(amount),
            status: "Completed",
            type: "debit",
            note: note || ""
        };

        // Delegate persistence to the parent (Dashboard.handleTransferComplete)
        // which calls createTransaction + updates account balances.
        // DO NOT call createTransaction here — it would cause a double-save.
        if (onPaymentComplete) onPaymentComplete(newTransaction);

        setIsProcessing(false);
        setShowConfirm(false);
        setIsSuccess(true);
        setSelectedUser(null);
        setAmount("");
        setNote("");
    };

    // Render the modal via portal so it covers the ENTIRE viewport
    const confirmModal = showConfirm ? createPortal(
        <div className="ptu-modal-overlay" data-testid="payment-confirm-modal">
            <div className="ptu-modal">
                <button className="ptu-modal-close" onClick={() => setShowConfirm(false)} data-testid="btn-cancel-confirm">
                    <X size={18} />
                </button>
                <h3 className="ptu-modal-title">Confirm Payment</h3>
                <div className="ptu-modal-details">
                    <div className="ptu-modal-row">
                        <span>Recipient</span>
                        <strong>{selectedUser?.name}</strong>
                    </div>
                    <div className="ptu-modal-row">
                        <span>Account</span>
                        <strong>{selectedUser?.accountNumber}</strong>
                    </div>
                    <div className="ptu-modal-row">
                        <span>Amount</span>
                        <strong className="ptu-modal-amount">${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                    </div>
                    {note && (
                        <div className="ptu-modal-row">
                            <span>Note</span>
                            <strong>{note}</strong>
                        </div>
                    )}
                </div>
                <div className="ptu-modal-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setShowConfirm(false)} data-testid="btn-cancel-payment">
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirmPayment}
                        disabled={isProcessing}
                        data-testid="btn-confirm-payment"
                    >
                        {isProcessing ? <span className="spinner" /> : <CheckCircle2 size={16} />}
                        {isProcessing ? "Processing..." : "Confirm & Send"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="card" data-testid="pay-to-user-section">
            <div className="card-header">
                <h2 className="card-title">Pay to User</h2>
                <Users size={20} color="var(--blue-600)" />
            </div>

            {isSuccess && (
                <div className="ptu-success" data-testid="payment-success-msg">
                    <CheckCircle2 size={18} color="var(--success)" />
                    <span>Payment sent successfully! The transfer history has been updated.</span>
                </div>
            )}

            {/* Search users */}
            <input
                type="text"
                className="form-input ptu-search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-user-search"
            />

            {/* User list */}
            <div className="ptu-user-list" data-testid="user-list">
                {filteredUsers.map(user => (
                    <div
                        key={user.id}
                        className={`ptu-user-item ${selectedUser?.id === user.id ? "selected" : ""}`}
                        onClick={() => handleSelectUser(user)}
                        data-testid={`user-item-${user.id}`}
                    >
                        <div className="ptu-avatar">{user.avatar}</div>
                        <div className="ptu-user-info">
                            <div className="ptu-user-name">{user.name}</div>
                            <div className="ptu-user-email">{user.email} · {user.accountNumber}</div>
                        </div>
                        {selectedUser?.id === user.id && (
                            <CheckCircle2 size={18} color="var(--success)" className="ptu-check" />
                        )}
                    </div>
                ))}
            </div>

            {/* Amount & Note (only when user is selected) */}
            {selectedUser && (
                <div className="ptu-payment-form fade-in">
                    <div className="form-group">
                        <label className="form-label">Amount ($)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={`form-input ${error ? "error" : ""}`}
                            placeholder="0.00"
                            value={amount}
                            onChange={e => { setAmount(e.target.value); setError(""); }}
                            data-testid="input-pay-amount"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Note (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Lunch split, Rent share..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            maxLength={100}
                            data-testid="input-pay-note"
                        />
                    </div>
                    {error && <span className="form-error">{error}</span>}
                    <button
                        className="btn btn-primary ptu-send-btn"
                        onClick={handleInitiatePayment}
                        data-testid="btn-send-payment"
                    >
                        <Send size={16} /> Send Payment
                    </button>
                </div>
            )}

            {confirmModal}
            <PayQRCode />
        </div>
    );
}

