/**
 * TransactionTable.jsx
 * 
 * A highly functional data table for display financial records. 
 * Features include multi-column sorting, pagination, category-based styling, 
 * real-time search highlighting for filtered results, and date range filtering.
 */

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, CalendarRange, X } from "lucide-react";
import "./TransactionTable.css";

const TRANSACTIONS_PER_PAGE = 8;

/**
 * Helper function to highlight search matches within text
 */
function getHighlightedText(fullText, searchQuery) {
    if (!searchQuery) return fullText;

    const searchIndex = fullText.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (searchIndex === -1) return fullText;

    return (
        <>
            {fullText.slice(0, searchIndex)}
            <mark className="search-highlight">
                {fullText.slice(searchIndex, searchIndex + searchQuery.length)}
            </mark>
            {fullText.slice(searchIndex + searchQuery.length)}
        </>
    );
}

export default function TransactionTable({ transactions, globalSearch }) {
    const [currentSortKey, setCurrentSortKey] = useState("date");
    const [sortDirection, setSortDirection] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const toggleSort = (columnKey) => {
        if (currentSortKey === columnKey) {
            setSortDirection(prevDirection => prevDirection === "asc" ? "desc" : "asc");
        } else {
            setCurrentSortKey(columnKey);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    const handleClearDates = () => {
        setDateFrom("");
        setDateTo("");
        setCurrentPage(1);
    };

    const sortedTransactions = useMemo(() => {
        // First: date filter
        let filtered = [...transactions];
        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            filtered = filtered.filter(t => new Date(t.date) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.date) <= to);
        }

        // Then sort
        return filtered.sort((recordA, recordB) => {
            let valueA = recordA[currentSortKey];
            let valueB = recordB[currentSortKey];

            if (currentSortKey === "amount") {
                valueA = Math.abs(valueA);
                valueB = Math.abs(valueB);
            }

            if (currentSortKey === "date") {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            }

            if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
            if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [transactions, currentSortKey, sortDirection, dateFrom, dateTo]);

    const totalPagesCount = Math.ceil(sortedTransactions.length / TRANSACTIONS_PER_PAGE);
    const currentPageTransactions = sortedTransactions.slice(
        (currentPage - 1) * TRANSACTIONS_PER_PAGE,
        currentPage * TRANSACTIONS_PER_PAGE
    );

    const SortIndicator = ({ columnKey }) => {
        if (currentSortKey !== columnKey) {
            return <ArrowUpDown size={14} className="sort-icon" />;
        }
        return sortDirection === "asc"
            ? <ArrowUp size={14} className="sort-icon active" />
            : <ArrowDown size={14} className="sort-icon active" />;
    };

    const TABLE_COLUMNS = [
        { key: "date", label: "Date", sortable: true },
        { key: "customerId", label: "Customer ID", sortable: true },
        { key: "description", label: "Description", sortable: true },
        { key: "category", label: "Category", sortable: true },
        { key: "amount", label: "Amount", sortable: true },
        { key: "status", label: "Status", sortable: true },
    ];

    const getStatusBadgeClass = (statusValue) => {
        const statusMap = {
            Completed: "badge-success",
            Pending: "badge-warning",
            Failed: "badge-danger"
        };
        return statusMap[statusValue] || "badge-blue";
    };

    const CATEGORY_STYLE_MAP = {
        Salary: { bg: "#D1FAE5", color: "#065F46" },
        Deposits: { bg: "#DBEAFE", color: "#1E40AF" },
        Withdrawals: { bg: "#FEE2E2", color: "#991B1B" },
        Transfers: { bg: "#EDE9FE", color: "#5B21B6" },
        Bills: { bg: "#FEF3C7", color: "#92400E" },
        Shopping: { bg: "#FCE7F3", color: "#9D174D" },
        Dining: { bg: "#ECFDF5", color: "#065F46" },
    };

    const isDateFiltered = dateFrom || dateTo;

    return (
        <div className="card" data-testid="transaction-table-section">
            <div className="card-header">
                <h2 className="card-title">Transaction History</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="badge badge-blue" data-testid="txn-count">
                        {sortedTransactions.length} records
                    </span>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="txn-date-filter" data-testid="date-filter-bar">
                <div className="txn-date-filter-inner">
                    <CalendarRange size={16} className="txn-date-icon" />
                    <span className="txn-date-label">Filter by Date:</span>
                    <div className="txn-date-field">
                        <label htmlFor="txn-date-from">From</label>
                        <input
                            type="date"
                            id="txn-date-from"
                            className="txn-date-input"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                            data-testid="input-date-from"
                        />
                    </div>
                    <div className="txn-date-field">
                        <label htmlFor="txn-date-to">To</label>
                        <input
                            type="date"
                            id="txn-date-to"
                            className="txn-date-input"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
                            data-testid="input-date-to"
                        />
                    </div>
                    {isDateFiltered && (
                        <button
                            className="txn-date-clear"
                            onClick={handleClearDates}
                            title="Clear date filter"
                            data-testid="btn-clear-dates"
                        >
                            <X size={14} /> Clear
                        </button>
                    )}
                </div>
                {isDateFiltered && (
                    <span className="txn-date-active-badge">
                        📅 {sortedTransactions.length} results in selected range
                    </span>
                )}
            </div>

            <div className="table-wrapper" data-testid="transaction-table-wrapper">
                <table className="txn-table" data-testid="transaction-table">
                    <thead>
                        <tr>
                            {TABLE_COLUMNS.map(column => (
                                <th
                                    key={column.key}
                                    className={column.sortable ? "sortable" : ""}
                                    onClick={column.sortable ? () => toggleSort(column.key) : undefined}
                                    data-testid={`th-${column.key}`}
                                    aria-sort={currentSortKey === column.key ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                                >
                                    <span className="th-inner">
                                        {column.label}
                                        {column.sortable && <SortIndicator columnKey={column.key} />}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    {/* Screen-only paginated rows */}
                    <tbody className="screen-only">
                        {currentPageTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-row" data-testid="txn-empty-state">
                                    <div>
                                        <p style={{ fontSize: "1.5rem" }}>🔍</p>
                                        <p>No transactions match your search or filters</p>
                                    </div>
                                </td>
                            </tr>
                        ) : currentPageTransactions.map((transaction, index) => {
                            const categoryStyle = CATEGORY_STYLE_MAP[transaction.category] || { bg: "#F1F5F9", color: "#475569" };
                            return (
                                <tr
                                    key={transaction.id}
                                    className={`txn-row ${index % 2 === 0 ? "even" : "odd"}`}
                                    data-testid={`txn-row-${transaction.id}`}
                                >
                                    <td className="td-date">{new Date(transaction.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                    <td className="td-cid">{getHighlightedText(transaction.customerId, globalSearch)}</td>
                                    <td className="td-desc">{getHighlightedText(transaction.description, globalSearch)}</td>
                                    <td>
                                        <span className="cat-dot" style={{ background: categoryStyle.bg, color: categoryStyle.color }}>
                                            {getHighlightedText(transaction.category, globalSearch)}
                                        </span>
                                    </td>
                                    <td className={`td-amount ${transaction.type}`}>
                                        {transaction.type === "credit" ? "+" : ""}${Math.abs(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>{transaction.status}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                    {/* Print-only full rows (Hidden on screen) */}
                    <tbody className="print-only">
                        {sortedTransactions.map((transaction, index) => {
                            const categoryStyle = CATEGORY_STYLE_MAP[transaction.category] || { bg: "#F1F5F9", color: "#475569" };
                            return (
                                <tr key={`print-${transaction.id}`} className={`txn-row ${index % 2 === 0 ? "even" : "odd"}`}>
                                    <td className="td-date">{new Date(transaction.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                    <td className="td-cid">{transaction.customerId}</td>
                                    <td className="td-desc">{transaction.description}</td>
                                    <td>
                                        <span className="cat-dot" style={{ background: categoryStyle.bg, color: categoryStyle.color }}>
                                            {transaction.category}
                                        </span>
                                    </td>
                                    <td className={`td-amount ${transaction.type}`}>
                                        {transaction.type === "credit" ? "+" : ""}${Math.abs(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>{transaction.status}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Minimal Pagination Controls */}
            {totalPagesCount > 1 && (
                <div className="pagination-minimal" data-testid="pagination">
                    <button
                        className="btn-pagination"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        data-testid="btn-prev-page"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="page-indicator">
                        <span className="current">{currentPage}</span>
                        <span className="separator">/</span>
                        <span className="total">{totalPagesCount}</span>
                    </div>

                    <button
                        className="btn-pagination"
                        onClick={() => setCurrentPage(prev => Math.min(totalPagesCount, prev + 1))}
                        disabled={currentPage === totalPagesCount}
                        data-testid="btn-next-page"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
