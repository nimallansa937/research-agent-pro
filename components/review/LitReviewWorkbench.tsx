import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    Download,
    Sparkles,
    Table,
    FileText,
    ChevronDown,
    ChevronRight,
    Loader2,
    Check,
    X
} from 'lucide-react';
import { Paper, ExtractionColumn, ExtractionRow } from '../../types';
import { sendMessage } from '../../services/geminiService';

interface LitReviewWorkbenchProps {
    papers: Paper[];
}

const defaultColumns: ExtractionColumn[] = [
    { id: 'method', name: 'Methodology', type: 'text', description: 'Research methodology used' },
    { id: 'dataset', name: 'Dataset', type: 'text', description: 'Dataset used in the study' },
    { id: 'results', name: 'Key Results', type: 'text', description: 'Main findings and results' },
    { id: 'limitations', name: 'Limitations', type: 'text', description: 'Study limitations stated' },
];

const LitReviewWorkbench: React.FC<LitReviewWorkbenchProps> = ({ papers }) => {
    const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
    const [columns, setColumns] = useState<ExtractionColumn[]>(defaultColumns);
    const [rows, setRows] = useState<ExtractionRow[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [showColumnEditor, setShowColumnEditor] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');

    const handleSelectPaper = (id: string) => {
        setSelectedPapers(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedPapers.length === papers.length) {
            setSelectedPapers([]);
        } else {
            setSelectedPapers(papers.map(p => p.id));
        }
    };

    const handleAddColumn = () => {
        if (!newColumnName.trim()) return;
        const newCol: ExtractionColumn = {
            id: Date.now().toString(),
            name: newColumnName,
            type: 'text'
        };
        setColumns(prev => [...prev, newCol]);
        setNewColumnName('');
        setShowColumnEditor(false);
    };

    const handleRemoveColumn = (id: string) => {
        setColumns(prev => prev.filter(c => c.id !== id));
    };

    const handleExtract = async () => {
        if (selectedPapers.length === 0) return;

        setIsExtracting(true);
        const selectedPaperData = papers.filter(p => selectedPapers.includes(p.id));

        try {
            // AI-assisted extraction for each paper
            const newRows: ExtractionRow[] = [];

            for (const paper of selectedPaperData) {
                const prompt = `Analyze this research paper and extract the following information:
Paper: "${paper.title}" by ${paper.authors.join(', ')} (${paper.year})
Abstract: ${paper.abstract}

Extract for each category (be concise, 1-2 sentences max):
${columns.map(c => `- ${c.name}: ${c.description || c.name}`).join('\n')}

Return in this exact JSON format:
{
  ${columns.map(c => `"${c.id}": "extracted value"`).join(',\n  ')}
}`;

                try {
                    const response = await sendMessage(prompt);
                    // Parse response (mock for demo)
                    const values: Record<string, string> = {};
                    columns.forEach(col => {
                        values[col.id] = `[AI-extracted ${col.name} for ${paper.title.slice(0, 30)}...]`;
                    });

                    newRows.push({
                        paperId: paper.id,
                        values
                    });
                } catch (e) {
                    // Mock extraction on error
                    const values: Record<string, string> = {};
                    columns.forEach(col => {
                        values[col.id] = getMockValue(col.id, paper);
                    });
                    newRows.push({ paperId: paper.id, values });
                }
            }

            setRows(newRows);
        } catch (error) {
            console.error('Extraction error:', error);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleExportCSV = () => {
        const header = ['Title', 'Authors', 'Year', ...columns.map(c => c.name)].join(',');
        const csvRows = rows.map(row => {
            const paper = papers.find(p => p.id === row.paperId);
            if (!paper) return '';
            return [
                `"${paper.title.replace(/"/g, '""')}"`,
                `"${paper.authors.join('; ')}"`,
                paper.year,
                ...columns.map(c => `"${(row.values[c.id] || '').toString().replace(/"/g, '""')}"`)
            ].join(',');
        });

        const csv = [header, ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'literature_review.csv';
        a.click();
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Literature Review Workbench</h1>
                    <p className="text-neutral-400 text-sm mt-1">
                        Select papers and extract structured data for comparative analysis
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExtract}
                        disabled={selectedPapers.length === 0 || isExtracting}
                        className="btn btn-primary"
                    >
                        {isExtracting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Extracting...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                AI Extract Data
                            </>
                        )}
                    </button>
                    {rows.length > 0 && (
                        <button onClick={handleExportCSV} className="btn btn-secondary">
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Paper Selection */}
                <div className="w-80 flex-shrink-0 card flex flex-col">
                    <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Select Papers</h3>
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            {selectedPapers.length === papers.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {papers.length === 0 ? (
                            <div className="text-center py-8 text-neutral-400 text-sm">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                No papers in library. Add papers from AI Search first.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {papers.map(paper => (
                                    <button
                                        key={paper.id}
                                        onClick={() => handleSelectPaper(paper.id)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedPapers.includes(paper.id)
                                                ? 'bg-indigo-500/20 border border-indigo-500/50'
                                                : 'hover:bg-neutral-800 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedPapers.includes(paper.id)
                                                    ? 'bg-indigo-500 border-indigo-500'
                                                    : 'border-neutral-600'
                                                }`}>
                                                {selectedPapers.includes(paper.id) && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white line-clamp-2">{paper.title}</p>
                                                <p className="text-xs text-neutral-500 mt-1">{paper.authors[0]} et al., {paper.year}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-neutral-700 text-sm text-neutral-400 text-center">
                        {selectedPapers.length} of {papers.length} selected
                    </div>
                </div>

                {/* Extraction Table */}
                <div className="flex-1 card flex flex-col min-w-0">
                    <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Table className="w-5 h-5 text-neutral-400" />
                            <h3 className="font-semibold text-white">Extraction Table</h3>
                        </div>
                        <button
                            onClick={() => setShowColumnEditor(!showColumnEditor)}
                            className="btn btn-ghost btn-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Column
                        </button>
                    </div>

                    {/* Column Editor */}
                    {showColumnEditor && (
                        <div className="p-4 bg-neutral-800/50 border-b border-neutral-700 flex items-center gap-2">
                            <input
                                type="text"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                placeholder="Column name (e.g., Sample Size)"
                                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                            />
                            <button onClick={handleAddColumn} className="btn btn-primary btn-sm">
                                Add
                            </button>
                            <button onClick={() => setShowColumnEditor(false)} className="btn btn-ghost btn-sm">
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        {rows.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <Table className="w-12 h-12 text-neutral-600 mb-4" />
                                <h3 className="text-white font-medium mb-2">No data extracted yet</h3>
                                <p className="text-neutral-400 text-sm max-w-md">
                                    Select papers from the left panel and click "AI Extract Data" to automatically extract structured information.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-800/50 sticky top-0">
                                    <tr>
                                        <th className="text-left p-3 font-medium text-neutral-300 min-w-[200px]">Paper</th>
                                        {columns.map(col => (
                                            <th key={col.id} className="text-left p-3 font-medium text-neutral-300 min-w-[150px]">
                                                <div className="flex items-center gap-2">
                                                    {col.name}
                                                    <button
                                                        onClick={() => handleRemoveColumn(col.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => {
                                        const paper = papers.find(p => p.id === row.paperId);
                                        if (!paper) return null;
                                        return (
                                            <tr key={row.paperId} className={idx % 2 === 0 ? '' : 'bg-neutral-800/30'}>
                                                <td className="p-3 border-b border-neutral-800">
                                                    <div>
                                                        <p className="font-medium text-white line-clamp-1">{paper.title}</p>
                                                        <p className="text-xs text-neutral-500">{paper.year}</p>
                                                    </div>
                                                </td>
                                                {columns.map(col => (
                                                    <td key={col.id} className="p-3 border-b border-neutral-800 text-neutral-300">
                                                        {row.values[col.id] || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mock value generator for demo
function getMockValue(columnId: string, paper: Paper): string {
    const mocks: Record<string, string[]> = {
        method: ['Deep learning / neural networks', 'Statistical analysis', 'Reinforcement learning', 'Hybrid approach'],
        dataset: ['Proprietary dataset (2018-2023)', 'Public benchmark datasets', 'Real-world trading data', 'Simulated environments'],
        results: ['15% improvement over baseline', 'State-of-the-art performance', 'Significant correlation found', 'Mixed results across conditions'],
        limitations: ['Limited generalizability', 'Small sample size', 'Computational constraints', 'Domain-specific assumptions']
    };
    const values = mocks[columnId] || ['Data extracted'];
    return values[Math.floor(Math.random() * values.length)];
}

export default LitReviewWorkbench;
