import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X, Check } from 'lucide-react';
import clsx from 'clsx';

export const CreatableSelect = ({
    options = [],
    value,
    onChange,
    onCreate,
    placeholder = "Select or create...",
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm(''); // Reset search on close
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exactMatch = options.find(option =>
        option.label.toLowerCase() === searchTerm.toLowerCase()
    );

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCreate = async () => {
        if (!searchTerm.trim()) return;

        setIsCreating(true);
        try {
            await onCreate(searchTerm);
            setIsOpen(false);
            setSearchTerm('');
        } catch (error) {
            console.error("Failed to create option:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={clsx("relative", className)} ref={wrapperRef}>
            {/* Trigger / Input Display */}
            <div
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500"
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }}
            >
                <div className="flex-1 truncate text-gray-700 dark:text-white">
                    {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
                </div>
                <ChevronDown size={16} className="text-gray-400 ml-2" />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (filteredOptions.length > 0) {
                                        handleSelect(filteredOptions[0]);
                                    } else if (searchTerm && !exactMatch) {
                                        handleCreate();
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.map(option => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option)}
                                className={clsx(
                                    "px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between",
                                    value === option.value ? "text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/20" : "text-gray-700 dark:text-gray-300"
                                )}
                            >
                                {option.label}
                                {value === option.value && <Check size={14} />}
                            </div>
                        ))}

                        {/* Create Option */}
                        {searchTerm && !exactMatch && (
                            <div
                                onClick={handleCreate}
                                className="px-4 py-2 text-sm cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                            >
                                <Plus size={14} />
                                {isCreating ? "Creating..." : `Create "${searchTerm}"`}
                            </div>
                        )}

                        {filteredOptions.length === 0 && !searchTerm && (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                Start typing to search or create...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
