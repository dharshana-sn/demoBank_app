/**
 * CheckboxFilter.jsx
 * 
 * Provides a UI for filtering transactions by their respective categories.
 * Users can toggle individual categories or use the "Select All" convenience button
 * to quickly update their view.
 */

import { Filter, CheckSquare, Square } from "lucide-react";
import "./CheckboxFilter.css";

export default function CheckboxFilter({ categories, selected, onChange }) {
    const isEveryCategorySelected = selected.length === categories.length;

    const handleCategoryToggle = (categoryName) => {
        if (selected.includes(categoryName)) {
            // Remove the category if it's already in the selected list
            onChange(selected.filter(item => item !== categoryName));
        } else {
            // Add the category to the list of selected filters
            onChange([...selected, categoryName]);
        }
    };

    const handleToggleAll = () => {
        // If everything is selected, clear it out. Otherwise, select everything.
        onChange(isEveryCategorySelected ? [] : [...categories]);
    };

    const CATEGORY_COLOR_SCHEMES = {
        Salary: { bg: "#D1FAE5", color: "#065F46" },
        Deposits: { bg: "#DBEAFE", color: "#1E40AF" },
        Withdrawals: { bg: "#FEE2E2", color: "#991B1B" },
        Transfers: { bg: "#EDE9FE", color: "#5B21B6" },
        Bills: { bg: "#FEF3C7", color: "#92400E" },
        Shopping: { bg: "#FCE7F3", color: "#9D174D" },
        Dining: { bg: "#ECFDF5", color: "#065F46" },
    };

    return (
        <div className="card" data-testid="checkbox-filter-section">
            <div className="card-header">
                <h2 className="card-title">Filter by Category</h2>
                <Filter size={18} color="var(--blue-600)" />
            </div>

            <button
                className={`toggle-all-btn ${isEveryCategorySelected ? "all-selected" : ""}`}
                onClick={handleToggleAll}
                data-testid="btn-toggle-all-categories"
            >
                {isEveryCategorySelected ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{isEveryCategorySelected ? "Deselect All" : "Select All"}</span>
            </button>

            <div className="checkbox-list" data-testid="checkbox-filter-list">
                {categories.map(categoryName => {
                    const isChecked = selected.includes(categoryName);
                    const visualTheme = CATEGORY_COLOR_SCHEMES[categoryName] || { bg: "#F1F5F9", color: "#475569" };

                    return (
                        <label
                            key={categoryName}
                            className={`checkbox-item ${isChecked ? "checked" : ""}`}
                            data-testid={`chk-category-${categoryName.toLowerCase()}`}
                            htmlFor={`chk-${categoryName}`}
                        >
                            <input
                                id={`chk-${categoryName}`}
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCategoryToggle(categoryName)}
                                className="chk-input"
                            />
                            <span className="chk-box">
                                {isChecked && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path
                                            d="M1 4L3.5 6.5L9 1"
                                            stroke="white"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </span>
                            <span
                                className="cat-badge"
                                style={{ background: visualTheme.bg, color: visualTheme.color }}
                                data-testid={`cat-badge-${categoryName.toLowerCase()}`}
                            >
                                {categoryName}
                            </span>
                            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--gray-400)" }}>
                                {isChecked ? "✓" : ""}
                            </span>
                        </label>
                    );
                })}
            </div>

            {selected.length > 0 && selected.length < categories.length && (
                <p className="filter-hint" data-testid="filter-hint">
                    Showing <strong>{selected.length}</strong> of {categories.length} categories
                </p>
            )}
        </div>
    );
}

