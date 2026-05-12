/**
 * Dashboard.jsx
 * 
 * This is the main core of our banking application. It handles the sidebar navigation,
 * global search across all pages, and the notification system. The dashboard swaps 
 * out dynamic "page" components (Overview, Accounts, Transfers, etc.) based on 
 * the user's selection in the sidebar.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
    Building2, LayoutDashboard, CreditCard, ArrowLeftRight, PieChart,
    Settings, LogOut, Bell, Menu, X, ShieldCheck, Lock, Globe,
    TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, User, Mail, Phone, MapPin,
    Download, FileSpreadsheet
} from "lucide-react";
import GlobalSearch from "../components/GlobalSearch.jsx";
import AccountCards from "../components/AccountCards.jsx";
import TransferForm from "../components/TransferForm.jsx";
import SameBankTransferForm from "../components/SameBankTransferForm.jsx";
import PayToUser from "../components/PayToUser.jsx";
import CheckboxFilter from "../components/CheckboxFilter.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import FDManager from "../components/FDManager.jsx";
import CreditCardPage from "../components/CreditCardPage.jsx";
import KycPage from "./KycPage.jsx";
import { StandardComboBox, SearchableComboBox, MultiSelectComboBox } from "../components/ComboBox.jsx";
import { mockUsers, transactionCategories } from "../data/mockData.js";
import { getAccounts, getTransactions, createTransaction, updateAccountBalance, getUserProfile, updateUserProfile } from "../api.js";
import "./Dashboard.css";
import "../web-components/settings-web-component.js";

const NAVIGATION_ITEMS = [
    { icon: LayoutDashboard, label: "Overview", id: "overview" },
    { icon: Wallet, label: "Accounts", id: "accounts" },
    { icon: PiggyBank, label: "Fixed Deposits", id: "fd" },
    { icon: CreditCard, label: "Credit Cards", id: "credit-cards" },
    { icon: ArrowLeftRight, label: "Transfers", id: "transfers" },
    { icon: PieChart, label: "Analytics", id: "analytics" },
    { icon: ShieldCheck, label: "KYC Verification", id: "kyc" },
    { icon: Settings, label: "Settings", id: "settings" },
];

const PAGE_METADATA = {
    overview: { title: "Dashboard Overview", subtitle: "Your complete financial snapshot" },
    accounts: { title: "My Accounts", subtitle: "Manage and reorder your linked accounts" },
    fd: { title: "Fixed Deposits", subtitle: "Secure your future with high-yield deposits" },
    "credit-cards": { title: "Credit Cards", subtitle: "Manage your plastic money and pay bills" },
    transfers: { title: "Fund Transfers", subtitle: "Move money between your accounts and others securely" },
    analytics: { title: "Analytics", subtitle: "Visualise your spending and income trends" },
    kyc: { title: "KYC Verification", subtitle: "Upload documents to digitally verify your identity" },
    settings: { title: "Account Settings", subtitle: "Manage your profile, security and preferences" },
};

const handleDownloadCSV = (transactions, filename) => {
    const headers = ["Date", "Description", "Category", "Amount", "Status", "Type"];
    const rows = transactions.map(t => [
        t.date,
        `"${t.description}"`,
        t.category,
        t.amount.toFixed(2),
        t.status,
        t.type
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

function OverviewPage({ filteredTransactions, globalSearchQuery, selectedCategories, onCategoryChange, onTransferComplete, accounts, allTransactions }) {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalIncome = allTransactions
        .filter(t => t.type === "credit" && accounts.find(a => a.id === t.accountId)?.type !== 'credit')
        .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = Math.abs(
        allTransactions.filter(t => t.type === "debit" && t.category !== "Internal Transfer").reduce((s, t) => s + t.amount, 0)
    );
    const tableRef = useRef(null);

    return (
        <>
            <section className="summary-strip fade-in" data-testid="summary-strip">
                <div className="summary-card">
                    <span className="summary-label">Total Net Worth</span>
                    <span className="summary-value">${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Income</span>
                    <span className="summary-value credit">+${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Expenses</span>
                    <span className="summary-value debit">-${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Active Accounts</span>
                    <span className="summary-value">{accounts.length}</span>
                </div>
            </section>

            <section className="section fade-in" style={{ animationDelay: "0.05s" }}>
                <AccountCards accounts={accounts.filter(a => a.type !== 'credit')} />
            </section>

            <div className="two-col fade-in" style={{ animationDelay: "0.08s", alignItems: 'stretch' }}>
                <div className="card market-pulse-card glassmorphic" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <TrendingUp size={18} style={{ marginRight: 8, color: "var(--blue-600)" }} />
                            Market Pulse
                        </h2>
                        <span className="badge badge-blue">S&P 500</span>
                    </div>
                    <div className="market-pulse-container compact" style={{ flex: 1, minHeight: '300px' }}>
                        <iframe
                            src="/market-insights.html"
                            title="Market Pulse Insights"
                            width="100%"
                            height="100%"
                            style={{ border: "none", display: 'block' }}
                            allowtransparency="true"
                        ></iframe>
                    </div>
                </div>
                <TransferForm onTransferComplete={onTransferComplete} accounts={accounts} />
            </div>

            <div className="two-col fade-in" style={{ animationDelay: "0.1s" }}>
                <CheckboxFilter
                    categories={transactionCategories}
                    selected={selectedCategories}
                    onChange={onCategoryChange}
                />
                <PayToUser onPaymentComplete={onTransferComplete} accounts={accounts} />
            </div>

            <section className="section fade-in" style={{ animationDelay: "0.15s" }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Transaction History</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => window.print()}
                                title="Download transaction statement as PDF"
                            >
                                <Download size={14} /> Download PDF
                            </button>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => handleDownloadCSV(tableRef.current?.getFilteredData() || filteredTransactions, `transactions_overview_${new Date().toISOString().split("T")[0]}.csv`)}
                                title="Download transaction statement as Excel"
                            >
                                <FileSpreadsheet size={14} /> Download Excel
                            </button>
                        </div>
                    </div>
                    <TransactionTable
                        ref={tableRef}
                        transactions={filteredTransactions}
                        globalSearch={globalSearchQuery}
                    />
                </div>
            </section>
        </>
    );
}

function AccountsPage({ globalSearchQuery, accounts, allTransactions }) {
    const tableRef = useRef(null);
    const filteredTransactions = allTransactions.filter(transaction => {
        const query = globalSearchQuery.toLowerCase();
        return !query ||
            transaction.description.toLowerCase().includes(query) ||
            transaction.category.toLowerCase().includes(query) ||
            transaction.status.toLowerCase().includes(query) ||
            Math.abs(transaction.amount).toString().includes(query);
    });

    return (
        <div className="page-content fade-in" data-testid="accounts-page">
            <section className="section" style={{ paddingTop: '24px' }}>
                <AccountCards accounts={accounts.filter(a => a.type !== 'credit')} />
            </section>

            <section className="section">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Account Details</h2>
                        {/* <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => window.print()}
                                title="Download account statement"
                            >
                                <Download size={14} /> Download PDF
                            </button>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => handleDownloadCSV(filteredTransactions, `account_statement_${new Date().toISOString().split("T")[0]}.csv`)}
                                title="Download account statement as Excel"
                            >
                                <FileSpreadsheet size={14} /> Download Excel
                            </button>
                            <span className="badge badge-blue">{accounts.length} Accounts</span>
                        </div> */}
                    </div>
                    <div className="account-details-grid">
                        {accounts.filter(a => a.type !== 'credit').map(account => {
                            const isNegative = account.balance < 0;
                            return (
                                <div key={account.id} className="account-detail-row" data-testid={`account-detail-${account.id}`}>
                                    <div className="acc-det-icon" style={{ background: `${account.color}22`, color: account.color }}>
                                        <Wallet size={22} />
                                    </div>
                                    <div className="acc-det-info">
                                        <div className="acc-det-name">{account.name}</div>
                                        <div
                                            className="acc-det-num"
                                            title="Click to copy account number"
                                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(account.number);
                                                // Brief visual feedback via a temporary tooltip
                                                const el = document.getElementById(`copy-hint-${account.id}`);
                                                if (el) { el.style.opacity = 1; setTimeout(() => { el.style.opacity = 0; }, 1800); }
                                            }}
                                        >
                                            {account.number} · {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                            <span id={`copy-hint-${account.id}`} style={{ fontSize: '0.72rem', color: 'var(--success)', opacity: 0, transition: 'opacity 0.3s' }}>✅ Copied!</span>
                                        </div>
                                    </div>
                                    <div className={`acc-det-bal ${isNegative ? "debit" : "credit"}`}>
                                        {isNegative ? "-" : "+"}${Math.abs(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </div>
                                    {/* <button className="btn btn-secondary btn-sm" data-testid={`btn-manage-${account.id}`}>Manage</button> */}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Recent Transactions</h2>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => window.print()}
                                title="Download transaction list"
                            >
                                <Download size={14} /> Download PDF
                            </button>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => handleDownloadCSV(tableRef.current?.getFilteredData() || filteredTransactions, `recent_transactions_${new Date().toISOString().split("T")[0]}.csv`)}
                                title="Download transaction list as Excel"
                            >
                                <FileSpreadsheet size={14} /> Download Excel
                            </button>
                            {globalSearchQuery && (
                                <span className="badge badge-blue">🔍 "{globalSearchQuery}" — {filteredTransactions.length} results</span>
                            )}
                        </div>
                    </div>
                    <TransactionTable ref={tableRef} transactions={filteredTransactions} globalSearch={globalSearchQuery} />
                </div>
            </section>
        </div>
    );
}

function TransfersPage({ globalSearchQuery, allTransactions, onTransferComplete, accounts, user }) {
    const tableRef = useRef(null);
    const query = globalSearchQuery.toLowerCase();
    const transferHistory = allTransactions
        .filter(transaction => transaction.category === "Transfers" || transaction.category === "Internal Transfer")
        .filter(transaction => !query ||
            transaction.description.toLowerCase().includes(query) ||
            transaction.customerId.toLowerCase().includes(query) ||
            transaction.status.toLowerCase().includes(query) ||
            Math.abs(transaction.amount).toString().includes(query)
        );

    const [activeTab, setActiveTab] = useState("internal");

    return (
        <div className="page-content fade-in" data-testid="transfers-page">
            <section className="summary-strip">
                <div className="summary-card">
                    <span className="summary-label">Transfers This Month</span>
                    <span className="summary-value">{transferHistory.length}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Sent</span>
                    <span className="summary-value debit">-${Math.abs(transferHistory.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Received</span>
                    <span className="summary-value credit">+${transferHistory.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Pending</span>
                    <span className="summary-value" style={{ color: "var(--warning)" }}>{transferHistory.filter(t => t.status === "Pending").length}</span>
                </div>
            </section>

            <div className="section fade-in" style={{ padding: "0 28px 20px" }}>
                <div className="transfer-tabs-container glassmorphic">
                    <div className="transfer-tabs">
                        <button 
                            className={`transfer-tab ${activeTab === "internal" ? "active" : ""}`}
                            onClick={() => setActiveTab("internal")}
                            data-testid="tab-internal-transfer"
                        >
                            <ArrowLeftRight size={18} />
                            <span>Internal Transfer</span>
                        </button>
                        <button 
                            className={`transfer-tab ${activeTab === "same-bank" ? "active" : ""}`}
                            onClick={() => setActiveTab("same-bank")}
                            data-testid="tab-same-bank-transfer"
                        >
                            <Building2 size={18} />
                            <span>Same Bank Transfer</span>
                        </button>
                        <button 
                            className={`transfer-tab ${activeTab === "pay-user" ? "active" : ""}`}
                            onClick={() => setActiveTab("pay-user")}
                            data-testid="tab-pay-user"
                        >
                            <User size={18} />
                            <span>Pay to Contact</span>
                        </button>
                    </div>
                    
                    <div className="transfer-tab-content fade-in" key={activeTab}>
                        {activeTab === "internal" && (
                            <TransferForm onTransferComplete={onTransferComplete} accounts={accounts} />
                        )}
                        {activeTab === "same-bank" && (
                            <SameBankTransferForm onTransferComplete={onTransferComplete} accounts={accounts} user={user} />
                        )}
                        {activeTab === "pay-user" && (
                            <PayToUser onPaymentComplete={onTransferComplete} accounts={accounts} user={user} />
                        )}
                    </div>
                </div>
            </div>

            {/* Transfer Transaction Table */}
            <div className="section fade-in" style={{ padding: "0 28px 20px" }}>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Transfer History</h2>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => window.print()}
                                title="Download transfer history"
                            >
                                <Download size={14} /> Download PDF
                            </button>
                            <button
                                className="btn btn-outline btn-sm btn-download"
                                onClick={() => handleDownloadCSV(tableRef.current?.getFilteredData() || transferHistory, `transfer_history_${new Date().toISOString().split("T")[0]}.csv`)}
                                title="Download transfer history as Excel"
                            >
                                <FileSpreadsheet size={14} /> Download Excel
                            </button>
                            {globalSearchQuery && (
                                <span className="badge badge-blue">🔍 {transferHistory.length} results</span>
                            )}
                        </div>
                    </div>
                    <TransactionTable ref={tableRef} transactions={transferHistory} globalSearch={globalSearchQuery} />
                </div>
            </div>
        </div>
    );
}

function SearchResultsPage({ transactions, query }) {
    return (
        <div className="page-content fade-in" data-testid="search-results-page">
            <div className="section" style={{ paddingTop: "20px" }}>
                <div style={{ marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--gray-800)" }}>
                        Search Results for "{query}"
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--gray-400)" }}>
                        Showing {transactions.length} matches across all categories
                    </p>
                </div>
                <TransactionTable transactions={transactions} globalSearch={query} />
            </div>
        </div>
    );
}

function AnalyticsPage({ transactions, accounts = [] }) {
    const [isFlutterVisible, setIsFlutterVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    const categoryTotals = transactionCategories.map(categoryName => {
        const matchingTransactions = transactions.filter(transaction => transaction.category === categoryName);
        const totalValue = matchingTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
        const count = matchingTransactions.length;
        return { categoryName, totalValue, count };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const maxTotalValue = categoryTotals[0]?.totalValue || 1;

    const CATEGORY_COLORS = {
        Salary: "#10B981", Deposits: "#3B82F6", Withdrawals: "#EF4444",
        Transfers: "#8B5CF6", Bills: "#F59E0B", Shopping: "#EC4899", Dining: "#14B8A6",
        "Investments (FD)": "#3B82F6"
    };

    if (isLoading) {
        return (
            <div className="page-content fade-in" data-testid="analytics-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', flexDirection: 'column' }}>
                <div style={{
                    border: '4px solid rgba(0, 0, 0, 0.1)',
                    borderLeftColor: 'var(--blue-600)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '16px', color: 'var(--gray-600)', fontWeight: 500 }}>Analyzing your data...</p>
                <style>
                    {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    `}
                </style>
            </div>
        );
    }

    if (isFlutterVisible) {
        return <FlutterAnalytics onBack={() => setIsFlutterVisible(false)} accounts={accounts} allTransactions={allTransactions} />;
    }

    return (
        <div className="page-content fade-in" data-testid="analytics-page">
            <div style={{ position: 'relative' }}>
                {/* 
                  Hidden "Semantic" Trigger 
                  Visually transparent but present in DOM for "while inspected" requirement 
                */}
                <button
                    onClick={() => setIsFlutterVisible(true)}
                    style={{
                        position: 'absolute', top: 0, right: 0,
                        width: '80px', height: '30px',
                        background: 'transparent', border: 'none',
                        cursor: 'default', opacity: 0, zIndex: 100
                    }}
                    data-testid="semantic-trigger-btn"
                >
                    Semantic
                </button>
            </div>
            <section className="summary-strip">
                <div className="summary-card">
                    <span className="summary-label">Total Income</span>
                    <span className="summary-value credit">
                        +${transactions.filter(t => t.type === 'credit' && accounts.find(a => a.id === t.accountId)?.type !== 'credit').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Expenses</span>
                    <span className="summary-value debit">
                        -${Math.abs(transactions.filter(t => t.type === 'debit' && t.category !== 'Internal Transfer').reduce((s, t) => s + t.amount, 0)).toLocaleString()}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Net Savings</span>
                    <span className="summary-value">
                        +${(
                            transactions.filter(t => t.type === 'credit' && accounts.find(a => a.id === t.accountId)?.type !== 'credit').reduce((s, t) => s + t.amount, 0) -
                            Math.abs(transactions.filter(t => t.type === 'debit' && t.category !== 'Internal Transfer').reduce((s, t) => s + t.amount, 0))
                        ).toLocaleString()}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Transactions</span>
                    <span className="summary-value">{transactions.length}</span>
                </div>
            </section>

            <div className="two-col section" style={{ padding: "0 28px 20px" }}>
                <div className="card fade-in">
                    <div className="card-header">
                        <h2 className="card-title">Spending by Category</h2>
                        <BarChart3 size={20} color="var(--blue-600)" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {categoryTotals.map(({ categoryName, totalValue, count }) => (
                            <div key={categoryName} data-testid={`analytics-bar-${categoryName.toLowerCase()}`}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gray-700)" }}>{categoryName}</span>
                                    <span style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({count} transactions)</span>
                                </div>
                                <div style={{ height: 10, background: "var(--gray-100)", borderRadius: 100, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", width: `${(totalValue / maxTotalValue) * 100}%`,
                                        background: CATEGORY_COLORS[categoryName] || "var(--blue-500)",
                                        borderRadius: 100, transition: "width 0.6s ease",
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card fade-in" style={{ animationDelay: "0.1s" }}>
                    <div className="card-header">
                        <h2 className="card-title">Monthly Breakdown</h2>
                        <TrendingUp size={20} color="var(--success)" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {[
                            { month: "February 2026", income: 10338.25, expense: 5387.97 },
                            { month: "January 2026", income: 8520.00, expense: 4210.50 },
                            { month: "December 2025", income: 9100.00, expense: 6030.00 },
                            { month: "November 2025", income: 8200.00, expense: 3800.00 },
                        ].map(({ month, income, expense }) => (
                            <div key={month} className="monthly-row" data-testid={`analytics-month-${month.replace(/\s/g, "-")}`}>
                                <span style={{ fontSize: "0.85rem", color: "var(--gray-700)", fontWeight: 600, minWidth: 130 }}>{month}</span>
                                <span style={{ fontSize: "0.82rem", color: "var(--success)", fontWeight: 700 }}>+${income.toLocaleString()}</span>
                                <span style={{ fontSize: "0.82rem", color: "var(--danger)", fontWeight: 700 }}>-${expense.toLocaleString()}</span>
                                <span style={{ fontSize: "0.82rem", color: "var(--blue-700)", fontWeight: 700 }}>
                                    Net: ${(income - expense).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsPage({ user: authUser }) {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: authUser?.name || "",
        email: authUser?.email || "",
        phone: "",
        address: ""
    });
    
    // ComboBox Demo states
    const [standardComboVal, setStandardComboVal] = useState("usd");
    const [searchComboVal, setSearchComboVal] = useState("us");
    const [multiComboVal, setMultiComboVal] = useState(["email", "sms"]);

    const comboOptions1 = [
        { label: "US Dollar (USD)", value: "usd" },
        { label: "Euro (EUR)", value: "eur" },
        { label: "British Pound (GBP)", value: "gbp" },
    ];
    
    const comboOptions2 = [
        { label: "United States", value: "us" },
        { label: "United Kingdom", value: "uk" },
        { label: "Canada", value: "ca" },
        { label: "Australia", value: "au" },
        { label: "Germany", value: "de" },
        { label: "France", value: "fr" },
        { label: "Japan", value: "jp" },
        { label: "India", value: "in" },
        { label: "Brazil", value: "br" },
        { label: "South Africa", value: "za" },
    ];

    const comboOptions3 = [
        { label: "Email Notifications", value: "email" },
        { label: "SMS Alerts", value: "sms" },
        { label: "Push Notifications", value: "push" },
        { label: "Monthly Newsletter", value: "news" },
    ];
    const [isSaved, setIsSaved] = useState(false);
    const [isPrefsSaved, setIsPrefsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (authUser?.email) {
                try {
                    const data = await getUserProfile(authUser.id);
                    setProfile({
                        name: data.name,
                        email: data.email,
                        phone: data.phone || "",
                        address: data.address || ""
                    });
                    // Load preferences if they exist
                    if (data.preferences) {
                        if (data.preferences.currency) setStandardComboVal(data.preferences.currency);
                        if (data.preferences.branch) setSearchComboVal(data.preferences.branch);
                        if (data.preferences.notifications) setMultiComboVal(data.preferences.notifications);
                    }
                } catch (err) {
                    console.error("Failed to fetch profile:", err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchProfile();
    }, [authUser]);

    const handleProfileUpdate = async (event) => {
        event.preventDefault();
        try {
            const updated = await updateUserProfile(authUser.id, {
                ...profile,
                preferences: {
                    currency: standardComboVal,
                    branch: searchComboVal,
                    notifications: multiComboVal
                }
            });
            // Update auth context to keep sidebar/topbar in sync
            login({
                ...authUser,
                name: updated.name,
                email: updated.email
            });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (err) {
            alert("Failed to save profile: " + err.message);
        }
    };

    const handlePreferencesSave = async (event) => {
        event.preventDefault();
        try {
            await updateUserProfile(authUser.id, {
                ...profile,
                preferences: {
                    currency: standardComboVal,
                    branch: searchComboVal,
                    notifications: multiComboVal
                }
            });
            setIsPrefsSaved(true);
            setTimeout(() => setIsPrefsSaved(false), 3000);
        } catch (err) {
            alert("Failed to save preferences: " + err.message);
        }
    };

    return (
        <div className="page-content fade-in" data-testid="settings-page">
            <div className="section" style={{ padding: "20px 28px" }}>
                <div className="card" style={{ marginBottom: "24px" }}>
                    <div className="card-header">
                        <h2 className="card-title">Profile Information</h2>
                        <User size={20} color="var(--blue-600)" />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px", background: "var(--blue-50)", borderRadius: 12 }}>
                        <div className="avatar" style={{ width: 60, height: 60, fontSize: "1.2rem", borderRadius: 16 }}>
                            {authUser?.avatar || authUser?.name?.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-800)" }}>{authUser?.name}</div>
                            <div style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>Premium Account · Member since 2022</div>
                        </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} data-testid="settings-profile-form">
                        {isSaved && (
                            <div style={{ padding: "10px 14px", background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, color: "#065F46", fontSize: "0.85rem", marginBottom: 14 }}>
                                ✅ Profile saved successfully!
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label"><User size={13} style={{ marginRight: 4 }} />Full Name</label>
                            <input type="text" className="form-input" value={profile.name}
                                onChange={event => setProfile(prev => ({ ...prev, name: event.target.value }))} data-testid="input-settings-name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Mail size={13} style={{ marginRight: 4 }} />Email Address</label>
                            <input type="email" className="form-input" value={profile.email}
                                onChange={event => setProfile(prev => ({ ...prev, email: event.target.value }))} data-testid="input-settings-email" />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Phone size={13} style={{ marginRight: 4 }} />Phone Number</label>
                            <input type="tel" className="form-input" value={profile.phone}
                                onChange={event => setProfile(prev => ({ ...prev, phone: event.target.value }))} data-testid="input-settings-phone" />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><MapPin size={13} style={{ marginRight: 4 }} />Address</label>
                            <input type="text" className="form-input" value={profile.address}
                                onChange={event => setProfile(prev => ({ ...prev, address: event.target.value }))} data-testid="input-settings-address" />
                        </div>
                        <button type="submit" className="btn btn-primary" data-testid="btn-save-profile">Save Changes</button>
                    </form>
                </div>

                <div style={{ marginBottom: "20px", padding: "16px", background: "var(--blue-50)", borderLeft: "4px solid var(--blue-600)", borderRadius: "8px" }}>
                    <h3 style={{ margin: "0 0 8px 0", color: "var(--blue-700)" }}>🧪 Automation Testing Zone: Shadow DOM</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--gray-600)", lineHeight: "1.5" }}>
                        The settings below are encapsulated within a <strong>Shadow Root (open)</strong>.
                        Standard CSS selectors and XPath from the document root will <strong>not</strong> work here.
                    </p>
                </div>

                <div className="card" style={{ marginBottom: "24px" }}>
                    <div className="card-header">
                        <h2 className="card-title">Preferences (ComboBox)</h2>
                        <Settings size={20} color="var(--blue-600)" />
                    </div>
                    
                    <form onSubmit={handlePreferencesSave}>
                        {isPrefsSaved && (
                            <div style={{ padding: "10px 14px", background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 8, color: "#065F46", fontSize: "0.85rem", marginBottom: 14 }}>
                                ✅ Preferences saved successfully!
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Standard ComboBox (Preferred Currency)</label>
                            <StandardComboBox 
                                options={comboOptions1}
                                value={standardComboVal}
                                onChange={setStandardComboVal}
                            />
                        </div>
                        
                        <div className="form-group" style={{ marginTop: "16px" }}>
                            <label className="form-label">Searchable ComboBox (Primary Branch Location)</label>
                            <SearchableComboBox 
                                options={comboOptions2}
                                value={searchComboVal}
                                onChange={setSearchComboVal}
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: "16px", marginBottom: "24px" }}>
                            <label className="form-label">Multi-Select ComboBox (Communication Preferences)</label>
                            <MultiSelectComboBox 
                                options={comboOptions3}
                                values={multiComboVal}
                                onChange={setMultiComboVal}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" data-testid="btn-save-preferences">Save Preferences</button>
                    </form>
                </div>

                <settings-web-component data-testid="shadow-settings-root"></settings-web-component>
            </div>
        </div>
    );
}

function FlutterAnalytics({ onBack, accounts = [], allTransactions = [] }) {
    // 1. Calculate Summary Metrics
    const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const monthlyIncome = allTransactions
        .filter(t => t.type === "credit" && accounts.find(a => a.id === t.accountId)?.type !== 'credit')
        .reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = Math.abs(
        allTransactions.filter(t => t.type === "debit" && t.category !== "Internal Transfer").reduce((s, t) => s + t.amount, 0)
    );
    const savingsRate = monthlyIncome > 0 
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) 
        : 0;

    // 2. Calculate Category Spending Distribution
    const categorySpendingMap = allTransactions
        .filter(t => t.type === "debit" && t.category !== "Internal Transfer")
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
            return acc;
        }, {});

    const sortedCategories = Object.entries(categorySpendingMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 categories

    const maxSpend = Math.max(...sortedCategories.map(c => c[1]), 1000);
    const chartHeight = 220; // Max bar height in pixels
    return (
        <div className="page-content fade-in" style={{
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative'
        }} data-testid="flutter-analytics-container">
            {/*
              FULL PAGE FLUTTER RENDERING (ALIBABA / CANVASKIT STYLE)
              Everything from header to summary cards to charts is rendered inside this SVG.
              In the Elements tab, this appears as one complex graphic.
            */}
            <svg width="100%" height="100%" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                {/* Background */}
                <rect width="1000" height="800" fill="#f9fafb" />

                {/* Custom Flutter-style Header Bar */}
                <rect width="1000" height="70" fill="#2563eb" />
                <text x="25" y="42" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="800" fill="#ffffff">Test Bank Analytics</text>
                <text x="215" y="42" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="500" fill="#bfdbfe" opacity="0.8">FLUTTER ENGINE v3.19.0 (CANVASKIT)</text>

                {/* Search Bar Placeholder (SVG style) */}
                <rect x="700" y="20" width="200" height="30" rx="15" fill="#1d4ed8" />
                <circle cx="720" cy="35" r="5" stroke="#93c5fd" strokeWidth="1.5" fill="none" />
                <line x1="724" y1="39" x2="728" y2="43" stroke="#93c5fd" strokeWidth="1.5" />
                <text x="735" y="39" fontFamily="Inter, sans-serif" fontSize="11" fill="#93c5fd">Search metrics...</text>

                {/* Return Button (Interactive SVG element) */}
                <g onClick={onBack} cursor="pointer" pointerEvents="all">
                    <rect x="915" y="20" width="70" height="30" rx="8" fill="#ef4444" />
                    <text x="950" y="39" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="bold" fill="#ffffff">EXIT</text>
                </g>

                {/* Summary Strips (Rendered as SVG Groups) */}
                {[
                    { label: "Total Net Worth", value: `$${totalNetWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#3b82f6", x: 25 },
                    { label: "Total Income", value: `+$${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#10b981", x: 270 },
                    { label: "Total Expenses", value: `-$${monthlyExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "#ef4444", x: 515 },
                    { label: "Savings Rate", value: `${savingsRate}%`, color: "#8b5cf6", x: 760 },
                ].map((item, i) => (
                    <g key={`summary-${i}`} transform={`translate(${item.x}, 90)`}>
                        <rect width="215" height="100" rx="12" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                        <text x="20" y="35" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#64748b" textTransform="uppercase">{item.label}</text>
                        <text x="20" y="75" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="800" fill={item.color}>{item.value}</text>
                    </g>
                ))}

                {/* Main Graph Card */}
                <g transform="translate(25, 210)">
                    <rect width="950" height="350" rx="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                    <text x="25" y="40" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="bold" fill="#1e2937">Spending Distribution by Category</text>

                    {/* Grid Lines */}
                    <g opacity="0.1">
                        {[0, 1, 2, 3, 4].map(i => (
                            <line key={`grid-${i}`} x1="50" y1={80 + (i * 50)} x2="900" y2={80 + (i * 50)} stroke="#000" strokeWidth="1" />
                        ))}
                    </g>

                    {/* Bar Chart Bars (SVG Shapes) */}
                    {sortedCategories.map(([category, amount], i) => {
                        const h = (amount / maxSpend) * chartHeight;
                        return (
                            <g key={`bar-group-${i}`}>
                                <rect
                                    x={80 + (i * 85)}
                                    y={320 - h}
                                    width="40"
                                    height={h}
                                    rx="6"
                                    fill={i % 2 === 0 ? "#2563eb" : "#60a5fa"}
                                >
                                    <animate attributeName="height" from="0" to={h} dur="1s" fill="freeze" />
                                    <animate attributeName="y" from="320" to={320 - h} dur="1s" fill="freeze" />
                                </rect>
                                <text x={100 + (i * 85)} y="340" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" fill="#94a3b8" transform={`rotate(10, ${100 + (i * 85)}, 340)`}>
                                    {category.length > 8 ? category.substring(0, 8) + '..' : category}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* Bottom Row Information */}
                <g transform="translate(25, 580)">
                    <rect width="465" height="180" rx="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                    <text x="25" y="40" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="bold" fill="#1e2937">Transaction Heatmap</text>
                    {/* Heatmap Grid */}
                    <g transform="translate(40, 60)">
                        {[...Array(7)].map((_, r) => (
                            [...Array(15)].map((_, c) => (
                                <rect
                                    key={`heat-${r}-${c}`}
                                    x={c * 26} y={r * 15} width="22" height="11" rx="2"
                                    fill="#10b981"
                                    opacity={Math.random() * 0.8 + 0.1}
                                />
                            ))
                        ))}
                    </g>
                </g>

                <g transform="translate(510, 580)">
                    <rect width="465" height="180" rx="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
                    <text x="25" y="40" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="bold" fill="#1e2937">Recent Activity Logs</text>
                    {[1, 2, 3].map(i => (
                        <g key={`log-${i}`} transform={`translate(25, ${50 + (i * 35)})`}>
                            <circle cx="10" cy="10" r="4" fill="#6366f1" />
                            <rect x="25" y="7" width="380" height="8" rx="4" fill="#f1f5f9" />
                            <rect x="25" y="7" width={100 + (Math.random() * 200)} height="8" rx="4" fill="#e2e8f0" />
                        </g>
                    ))}
                </g>

                {/* Flutter-style Floating Action Button */}
                <circle cx="940" cy="740" r="30" fill="#2563eb" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                <path d="M930,740 L950,740 M940,730 L940,750" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
        </div>
    );
}

const INITIAL_NOTIFICATIONS = [];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [activeNavigationId, setActiveNavigationId] = useState("overview");
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState(transactionCategories);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const [allTransactions, setAllTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch accounts + transactions from MongoDB on mount
    useEffect(() => {
        if (!user?.id) return;
        
        setIsLoading(true);
        Promise.all([
            getAccounts({ userId: user.id }), 
            getTransactions({ userId: user.id })
        ])
            .then(([accs, txns]) => {
                setAccounts(accs);
                setAllTransactions(txns);
                setSelectedCategories(transactionCategories);
            })
            .catch(err => console.error('Failed to load data:', err))
            .finally(() => setIsLoading(false));
    }, [user?.id]);

    // Silent background poll every 15 seconds — picks up incoming transfers from other users
    useEffect(() => {
        if (!user?.id) return;
        const poll = setInterval(() => {
            Promise.all([
                getAccounts({ userId: user.id }),
                getTransactions({ userId: user.id })
            ]).then(([accs, txns]) => {
                setAccounts(prev => {
                    // Only update if balances actually changed
                    const changed = accs.some((a, i) => !prev[i] || prev[i].balance !== a.balance);
                    return changed ? accs : prev;
                });
                setAllTransactions(prev => {
                    // Only update if there are new transactions
                    return txns.length !== prev.length ? txns : prev;
                });
            }).catch(() => {}); // silent fail — don't show errors during poll
        }, 15000); // every 15 seconds
        return () => clearInterval(poll);
    }, [user?.id]);

    const handleTransferComplete = async (newTxn) => {
        // If the server already handled the full transfer atomically (same-bank),
        // just sync the local sender balance without re-creating the transaction.
        if (newTxn._serverHandled) {
            const amt = Math.abs(newTxn.amount);
            setAccounts(prev => prev.map(acc =>
                acc.id === newTxn.fromAccountId
                    ? { ...acc, balance: Math.round((acc.balance - amt) * 100) / 100 }
                    : acc
            ));
            setAllTransactions(prev => [{ ...newTxn, userId: user.id }, ...prev]);
            setNotifications(prev => [{
                id: Date.now(),
                icon: '🏢',
                title: 'Transfer Completed',
                message: `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} sent to account ${newTxn.toAccountNum}`,
                time: 'Just now',
                isRead: false,
            }, ...prev]);
            return;
        }

        const tempId = newTxn.id || `txn-optimistic-${Date.now()}`;
        const enrichedTxn = { ...newTxn, userId: user.id };
        const optimisticTxn = { ...enrichedTxn, id: tempId, _optimistic: true };
        setAllTransactions(prev => [optimisticTxn, ...prev]);

        let saved;
        try {
            saved = await createTransaction(enrichedTxn);
            setAllTransactions(prev => prev.map(t => t.id === tempId ? saved : t));
        } catch (err) {
            console.error('Transfer failed:', err);
            setAllTransactions(prev => prev.filter(t => t.id !== tempId));
            throw err;
        }

        try {
            const amt = Math.abs(newTxn.amount);
            const isInternal = newTxn.category === "Internal Transfer" || newTxn.category === "Credit Card" || newTxn.category === "Investments (FD)";
            const isSameBank = !!newTxn.toAccountNum && !newTxn._serverHandled;

            // 1. Update Sender's Accounts (Local state + DB)
            const updatedAccounts = await Promise.all(
                accounts.map(acc => {
                    if (acc.id === newTxn.fromAccountId) return updateAccountBalance(acc.id, -amt);
                    if (isInternal && acc.id === newTxn.toAccountId) return updateAccountBalance(acc.id, +amt);
                    return Promise.resolve(acc);
                })
            );
            setAccounts(updatedAccounts);

            if (isSameBank) {
                try {
                    console.log('Attempting to credit same bank account:', newTxn.toAccountNum);
                    // Update recipient balance in DB
                    const recipientAcc = await updateAccountBalanceByNumber(newTxn.toAccountNum, +amt);
                    console.log('Recipient account updated:', recipientAcc);
                    
                    // Create a credit transaction for the recipient user
                    if (recipientAcc && recipientAcc.userId) {
                        await createTransaction({
                            id: `txn-credit-${Date.now()}`,
                            date: newTxn.date,
                            description: `Transfer from ${user.name}`,
                            category: "Deposits",
                            amount: amt,
                            status: "Completed",
                            type: "credit",
                            accountId: recipientAcc.id,
                            userId: recipientAcc.userId,
                            note: newTxn.note || ""
                        });
                    }
                } catch (recipientErr) {
                    console.error('Could not credit recipient account:', recipientErr);
                    // We don't throw here as the sender's part is done
                }
            }

            const fromAcc = updatedAccounts.find(a => a.id === newTxn.fromAccountId);
            const availableBalance = fromAcc?.balance;
            setNotifications(prev => [{
                id: Date.now(),
                icon: isInternal ? "🔄" : (isSameBank ? "🏢" : "💸"),
                title: isInternal ? "Transfer Completed" : "Amount Debited",
                message: isInternal
                    ? `$${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })} moved to account ${newTxn.toAccountId}`
                    : `$${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })} sent to account ${newTxn.toAccountNum || "external"}`,
                time: "Just now",
                isRead: false,
            }, ...prev]);
        } catch (err) {
            console.error('Balance update failed:', err);
            throw err;
        }
    };

    useEffect(() => {
        // Load initial theme
        const savedTheme = localStorage.getItem("testbank_theme");
        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
        }

        const handleThemeChange = (e) => {
            const isDark = e.detail.isDark;
            if (isDark) {
                document.body.classList.add("dark-mode");
                localStorage.setItem("testbank_theme", "dark");
            } else {
                document.body.classList.remove("dark-mode");
                localStorage.setItem("testbank_theme", "light");
            }
        };

        window.addEventListener('theme-change', handleThemeChange);
        return () => window.removeEventListener('theme-change', handleThemeChange);
    }, []);

    const unreadNotificationsCount = notifications.filter(notification => !notification.isRead).length;

    const filteredTransactions = allTransactions.filter(transaction => {
        const matchesCategory = selectedCategories.includes(transaction.category);
        const query = globalSearchQuery.toLowerCase();
        const matchesSearch = !query ||
            transaction.description.toLowerCase().includes(query) ||
            transaction.customerId.toLowerCase().includes(query) ||
            transaction.category.toLowerCase().includes(query) ||
            transaction.status.toLowerCase().includes(query) ||
            Math.abs(transaction.amount).toString().includes(query);
        return matchesCategory && matchesSearch;
    });

    const { title, subtitle } = PAGE_METADATA[activeNavigationId];

    const renderDynamicPageContent = () => {
        if (globalSearchQuery) {
            return <SearchResultsPage transactions={filteredTransactions} query={globalSearchQuery} />;
        }

        switch (activeNavigationId) {
            case "overview":
                return <OverviewPage
                    filteredTransactions={filteredTransactions}
                    globalSearchQuery={globalSearchQuery}
                    selectedCategories={selectedCategories}
                    onCategoryChange={setSelectedCategories}
                    onTransferComplete={handleTransferComplete}
                    accounts={accounts}
                    allTransactions={allTransactions}
                />;
            case "accounts": return <AccountsPage globalSearchQuery={globalSearchQuery} accounts={accounts} allTransactions={allTransactions} />;
            case "fd": return <FDManager accounts={accounts} onTransferComplete={handleTransferComplete} />;
            case "credit-cards": return <CreditCardPage accounts={accounts} onTransferComplete={handleTransferComplete} onAccountsRefresh={setAccounts} />;
            case "transfers": return <TransfersPage globalSearchQuery={globalSearchQuery} allTransactions={allTransactions} onTransferComplete={handleTransferComplete} accounts={accounts} user={user} />;
            case "analytics": return <AnalyticsPage transactions={allTransactions} accounts={accounts} />;
            case "kyc": return <KycPage />;
            case "settings": return <SettingsPage user={user} />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-layout" data-testid="dashboard-page">
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`sidebar ${isSidebarOpen ? "sidebar-open" : ""}`} data-testid="sidebar">
                <div className="sidebar-brand">
                    <Building2 size={26} color="white" />
                    <span>Test Bank</span>
                </div>

                <nav className="sidebar-nav">
                    {NAVIGATION_ITEMS.map(({ icon: Icon, label, id }) => (
                        <button
                            key={id}
                            className={`nav-item ${activeNavigationId === id ? "nav-item-active" : ""}`}
                            data-testid={`nav-${id}`}
                            onClick={() => { setActiveNavigationId(id); setIsSidebarOpen(false); }}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <div className="avatar">{user?.avatar || user?.name?.charAt(0)}</div>
                    <div className="sidebar-user-info">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-email">{user?.email}</div>
                    </div>
                    <button className="logout-btn sidebar-logout" onClick={logout} data-testid="btn-logout" title="Sign Out">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            <div className="dashboard-main">
                <header className="topbar" data-testid="topbar">
                    <div className="topbar-left">
                        <button className="menu-btn" onClick={() => setIsSidebarOpen(prev => !prev)} data-testid="btn-menu">
                            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                        <div>
                            <h1 className="topbar-title">{title}</h1>
                            <p className="topbar-sub">{subtitle}</p>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <GlobalSearch searchQuery={globalSearchQuery} onSearchQueryChange={setGlobalSearchQuery} />
                        <div className="notif-wrapper" data-testid="notifications-wrapper">
                            <button
                                className={`icon-btn ${isNotificationPanelOpen ? "icon-btn-active" : ""}`}
                                data-testid="btn-notifications"
                                title="Notifications"
                                onClick={() => setIsNotificationPanelOpen(prev => !prev)}
                            >
                                <Bell size={20} />
                                {unreadNotificationsCount > 0 && <span className="notif-dot" data-testid="notif-badge">{unreadNotificationsCount}</span>}
                            </button>

                            {isNotificationPanelOpen && (
                                <>
                                    <div className="notif-backdrop" onClick={() => setIsNotificationPanelOpen(false)} />
                                    <div className="notif-dropdown" data-testid="notif-dropdown">
                                        <div className="notif-header">
                                            <span className="notif-title">Notifications</span>
                                            <button
                                                className="notif-mark-all"
                                                data-testid="btn-mark-all-read"
                                                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                                            >
                                                Mark all read
                                            </button>
                                        </div>
                                        <div className="notif-list">
                                            {notifications.filter(n => !n.isRead).length > 0 ? (
                                                notifications.filter(n => !n.isRead).map(notification => (
                                                    <div
                                                        key={notification.id}
                                                        className="notif-item notif-unread"
                                                        data-testid={`notif-item-${notification.id}`}
                                                        onClick={() => setNotifications(prev => prev.map(x => x.id === notification.id ? { ...x, isRead: true } : x))}
                                                    >
                                                        <span className="notif-icon">{notification.icon}</span>
                                                        <div className="notif-body">
                                                            <div className="notif-item-title">{notification.title}</div>
                                                            <div className="notif-item-message">{notification.message}</div>
                                                            <div className="notif-item-time">{notification.time}</div>
                                                        </div>
                                                        <span className="notif-unread-dot" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                                                    No new notifications
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <button 
                            className="logout-btn topbar-logout" 
                            onClick={logout} 
                            data-testid="btn-logout-topbar" 
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                            <span className="logout-text">Logout</span>
                        </button>
                    </div>
                </header>

                <div key={activeNavigationId}>
                    <div className="print-only-header">
                        <img src="/logo.png" alt="Bank Logo" className="print-logo" />
                        <h1 className="print-title">Transaction Statement</h1>
                        <p style={{ fontSize: '12px', color: '#666' }}>Generated on {new Date().toLocaleDateString()} · Test Bank Official Document</p>
                    </div>
                    {renderDynamicPageContent()}
                </div>
            </div>
        </div>
    );
}

