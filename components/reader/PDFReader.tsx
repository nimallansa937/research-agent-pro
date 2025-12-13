import React, { useState } from 'react';
import {
    ArrowLeft,
    MessageSquare,
    Highlighter,
    StickyNote,
    Download,
    ZoomIn,
    ZoomOut,
    ChevronLeft,
    ChevronRight,
    Send,
    Loader2,
    Sparkles,
    FileText
} from 'lucide-react';
import { Paper, ChatMessage } from '../../types';
import { sendMessage } from '../../services/geminiService';

interface PDFReaderProps {
    paper: Paper | null;
    onBack: () => void;
}

const PDFReader: React.FC<PDFReaderProps> = ({ paper, onBack }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(100);
    const [showChat, setShowChat] = useState(true);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: chatInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsLoading(true);

        try {
            const context = paper
                ? `You are analyzing the paper: "${paper.title}" by ${paper.authors.join(', ')} (${paper.year}). Abstract: ${paper.abstract}. Answer the following question in context of this paper: `
                : '';

            const response = await sendMessage(context + chatInput);

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "I apologize, but I encountered an error processing your request. Please try again.",
                timestamp: new Date(),
                isError: true
            };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!paper) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-neutral-500" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No Paper Selected</h2>
                <p className="text-neutral-400 max-w-md mb-6">
                    Select a paper from your library or search results to view and chat with it.
                </p>
                <button onClick={onBack} className="btn btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                    Go to Library
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-neutral-700 mb-4">
                <button onClick={onBack} className="btn btn-ghost btn-icon">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white truncate">{paper.title}</h2>
                    <p className="text-sm text-neutral-400 truncate">{paper.authors.join(', ')} • {paper.year}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                    </button>
                    {paper.doi && (
                        <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                        >
                            <Download className="w-4 h-4" />
                            PDF
                        </a>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* PDF Viewer Area */}
                <div className="flex-1 flex flex-col card overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between p-3 border-b border-neutral-700">
                        <div className="flex items-center gap-2">
                            <button className="btn btn-ghost btn-icon btn-sm" title="Highlight">
                                <Highlighter className="w-4 h-4" />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" title="Add Note">
                                <StickyNote className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setZoom(Math.max(50, zoom - 10))}
                                className="btn btn-ghost btn-icon btn-sm"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-neutral-400 w-12 text-center">{zoom}%</span>
                            <button
                                onClick={() => setZoom(Math.min(200, zoom + 10))}
                                className="btn btn-ghost btn-icon btn-sm"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                className="btn btn-ghost btn-icon btn-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-neutral-400">Page {currentPage} of 12</span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="btn btn-ghost btn-icon btn-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* PDF Content Placeholder */}
                    <div className="flex-1 flex items-center justify-center bg-neutral-900 p-8">
                        <div className="max-w-2xl text-center">
                            <div className="bg-white rounded-lg shadow-2xl p-8 mb-6" style={{ transform: `scale(${zoom / 100})` }}>
                                <div className="text-left text-neutral-900">
                                    <h1 className="text-xl font-bold mb-4">{paper.title}</h1>
                                    <p className="text-sm text-neutral-600 mb-4">{paper.authors.join(', ')}</p>
                                    <div className="text-sm leading-relaxed text-neutral-800">
                                        <h2 className="font-semibold mt-4 mb-2">Abstract</h2>
                                        <p>{paper.abstract}</p>
                                        <h2 className="font-semibold mt-4 mb-2">1. Introduction</h2>
                                        <p className="text-neutral-500">[Full paper content would be rendered here using pdf.js or similar library]</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500">
                                PDF rendering preview • Full PDF integration available with pdf.js
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat Panel */}
                {showChat && (
                    <div className="w-96 flex-shrink-0 card flex flex-col">
                        <div className="p-4 border-b border-neutral-700 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">Chat with Paper</h3>
                                <p className="text-xs text-neutral-400">Ask questions about this paper</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatMessages.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-neutral-400 text-sm mb-4">
                                        Ask me anything about this paper!
                                    </p>
                                    <div className="space-y-2">
                                        {[
                                            "What is the main contribution?",
                                            "Explain the methodology",
                                            "What are the key findings?",
                                            "What are the limitations?"
                                        ].map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setChatInput(q)}
                                                className="block w-full text-left px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                chatMessages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                                ? 'bg-neutral-700'
                                                : 'bg-gradient-to-br from-indigo-500 to-cyan-500'
                                            }`}>
                                            {msg.role === 'user' ? (
                                                <span className="text-xs">You</span>
                                            ) : (
                                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                            )}
                                        </div>
                                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.role === 'user'
                                                ? 'bg-indigo-500 text-white'
                                                : msg.isError
                                                    ? 'bg-red-500/20 text-red-300'
                                                    : 'bg-neutral-800 text-neutral-200'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                                        <Sparkles className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="px-3 py-2 bg-neutral-800 rounded-xl">
                                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-neutral-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask about this paper..."
                                    className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isLoading}
                                    className="btn btn-primary btn-icon"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFReader;
