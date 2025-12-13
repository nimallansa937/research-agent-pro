import React, { useState, useRef } from 'react';
import {
    FileText,
    Plus,
    Sparkles,
    Quote,
    Bold,
    Italic,
    List,
    Heading1,
    Heading2,
    Download,
    Loader2,
    BookOpen,
    Search
} from 'lucide-react';
import { Paper, Citation, DocumentSection } from '../../types';
import { sendMessage } from '../../services/geminiService';

interface AIWriterProps {
    library: Paper[];
}

const sectionTypes = [
    { id: 'introduction', label: 'Introduction', icon: Heading1 },
    { id: 'methods', label: 'Methods', icon: FileText },
    { id: 'results', label: 'Results', icon: List },
    { id: 'discussion', label: 'Discussion', icon: BookOpen },
    { id: 'conclusion', label: 'Conclusion', icon: FileText },
];

const AIWriter: React.FC<AIWriterProps> = ({ library }) => {
    const [title, setTitle] = useState('Untitled Document');
    const [content, setContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showCitationPicker, setShowCitationPicker] = useState(false);
    const [citations, setCitations] = useState<Citation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const editorRef = useRef<HTMLTextAreaElement>(null);

    const handleGenerateSection = async (sectionType: string) => {
        setIsGenerating(true);

        try {
            const citationContext = citations.length > 0
                ? `\n\nAvailable citations:\n${citations.map(c => `- ${c.authors} (${c.year}): "${c.title}"`).join('\n')}`
                : '';

            const prompt = `You are an academic writing assistant. Write a ${sectionType} section for a research paper.

Topic/Title: "${title}"
${citationContext}

Write a well-structured ${sectionType} section that:
- Uses academic language and tone
- Is approximately 2-3 paragraphs
- Includes placeholder citations in format [Author, Year] where appropriate
- Follows standard academic conventions for ${sectionType} sections

Write the section now:`;

            const response = await sendMessage(prompt);

            // Append to content
            setContent(prev => {
                const newContent = prev + (prev ? '\n\n' : '') + `## ${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}\n\n${response}`;
                return newContent;
            });
        } catch (error) {
            console.error('Generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsertCitation = (paper: Paper) => {
        const citation: Citation = {
            paperId: paper.id,
            title: paper.title,
            authors: paper.authors.join(', '),
            year: paper.year
        };

        setCitations(prev => {
            if (prev.some(c => c.paperId === paper.id)) return prev;
            return [...prev, citation];
        });

        // Insert inline citation at cursor
        const citationText = `[${paper.authors[0].split(',')[0]} et al., ${paper.year}]`;
        if (editorRef.current) {
            const start = editorRef.current.selectionStart;
            const end = editorRef.current.selectionEnd;
            const newContent = content.slice(0, start) + citationText + content.slice(end);
            setContent(newContent);

            // Reset cursor position
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.selectionStart = editorRef.current.selectionEnd = start + citationText.length;
                    editorRef.current.focus();
                }
            }, 0);
        } else {
            setContent(prev => prev + ' ' + citationText);
        }

        setShowCitationPicker(false);
    };

    const handleExportMarkdown = () => {
        const references = citations.length > 0
            ? `\n\n## References\n\n${citations.map(c => `- ${c.authors} (${c.year}). ${c.title}.`).join('\n')}`
            : '';

        const fullDocument = `# ${title}\n\n${content}${references}`;

        const blob = new Blob([fullDocument], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.md`;
        a.click();
    };

    const filteredLibrary = library.filter(p =>
        searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="h-full flex gap-6 animate-fade-in">
            {/* Main Editor */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold bg-transparent text-white border-none outline-none mb-4 placeholder-neutral-500"
                    placeholder="Document Title"
                />

                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="flex items-center gap-1 bg-neutral-800/50 rounded-lg p-1">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Bold">
                            <Bold className="w-4 h-4" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Italic">
                            <Italic className="w-4 h-4" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Heading">
                            <Heading2 className="w-4 h-4" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="List">
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-neutral-700" />

                    <button
                        onClick={() => setShowCitationPicker(!showCitationPicker)}
                        className={`btn btn-sm ${showCitationPicker ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        <Quote className="w-4 h-4" />
                        Insert Citation
                    </button>

                    <div className="flex-1" />

                    <button onClick={handleExportMarkdown} className="btn btn-secondary btn-sm">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {/* Editor Area */}
                <div className="flex-1 card flex flex-col overflow-hidden">
                    <textarea
                        ref={editorRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing your document here, or use AI assistance to generate sections..."
                        className="flex-1 w-full p-6 bg-transparent text-neutral-200 text-base leading-relaxed resize-none outline-none placeholder-neutral-600"
                    />

                    {/* Citation Picker Dropdown */}
                    {showCitationPicker && (
                        <div className="absolute left-1/3 top-48 w-96 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                            <div className="p-3 border-b border-neutral-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search library..."
                                        className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {filteredLibrary.length === 0 ? (
                                    <div className="p-4 text-center text-neutral-500 text-sm">
                                        {library.length === 0 ? 'No papers in library' : 'No matching papers'}
                                    </div>
                                ) : (
                                    filteredLibrary.map(paper => (
                                        <button
                                            key={paper.id}
                                            onClick={() => handleInsertCitation(paper)}
                                            className="w-full text-left p-3 hover:bg-neutral-700/50 transition-colors"
                                        >
                                            <p className="text-sm font-medium text-white line-clamp-1">{paper.title}</p>
                                            <p className="text-xs text-neutral-400">{paper.authors[0]} et al., {paper.year}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* References */}
                {citations.length > 0 && (
                    <div className="mt-4 card p-4">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            References ({citations.length})
                        </h3>
                        <ul className="space-y-2 text-sm text-neutral-300">
                            {citations.map((c, i) => (
                                <li key={c.paperId} className="flex gap-2">
                                    <span className="text-neutral-500">[{i + 1}]</span>
                                    <span>{c.authors} ({c.year}). <em>{c.title}</em>.</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* AI Assistant Panel */}
            <div className="w-80 flex-shrink-0 space-y-4">
                <div className="card p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-white">AI Writing Assistant</h3>
                    </div>

                    <p className="text-sm text-neutral-400 mb-4">
                        Click a section type to generate content with AI assistance.
                    </p>

                    <div className="space-y-2">
                        {sectionTypes.map(section => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => handleGenerateSection(section.id)}
                                    disabled={isGenerating}
                                    className="w-full flex items-center gap-3 p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <Icon className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm text-neutral-200">{section.label}</span>
                                    {isGenerating && (
                                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin ml-auto" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="card p-4">
                    <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                        <button className="btn btn-secondary btn-sm w-full justify-start">
                            <Sparkles className="w-4 h-4" />
                            Improve Selection
                        </button>
                        <button className="btn btn-secondary btn-sm w-full justify-start">
                            <FileText className="w-4 h-4" />
                            Summarize
                        </button>
                        <button className="btn btn-secondary btn-sm w-full justify-start">
                            <Quote className="w-4 h-4" />
                            Add Supporting Evidence
                        </button>
                    </div>
                </div>

                <div className="card p-4 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border-indigo-500/20">
                    <p className="text-sm text-neutral-300">
                        <strong className="text-white">Tip:</strong> Add papers to your library first, then use the citation picker to easily reference them in your writing.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIWriter;
