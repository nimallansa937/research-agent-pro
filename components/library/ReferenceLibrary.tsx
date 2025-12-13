import React, { useState, useMemo } from 'react';
import {
    Search,
    Grid,
    List,
    FolderPlus,
    Tag,
    Trash2,
    FileText,
    Calendar,
    BookOpen,
    MoreVertical,
    Upload,
    Download,
    Filter,
    SortAsc
} from 'lucide-react';
import { Paper, Folder } from '../../types';

interface ReferenceLibraryProps {
    papers: Paper[];
    onOpenPaper: (paper: Paper) => void;
    onRemovePaper: (id: string) => void;
}

const ReferenceLibrary: React.FC<ReferenceLibraryProps> = ({
    papers,
    onOpenPaper,
    onRemovePaper
}) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'addedAt' | 'year' | 'title'>('addedAt');
    const [folders] = useState<Folder[]>([
        { id: '1', name: 'Machine Learning', createdAt: new Date() },
        { id: '2', name: 'Finance', createdAt: new Date() },
        { id: '3', name: 'To Read', createdAt: new Date() },
    ]);

    const filteredPapers = useMemo(() => {
        let result = papers;

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.authors.some(a => a.toLowerCase().includes(q)) ||
                p.abstract.toLowerCase().includes(q)
            );
        }

        // Folder filter
        if (selectedFolder) {
            result = result.filter(p => p.folderId === selectedFolder);
        }

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'year':
                    return b.year - a.year;
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'addedAt':
                default:
                    return (b.addedAt?.getTime() || 0) - (a.addedAt?.getTime() || 0);
            }
        });

        return result;
    }, [papers, searchQuery, selectedFolder, sortBy]);

    return (
        <div className="h-full flex gap-6 animate-fade-in">
            {/* Sidebar - Folders */}
            <div className="w-64 flex-shrink-0 space-y-4">
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Folders</h3>
                        <button className="btn btn-ghost btn-icon btn-sm">
                            <FolderPlus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <button
                            onClick={() => setSelectedFolder(null)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedFolder === null
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : 'hover:bg-neutral-800 text-neutral-300'
                                }`}
                        >
                            All Papers ({papers.length})
                        </button>
                        {folders.map(folder => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedFolder === folder.id
                                        ? 'bg-indigo-500/20 text-indigo-300'
                                        : 'hover:bg-neutral-800 text-neutral-300'
                                    }`}
                            >
                                {folder.name} (0)
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-4">
                    <h3 className="font-semibold text-white mb-4">Import</h3>
                    <div className="space-y-2">
                        <button className="btn btn-secondary btn-sm w-full justify-start">
                            <Upload className="w-4 h-4" />
                            Upload PDF
                        </button>
                        <button className="btn btn-secondary btn-sm w-full justify-start">
                            <FileText className="w-4 h-4" />
                            Import BibTeX
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search your library..."
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-sm text-neutral-300"
                        >
                            <option value="addedAt">Recently Added</option>
                            <option value="year">Year</option>
                            <option value="title">Title</option>
                        </select>

                        <div className="flex bg-neutral-800/50 rounded-xl border border-neutral-700 p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'text-neutral-400'
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-400'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Papers Display */}
                {filteredPapers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                        <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No papers yet</h3>
                        <p className="text-neutral-400 max-w-md">
                            Start by searching for papers and adding them to your library. Your saved papers will appear here.
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
                        {filteredPapers.map((paper, index) => (
                            <LibraryPaperCard
                                key={paper.id}
                                paper={paper}
                                onOpen={onOpenPaper}
                                onRemove={onRemovePaper}
                                style={{ animationDelay: `${index * 50}ms` }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 overflow-y-auto">
                        {filteredPapers.map((paper, index) => (
                            <LibraryPaperRow
                                key={paper.id}
                                paper={paper}
                                onOpen={onOpenPaper}
                                onRemove={onRemovePaper}
                                style={{ animationDelay: `${index * 30}ms` }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Grid Card
interface LibraryPaperCardProps {
    paper: Paper;
    onOpen: (paper: Paper) => void;
    onRemove: (id: string) => void;
    style?: React.CSSProperties;
}

const LibraryPaperCard: React.FC<LibraryPaperCardProps> = ({ paper, onOpen, onRemove, style }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="card paper-card animate-slide-up relative group" style={style}>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="btn btn-ghost btn-icon btn-sm"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                        <button
                            onClick={() => { onRemove(paper.id); setShowMenu(false); }}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove
                        </button>
                    </div>
                )}
            </div>

            <h3
                className="paper-card-title cursor-pointer hover:text-indigo-400 transition-colors pr-8"
                onClick={() => onOpen(paper)}
            >
                {paper.title}
            </h3>
            <p className="paper-card-authors">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 && ' et al.'}</p>
            <div className="paper-card-meta">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {paper.year}
                </span>
                {paper.venue && (
                    <span className="truncate max-w-[150px]">{paper.venue}</span>
                )}
            </div>
            <p className="paper-card-abstract text-xs">{paper.abstract}</p>
        </div>
    );
};

// List Row
const LibraryPaperRow: React.FC<LibraryPaperCardProps> = ({ paper, onOpen, onRemove, style }) => {
    return (
        <div
            className="card p-4 flex items-center gap-4 animate-slide-up cursor-pointer hover:border-indigo-500/50"
            style={style}
            onClick={() => onOpen(paper)}
        >
            <div className="w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{paper.title}</h3>
                <p className="text-sm text-neutral-400 truncate">{paper.authors.join(', ')} • {paper.year}</p>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(paper.id); }}
                className="btn btn-ghost btn-icon btn-sm text-neutral-400 hover:text-red-400"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export default ReferenceLibrary;
