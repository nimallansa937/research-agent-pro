import React, { useState, useEffect } from 'react';
import {
    Globe,
    BookOpen,
    Database,
    Search,
    Brain,
    Sparkles,
    FileSearch,
    Network,
    BarChart3,
    Lightbulb,
    PenTool
} from 'lucide-react';

interface ThinkingActivityProps {
    phaseId: string;
    isActive: boolean;
}

// Activity messages for each phase
const PHASE_ACTIVITIES: Record<string, { icon: React.ReactNode; messages: string[] }> = {
    slr: {
        icon: <Search className="w-4 h-4" />,
        messages: [
            'Searching Google Scholar for relevant papers...',
            'Querying arXiv database for recent publications...',
            'Scanning IEEE Xplore for technical papers...',
            'Exploring PubMed for health-related research...',
            'Analyzing SSRN for working papers...',
            'Cross-referencing Semantic Scholar citations...',
            'Extracting key findings from abstracts...',
            'Evaluating source credibility and relevance...',
            'Identifying seminal works in the field...',
            'Categorizing papers by research theme...',
            'Calculating relevance scores for each source...',
            'Building annotated bibliography...',
        ]
    },
    taxonomy: {
        icon: <Network className="w-4 h-4" />,
        messages: [
            'Extracting core concepts from literature...',
            'Mapping theoretical relationships...',
            'Building hierarchical concept structure...',
            'Identifying key variables and factors...',
            'Creating conceptual diagram nodes...',
            'Analyzing causal relationships...',
            'Grouping related theories together...',
            'Establishing concept definitions...',
            'Drawing framework connections...',
            'Synthesizing theoretical foundations...',
        ]
    },
    forensic: {
        icon: <FileSearch className="w-4 h-4" />,
        messages: [
            'Performing deep analysis of Component 1...',
            'Extracting quantitative evidence...',
            'Evaluating study methodologies...',
            'Cross-validating data sources...',
            'Identifying statistical patterns...',
            'Analyzing meta-analysis results...',
            'Examining effect sizes and significance...',
            'Reviewing longitudinal data trends...',
            'Assessing confidence intervals...',
            'Documenting limitations and caveats...',
        ]
    },
    quantitative: {
        icon: <BarChart3 className="w-4 h-4" />,
        messages: [
            'Designing analytical framework...',
            'Defining key metrics and variables...',
            'Establishing measurement criteria...',
            'Creating data collection strategy...',
            'Building implementation guidelines...',
            'Mapping variable relationships...',
            'Developing validation approach...',
            'Designing workflow diagrams...',
            'Specifying resource requirements...',
            'Outlining step-by-step methodology...',
        ]
    },
    synthesis: {
        icon: <Lightbulb className="w-4 h-4" />,
        messages: [
            'Synthesizing findings across all phases...',
            'Extracting key insights and patterns...',
            'Formulating actionable recommendations...',
            'Writing executive summary...',
            'Compiling evidence-based conclusions...',
            'Creating stakeholder recommendations...',
            'Identifying future research directions...',
            'Finalizing reference bibliography...',
            'Formatting research report...',
            'Generating final conclusions...',
        ]
    }
};

// Simulated sources being browsed
const SIMULATED_SOURCES = [
    { name: 'Google Scholar', url: 'scholar.google.com', icon: <Globe className="w-3 h-3" /> },
    { name: 'arXiv', url: 'arxiv.org', icon: <BookOpen className="w-3 h-3" /> },
    { name: 'PubMed', url: 'pubmed.ncbi.nlm.nih.gov', icon: <Database className="w-3 h-3" /> },
    { name: 'IEEE Xplore', url: 'ieeexplore.ieee.org', icon: <Network className="w-3 h-3" /> },
    { name: 'Semantic Scholar', url: 'semanticscholar.org', icon: <Brain className="w-3 h-3" /> },
    { name: 'SSRN', url: 'ssrn.com', icon: <FileSearch className="w-3 h-3" /> },
    { name: 'ResearchGate', url: 'researchgate.net', icon: <Globe className="w-3 h-3" /> },
    { name: 'JSTOR', url: 'jstor.org', icon: <BookOpen className="w-3 h-3" /> },
];

const ThinkingActivity: React.FC<ThinkingActivityProps> = ({ phaseId, isActive }) => {
    const [currentActivity, setCurrentActivity] = useState(0);
    const [currentSource, setCurrentSource] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);

    const phaseData = PHASE_ACTIVITIES[phaseId] || PHASE_ACTIVITIES.slr;
    const messages = phaseData.messages;

    // Rotate through activities
    useEffect(() => {
        if (!isActive) return;

        const activityInterval = setInterval(() => {
            setCurrentActivity(prev => (prev + 1) % messages.length);
        }, 3000);

        return () => clearInterval(activityInterval);
    }, [isActive, messages.length]);

    // Rotate through sources (only for first phase)
    useEffect(() => {
        if (!isActive || phaseId !== 'slr') return;

        const sourceInterval = setInterval(() => {
            setCurrentSource(prev => (prev + 1) % SIMULATED_SOURCES.length);
        }, 2000);

        return () => clearInterval(sourceInterval);
    }, [isActive, phaseId]);

    // Typewriter effect for activity text
    useEffect(() => {
        if (!isActive) return;

        const fullText = messages[currentActivity];
        let charIndex = 0;
        setDisplayedText('');

        const typeInterval = setInterval(() => {
            if (charIndex < fullText.length) {
                setDisplayedText(fullText.substring(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 30);

        return () => clearInterval(typeInterval);
    }, [currentActivity, isActive, messages]);

    // Cursor blink effect
    useEffect(() => {
        const cursorInterval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 500);

        return () => clearInterval(cursorInterval);
    }, []);

    if (!isActive) return null;

    return (
        <div className="mt-3 space-y-2 animate-fade-in">
            {/* Current Activity */}
            <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center animate-pulse">
                    <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-purple-400">AI Thinking</span>
                        <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                    </div>
                    <p className="text-sm text-neutral-300 truncate">
                        {displayedText}
                        <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} text-purple-400`}>|</span>
                    </p>
                </div>
            </div>

            {/* Source Browsing (only shown for literature phase) */}
            {phaseId === 'slr' && (
                <div className="flex items-center gap-2 p-2 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                    <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center">
                        <Globe className="w-3 h-3 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">Browsing:</span>
                            <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                                {SIMULATED_SOURCES[currentSource].icon}
                                {SIMULATED_SOURCES[currentSource].name}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500">{SIMULATED_SOURCES[currentSource].url}</p>
                    </div>
                </div>
            )}

            {/* Thinking Animation Dots */}
            <div className="flex items-center gap-1 px-2">
                <span className="text-xs text-neutral-500">Processing</span>
                <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThinkingActivity;
