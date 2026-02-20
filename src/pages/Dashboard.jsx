/**
 * Dashboard.jsx
 * 
 * This is the main core of our banking application. It handles the sidebar navigation,
 * global search across all pages, and the notification system. The dashboard swaps 
 * out dynamic "page" components (Overview, Accounts, Transfers, etc.) based on 
 * the user's selection in the sidebar.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
    Building2, LayoutDashboard, CreditCard, ArrowLeftRight, PieChart,
    Settings, LogOut, Bell, Menu, X, ShieldCheck, Lock, Globe,
    TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, User, Mail, Phone, MapPin
} from "lucide-react";
import GlobalSearch from "../components/GlobalSearch.jsx";
import AccountCards from "../components/AccountCards.jsx";
import TransferForm from "../components/TransferForm.jsx";
import CheckboxFilter from "../components/CheckboxFilter.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import { mockTransactions, transactionCategories, mockAccounts } from "../data/mockData.js";
import "./Dashboard.css";
import "../web-components/settings-web-component.js";

const NAVIGATION_ITEMS = [
    { icon: LayoutDashboard, label: "Overview", id: "overview" },
    { icon: CreditCard, label: "Accounts", id: "accounts" },
    { icon: ArrowLeftRight, label: "Transfers", id: "transfers" },
    { icon: PieChart, label: "Analytics", id: "analytics" },
    { icon: Settings, label: "Settings", id: "settings" },
];

const PAGE_METADATA = {
    overview: { title: "Dashboard Overview", subtitle: "Your complete financial snapshot" },
    accounts: { title: "My Accounts", subtitle: "Manage and reorder your linked accounts" },
    transfers: { title: "Fund Transfers", subtitle: "Move money between your accounts securely" },
    analytics: { title: "Analytics", subtitle: "Visualise your spending and income trends" },
    settings: { title: "Account Settings", subtitle: "Manage your profile, security and preferences" },
};

function OverviewPage({ filteredTransactions, globalSearchQuery, selectedCategories, onCategoryChange }) {
    const totalBalance = 12450.75 + 56789.00 - 3241.50 + 98100.20;

    return (
        <>
            <section className="summary-strip fade-in" data-testid="summary-strip">
                <div className="summary-card">
                    <span className="summary-label">Total Net Worth</span>
                    <span className="summary-value">${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">This Month Income</span>
                    <span className="summary-value credit">+$10,025.45</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">This Month Expenses</span>
                    <span className="summary-value debit">-$3,592.97</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Active Accounts</span>
                    <span className="summary-value">4</span>
                </div>
            </section>

            <section className="section fade-in" style={{ animationDelay: "0.05s" }}>
                <AccountCards />
            </section>

            <div className="two-col fade-in" style={{ animationDelay: "0.1s" }}>
                <CheckboxFilter
                    categories={transactionCategories}
                    selected={selectedCategories}
                    onChange={onCategoryChange}
                />
                <TransferForm />
            </div>

            <section className="section fade-in" style={{ animationDelay: "0.15s" }}>
                <TransactionTable
                    transactions={filteredTransactions}
                    globalSearch={globalSearchQuery}
                />
            </section>
        </>
    );
}

function AccountsPage({ globalSearchQuery }) {
    const filteredTransactions = mockTransactions.filter(transaction => {
        const query = globalSearchQuery.toLowerCase();
        return !query ||
            transaction.description.toLowerCase().includes(query) ||
            transaction.category.toLowerCase().includes(query) ||
            transaction.status.toLowerCase().includes(query) ||
            Math.abs(transaction.amount).toString().includes(query);
    });

    return (
        <div className="page-content fade-in" data-testid="accounts-page">
            <section className="section">
                <AccountCards />
            </section>

            <section className="section">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Account Details</h2>
                        <span className="badge badge-blue">4 Accounts</span>
                    </div>
                    <div className="account-details-grid">
                        {mockAccounts.map(account => {
                            const isNegative = account.balance < 0;
                            return (
                                <div key={account.id} className="account-detail-row" data-testid={`account-detail-${account.id}`}>
                                    <div className="acc-det-icon" style={{ background: `${account.color}22`, color: account.color }}>
                                        <Wallet size={22} />
                                    </div>
                                    <div className="acc-det-info">
                                        <div className="acc-det-name">{account.name}</div>
                                        <div className="acc-det-num">{account.number} · {account.type.charAt(0).toUpperCase() + account.type.slice(1)}</div>
                                    </div>
                                    <div className={`acc-det-bal ${isNegative ? "debit" : "credit"}`}>
                                        {isNegative ? "-" : "+"}${Math.abs(account.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </div>
                                    <button className="btn btn-secondary btn-sm" data-testid={`btn-manage-${account.id}`}>Manage</button>
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
                        {globalSearchQuery && (
                            <span className="badge badge-blue">🔍 "{globalSearchQuery}" — {filteredTransactions.length} results</span>
                        )}
                    </div>
                    <TransactionTable transactions={filteredTransactions} globalSearch={globalSearchQuery} />
                </div>
            </section>
        </div>
    );
}

function TransfersPage({ globalSearchQuery }) {
    const query = globalSearchQuery.toLowerCase();
    const transferHistory = mockTransactions
        .filter(transaction => transaction.category === "Transfers")
        .filter(transaction => !query ||
            transaction.description.toLowerCase().includes(query) ||
            transaction.customerId.toLowerCase().includes(query) ||
            transaction.status.toLowerCase().includes(query) ||
            Math.abs(transaction.amount).toString().includes(query)
        );

    return (
        <div className="page-content fade-in" data-testid="transfers-page">
            <section className="summary-strip">
                <div className="summary-card">
                    <span className="summary-label">Transfers This Month</span>
                    <span className="summary-value">12</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Sent</span>
                    <span className="summary-value debit">-$4,700.00</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Received</span>
                    <span className="summary-value credit">+$2,000.00</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Pending</span>
                    <span className="summary-value" style={{ color: "var(--warning)" }}>2</span>
                </div>
            </section>

            <div className="two-col section fade-in" style={{ padding: "0 28px 20px" }}>
                <TransferForm />
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Quick Transfer History</h2>
                        {globalSearchQuery && (
                            <span className="badge badge-blue">🔍 {transferHistory.length} results</span>
                        )}
                    </div>
                    {transferHistory.length === 0 ? (
                        <p style={{ color: "var(--gray-400)", textAlign: "center", padding: "24px 0", fontSize: "0.9rem" }}>
                            No transfers match "{globalSearchQuery}"
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {transferHistory.map(transaction => (
                                <div key={transaction.id} className="quick-txn-row" data-testid={`transfer-hist-${transaction.id}`}>
                                    <div className="quick-txn-icon" style={{ background: transaction.type === "credit" ? "#D1FAE5" : "#FEE2E2" }}>
                                        {transaction.type === "credit" ? <TrendingUp size={16} color="var(--success)" /> : <TrendingDown size={16} color="var(--danger)" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--gray-800)" }}>{transaction.description}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{new Date(transaction.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: transaction.type === "credit" ? "var(--success)" : "var(--danger)" }}>
                                        {transaction.type === "credit" ? "+" : ""}{transaction.amount < 0 ? "-" : ""}${Math.abs(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </div>
                                    <span className={`badge ${transaction.status === "Completed" ? "badge-success" : "badge-warning"}`}>{transaction.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
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

function AnalyticsPage() {
    const categoryTotals = transactionCategories.map(categoryName => {
        const matchingTransactions = mockTransactions.filter(transaction => transaction.category === categoryName);
        const totalValue = matchingTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
        const count = matchingTransactions.length;
        return { categoryName, totalValue, count };
    }).sort((a, b) => b.totalValue - a.totalValue);

    const maxTotalValue = categoryTotals[0]?.totalValue || 1;

    const CATEGORY_COLORS = {
        Salary: "#10B981", Deposits: "#3B82F6", Withdrawals: "#EF4444",
        Transfers: "#8B5CF6", Bills: "#F59E0B", Shopping: "#EC4899", Dining: "#14B8A6",
    };

    return (
        <div className="page-content fade-in" data-testid="analytics-page">
            <section className="summary-strip">
                <div className="summary-card">
                    <span className="summary-label">Total Income</span>
                    <span className="summary-value credit">+$10,338.25</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Expenses</span>
                    <span className="summary-value debit">-$5,387.97</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Net Savings</span>
                    <span className="summary-value">+$4,950.28</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Transactions</span>
                    <span className="summary-value">{mockTransactions.length}</span>
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

function SettingsPage({ user }) {
    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: "+1 (555) 012-3456",
        address: "123 Oak Street, New York, NY 10001"
    });
    const [isSaved, setIsSaved] = useState(false);

    const handleProfileUpdate = (event) => {
        event.preventDefault();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
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
                            {user?.avatar || user?.name?.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-800)" }}>{user?.name}</div>
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

                <settings-web-component data-testid="shadow-settings-root"></settings-web-component>
            </div>
        </div>
    );
}

const INITIAL_NOTIFICATIONS = [
    { id: 1, icon: "💰", title: "Salary Deposited", message: "+$5,200.00 credited to Checking", time: "2 hrs ago", isRead: false },
    { id: 2, icon: "⚠️", title: "Large Transaction Alert", message: "$1,800.00 mortgage payment processed", time: "5 hrs ago", isRead: false },
    { id: 3, icon: "✅", title: "Transfer Completed", message: "$500 moved to Savings Account", time: "Yesterday", isRead: true },
    { id: 4, icon: "🔔", title: "Low Balance Warning", message: "Credit card balance exceeds 80% limit", time: "2 days ago", isRead: true },
    { id: 5, icon: "📊", title: "Monthly Statement Ready", message: "Your January 2026 statement is available", time: "3 days ago", isRead: true },
];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [activeNavigationId, setActiveNavigationId] = useState("overview");
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState(transactionCategories);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

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

    const filteredTransactions = mockTransactions.filter(transaction => {
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
                />;
            case "accounts": return <AccountsPage globalSearchQuery={globalSearchQuery} />;
            case "transfers": return <TransfersPage globalSearchQuery={globalSearchQuery} />;
            case "analytics": return <AnalyticsPage />;
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
                    <button className="logout-btn" onClick={logout} data-testid="btn-logout" title="Sign Out">
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
                                            {notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`notif-item ${notification.isRead ? "notif-read" : "notif-unread"}`}
                                                    data-testid={`notif-item-${notification.id}`}
                                                    onClick={() => setNotifications(prev => prev.map(x => x.id === notification.id ? { ...x, isRead: true } : x))}
                                                >
                                                    <span className="notif-icon">{notification.icon}</span>
                                                    <div className="notif-body">
                                                        <div className="notif-item-title">{notification.title}</div>
                                                        <div className="notif-item-message">{notification.message}</div>
                                                        <div className="notif-item-time">{notification.time}</div>
                                                    </div>
                                                    {!notification.isRead && <span className="notif-unread-dot" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="avatar avatar-sm">{user?.avatar || user?.name?.charAt(0)}</div>
                    </div>
                </header>

                <div key={activeNavigationId}>
                    {renderDynamicPageContent()}
                </div>
            </div>
        </div>
    );
}

