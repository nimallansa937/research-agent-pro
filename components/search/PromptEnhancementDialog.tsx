import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Loader2,
    Check,
    X,
    FileText,
    ArrowRight,
    BookOpen,
    Tag,
    Clock,
    Layers,
    Edit3,
    Zap
} from 'lucide-react';
import {
    EnhancedPrompt,
    PilotSource,
    runFullEnhancement
} from '../../services/promptEnhancer';

interface PromptEnhancementDialogProps {
    isOpen: boolean;
    originalPrompt: string;
    onConfirm: (enhancedPrompt: string) => void;
    onCancel: () => void;
    onSkip: () => void;
}

type EnhancementPhase = 'asking' | 'surveying' | 'enhancing' | 'reviewing';

const PromptEnhancementDialog: React.FC<PromptEnhancementDialogProps> = ({
    isOpen,
    originalPrompt,
    onConfirm,
    onCancel,
    onSkip
}) => {
    const [phase, setPhase] = useState<EnhancementPhase>('asking');
    const [enhancementResult, setEnhancementResult] = useState<EnhancedPrompt | null>(null);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setPhase('asking');
            setEnhancementResult(null);
            setEditedPrompt('');
            setError(null);
        }
    }, [isOpen]);

    const handleEnhance = async () => {
        setPhase('surveying');
        setError(null);

        try {
            // Run the full enhancement process
            setPhase('enhancing');
            const result = await runFullEnhancement(originalPrompt);
            setEnhancementResult(result);
            setEditedPrompt(result.enhanced);
            setPhase('reviewing');
        } catch (err) {
            console.error('Enhancement failed:', err);
            setError('Failed to enhance prompt. Please try again.');
            setPhase('asking');
        }
    };

    const handleConfirm = () => {
        onConfirm(editedPrompt);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-neutral-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Intelligent Prompt Enhancement</h2>
                            <p className="text-neutral-400 text-sm">
                                {phase === 'asking' && 'Your prompt could benefit from enhancement'}
                                {phase === 'surveying' && 'Running pilot survey...'}
                                {phase === 'enhancing' && 'Enhancing your prompt...'}
                                {phase === 'reviewing' && 'Review your enhanced prompt'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Phase: Asking */}
                    {phase === 'asking' && (
                        <div className="space-y-6">
                            <div className="card p-4 bg-neutral-800/50">
                                <h3 className="text-sm font-medium text-neutral-400 mb-2">Your Original Prompt</h3>
                                <p className="text-white">{originalPrompt}</p>
                                <div className="mt-2 text-xs text-neutral-500">
                                    {originalPrompt.length} characters • {originalPrompt.split(/\s+/).length} words
                                </div>
                            </div>

                            <div className="card p-6 border-purple-500/30 bg-purple-500/5">
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                    Would you like to enhance this prompt?
                                </h3>
                                <p className="text-neutral-300 mb-4">
                                    Your prompt is relatively short. We can run a <strong>pilot survey</strong> to find
                                    10 relevant sources, then enhance your prompt to be more:
                                </p>
                                <ul className="space-y-2 text-neutral-400 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-400" />
                                        Well-structured with clear research questions
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-400" />
                                        Comprehensive in scope and methodology
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-400" />
                                        Organized with specific output expectations
                                    </li>
                                </ul>
                            </div>

                            {error && (
                                <div className="card p-4 bg-red-500/10 border-red-500/30 text-red-400">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phase: Surveying/Enhancing */}
                    {(phase === 'surveying' || phase === 'enhancing') && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {phase === 'surveying' ? 'Running Pilot Survey' : 'Enhancing Prompt'}
                                </h3>
                                <p className="text-neutral-400">
                                    {phase === 'surveying'
                                        ? 'Finding 10 relevant sources to inform enhancement...'
                                        : 'Structuring and expanding your research prompt...'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                <div className={`flex items-center gap-2 ${phase === 'surveying' ? 'text-purple-400' : 'text-green-400'}`}>
                                    {phase === 'surveying' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Pilot Survey
                                </div>
                                <ArrowRight className="w-4 h-4" />
                                <div className={`flex items-center gap-2 ${phase === 'enhancing' ? 'text-purple-400' : 'text-neutral-500'}`}>
                                    {phase === 'enhancing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4" />}
                                    Enhancement
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phase: Reviewing */}
                    {phase === 'reviewing' && enhancementResult && (
                        <div className="space-y-6">
                            {/* Before/After Comparison */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Original */}
                                <div className="card p-4 bg-neutral-800/50">
                                    <h3 className="text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Original Prompt
                                    </h3>
                                    <p className="text-neutral-300 text-sm">{enhancementResult.original}</p>
                                    <div className="mt-2 text-xs text-neutral-500">
                                        {enhancementResult.wordCount.original} words
                                    </div>
                                </div>

                                {/* Enhanced (Editable) */}
                                <div className="card p-4 border-purple-500/30 bg-purple-500/5">
                                    <h3 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                                        <Edit3 className="w-4 h-4" />
                                        Enhanced Prompt (Editable)
                                    </h3>
                                    <textarea
                                        value={editedPrompt}
                                        onChange={(e) => setEditedPrompt(e.target.value)}
                                        className="w-full h-40 bg-neutral-900/50 border border-neutral-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-purple-500"
                                    />
                                    <div className="mt-2 text-xs text-purple-400">
                                        {editedPrompt.split(/\s+/).length} words
                                        ({enhancementResult.wordCount.enhanced > enhancementResult.wordCount.original
                                            ? `+${enhancementResult.wordCount.enhanced - enhancementResult.wordCount.original}`
                                            : enhancementResult.wordCount.enhanced - enhancementResult.wordCount.original} from original)
                                    </div>
                                </div>
                            </div>

                            {/* Enhancement Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Scope */}
                                <div className="card p-4">
                                    <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-blue-400" />
                                        Scope
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-neutral-400">
                                            <Clock className="w-3 h-3" />
                                            {enhancementResult.scope.timeframe}
                                        </div>
                                        <div className="text-neutral-400">
                                            Depth: <span className="text-white capitalize">{enhancementResult.scope.depth}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {enhancementResult.scope.domains.slice(0, 3).map((domain, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                                    {domain}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Key Terms */}
                                <div className="card p-4">
                                    <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-green-400" />
                                        Key Terms Identified
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {enhancementResult.keyTerms.slice(0, 8).map((term, i) => (
                                            <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                                {term}
                                            </span>
                                        ))}
                                        {enhancementResult.keyTerms.length > 8 && (
                                            <span className="px-2 py-1 text-neutral-500 text-xs">
                                                +{enhancementResult.keyTerms.length - 8} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Methodology */}
                                <div className="card p-4">
                                    <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                        Suggested Methodology
                                    </h4>
                                    <p className="text-sm text-neutral-400">
                                        {enhancementResult.suggestedMethodology}
                                    </p>
                                </div>
                            </div>

                            {/* Pilot Sources */}
                            <div className="card p-4">
                                <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-amber-400" />
                                    Pilot Survey Sources ({enhancementResult.pilotSources.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {enhancementResult.pilotSources.map((source, i) => (
                                        <div key={i} className="p-3 bg-neutral-800/50 rounded-lg">
                                            <p className="text-sm font-medium text-white truncate">{source.title}</p>
                                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{source.snippet}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-700 bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        {phase === 'asking' && (
                            <>
                                <button
                                    onClick={onCancel}
                                    className="btn btn-secondary"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onSkip}
                                        className="btn btn-secondary"
                                    >
                                        Skip Enhancement
                                    </button>
                                    <button
                                        onClick={handleEnhance}
                                        className="btn btn-primary"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Yes, Enhance Prompt
                                    </button>
                                </div>
                            </>
                        )}

                        {(phase === 'surveying' || phase === 'enhancing') && (
                            <button
                                onClick={onCancel}
                                className="btn btn-secondary ml-auto"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        )}

                        {phase === 'reviewing' && (
                            <>
                                <button
                                    onClick={() => setPhase('asking')}
                                    className="btn btn-secondary"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                    Start Over
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onSkip}
                                        className="btn btn-secondary"
                                    >
                                        Use Original
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="btn btn-primary"
                                    >
                                        <Check className="w-4 h-4" />
                                        Use Enhanced Prompt
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptEnhancementDialog;
