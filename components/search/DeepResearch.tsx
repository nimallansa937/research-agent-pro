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
    Search,
    Quote,
    Zap
} from 'lucide-react';
import { searchAllAcademicSources, formatPapersForPrompt, AcademicPaper, ScoredPaper } from '../../services/academicSearch';
import { loadSettings, runDialecticalAnalysis, sendToProvider, AIResponse } from '../../services/aiProviders';
import { exportToPDF, exportToDOC, exportToBibTeX } from '../../services/exportService';
import { shouldSuggestEnhancement, ENHANCEMENT_THRESHOLD } from '../../services/promptEnhancer';
import { saveFileToDrive, isAuthenticated as isDriveAuthenticated, loadDriveSettings } from '../../services/googleDriveService';
import { saveResearch, generateTitleFromPrompt, ResearchItem } from '../../services/researchHistoryService';
import { runGoogleDeepResearch, DeepResearchStatus } from '../../services/googleDeepResearchService';
import { isPythonAgentAvailable, searchWithPythonAgent, llmSearchWithPythonAgent, multiAgentSearch, getFormattedOutput } from '../../services/pythonAgentService';
import { useAuth } from '../../contexts/AuthContext';
import ReportViewer from '../report/ReportViewer';
import PromptEnhancementDialog from './PromptEnhancementDialog';
import ResearchHistory from './ResearchHistory';
import AttachmentInput from './AttachmentInput';
import AttachmentAnalysisDialog from './AttachmentAnalysisDialog';
import ThinkingActivity from './ThinkingActivity';
import MultiAgentVisualization from './MultiAgentVisualization';
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

const QUALITY_CONSTRAINTS = `
CRITICAL RESEARCH STANDARDS (NON-NEGOTIABLE):
1. Source Quality: Use ONLY Tier 1 (Verified Journals/Conferences) or Tier 2 (ArXiv/SSRN/Institutional Reports). Reject blogs, news sites (unless for factual timelines), and Wikipedia.
2. Citation Style: All citations must be strictly APA 7th Edition.
3. Empirical Rigor: Distinguish clearly between "Theoretical Models" and "Empirical Data". Do not conflate them.
4. Metrics: Use standard financial/scientific notation.
5. Hallucination Policy: If exact data is found, cite it. If not, state "Data unavailable" - DO NOT fabricate numbers.
`;

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
    const [searchThemes, setSearchThemes] = useState<string[]>([]);
    const [usePythonAgent, setUsePythonAgent] = useState(false);
    const [useMultiAgent, setUseMultiAgent] = useState(false); // Multi-agent 3-tier system
    const [multiAgentPatterns, setMultiAgentPatterns] = useState<{ name: string; insight: string; confidence: number; supporting_papers?: number[] }[]>([]);
    const [multiAgentCoverage, setMultiAgentCoverage] = useState<{ coverage_score: number; dimensions?: Record<string, Record<string, number>> } | null>(null);
    const [multiAgentStats, setMultiAgentStats] = useState<{ total_papers: number; elapsed_seconds: number } | null>(null);
    const [pythonAgentAvailable, setPythonAgentAvailable] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    // Check if Python Agent is available on mount
    useEffect(() => {
        isPythonAgentAvailable().then(available => {
            setPythonAgentAvailable(available);
            console.log(`Python Agent: ${available ? 'Available ✓' : 'Not running'}`);
        });
    }, []);

    // Generate 4 distinct search themes based on the research topic
    const generateSearchThemes = async (topic: string) => {
        try {
            console.log('Generating search themes for:', topic);
            const settings = loadSettings();
            const prompt = `Based on the research topic: "${topic}", generate 4 distinct search queries to cover different aspects of the literature.
            
            1. Broad foundational search (Core theories/concepts)
            2. Theoretical/Mechanistic search (How it works/Frameworks)
            3. Empirical/Methodological search (Evidence/Data/Experiments)
            4. Review/Systematic search (Meta-analyses/State of the art)
            
            Return ONLY the 4 search queries, one per line. No numbering, no extra text.`;

            const response = await sendToProvider(settings.primaryProvider, settings, prompt);
            const themes = response.content.split('\n').filter(line => line.trim().length > 0).slice(0, 4);

            // Fallback if LLM fails to generate 4 lines
            while (themes.length < 4) {
                themes.push(`${topic} analysis`);
            }

            console.log('Generated themes:', themes);
            setSearchThemes(themes);
            return themes;
        } catch (error) {
            console.error('Failed to generate search themes:', error);
            // Fallback themes
            return [
                topic,
                `${topic} theory mechanisms`,
                `${topic} empirical evidence data`,
                `${topic} systematic review`
            ];
        }
    };

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


    const executePhase = async (phaseIndex: number, researchPrompt: string, previousOutputs: string[], themes?: string[]): Promise<string> => {
        const phase = DEFAULT_PHASES[phaseIndex];
        const settings = loadSettings();

        // Include attachment context in the first phase
        const attachmentContext = phaseIndex === 0 ? buildAttachmentContext() : '';
        const fullPrompt = researchPrompt + attachmentContext + '\\n\\n' + QUALITY_CONSTRAINTS;

        // For Phase 1 batches (slr1-slr4), fetch REAL papers from academic APIs
        const isLiteraturePhase = ['slr1', 'slr2', 'slr3', 'slr4'].includes(phase.id);
        let realPapers: ScoredPaper[] = [];
        let papersContext = '';

        let currentSearchQuery = researchPrompt;

        if (isLiteraturePhase) {
            console.log(`Phase ${phase.id}: Fetching real academic papers...`);
            try {
                // Use dynamic themes if available, otherwise fall back to variants
                if (themes && themes.length >= 4) {
                    const themeIndex = ['slr1', 'slr2', 'slr3', 'slr4'].indexOf(phase.id);
                    if (themeIndex >= 0 && themes[themeIndex]) {
                        currentSearchQuery = themes[themeIndex];
                        console.log(`Using dynamic theme for ${phase.id}: "${currentSearchQuery}"`);
                    }
                } else {
                    const searchVariants: Record<string, string> = {
                        'slr1': researchPrompt,
                        'slr2': `${researchPrompt} theoretical framework`,
                        'slr3': `${researchPrompt} empirical study methodology`,
                        'slr4': `${researchPrompt} systematic review meta-analysis`,
                    };
                    currentSearchQuery = searchVariants[phase.id] || researchPrompt;
                }

                // Use Multi-Agent System if enabled (3-tier: scripted + Gemini + DeepSeek)
                if (useMultiAgent && pythonAgentAvailable && phase.id === 'slr1') {
                    console.log(`Using Multi-Agent System (3-tier) for comprehensive literature search`);
                    try {
                        const multiResult = await multiAgentSearch(researchPrompt, 3);
                        // Convert papers to our format
                        realPapers = multiResult.papers.map(p => ({
                            paperId: p.paper_id || p.doi || `multi-${Date.now()}`,
                            title: p.title,
                            authors: p.authors || [],
                            year: p.year,
                            abstract: p.abstract || '',
                            doi: p.doi,
                            url: p.url || (p.doi ? `https://doi.org/${p.doi}` : ''),
                            citationCount: p.citation_count || 0,
                            venue: '',
                            source: p.source || 'multi-agent',
                            qualityScore: p.llm_relevance_score ? p.llm_relevance_score / 100 : (p.quality_score || 0.5),
                            verified: true
                        })) as ScoredPaper[];

                        // Store patterns for later synthesis
                        if (multiResult.patterns) {
                            setMultiAgentPatterns(multiResult.patterns.map(p => ({
                                name: p.name,
                                insight: p.insight,
                                confidence: p.confidence,
                                supporting_papers: p.supporting_papers
                            })));
                        }

                        // Store coverage and stats for visualization
                        if (multiResult.coverage) {
                            setMultiAgentCoverage(multiResult.coverage);
                        }
                        if (multiResult.statistics) {
                            setMultiAgentStats({
                                total_papers: multiResult.statistics.total_papers,
                                elapsed_seconds: multiResult.statistics.elapsed_seconds
                            });
                        }

                        papersContext = `## Multi-Agent Research Results (${realPapers.length} papers)\n\n` +
                            `**Coverage:** ${multiResult.coverage?.coverage_score || 'N/A'}%\n` +
                            `**Patterns Found:** ${multiResult.patterns?.length || 0}\n\n` +
                            multiResult.papers.slice(0, 20).map((p, i) =>
                                `[${i + 1}] ${p.authors?.[0] || 'Unknown'} (${p.year}). ${p.title}. DOI: ${p.doi || 'N/A'}`
                            ).join('\n');
                        console.log(`Multi-Agent found ${realPapers.length} papers with ${multiResult.patterns?.length || 0} patterns`);

                        // Skip remaining SLR phases since multi-agent handles all at once
                        return;
                    } catch (multiError) {
                        console.warn('Multi-Agent system failed, falling back to Python Agent:', multiError);
                    }
                }

                // Use Python Agent if enabled (with LLM or regular search)
                if (usePythonAgent && pythonAgentAvailable) {
                    console.log(`Using Python Agent (LLM-powered) for ${phase.id}`);
                    try {
                        const pythonResult = await llmSearchWithPythonAgent(currentSearchQuery, 25, 30);
                        // Convert Python papers to our format
                        realPapers = pythonResult.papers.map(p => ({
                            paperId: p.paper_id || p.doi || `py-${Date.now()}`,
                            title: p.title,
                            authors: p.authors || [],
                            year: p.year,
                            abstract: p.abstract || '',
                            doi: p.doi,
                            url: p.url || (p.doi ? `https://doi.org/${p.doi}` : ''),
                            citationCount: p.citation_count || 0,
                            venue: '',
                            source: p.source || 'python-agent',
                            qualityScore: p.llm_relevance_score ? p.llm_relevance_score / 100 : (p.quality_score || 0.5),
                            verified: true
                        })) as ScoredPaper[];
                        papersContext = `## Python Agent Results (LLM-Scored)\n\n` +
                            pythonResult.papers.slice(0, 15).map((p, i) =>
                                `[${i + 1}] ${p.authors?.[0] || 'Unknown'} (${p.year}). ${p.title}. ` +
                                `[Relevance: ${p.llm_relevance_score || 'N/A'}%] DOI: ${p.doi || 'N/A'}`
                            ).join('\n');
                        console.log(`Python Agent found ${realPapers.length} papers with LLM scoring`);
                    } catch (pyError) {
                        console.warn('Python Agent failed, falling back to TypeScript:', pyError);
                        realPapers = await searchAllAcademicSources(currentSearchQuery, 25);
                        papersContext = formatPapersForPrompt(realPapers);
                    }
                } else {
                    // Use TypeScript implementation
                    realPapers = await searchAllAcademicSources(currentSearchQuery, 25);
                    papersContext = formatPapersForPrompt(realPapers);
                }
                console.log(`Found ${realPapers.length} real papers for ${phase.id} using: ${currentSearchQuery}`);
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

### Literature Matrix (Consolidated)
| Theme | Key Methodologies Used | LOE Range | Major Findings | Critical Sources |
|-------|------------------------|-----------|----------------|------------------|
| [Theme 1] | [Methods] | [Range] | [Findings] | [Citations] |
| [Theme 2] | [Methods] | [Range] | [Findings] | [Citations] |
| [Theme 3] | [Methods] | [Range] | [Findings] | [Citations] |
| [Theme 4] | [Methods] | [Range] | [Findings] | [Citations] |

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

            forensic: `Phase 3: Case Studies & Empirical Evidence

RESEARCH TOPIC: ${researchPrompt}

CONSOLIDATED LITERATURE (use the summary from Phase 1.5):
${previousOutputs.length > 0 ? previousOutputs[previousOutputs.length - 1] : 'No previous output'}

TASK: Identify and analyze 3-4 CASE STUDIES or real-world examples from the literature.
Focus on: Empirical data, timeline of events, root causes, and outcomes.

OUTPUT:
## Case Studies & Empirical Evidence

### Case Study 1: [Name/Event]
**Context:** [Background]
**Timeline/Progression:** [Key events]
**Data Points:** [Quantifiable metrics found in literature]
**Key Lessons:** [What this case demonstrates]

### Case Study 2: [Name/Event]
[Same structure]

### Case Study 3: [Name/Event]
[Same structure]

### Cross-Case Analysis
| Feature | Case 1 | Case 2 | Case 3 | Pattern Identified |
|---------|--------|--------|--------|--------------------|
[Compare cases]`,

            quantitative: `Phase 4: Empirical Validation Framework

RESEARCH TOPIC: ${researchPrompt}

TASK: Design an empirical validation study based on the findings and case studies.

OUTPUT:
## Empirical Validation Framework

### Proposed Methodology
[How to validate the findings using real data]

### Key Variables & Metrics
| Variable | Definition | Measurement Source |
|----------|------------|-------------------|
[8-12 variables]

### Validation Steps
1. **Data Collection:** [Where to get data]
2. **Analysis Model:** [Statistical/Machine Learning approach]
3. **Hypotheses:** [What to test]

### Validation Diagram
\`\`\`mermaid
flowchart LR
    A[Data Ingestion] --> B[Processing]
    B --> C[Analysis]
    C --> D[Validation Result]
\`\`\``,

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

        // Generate dynamic search themes first
        const themes = await generateSearchThemes(prompt);

        const outputs: string[] = [];

        for (let i = 0; i < DEFAULT_PHASES.length; i++) {
            setCurrentPhaseIndex(i);
            setPhases(prev => prev.map((p, idx) =>
                idx === i ? { ...p, status: 'running' } : p
            ));

            try {
                const output = await executePhase(i, researchPrompt, outputs, themes);
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

    const handleExportBibTeX = async () => {
        if (!finalReport) return;
        try {
            await exportToBibTeX(
                finalReport,
                prompt.slice(0, 50) || 'Deep Research Report'
            );
        } catch (error) {
            console.error('Failed to export BibTeX:', error);
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

                            {/* Python Agent Toggle */}
                            {pythonAgentAvailable && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <Zap className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm text-yellow-300">Python Agent Available</span>
                                        <label className="ml-auto flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={usePythonAgent}
                                                onChange={(e) => {
                                                    setUsePythonAgent(e.target.checked);
                                                    if (e.target.checked) setUseMultiAgent(false);
                                                }}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm text-neutral-300">LLM Search</span>
                                        </label>
                                    </div>

                                    {/* Multi-Agent Toggle */}
                                    <div className="flex items-center gap-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <Network className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-purple-300">Multi-Agent (3-Tier)</span>
                                        <label className="ml-auto flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useMultiAgent}
                                                onChange={(e) => {
                                                    setUseMultiAgent(e.target.checked);
                                                    if (e.target.checked) setUsePythonAgent(false);
                                                }}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm text-neutral-300">Use DeepSeek+Gemini</span>
                                        </label>
                                    </div>
                                </div>
                            )}

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
                                    <button onClick={handleExportBibTeX} className="btn btn-ghost btn-sm" title="Export Citations (BibTeX)">
                                        <Quote className="w-4 h-4" />
                                        BibTeX
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
                                <div className="space-y-6">
                                    {/* Multi-Agent Visualization (if patterns exist) */}
                                    {multiAgentPatterns.length > 0 && (
                                        <div className="px-6 pt-6">
                                            <MultiAgentVisualization
                                                patterns={multiAgentPatterns}
                                                coverage={multiAgentCoverage || undefined}
                                                totalPapers={multiAgentStats?.total_papers || 0}
                                                elapsedTime={multiAgentStats?.elapsed_seconds}
                                            />
                                        </div>
                                    )}

                                    <ReportViewer
                                        content={phases.map(p => p.output || '').join('\n\n---\n\n')}
                                        title={prompt.slice(0, 100) + (prompt.length > 100 ? '...' : '')}
                                        generatedAt={new Date().toLocaleString()}
                                    />
                                </div>
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
        </div >
    );
};

export default DeepResearch;

