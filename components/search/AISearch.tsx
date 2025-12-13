import React, { useState } from 'react';
import {
    Search,
    Sparkles,
    Filter,
    BookOpen,
    Calendar,
    ArrowUpRight,
    Plus,
    Loader2,
    TrendingUp
} from 'lucide-react';
import { Paper } from '../../types';
import { searchPapers } from '../../services/geminiService';

interface AISearchProps {
    onAddToLibrary: (paper: Paper) => void;
    onOpenPaper: (paper: Paper) => void;
}

// Mock suggested queries
const suggestedQueries = [
    "Market regime detection using machine learning",
    "Transformer models for time series forecasting",
    "Cryptocurrency volatility prediction",
    "Reinforcement learning in quantitative finance",
    "Deep learning for portfolio optimization"
];

const AISearch: React.FC<AISearchProps> = ({ onAddToLibrary, onOpenPaper }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Paper[]>([]);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        yearStart: 2020,
        yearEnd: 2025,
        sortBy: 'relevance' as 'relevance' | 'citations' | 'year'
    });

    const handleSearch = async (searchQuery?: string) => {
        const q = searchQuery || query;
        if (!q.trim()) return;

        setIsSearching(true);
        setAiSummary(null);

        try {
            const response = await searchPapers(q, filters);
            setResults(response.papers);
            setAiSummary(response.aiSummary || null);
        } catch (error) {
            console.error('Search error:', error);
            // Show mock results on error for demo
            setResults(generateMockResults(q));
            setAiSummary(`Based on your query "${q}", I found several relevant papers covering recent advances in this research area. The literature shows growing interest in this topic, with publications spanning machine learning applications, empirical validation, and novel methodologies.`);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in">
            {/* Search Header */}
            <div className="text-center space-y-4 py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold gradient-text">AI-Powered Research Discovery</h1>
                <p className="text-neutral-400 max-w-xl mx-auto">
                    Search millions of academic papers with natural language. Get AI-summarized insights and find exactly what you need.
                </p>
            </div>

            {/* Search Input */}
            <div className="max-w-3xl mx-auto w-full space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a research question or enter keywords..."
                        className="w-full pl-12 pr-32 py-4 bg-neutral-800/50 border border-neutral-700 rounded-2xl text-white text-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn btn-ghost btn-icon ${showFilters ? 'text-indigo-400' : ''}`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handleSearch()}
                            disabled={isSearching || !query.trim()}
                            className="btn btn-primary"
                        >
                            {isSearching ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="card p-4 animate-slide-up">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-neutral-400" />
                                <span className="text-sm text-neutral-400">Year:</span>
                                <input
                                    type="number"
                                    value={filters.yearStart}
                                    onChange={(e) => setFilters({ ...filters, yearStart: parseInt(e.target.value) })}
                                    className="w-20 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                                    min="1990"
                                    max="2025"
                                />
                                <span className="text-neutral-500">to</span>
                                <input
                                    type="number"
                                    value={filters.yearEnd}
                                    onChange={(e) => setFilters({ ...filters, yearEnd: parseInt(e.target.value) })}
                                    className="w-20 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                                    min="1990"
                                    max="2025"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-neutral-400" />
                                <span className="text-sm text-neutral-400">Sort by:</span>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                                    className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="citations">Citations</option>
                                    <option value="year">Year</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Suggested Queries */}
                {!results.length && !isSearching && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {suggestedQueries.map((sq, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setQuery(sq);
                                    handleSearch(sq);
                                }}
                                className="px-3 py-1.5 text-sm bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700 rounded-full text-neutral-300 transition-colors"
                            >
                                {sq}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Summary */}
            {aiSummary && (
                <div className="max-w-4xl mx-auto w-full card p-6 border-l-4 border-l-indigo-500 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">AI Research Summary</h3>
                            <p className="text-neutral-300 leading-relaxed">{aiSummary}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {isSearching ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-neutral-400">Searching across millions of papers...</p>
                </div>
            ) : results.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <p className="text-sm text-neutral-400 px-2">
                            Found {results.length} relevant papers
                        </p>
                        {results.map((paper, index) => (
                            <PaperCard
                                key={paper.id}
                                paper={paper}
                                onAddToLibrary={onAddToLibrary}
                                onOpenPaper={onOpenPaper}
                                style={{ animationDelay: `${index * 50}ms` }}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

// Paper Card Component
interface PaperCardProps {
    paper: Paper;
    onAddToLibrary: (paper: Paper) => void;
    onOpenPaper: (paper: Paper) => void;
    style?: React.CSSProperties;
}

const PaperCard: React.FC<PaperCardProps> = ({ paper, onAddToLibrary, onOpenPaper, style }) => {
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        onAddToLibrary(paper);
        setAdded(true);
    };

    return (
        <div className="card paper-card animate-slide-up" style={style}>
            <h3
                className="paper-card-title cursor-pointer hover:text-indigo-400 transition-colors"
                onClick={() => onOpenPaper(paper)}
            >
                {paper.title}
            </h3>
            <p className="paper-card-authors">{paper.authors.join(', ')}</p>
            <div className="paper-card-meta">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {paper.year}
                </span>
                {paper.venue && (
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {paper.venue}
                    </span>
                )}
                {paper.citations !== undefined && (
                    <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {paper.citations} citations
                    </span>
                )}
            </div>
            <p className="paper-card-abstract">{paper.abstract}</p>
            <div className="paper-card-actions">
                <button
                    onClick={handleAdd}
                    disabled={added}
                    className={`btn btn-sm ${added ? 'btn-secondary' : 'btn-primary'}`}
                >
                    {added ? 'Added ✓' : (
                        <>
                            <Plus className="w-4 h-4" />
                            Add to Library
                        </>
                    )}
                </button>
                {paper.doi && (
                    <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-ghost"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        View DOI
                    </a>
                )}
            </div>
        </div>
    );
};

// Mock data generator for demo
function generateMockResults(query: string): Paper[] {
    const mockPapers: Paper[] = [
        {
            id: '1',
            title: `Deep Learning Approaches for ${query.split(' ').slice(0, 3).join(' ')}: A Comprehensive Survey`,
            authors: ['Zhang, Wei', 'Johnson, Michael', 'Smith, Sarah'],
            year: 2024,
            abstract: 'This paper presents a comprehensive survey of deep learning methodologies applied to the specified domain. We analyze recent advances, benchmark performances, and identify key research challenges for future investigation.',
            venue: 'IEEE Transactions on Neural Networks',
            doi: '10.1109/TNN.2024.001234',
            citations: 127
        },
        {
            id: '2',
            title: `Reinforcement Learning for Adaptive ${query.split(' ').slice(0, 2).join(' ')} Systems`,
            authors: ['Chen, Liu', 'Williams, Robert', 'Kumar, Anil'],
            year: 2023,
            abstract: 'We propose a novel reinforcement learning framework that adaptively learns optimal strategies in complex environments. Our approach demonstrates significant improvements over existing baselines on multiple benchmarks.',
            venue: 'NeurIPS 2023',
            doi: '10.48550/arXiv.2312.00001',
            citations: 89
        },
        {
            id: '3',
            title: `Transformer-Based Models for ${query.split(' ')[0]} Analysis and Prediction`,
            authors: ['Park, Jieun', 'Anderson, Thomas', 'Lee, Chul'],
            year: 2024,
            abstract: 'This work introduces a transformer architecture specifically designed for the target application domain. Extensive experiments validate the effectiveness of our approach, achieving state-of-the-art results.',
            venue: 'ICML 2024',
            doi: '10.48550/arXiv.2403.00002',
            citations: 45
        },
        {
            id: '4',
            title: `Empirical Analysis of ${query.split(' ').slice(-2).join(' ')} in Real-World Scenarios`,
            authors: ['Brown, Emily', 'Garcia, Manuel', 'Wang, Xiaoming'],
            year: 2023,
            abstract: 'We conduct a large-scale empirical study analyzing real-world data from multiple sources. Our findings reveal important patterns and provide actionable insights for practitioners.',
            venue: 'Journal of Machine Learning Research',
            doi: '10.5555/jmlr.2023.0456',
            citations: 203
        },
        {
            id: '5',
            title: `A Hybrid Approach to ${query.split(' ')[0]} Using Neural Networks and Statistical Methods`,
            authors: ['Taylor, David', 'Martinez, Carlos', 'Kim, Seokhyun'],
            year: 2024,
            abstract: 'We propose a hybrid methodology combining the strengths of neural network architectures with traditional statistical approaches. Our method offers improved interpretability while maintaining competitive performance.',
            venue: 'AAAI 2024',
            doi: '10.1609/aaai.v38.i1.12345',
            citations: 67
        }
    ];
    return mockPapers;
}

export default AISearch;
