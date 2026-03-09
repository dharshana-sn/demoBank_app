/**
 * TransferForm.jsx
 * 
 * This component handles the internal movement of funds between user accounts.
 * Includes validation to prevent self-transfers, negative amounts, or empty selections.
 * Provides real-time feedback and a simulated loading state for improved UX.
 */

import { useState, useEffect } from "react";
import { getAccounts } from "../api.js";
import { Send, CheckCircle2 } from "lucide-react";
import "./TransferForm.css";

export default function TransferForm({ onTransferComplete }) {
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        getAccounts().then(setAccounts).catch(console.error);
    }, []);

    // Initial state for the transfer process
    const [transferFormData, setTransferFormData] = useState({
        from: "",
        to: "",
        amount: "",
        note: "",
        priority: "normal"
    });

    const [inputErrors, setInputErrors] = useState({});
    const [isTransferSuccessful, setIsTransferSuccessful] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFormInputChange = (event) => {
        const { name, value } = event.target;

        setTransferFormData(previousData => ({
            ...previousData,
            [name]: value
        }));

        // Clear errors as the user types
        setInputErrors(previousErrors => ({
            ...previousErrors,
            [name]: ""
        }));

        setIsTransferSuccessful(false);
    };

    const validateTransfer = () => {
        const foundErrors = {};

        if (!transferFormData.from) {
            foundErrors.from = "Please select source account";
        }

        if (!transferFormData.to) {
            foundErrors.to = "Please select destination account";
        }

        if (transferFormData.from && transferFormData.to && transferFormData.from === transferFormData.to) {
            foundErrors.to = "Cannot transfer to same account";
        }

        if (!transferFormData.amount) {
            foundErrors.amount = "Enter transfer amount";
        } else if (isNaN(transferFormData.amount) || Number(transferFormData.amount) <= 0) {
            foundErrors.amount = "Enter a valid positive amount";
        }

        return foundErrors;
    };

    const handleTransferSubmit = async (event) => {
        event.preventDefault();

        const errors = validateTransfer();
        if (Object.keys(errors).length > 0) {
            setInputErrors(errors);
            return;
        }

        setIsProcessing(true);
        // Simulate a short network delay for realism
        await new Promise(resolve => setTimeout(resolve, 1200));

        setIsTransferSuccessful(true);
        setIsProcessing(false);

        // Create a new transaction for the transfer history
        const fromAccount = mockAccounts.find(a => a.id === transferFormData.from);
        const toAccount = mockAccounts.find(a => a.id === transferFormData.to);
        const newTransaction = {
            id: `txn-tf-${Date.now()}`,
            customerId: "CID-101",
            date: new Date().toISOString().split("T")[0],
            description: `Transfer: ${fromAccount?.name || "Account"} → ${toAccount?.name || "Account"}`,
            category: "Transfers",
            amount: -Number(transferFormData.amount),
            status: "Completed",
            type: "debit",
            note: transferFormData.note || ""
        };

        if (onTransferComplete) onTransferComplete(newTransaction);

        // Reset the form to its original blank state
        setTransferFormData({ from: "", to: "", amount: "", note: "", priority: "normal" });
    };

    const handleFormReset = () => {
        setTransferFormData({ from: "", to: "", amount: "", note: "", priority: "normal" });
        setInputErrors({});
        setIsTransferSuccessful(false);
    };

    const availableAccountOptions = accounts.map(account => (
        <option key={account.id} value={account.id}>
            {account.name} ({account.number})
        </option>
    ));

    return (
        <div className="card" data-testid="transfer-form-section">
            <div className="card-header">
                <h2 className="card-title">Fund Transfer</h2>
                <Send size={20} color="var(--blue-600)" />
            </div>

            {isTransferSuccessful && (
                <div className="transfer-success" data-testid="transfer-success-msg">
                    <CheckCircle2 size={20} color="var(--success)" />
                    <span>Transfer initiated successfully! You'll receive a confirmation shortly.</span>
                </div>
            )}

            <form onSubmit={handleTransferSubmit} data-testid="transfer-form" noValidate>
                <div className="form-group">
                    <label className="form-label" htmlFor="from">From Account</label>
                    <select
                        id="from"
                        name="from"
                        className={`form-input form-select ${inputErrors.from ? "error" : ""}`}
                        value={transferFormData.from}
                        onChange={handleFormInputChange}
                        data-testid="select-from-account"
                    >
                        <option value="">Select source account</option>
                        {availableAccountOptions}
                    </select>
                    {inputErrors.from && <span className="form-error">{inputErrors.from}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="to">To Account</label>
                    <select
                        id="to"
                        name="to"
                        className={`form-input form-select ${inputErrors.to ? "error" : ""}`}
                        value={transferFormData.to}
                        onChange={handleFormInputChange}
                        data-testid="select-to-account"
                    >
                        <option value="">Select destination account</option>
                        {availableAccountOptions}
                    </select>
                    {inputErrors.to && <span className="form-error">{inputErrors.to}</span>}
                </div>

                <div className="transfer-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label" htmlFor="amount">Amount ($)</label>
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={`form-input ${inputErrors.amount ? "error" : ""}`}
                            placeholder="0.00"
                            value={transferFormData.amount}
                            onChange={handleFormInputChange}
                            data-testid="input-transfer-amount"
                        />
                        {inputErrors.amount && <span className="form-error">{inputErrors.amount}</span>}
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label" htmlFor="priority">Priority</label>
                        <select
                            id="priority"
                            name="priority"
                            className="form-input form-select"
                            value={transferFormData.priority}
                            onChange={handleFormInputChange}
                            data-testid="select-priority"
                        >
                            <option value="normal">Normal (1–3 days)</option>
                            <option value="express">Express (Same day)</option>
                            <option value="instant">Instant Transfer</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="note">Note / Memo (Optional)</label>
                    <input
                        id="note"
                        name="note"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Monthly savings, Rent payment..."
                        value={transferFormData.note}
                        onChange={handleFormInputChange}
                        maxLength={100}
                        data-testid="input-transfer-note"
                    />
                </div>

                <div className="transfer-actions">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleFormReset}
                        data-testid="btn-transfer-reset"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isProcessing}
                        data-testid="btn-transfer-submit"
                    >
                        {isProcessing ? <span className="spinner" /> : <Send size={16} />}
                        {isProcessing ? "Processing..." : "Transfer Funds"}
                    </button>
                </div>
            </form>
        </div>
    );
}

