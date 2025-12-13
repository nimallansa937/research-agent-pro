import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    LogOut,
    Settings,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../services/authService';

interface UserMenuProps {
    onViewChange?: (view: 'settings' | 'profile') => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onViewChange }) => {
    const { user, userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!user) return null;

    const handleSignOut = async () => {
        console.log('handleSignOut started');
        setLoading(true);
        setIsOpen(false);
        try {
            console.log('Calling signOut...');
            await signOut();
            console.log('signOut completed, redirecting...');
            // Force hard redirect to login
            window.location.replace('/login');
        } catch (error) {
            console.error('Sign out error:', error);
            // Even if signOut fails, still redirect
            window.location.replace('/login');
        }
        setLoading(false);
    };

    const displayName = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'User';
    const photoURL = user.photoURL;

    return (
        <div className="user-menu-container" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
                {photoURL ? (
                    <img
                        src={photoURL}
                        alt={displayName}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="text-sm text-neutral-200 hidden md:block">{displayName}</span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>

            {isOpen && (
                <div className="dropdown-menu">
                    {/* User Info */}
                    <div className="p-3 border-b border-neutral-700">
                        <p className="text-sm font-medium text-white truncate">{displayName}</p>
                        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Settings clicked');
                                setIsOpen(false);
                                if (onViewChange) {
                                    onViewChange('settings');
                                } else {
                                    console.warn('onViewChange not provided');
                                }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Profile clicked');
                                setIsOpen(false);
                                if (onViewChange) {
                                    onViewChange('profile');
                                } else {
                                    console.warn('onViewChange not provided');
                                }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </button>
                    </div>

                    {/* Sign Out */}
                    <div className="p-1 border-t border-neutral-700">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Sign Out clicked');
                                handleSignOut();
                            }}
                            disabled={loading}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
