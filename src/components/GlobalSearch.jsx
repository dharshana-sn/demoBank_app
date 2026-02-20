/**
 * GlobalSearch.jsx
 * 
 * A reusable search input component used across the dashboard.
 * It provides a centralized way to filter data in real-time. 
 * Includes a "clear" button that appears only when there is active text.
 */

import { Search, X } from "lucide-react";
import "./GlobalSearch.css";

export default function GlobalSearch({ searchQuery, onSearchQueryChange }) {
    return (
        <div className="global-search-wrap" data-testid="global-search-container">
            <Search size={16} className="search-icon" />
            <input
                type="text"
                className="global-search-input"
                placeholder="Search transactions, categories..."
                value={searchQuery}
                onChange={event => onSearchQueryChange(event.target.value)}
                data-testid="input-global-search"
                aria-label="Global search"
            />
            {searchQuery && (
                <button
                    className="search-clear"
                    onClick={() => onSearchQueryChange("")}
                    data-testid="btn-clear-search"
                    title="Clear search"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

