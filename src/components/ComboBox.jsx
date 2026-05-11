import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import './ComboBox.css';

/**
 * Standard ComboBox
 */
export function StandardComboBox({ options, value, onChange, placeholder = "Select an option..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="combobox-container" ref={containerRef}>
            <div 
                className={`combobox-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                data-testid="standard-combo-trigger"
            >
                <span className={`combobox-value ${!selectedOption ? 'placeholder' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`combobox-icon ${isOpen ? 'rotate' : ''}`} />
            </div>
            {isOpen && (
                <div className="combobox-dropdown fade-in">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`combobox-option ${value === option.value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                            {value === option.value && <Check size={14} className="check-icon" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Searchable ComboBox
 */
export function SearchableComboBox({ options, value, onChange, placeholder = "Search options..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="combobox-container" ref={containerRef}>
            <div 
                className={`combobox-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <div className="combobox-search-wrapper">
                        <input
                            ref={inputRef}
                            className="combobox-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={placeholder}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ) : (
                    <>
                        <span className={`combobox-value ${!selectedOption ? 'placeholder' : ''}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronDown size={16} className={`combobox-icon`} />
                    </>
                )}
            </div>
            {isOpen && (
                <div className="combobox-dropdown fade-in">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`combobox-option ${value === option.value ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                    setSearchQuery('');
                                }}
                            >
                                {option.label}
                                {value === option.value && <Check size={14} className="check-icon" />}
                            </div>
                        ))
                    ) : (
                        <div className="combobox-empty">No options found</div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Multi-Select ComboBox
 */
export function MultiSelectComboBox({ options, values = [], onChange, placeholder = "Select multiple..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue) => {
        if (values.includes(optionValue)) {
            onChange(values.filter(v => v !== optionValue));
        } else {
            onChange([...values, optionValue]);
        }
    };

    const removeTag = (e, optionValue) => {
        e.stopPropagation();
        onChange(values.filter(v => v !== optionValue));
    };

    const selectedOptions = options.filter(opt => values.includes(opt.value));

    return (
        <div className="combobox-container multi-select" ref={containerRef}>
            <div 
                className={`combobox-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="combobox-tags">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span key={opt.value} className="combobox-tag fade-in">
                                {opt.label}
                                <X size={12} className="tag-remove" onClick={(e) => removeTag(e, opt.value)} />
                            </span>
                        ))
                    ) : (
                        <span className="combobox-value placeholder">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={16} className={`combobox-icon ${isOpen ? 'rotate' : ''}`} />
            </div>
            {isOpen && (
                <div className="combobox-dropdown fade-in">
                    {options.map((option) => {
                        const isSelected = values.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                className={`combobox-option multi ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleOption(option.value)}
                            >
                                <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                </div>
                                {option.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
