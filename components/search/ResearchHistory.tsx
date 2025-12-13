import React, { useState, useEffect } from 'react';
import {
    History,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    FileText,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getResearchHistory,
    deleteResearch,
    ResearchItem
} from '../../services/researchHistoryService';

interface ResearchHistoryProps {
    onSelectResearch: (research: ResearchItem) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const ResearchHistory: React.FC<ResearchHistoryProps> = ({
    onSelectResearch,
    isCollapsed,
    onToggleCollapse
}) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<ResearchItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, [user]);

    const loadHistory = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const items = await getResearchHistory(user.uid);
            setHistory(items);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
        setLoading(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!user || !id) return;

        setDeletingId(id);
        try {
            await deleteResearch(user.uid, id);
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete:', error);
        }
        setDeletingId(null);
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    if (isCollapsed) {
        return (
            <div className="w-12 border-r border-neutral-700 flex flex-col items-center py-4">
                <button
                    onClick={onToggleCollapse}
                    className="btn btn-ghost btn-icon mb-4"
                    title="Expand History"
                >
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
                <History className="w-5 h-5 text-neutral-500" />
            </div>
        );
    }

    return (
        <div className="w-64 border-r border-neutral-700 flex flex-col bg-neutral-900/50">
            {/* Header */}
            <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    History
                </h3>
                <button
                    onClick={onToggleCollapse}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Collapse"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <FileText className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">No research history yet</p>
                        <p className="text-xs text-neutral-600 mt-1">
                            Completed research will appear here
                        </p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onSelectResearch(item)}
                            className="group p-3 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(item.createdAt instanceof Date ? item.createdAt : new Date())}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, item.id!)}
                                    disabled={deletingId === item.id}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                    title="Delete"
                                >
                                    {deletingId === item.id ? (
                                        <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    )}
                                </button>
                            </div>
                            {item.status === 'error' && (
                                <div className="flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3 h-3 text-red-400" />
                                    <span className="text-xs text-red-400">Error</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Refresh Button */}
            {!loading && history.length > 0 && (
                <div className="p-2 border-t border-neutral-700">
                    <button
                        onClick={loadHistory}
                        className="w-full btn btn-ghost btn-sm text-neutral-400"
                    >
                        Refresh
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResearchHistory;
