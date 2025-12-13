import React, { useState } from 'react';
import {
    FileSearch,
    X,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText,
    Link as LinkIcon,
    Image as ImageIcon,
    Sparkles
} from 'lucide-react';
import { Attachment } from '../../types';
import { loadSettings, sendToProvider } from '../../services/aiProviders';

interface AttachmentAnalysisDialogProps {
    isOpen: boolean;
    attachments: Attachment[];
    originalPrompt: string;
    onConfirm: (enhancedPrompt: string) => void;
    onSkip: () => void;
    onCancel: () => void;
}

const AttachmentAnalysisDialog: React.FC<AttachmentAnalysisDialogProps> = ({
    isOpen,
    attachments,
    originalPrompt,
    onConfirm,
    onSkip,
    onCancel
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const getAttachmentIcon = (type: string) => {
        switch (type) {
            case 'document':
                return <FileText className="w-4 h-4 text-blue-400" />;
            case 'link':
                return <LinkIcon className="w-4 h-4 text-green-400" />;
            case 'image':
                return <ImageIcon className="w-4 h-4 text-purple-400" />;
            default:
                return <FileText className="w-4 h-4 text-neutral-400" />;
        }
    };

    const buildAnalysisPrompt = (): string => {
        const parts: string[] = [];

        parts.push(`The user wants to research the following topic:\n"${originalPrompt}"\n`);
        parts.push(`They have provided the following reference materials. Please analyze each one and extract key information that would be relevant to their research:\n`);

        attachments.forEach((att, idx) => {
            if (att.type === 'document') {
                if (att.mimeType === 'text/plain' || att.mimeType === 'text/markdown') {
                    const truncatedContent = att.content?.substring(0, 8000) || '';
                    parts.push(`\n### Document ${idx + 1}: ${att.name}\n${truncatedContent}${att.content && att.content.length > 8000 ? '\n[Content truncated...]' : ''}\n`);
                } else {
                    parts.push(`\n### Document ${idx + 1}: ${att.name} (${att.mimeType})\nNote: Binary document provided. Analyze based on filename and context.\n`);
                }
            } else if (att.type === 'link') {
                parts.push(`\n### Reference Link ${idx + 1}: ${att.url}\nPlease consider what information might be available from this source.\n`);
            } else if (att.type === 'image') {
                parts.push(`\n### Image ${idx + 1}: ${att.name}\nNote: An image was provided. Consider its potential relevance.\n`);
            }
        });

        parts.push(`\n---\n\nBased on the above materials, please provide:\n1. A brief summary of the key information from each attachment (2-3 sentences each)\n2. How these materials relate to the research topic\n3. Specific questions, themes, or angles to explore based on these materials\n4. An enhanced version of the research prompt that incorporates insights from these materials\n\nFormat your response as:\n## Attachment Analysis\n[Your analysis]\n\n## Enhanced Research Prompt\n[The enhanced prompt that incorporates the key insights from the attachments]`);

        return parts.join('');
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const settings = loadSettings();
            const analysisPrompt = buildAnalysisPrompt();

            const response = await sendToProvider(settings.primaryProvider, settings, analysisPrompt);

            // Extract the enhanced prompt from the response
            const enhancedPromptMatch = response.content.match(/## Enhanced Research Prompt\s*([\s\S]+?)(?=$|## )/i);
            const enhancedPrompt = enhancedPromptMatch
                ? enhancedPromptMatch[1].trim()
                : `${originalPrompt}\n\n[AI Analysis of Attachments]:\n${response.content}`;

            setAnalysisResult(response.content);

            // Auto-confirm with enhanced prompt after short delay so user can see the analysis
            setTimeout(() => {
                onConfirm(enhancedPrompt);
            }, 1500);

        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze attachments');
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white transition-colors"
                    title="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <FileSearch className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Analyze Attachments?</h2>
                        <p className="text-sm text-neutral-400">
                            {attachments.length} attachment{attachments.length > 1 ? 's' : ''} detected
                        </p>
                    </div>
                </div>

                {/* Attachment List */}
                <div className="mb-4 p-3 bg-neutral-800/50 rounded-xl border border-neutral-700">
                    <p className="text-xs text-neutral-500 mb-2">Attached materials:</p>
                    <div className="space-y-2">
                        {attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-2 text-sm">
                                {getAttachmentIcon(att.type)}
                                <span className="text-neutral-300 truncate">
                                    {att.type === 'link' ? att.url : att.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Description */}
                {!isAnalyzing && !analysisResult && !error && (
                    <p className="text-sm text-neutral-300 mb-6">
                        Would you like to analyze these attachments first? This will extract key information
                        and use it to enhance your research prompt for better results.
                    </p>
                )}

                {/* Analyzing State */}
                {isAnalyzing && (
                    <div className="flex items-center gap-3 mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        <div>
                            <p className="text-sm text-purple-300 font-medium">Analyzing attachments...</p>
                            <p className="text-xs text-purple-400/70">Extracting key information to enhance your research</p>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {analysisResult && (
                    <div className="flex items-center gap-3 mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-sm text-green-300 font-medium">Analysis complete!</p>
                            <p className="text-xs text-green-400/70">Starting research with enhanced prompt...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex items-start gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-red-300 font-medium">Analysis failed</p>
                            <p className="text-xs text-red-400/70">{error}</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {!isAnalyzing && !analysisResult && (
                    <div className="flex gap-3">
                        <button
                            onClick={onSkip}
                            className="flex-1 btn btn-secondary"
                        >
                            Skip Analysis
                        </button>
                        <button
                            onClick={handleAnalyze}
                            className="flex-1 btn btn-primary bg-gradient-to-r from-blue-500 to-purple-500"
                        >
                            <Sparkles className="w-4 h-4" />
                            Analyze & Enhance
                        </button>
                    </div>
                )}

                {/* Retry on Error */}
                {error && (
                    <div className="flex gap-3">
                        <button
                            onClick={onSkip}
                            className="flex-1 btn btn-secondary"
                        >
                            Continue Without Analysis
                        </button>
                        <button
                            onClick={handleAnalyze}
                            className="flex-1 btn btn-primary"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttachmentAnalysisDialog;
