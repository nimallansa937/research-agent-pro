import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    FileText,
    BookOpen,
    Network,
    Database,
    BarChart3,
    CheckCircle,
    AlertTriangle,
    Info,
    Lightbulb,
    ArrowRight,
    ExternalLink
} from 'lucide-react';

interface ReportViewerProps {
    content: string;
    title?: string;
    generatedAt?: string;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ content, title, generatedAt }) => {

    // Custom renderer for enhanced markdown
    const components = {
        // Enhanced headers with icons and styling
        h1: ({ children, ...props }: any) => (
            <div className="report-section-header phase-header">
                <div className="phase-icon">
                    <FileText className="w-6 h-6" />
                </div>
                <h1 className="report-h1" {...props}>{children}</h1>
            </div>
        ),
        h2: ({ children, ...props }: any) => {
            const text = String(children).toLowerCase();
            let icon = <BookOpen className="w-5 h-5" />;
            let phaseClass = '';

            if (text.includes('literature') || text.includes('review')) {
                icon = <BookOpen className="w-5 h-5" />;
                phaseClass = 'phase-1';
            } else if (text.includes('taxonomy') || text.includes('mechanism')) {
                icon = <Network className="w-5 h-5" />;
                phaseClass = 'phase-2';
            } else if (text.includes('forensic') || text.includes('analysis')) {
                icon = <Database className="w-5 h-5" />;
                phaseClass = 'phase-3';
            } else if (text.includes('quantitative') || text.includes('model')) {
                icon = <BarChart3 className="w-5 h-5" />;
                phaseClass = 'phase-4';
            } else if (text.includes('executive') || text.includes('summary') || text.includes('synthesis')) {
                icon = <CheckCircle className="w-5 h-5" />;
                phaseClass = 'phase-5';
            } else if (text.includes('recommendation')) {
                icon = <Lightbulb className="w-5 h-5" />;
                phaseClass = 'phase-recommendation';
            }

            return (
                <div className={`report-section-header ${phaseClass}`}>
                    <div className="section-icon">{icon}</div>
                    <h2 className="report-h2" {...props}>{children}</h2>
                </div>
            );
        },
        h3: ({ children, ...props }: any) => (
            <h3 className="report-h3" {...props}>
                <ArrowRight className="w-4 h-4 inline-block mr-2 text-purple-400" />
                {children}
            </h3>
        ),
        h4: ({ children, ...props }: any) => (
            <h4 className="report-h4" {...props}>{children}</h4>
        ),
        // Enhanced tables
        table: ({ children, ...props }: any) => (
            <div className="report-table-container">
                <table className="report-table" {...props}>{children}</table>
            </div>
        ),
        thead: ({ children, ...props }: any) => (
            <thead className="report-thead" {...props}>{children}</thead>
        ),
        th: ({ children, ...props }: any) => (
            <th className="report-th" {...props}>{children}</th>
        ),
        td: ({ children, ...props }: any) => (
            <td className="report-td" {...props}>{children}</td>
        ),
        // Enhanced blockquotes for callouts
        blockquote: ({ children, ...props }: any) => {
            const text = String(children);
            let icon = <Info className="w-5 h-5" />;
            let calloutClass = 'callout-info';

            if (text.toLowerCase().includes('warning') || text.toLowerCase().includes('caution')) {
                icon = <AlertTriangle className="w-5 h-5" />;
                calloutClass = 'callout-warning';
            } else if (text.toLowerCase().includes('critical') || text.toLowerCase().includes('important')) {
                icon = <AlertTriangle className="w-5 h-5" />;
                calloutClass = 'callout-critical';
            } else if (text.toLowerCase().includes('finding') || text.toLowerCase().includes('insight')) {
                icon = <Lightbulb className="w-5 h-5" />;
                calloutClass = 'callout-insight';
            }

            return (
                <div className={`report-callout ${calloutClass}`}>
                    <div className="callout-icon">{icon}</div>
                    <div className="callout-content">{children}</div>
                </div>
            );
        },
        // Enhanced code blocks
        code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
                return <code className="report-inline-code" {...props}>{children}</code>;
            }

            const language = className?.replace('language-', '') || '';

            if (language === 'mermaid') {
                return (
                    <div className="report-mermaid-placeholder">
                        <Network className="w-8 h-8 text-purple-400 mb-2" />
                        <p className="text-sm text-neutral-400">Mermaid Diagram</p>
                        <pre className="report-code-block mermaid-code">{children}</pre>
                    </div>
                );
            }

            return (
                <div className="report-code-container">
                    {language && <div className="code-language-tag">{language}</div>}
                    <pre className="report-code-block"><code {...props}>{children}</code></pre>
                </div>
            );
        },
        // Enhanced lists
        ul: ({ children, ...props }: any) => (
            <ul className="report-ul" {...props}>{children}</ul>
        ),
        ol: ({ children, ...props }: any) => (
            <ol className="report-ol" {...props}>{children}</ol>
        ),
        li: ({ children, ...props }: any) => (
            <li className="report-li" {...props}>{children}</li>
        ),
        // Enhanced paragraphs
        p: ({ children, ...props }: any) => (
            <p className="report-p" {...props}>{children}</p>
        ),
        // Enhanced links
        a: ({ children, href, ...props }: any) => (
            <a className="report-link" href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
                <ExternalLink className="w-3 h-3 inline-block ml-1" />
            </a>
        ),
        // Enhanced horizontal rules
        hr: () => (
            <div className="report-divider">
                <div className="divider-line"></div>
                <div className="divider-ornament"></div>
                <div className="divider-line"></div>
            </div>
        ),
        // Enhanced strong/bold
        strong: ({ children, ...props }: any) => (
            <strong className="report-strong" {...props}>{children}</strong>
        ),
        // Enhanced emphasis/italic
        em: ({ children, ...props }: any) => (
            <em className="report-em" {...props}>{children}</em>
        ),
    };

    return (
        <div className="report-viewer">
            {/* Report Header */}
            {(title || generatedAt) && (
                <div className="report-header">
                    <div className="report-header-content">
                        <div className="report-badge">FORENSIC RESEARCH REPORT</div>
                        {title && <h1 className="report-title">{title}</h1>}
                        {generatedAt && <p className="report-meta">Generated: {generatedAt}</p>}
                    </div>
                    <div className="report-header-decoration"></div>
                </div>
            )}

            {/* Report Content */}
            <div className="report-content">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={components}
                >
                    {content}
                </ReactMarkdown>
            </div>

            {/* Report Footer */}
            <div className="report-footer">
                <div className="footer-line"></div>
                <p className="footer-text">
                    Generated by ResearchAgent Pro • FinRL-Enhanced Quality Framework
                </p>
            </div>
        </div>
    );
};

export default ReportViewer;
