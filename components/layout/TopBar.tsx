import React, { useState, ReactNode } from 'react';
import { Search, Menu, Bell, HelpCircle } from 'lucide-react';

interface TopBarProps {
    onSearch?: (query: string) => void;
    onMenuToggle?: () => void;
    showMenuButton?: boolean;
    rightContent?: ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({
    onSearch,
    onMenuToggle,
    showMenuButton = false,
    rightContent
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch && searchQuery.trim()) {
            onSearch(searchQuery);
        }
    };

    return (
        <header className="topbar">
            {showMenuButton && (
                <button
                    onClick={onMenuToggle}
                    className="btn btn-ghost btn-icon"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-wrapper">
                <div className="search-input-container">
                    <Search className="search-icon w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search papers, topics, or ask a research question..."
                        className="search-input"
                    />
                </div>
            </form>

            {/* Actions */}
            <div className="topbar-actions">
                <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    title="Help"
                    onClick={() => alert('Help documentation coming soon!')}
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    title="Notifications"
                    onClick={() => alert('Notifications feature coming soon!')}
                >
                    <Bell className="w-5 h-5" />
                </button>
                {rightContent}
            </div>
        </header>
    );
};

export default TopBar;
