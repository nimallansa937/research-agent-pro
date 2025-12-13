import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { startChat, sendMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

const ResearchChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `## Welcome to ResearchAgent Pro 🚀

I am your **FinRL-Enhanced Research Agent**, following a rigorous **5-Tier Quality Framework** to produce publication-ready systematic literature reviews.

**I can help you with:**
- 🔍 Systematic literature searches across multiple databases
- 📊 Comparative analysis of research methodologies
- 📝 Research synthesis with proper citations
- 🎯 Identifying research gaps and frontiers

**Try asking:**
- "Conduct a systematic review on market regime detection in crypto 2020-2025"
- "Compare transformer vs RNN performance in time series forecasting"
- "What are the latest advances in reinforcement learning for trading?"`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await sendMessage(userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError("Failed to connect to the research agent. Please check your API configuration.");
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered a system error while processing your request. Please ensure your Gemini API key is configured in the `.env.local` file.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container h-full animate-fade-in">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-avatar">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="chat-info">
          <h3>Research Agent (FinRL Edition)</h3>
          <p>Powered by Gemini 2.5 Flash • 5-Tier Framework Active</p>
        </div>
        <div className="ml-auto px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-medium">
          Publication Quality Mode
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="chat-message-avatar">
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>

            <div className={`chat-message-content ${msg.isError ? 'bg-red-500/20 border border-red-500/50' : ''}`}>
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <ReactMarkdown
                  className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-300 prose-li:text-neutral-300 prose-strong:text-indigo-300 prose-code:text-cyan-300 prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-message-avatar">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="chat-message-content flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-sm text-neutral-400">Synthesizing research findings...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your research topic or ask a question..."
            className="chat-input"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="chat-send-btn"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
          <span>ENTER to send, SHIFT+ENTER for new line</span>
          {error && (
            <span className="text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchChat;