import React from 'react';
import {
    Search,
    Library,
    FileText,
    TableProperties,
    PenTool,
    MessageSquare,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Zap
} from 'lucide-react';
import { ViewState, NavItem } from '../types';

interface SidebarProps {
    currentView: ViewState;
    onViewChange: (view: ViewState) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const navItems: NavItem[] = [
    { id: 'search', label: 'AI Search', icon: 'Search' },
    { id: 'deep-research', label: 'Deep Research', icon: 'Zap' },
    { id: 'library', label: 'My Library', icon: 'Library' },
    { id: 'reader', label: 'PDF Reader', icon: 'FileText' },
    { id: 'review', label: 'Lit Review', icon: 'TableProperties' },
    { id: 'writer', label: 'AI Writer', icon: 'PenTool' },
    { id: 'chat', label: 'Research Chat', icon: 'MessageSquare' },
];

const getIcon = (iconName: string, className: string) => {
    const icons: Record<string, React.ReactNode> = {
        Search: <Search className={className} />,
        Zap: <Zap className={className} />,
        Library: <Library className={className} />,
        FileText: <FileText className={className} />,
        TableProperties: <TableProperties className={className} />,
        PenTool: <PenTool className={className} />,
        MessageSquare: <MessageSquare className={className} />,
        Settings: <Settings className={className} />,
    };
    return icons[iconName] || <FileText className={className} />;
};

const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onViewChange,
    isCollapsed,
    onToggleCollapse,
}) => {
    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header / Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Sparkles className="w-6 h-6" />
                </div>
                {!isCollapsed && (
                    <span className="sidebar-brand">ResearchAgent Pro</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    {!isCollapsed && (
                        <span className="nav-section-title">Main</span>
                    )}
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            {getIcon(item.icon, 'w-5 h-5')}
                            {!isCollapsed && <span>{item.label}</span>}
                            {item.badge && !isCollapsed && (
                                <span className="badge">{item.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="nav-section" style={{ marginTop: 'auto' }}>
                    {!isCollapsed && (
                        <span className="nav-section-title">Settings</span>
                    )}
                    <button
                        onClick={() => onViewChange('settings')}
                        className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
                        title={isCollapsed ? 'AI Settings' : undefined}
                    >
                        {getIcon('Settings', 'w-5 h-5')}
                        {!isCollapsed && <span>AI Settings</span>}
                    </button>
                    <button
                        onClick={() => onViewChange('architecture')}
                        className={`nav-item ${currentView === 'architecture' ? 'active' : ''}`}
                        title={isCollapsed ? 'Architecture' : undefined}
                    >
                        {getIcon('Settings', 'w-5 h-5')}
                        {!isCollapsed && <span>Architecture</span>}
                    </button>
                </div>
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={onToggleCollapse}
                className="nav-item"
                style={{
                    margin: '0.5rem 0.75rem 1rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start'
                }}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-5 h-5" />
                ) : (
                    <>
                        <ChevronLeft className="w-5 h-5" />
                        <span>Collapse</span>
                    </>
                )}
            </button>
        </aside>
    );
};

export default Sidebar;
