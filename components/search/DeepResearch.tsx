import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles,
    Play,
    Pause,
    CheckCircle,
    Circle,
    Loader2,
    FileText,
    Download,
    Copy,
    BookOpen,
    Database,
    BarChart3,
    Network,
    AlertTriangle,
    FileDown,
    FileType,
    Cloud,
    Search
} from 'lucide-react';
import { searchAllAcademicSources, formatPapersForPrompt, AcademicPaper } from '../../services/academicSearch';
import { loadSettings, runDialecticalAnalysis, sendToProvider, AIResponse } from '../../services/aiProviders';
import { exportToPDF, exportToDOC } from '../../services/exportService';
import { shouldSuggestEnhancement, ENHANCEMENT_THRESHOLD } from '../../services/promptEnhancer';
import { saveFileToDrive, isAuthenticated as isDriveAuthenticated, loadDriveSettings } from '../../services/googleDriveService';
import { saveResearch, generateTitleFromPrompt, ResearchItem } from '../../services/researchHistoryService';
import { runGoogleDeepResearch, DeepResearchStatus } from '../../services/googleDeepResearchService';
import { useAuth } from '../../contexts/AuthContext';
import ReportViewer from '../report/ReportViewer';
import PromptEnhancementDialog from './PromptEnhancementDialog';
import ResearchHistory from './ResearchHistory';
import AttachmentInput from './AttachmentInput';
import AttachmentAnalysisDialog from './AttachmentAnalysisDialog';
import ThinkingActivity from './ThinkingActivity';
import { Attachment } from '../../types';

interface ResearchPhase {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    output?: string;
    icon: React.ReactNode;
}

const DEFAULT_PHASES: Omit<ResearchPhase, 'status' | 'output'>[] = [
    {
        id: 'slr1',
        name: 'Phase 1A: Literature Discovery (Batch 1)',
        description: 'Batch 1: Google Scholar & Semantic Scholar (25 sources)',
        icon: <BookOpen className="w-4 h-4" />
    },
    {
        id: 'slr2',
        name: 'Phase 1B: Literature Discovery (Batch 2)',
        description: 'Batch 2: arXiv & SSRN preprints (25 sources)',
        icon: <BookOpen className="w-4 h-4" />
    },
    {
        id: 'slr3',
        name: 'Phase 1C: Literature Discovery (Batch 3)',
        description: 'Batch 3: IEEE & ACM computing research (25 sources)',
        icon: <BookOpen className="w-4 h-4" />
    },
    {
        id: 'slr4',
        name: 'Phase 1D: Literature Discovery (Batch 4)',
        description: 'Batch 4: Web of Science & Scopus (25 sources)',
        icon: <BookOpen className="w-4 h-4" />
    },
    {
        id: 'consolidate',
        name: 'Phase 1.5: Literature Consolidation',
        description: 'Merge and summarize all 100 sources into key themes',
        icon: <Network className="w-4 h-4" />
    },
    {
        id: 'taxonomy',
        name: 'Phase 2: Conceptual Framework & Mapping',
        description: 'Organize concepts, theories, and relationships hierarchically',
        icon: <Network className="w-4 h-4" />
    },
    {
        id: 'forensic',
        name: 'Phase 3: Deep Analysis & Evidence Review',
        description: 'Detailed examination of key components with supporting data',
        icon: <Database className="w-4 h-4" />
    },
    {
        id: 'quantitative',
        name: 'Phase 4: Methodology & Framework Design',
        description: 'Develop analytical models, frameworks, or methodologies',
        icon: <BarChart3 className="w-4 h-4" />
    },
    {
        id: 'synthesis',
        name: 'Phase 5: Synthesis & Recommendations',
        description: 'Compile findings into actionable insights and conclusions',
        icon: <FileText className="w-4 h-4" />
    }
];

const DeepResearch: React.FC = () => {
    const { user } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);
    const [phases, setPhases] = useState<ResearchPhase[]>(
        DEFAULT_PHASES.map(p => ({ ...p, status: 'pending' as const }))
    );
    const [finalReport, setFinalReport] = useState<string | null>(null);
    const [showEnhancementDialog, setShowEnhancementDialog] = useState(false);
    const [savingToDrive, setSavingToDrive] = useState(false);
    const [driveSaveStatus, setDriveSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [historyCollapsed, setHistoryCollapsed] = useState(false);
    const [historyKey, setHistoryKey] = useState(0); // Used to refresh history
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [showAttachmentAnalysis, setShowAttachmentAnalysis] = useState(false);
    const [googleResearchStatus, setGoogleResearchStatus] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [phases, finalReport]);

    // Build context from attachments for AI prompts
    const buildAttachmentContext = (): string => {
        if (attachments.length === 0) return '';

        const contextParts: string[] = ['\\n\\n## PROVIDED REFERENCE MATERIALS:\\n'];

        attachments.forEach((att, idx) => {
            if (att.type === 'document') {
                if (att.mimeType === 'text/plain' || att.mimeType === 'text/markdown') {
                    // Include text content directly
                    contextParts.push(`### Document ${idx + 1}: ${att.name}\\n${att.content?.substring(0, 5000)}${att.content && att.content.length > 5000 ? '\\n[Content truncated...]' : ''}\\n`);
                } else {
                    // For binary docs, note that they were provided
                    contextParts.push(`### Document ${idx + 1}: ${att.name} (${att.mimeType})\\nNote: This document was uploaded as a reference. Please consider its typical content relevant to the research topic.\\n`);
                }
            } else if (att.type === 'link') {
                contextParts.push(`### Reference Link ${idx + 1}: ${att.url}\\nPlease consider information from this source in your analysis.\\n`);
            } else if (att.type === 'image') {
                contextParts.push(`### Image ${idx + 1}: ${att.name}\\nNote: An image was provided as reference material.\\n`);
            }
        });

        return contextParts.join('\\n');
    };


    const executePhase = async (phaseIndex: number, researchPrompt: string, previousOutputs: string[]): Promise<string> => {
        const phase = DEFAULT_PHASES[phaseIndex];
        const settings = loadSettings();

        // Include attachment context in the first phase
        const attachmentContext = phaseIndex === 0 ? buildAttachmentContext() : '';
        const fullPrompt = researchPrompt + attachmentContext;

        // For Phase 1 batches (slr1-slr4), fetch REAL papers from academic APIs
        const isLiteraturePhase = ['slr1', 'slr2', 'slr3', 'slr4'].includes(phase.id);
        let realPapers: AcademicPaper[] = [];
        let papersContext = '';

        if (isLiteraturePhase) {
            console.log(`Phase ${phase.id}: Fetching real academic papers...`);
            try {
                // Use different search terms for variety
                const searchVariants: Record<string, string> = {
                    'slr1': researchPrompt, // Main topic
                    'slr2': `${researchPrompt} theoretical framework`, // Theory focus
                    'slr3': `${researchPrompt} empirical study methodology`, // Methods focus
                    'slr4': `${researchPrompt} systematic review meta-analysis`, // Reviews focus
                };
                const searchQuery = searchVariants[phase.id] || researchPrompt;
                realPapers = await searchAllAcademicSources(searchQuery, 25);
                papersContext = formatPapersForPrompt(realPapers);
                console.log(`Found ${realPapers.length} real papers for ${phase.id}`);
            } catch (error) {
                console.error('Academic search failed, falling back to LLM:', error);
                papersContext = 'Note: Academic database search unavailable. Please generate representative sources.';
            }
        }

        const phasePrompts: Record<string, string> = {
            slr1: `Phase 1A: Literature Discovery (Batch 1 of 4)

RESEARCH TOPIC: ${fullPrompt}

${papersContext || 'No papers found - please generate representative sources.'}

TASK: Analyze the VERIFIED academic papers above. For each, provide:
- Relevance score (0-100) to the research topic
- Level of Evidence (LOE 1-4): 1=Meta-analysis, 2=RCT, 3=Observational, 4=Expert

OUTPUT:
## Batch 1: Academic Sources (Verified Papers)
| # | Citation | Year | Score | LOE | Key Finding |
|---|----------|------|-------|-----|-------------|
[Summarize each verified paper above]

Summary: Themes identified: [list 3-4 major themes]`,

            slr2: `Phase 1B: Literature Discovery (Batch 2 of 4)

RESEARCH TOPIC: ${fullPrompt}

${papersContext || 'No papers found - please generate representative sources.'}

TASK: Analyze the VERIFIED academic papers above (theoretical framework focus).
Rate relevance (0-100) and evidence level (1-4) for each.

OUTPUT:
## Batch 2: Theoretical Sources (Verified Papers)
| # | Citation | Year | Score | LOE | Key Finding |
|---|----------|------|-------|-----|-------------|
[Summarize each verified paper]

Summary: Themes: [list 3-4]`,

            slr3: `Phase 1C: Literature Discovery (Batch 3 of 4)

RESEARCH TOPIC: ${fullPrompt}

${papersContext || 'No papers found - please generate representative sources.'}

TASK: Analyze VERIFIED papers (methodology & empirical focus).
Rate relevance and evidence level for each.

OUTPUT:
## Batch 3: Methodology Sources (Verified Papers)
| # | Citation | Year | Score | LOE | Key Finding |
|---|----------|------|-------|-----|-------------|
[Summarize each verified paper]

Summary: Themes: [list 3-4]`,

            slr4: `Phase 1D: Literature Discovery (Batch 4 of 4)

RESEARCH TOPIC: ${fullPrompt}

${papersContext || 'No papers found - please generate representative sources.'}

TASK: Analyze VERIFIED papers (reviews & meta-analysis focus).
Rate relevance and evidence level.

OUTPUT:
## Batch 4: Review Sources (Verified Papers)
| # | Citation | Year | Score | LOE | Key Finding |
|---|----------|------|-------|-----|-------------|
[Summarize each verified paper]

Summary: Themes: [list 3-4]`,

            consolidate: `Phase 1.5: Literature Consolidation

RESEARCH TOPIC: ${fullPrompt}

You have collected 100 sources across 4 batches. Create a consolidated summary.

TASK: Synthesize all sources into a structured literature overview.

OUTPUT:
## Consolidated Literature Summary (100 Sources)

### Source Statistics
- Total sources: 100
- By database: Google Scholar/Semantic (25), arXiv/SSRN (25), IEEE/ACM (25), WoS/Scopus (25)
- By LOE: 1:X, 2:X, 3:X, 4:X
- Average relevance score: XX
- Year range: XXXX-2025

### Major Themes (8-10 themes)
1. Theme: [Name] - Sources: [count] - Key insight
2. Theme: [Name] - Sources: [count] - Key insight
[Continue for all major themes]

### Top 20 Most Critical Sources
| Rank | Citation | Score | Why Critical |
|------|----------|-------|--------------|
[List top 20 highest-scoring sources]

### Research Gaps Identified
1. Gap: [Description] - Priority: High/Medium/Low
2. Gap: [Description] - Priority: High/Medium/Low
[List 5-8 gaps]

### Key Findings Summary
[5-10 bullet points of the most important findings across all 100 sources]`,

            taxonomy: `Phase 2: Conceptual Framework & Mapping

RESEARCH TOPIC: ${researchPrompt}

CONSOLIDATED LITERATURE (from Phase 1.5):
${previousOutputs.length > 0 ? previousOutputs[previousOutputs.length - 1] : 'No previous output'}

TASK: Create a conceptual framework based on the 100 sources.

OUTPUT:
## Conceptual Framework & Mapping

### Glossary (10-15 key terms)
| Term | Definition | Source |
|------|------------|--------|

### Concept Hierarchy
1. Core Concepts (with citations)
2. Contributing Factors
3. Outcomes & Effects

### Relationship Matrix
| Concept A | Relationship | Concept B | Evidence | Sources |
|-----------|--------------|-----------|----------|---------|

### Framework Diagram
\`\`\`mermaid
graph TD
    A[Core] --> B[Factor]
    B --> C[Outcome]
\`\`\`

### Theoretical Integration
[How concepts connect]`,

            forensic: `Phase 3: Deep Analysis & Evidence Review

RESEARCH TOPIC: ${researchPrompt}

CONSOLIDATED LITERATURE (use the summary from Phase 1.5):
${previousOutputs.length > 0 ? previousOutputs[previousOutputs.length - 1] : 'No previous output'}

TASK: Provide deep analysis of 5-6 key components.

OUTPUT:
## Deep Analysis & Evidence Review

### Evidence Summary
| Component | Sources | Confidence |
|-----------|---------|------------|

### Component Analysis (5-6 components)
For each: Definition, Evidence, Limitations

### Cross-Component Synthesis
Key relationships between components

### Overall Confidence: High/Medium/Low`,

            quantitative: `Phase 4: Methodology & Framework Design

RESEARCH TOPIC: ${researchPrompt}

TASK: Design a methodological framework based on the research.

OUTPUT:
## Methodology & Framework Design

### Framework Overview
[Describe the approach]

### Key Variables & Metrics
| Variable | Definition | Measurement |
|----------|------------|-------------|
[8-12 variables]

### Framework Diagram
\`\`\`mermaid
flowchart LR
    A[Input] --> B[Process]
    B --> C[Output]
\`\`\`

### Implementation Steps
1. [Step 1]
2. [Step 2]

### Validation Approach
[How to verify]`,

            synthesis: `Phase 5: Synthesis & Recommendations

RESEARCH TOPIC: ${researchPrompt}

TASK: Create a final synthesis report.

OUTPUT:
## Executive Summary
**Research Question:** [Restated]
**Answer:** [1-paragraph answer]
**Confidence:** High/Medium/Low

## Key Takeaways (5-6)
1. [Takeaway]

## Key Insights (5-7)
### Insight 1: [Title]
- Finding, Evidence, Implications

## Summary Table
| Finding | Evidence | Confidence |
|---------|----------|------------|

## Recommendations
### For Researchers
| Recommendation | Priority |
|----------------|----------|

### For Practitioners
| Recommendation | Risk |
|----------------|------|

## Limitations
- Scope, Data, Biases

## Top 10 References
[Key citations]

---
Generated: ${new Date().toISOString()}`
        };

        const phasePrompt = phasePrompts[phase.id] || `Execute ${phase.name} for the research task`;

        try {
            if (settings.dialecticalMode && settings.secondaryProvider) {
                const result = await runDialecticalAnalysis(settings, phasePrompt, previousOutputs);
                return result.synthesis;
            } else {
                const result = await sendToProvider(settings.primaryProvider, settings, phasePrompt);
                return result.content;
            }
        } catch (error) {
            console.error(`Error in ${phase.name}:`, error);
            throw new Error(`Failed to execute ${phase.name}: ${error}`);
        }
    };

    const handleStartResearch = () => {
        if (!prompt.trim()) return;

        // Check if there are attachments - ask user if they want to analyze them
        if (attachments.length > 0) {
            setShowAttachmentAnalysis(true);
            return;
        }

        // Check if prompt should trigger enhancement suggestion
        if (shouldSuggestEnhancement(prompt)) {
            setShowEnhancementDialog(true);
            return;
        }

        // Otherwise run directly
        runDeepResearch(prompt);
    };

    const handleAttachmentAnalysisConfirm = (enhancedPrompt: string) => {
        setShowAttachmentAnalysis(false);
        setPrompt(enhancedPrompt);
        runDeepResearch(enhancedPrompt);
    };

    const handleAttachmentAnalysisSkip = () => {
        setShowAttachmentAnalysis(false);
        // Still use prompt enhancement dialog if needed
        if (shouldSuggestEnhancement(prompt)) {
            setShowEnhancementDialog(true);
        } else {
            runDeepResearch(prompt);
        }
    };

    const handleEnhancedPromptConfirm = (enhancedPrompt: string) => {
        setShowEnhancementDialog(false);
        setPrompt(enhancedPrompt);
        runDeepResearch(enhancedPrompt);
    };

    const handleEnhancementSkip = () => {
        setShowEnhancementDialog(false);
        runDeepResearch(prompt);
    };

    const runDeepResearch = async (researchPrompt: string) => {
        if (!researchPrompt.trim()) return;

        const settings = loadSettings();

        // Check if Google Deep Research is enabled
        if (settings.useGoogleDeepResearch && settings.providers.gemini.apiKey) {
            setIsRunning(true);
            setFinalReport(null);
            setGoogleResearchStatus('Starting Google Deep Research Agent...');
            setPhases(DEFAULT_PHASES.map(p => ({ ...p, status: 'running' as const, output: undefined })));

            try {
                const result = await runGoogleDeepResearch(
                    settings.providers.gemini.apiKey,
                    researchPrompt,
                    (status: DeepResearchStatus) => {
                        if (status.status === 'running') {
                            setGoogleResearchStatus(`Research in progress... ${status.progress ? `(${status.progress}%)` : ''}`);
                        }
                    },
                    5000, // Poll every 5 seconds
                    600000 // 10 minute timeout
                );

                if (result.success && result.report) {
                    const fullReport = `# Google Deep Research Report

**Research Topic:** ${prompt.slice(0, 200)}${prompt.length > 200 ? '...' : ''}

**Generated:** ${new Date().toLocaleString()}

**Powered by:** Google Deep Research Agent (deep-research-pro-preview-12-2025)

---

${result.report}
`;
                    setFinalReport(fullReport);
                    setPhases(DEFAULT_PHASES.map(p => ({ ...p, status: 'completed' as const })));
                    setGoogleResearchStatus(null);

                    // Auto-save research to history
                    if (user) {
                        try {
                            await saveResearch(user.uid, {
                                title: generateTitleFromPrompt(prompt),
                                prompt,
                                report: fullReport,
                                phases: [],
                                status: 'complete',
                            });
                            setHistoryKey(prev => prev + 1);
                        } catch (error) {
                            console.warn('Could not save research to history:', error);
                        }
                    }
                } else {
                    setGoogleResearchStatus(`Error: ${result.error}`);
                    setPhases(DEFAULT_PHASES.map(p => ({ ...p, status: 'error' as const, output: result.error })));
                }
            } catch (error: any) {
                setGoogleResearchStatus(`Error: ${error.message}`);
                setPhases(DEFAULT_PHASES.map(p => ({ ...p, status: 'error' as const, output: error.message })));
            }

            setIsRunning(false);
            setCurrentPhaseIndex(-1);
            return;
        }

        // Standard multi-phase research
        setIsRunning(true);
        setFinalReport(null);
        setPhases(DEFAULT_PHASES.map(p => ({ ...p, status: 'pending' as const, output: undefined })));

        const outputs: string[] = [];

        for (let i = 0; i < DEFAULT_PHASES.length; i++) {
            setCurrentPhaseIndex(i);
            setPhases(prev => prev.map((p, idx) =>
                idx === i ? { ...p, status: 'running' } : p
            ));

            try {
                const output = await executePhase(i, researchPrompt, outputs);
                outputs.push(output);

                setPhases(prev => prev.map((p, idx) =>
                    idx === i ? { ...p, status: 'completed', output } : p
                ));
            } catch (error: any) {
                setPhases(prev => prev.map((p, idx) =>
                    idx === i ? { ...p, status: 'error', output: error.message } : p
                ));
                setIsRunning(false);
                return;
            }
        }

        // Compile final report
        const fullReport = `# Deep Research Report

**Research Topic:** ${prompt.slice(0, 200)}${prompt.length > 200 ? '...' : ''}

**Generated:** ${new Date().toLocaleString()}

---

${outputs.join('\n\n---\n\n')}
`;

        setFinalReport(fullReport);
        setIsRunning(false);
        setCurrentPhaseIndex(-1);

        // Auto-save research to history
        if (user) {
            try {
                await saveResearch(user.uid, {
                    title: generateTitleFromPrompt(prompt),
                    prompt,
                    report: fullReport,
                    phases: phases.map(p => ({ id: p.id, name: p.name, status: p.status, output: p.output })),
                    status: 'complete',
                });
                setHistoryKey(prev => prev + 1); // Refresh history
            } catch (error) {
                console.warn('Could not save research to history:', error);
            }
        }
    };

    const stopResearch = () => {
        setIsRunning(false);
        setCurrentPhaseIndex(-1);
    };

    const copyReport = () => {
        if (finalReport) {
            navigator.clipboard.writeText(finalReport);
        }
    };

    const handleExportPDF = async () => {
        if (!finalReport) return;
        try {
            await exportToPDF(
                finalReport,
                prompt.slice(0, 50) || 'Deep Research Report',
                new Date().toLocaleString()
            );
        } catch (error) {
            console.error('Failed to export PDF:', error);
        }
    };

    const handleExportDOC = async () => {
        if (!finalReport) return;
        try {
            await exportToDOC(
                finalReport,
                prompt.slice(0, 50) || 'Deep Research Report',
                new Date().toLocaleString()
            );
        } catch (error) {
            console.error('Failed to export DOCX:', error);
        }
    };

    const handleSaveToDrive = async () => {
        if (!finalReport) return;

        setSavingToDrive(true);
        setDriveSaveStatus('idle');

        try {
            const filename = `${prompt.slice(0, 50).replace(/[^a-zA-Z0-9 ]/g, '') || 'Deep Research Report'}_${new Date().toISOString().slice(0, 10)}.md`;
            await saveFileToDrive(finalReport, filename, 'text/markdown');
            setDriveSaveStatus('success');
            setTimeout(() => setDriveSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Failed to save to Drive:', error);
            setDriveSaveStatus('error');
            setTimeout(() => setDriveSaveStatus('idle'), 3000);
        }

        setSavingToDrive(false);
    };

    const handleLoadFromHistory = (research: ResearchItem) => {
        setPrompt(research.prompt);
        setFinalReport(research.report);
        setPhases(research.phases.map(p => ({
            ...p,
            icon: DEFAULT_PHASES.find(dp => dp.id === p.id)?.icon || <FileText className="w-4 h-4" />,
            description: DEFAULT_PHASES.find(dp => dp.id === p.id)?.description || '',
        })));
    };

    return (
        <div className="h-full flex animate-fade-in">
            {/* Research History Sidebar */}
            <ResearchHistory
                key={historyKey}
                isCollapsed={historyCollapsed}
                onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
                onSelectResearch={handleLoadFromHistory}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Deep Research Mode</h1>
                        <p className="text-neutral-400 text-sm">Execute comprehensive multi-phase research tasks</p>
                    </div>
                </div>

                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Left Panel - Input & Phases */}
                    <div className="w-96 flex-shrink-0 flex flex-col gap-4">
                        {/* Prompt Input */}
                        <div className="card p-4 flex-shrink-0">
                            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-400" />
                                Research Task
                            </h3>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your research topic or question...

Examples:
• What are the key factors influencing remote work productivity?
• Analyze the impact of AI on healthcare diagnostics
• Explore sustainable energy adoption barriers in developing nations
• Investigate consumer behavior patterns in e-commerce
• Study the effects of social media on adolescent mental health"
                                className="w-full h-32 p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 resize-none focus:outline-none focus:border-purple-500"
                                disabled={isRunning}
                            />

                            {/* Attachments */}
                            <div className="mt-3">
                                <AttachmentInput
                                    attachments={attachments}
                                    onAttachmentsChange={setAttachments}
                                    disabled={isRunning}
                                />
                            </div>

                            <div className="flex gap-2 mt-3">
                                {!isRunning ? (
                                    <button
                                        onClick={handleStartResearch}
                                        disabled={!prompt.trim()}
                                        className="flex-1 btn btn-primary bg-gradient-to-r from-purple-500 to-pink-500"
                                    >
                                        <Play className="w-4 h-4" />
                                        Execute Research
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopResearch}
                                        className="flex-1 btn btn-secondary border-red-500 text-red-400"
                                    >
                                        <Pause className="w-4 h-4" />
                                        Stop
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Phase Progress */}
                        <div className="card p-4 flex-1 overflow-y-auto">
                            <h3 className="font-semibold text-white mb-4">Execution Phases</h3>
                            <div className="space-y-3">
                                {phases.map((phase, idx) => (
                                    <div
                                        key={phase.id}
                                        className={`p-3 rounded-xl border transition-all ${phase.status === 'running'
                                            ? 'bg-purple-500/10 border-purple-500'
                                            : phase.status === 'completed'
                                                ? 'bg-green-500/10 border-green-500/50'
                                                : phase.status === 'error'
                                                    ? 'bg-red-500/10 border-red-500/50'
                                                    : 'bg-neutral-800/50 border-neutral-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${phase.status === 'running'
                                                ? 'bg-purple-500'
                                                : phase.status === 'completed'
                                                    ? 'bg-green-500'
                                                    : phase.status === 'error'
                                                        ? 'bg-red-500'
                                                        : 'bg-neutral-700'
                                                }`}>
                                                {phase.status === 'running' ? (
                                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                ) : phase.status === 'completed' ? (
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                ) : phase.status === 'error' ? (
                                                    <AlertTriangle className="w-4 h-4 text-white" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-neutral-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${phase.status === 'running' ? 'text-purple-300' :
                                                    phase.status === 'completed' ? 'text-green-300' :
                                                        phase.status === 'error' ? 'text-red-300' :
                                                            'text-neutral-400'
                                                    }`}>
                                                    {phase.name}
                                                </p>
                                                <p className="text-xs text-neutral-500 truncate">{phase.description}</p>
                                            </div>
                                        </div>

                                        {/* Thinking Activity Display */}
                                        <ThinkingActivity
                                            phaseId={phase.id}
                                            isActive={phase.status === 'running'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Output */}
                    <div className="flex-1 card flex flex-col min-w-0">
                        <div className="p-4 border-b border-neutral-700 flex items-center justify-between">
                            <h3 className="font-semibold text-white">Research Output</h3>
                            {finalReport && (
                                <div className="flex gap-2">
                                    <button onClick={copyReport} className="btn btn-ghost btn-sm">
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </button>
                                    <button onClick={handleExportDOC} className="btn btn-ghost btn-sm" title="Export to Word (DOCX)">
                                        <FileType className="w-4 h-4" />
                                        DOCX
                                    </button>
                                    <button onClick={handleExportPDF} className="btn btn-secondary btn-sm" title="Export to PDF">
                                        <FileDown className="w-4 h-4" />
                                        PDF
                                    </button>
                                    {isDriveAuthenticated() && (
                                        <button
                                            onClick={handleSaveToDrive}
                                            disabled={savingToDrive}
                                            className={`btn btn-sm ${driveSaveStatus === 'success' ? 'btn-secondary bg-green-500/20 border-green-500 text-green-400' :
                                                driveSaveStatus === 'error' ? 'btn-secondary bg-red-500/20 border-red-500 text-red-400' :
                                                    'btn-ghost'
                                                }`}
                                            title="Save to Google Drive"
                                        >
                                            {savingToDrive ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : driveSaveStatus === 'success' ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Cloud className="w-4 h-4" />
                                            )}
                                            {driveSaveStatus === 'success' ? 'Saved!' : 'Drive'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div ref={outputRef} className="flex-1 overflow-y-auto">
                            {phases.every(p => p.status === 'pending') && !isRunning ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
                                        <Sparkles className="w-8 h-8 text-neutral-500" />
                                    </div>
                                    <h3 className="text-white font-medium mb-2">Ready for Deep Research</h3>
                                    <p className="text-neutral-400 text-sm max-w-md">
                                        Paste your comprehensive research prompt and click "Execute Research" to generate a full multi-phase report with literature review, analysis, and synthesis.
                                    </p>
                                </div>
                            ) : finalReport ? (
                                <ReportViewer
                                    content={phases.map(p => p.output || '').join('\n\n---\n\n')}
                                    title={prompt.slice(0, 100) + (prompt.length > 100 ? '...' : '')}
                                    generatedAt={new Date().toLocaleString()}
                                />
                            ) : (
                                <div className="p-6">
                                    {phases.map((phase, idx) => (
                                        phase.output && (
                                            <div key={phase.id} className="mb-8">
                                                <ReportViewer content={phase.output} />
                                                {idx < phases.length - 1 && phase.status === 'completed' && (
                                                    <hr className="my-6 border-neutral-700" />
                                                )}
                                            </div>
                                        )
                                    ))}
                                    {isRunning && currentPhaseIndex >= 0 && (
                                        <div className="flex items-center gap-3 text-purple-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Executing {phases[currentPhaseIndex]?.name}...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Prompt Enhancement Dialog */}
                <PromptEnhancementDialog
                    isOpen={showEnhancementDialog}
                    originalPrompt={prompt}
                    onConfirm={handleEnhancedPromptConfirm}
                    onCancel={() => setShowEnhancementDialog(false)}
                    onSkip={handleEnhancementSkip}
                />

                {/* Attachment Analysis Dialog */}
                <AttachmentAnalysisDialog
                    isOpen={showAttachmentAnalysis}
                    attachments={attachments}
                    originalPrompt={prompt}
                    onConfirm={handleAttachmentAnalysisConfirm}
                    onSkip={handleAttachmentAnalysisSkip}
                    onCancel={() => setShowAttachmentAnalysis(false)}
                />
            </div>
        </div>
    );
};

export default DeepResearch;

