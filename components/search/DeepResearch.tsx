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
    Cloud
} from 'lucide-react';
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
        id: 'slr',
        name: 'Phase 1: Literature Discovery & Synthesis',
        description: 'Comprehensive search across academic databases and sources',
        icon: <BookOpen className="w-4 h-4" />
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

        const phasePrompts: Record<string, string> = {
            slr: `You are executing Phase 1: Literature Discovery & Synthesis for the following research task:

${fullPrompt}

CRITICAL FORMATTING RULES (MUST FOLLOW):
- Use ONLY ASCII characters - NO Unicode symbols (no checkmarks, warning triangles, etc.)
- Use these text markers: [VERIFIED], [NEEDS-CHECK], [ESTIMATED]
- COMPLETE ALL TEXT - never truncate titles, author names, or descriptions
- Write FULL author names (avoid "et al." in bibliography entries)
- Include COMPLETE DOI links (full URL, never shortened or cut off)
- Every table cell MUST contain complete text - no "..." or partial content
- If length is a concern, include FEWER complete entries rather than many truncated ones

QUALITY REQUIREMENTS:
- ONLY cite papers/sources that actually exist - do NOT fabricate references
- Mark each source: [VERIFIED] = confirmed real with DOI, [NEEDS-CHECK] = uncertain
- Distinguish: Established facts vs Emerging research vs Theoretical proposals

INSTRUCTIONS:
1. Search across: arXiv, SSRN, PubMed, IEEE, Google Scholar, Semantic Scholar
2. Identify 12-20 relevant peer-reviewed sources (prioritize 2020-2025)
3. Create annotated bibliography with COMPLETE citation data (no truncation)
4. Assign Relevance Score (1-100) and Evidence Quality (1-10)
5. Organize into 3-5 thematic categories
6. Include full DOI URLs for all sources

FORMAT YOUR OUTPUT AS:
## Literature Discovery & Synthesis

### Research Methodology
**Databases Searched:** [List specific databases]
**Search Terms:** [Exact query terms used]
**Inclusion Criteria:** Peer-reviewed papers, 2018-2025, English language
**Quality Threshold:** Citation count > 5 or tier-1 venue publication

### Thematic Categories
[List 3-5 categories with brief descriptions]

### Annotated Bibliography

#### Category 1: [Name]
| # | Citation (Complete APA) | Key Finding | Rel. | Qual. | Status |
|---|------------------------|-------------|------|-------|--------|
| 1 | LastName, F., LastName2, F. (Year). Full Title Here. Journal, Vol(Issue), pp-pp. https://doi.org/xxx | [Complete finding] | 85 | 8 | [VERIFIED] |

[Repeat for each category with 3-6 COMPLETE sources each]

### Top 5 Most Relevant Sources
| Rank | Full Citation (no truncation) | Why Critical | Complete DOI URL |
|------|------------------------------|--------------|------------------|

### Key Themes Identified
1. Theme: [Description] - Sources: [X]
2. Theme: [Description] - Sources: [X]
[Continue for 4-6 themes]

### Research Gaps & Opportunities
- Gap 1: [Description] - Priority: High/Medium/Low
- Gap 2: [Description] - Priority: High/Medium/Low

### Verification Summary
- [VERIFIED] Sources (with DOIs): [X of Y total]
- [NEEDS-CHECK] Sources: [List numbers]
- Overall confidence: High/Medium/Low

### Limitations of This Review
- Scope: [What was included/excluded]
- Potential biases: [Language, date range, database coverage]
- Confidence level: [High/Medium/Low] based on verification rate`,

            taxonomy: `You are executing Phase 2: Conceptual Framework & Mapping for the following research task:

${researchPrompt}

PREVIOUS PHASE OUTPUT:
${previousOutputs.join('\\n\\n---\\n\\n')}

CRITICAL FORMATTING RULES:
- Use ONLY ASCII characters - NO Unicode symbols
- Use markers: [VERIFIED], [SPECULATIVE], [NEEDS-CHECK]
- COMPLETE ALL TEXT - no truncation in definitions or descriptions
- Use simple ASCII for diagrams (-->, ---, |, +)
- Every table cell must contain complete text

QUALITY REQUIREMENTS:
- Ground ALL concepts in Phase 1 sources with [#] citations
- Define all terminology/acronyms in glossary before use
- Mark speculative connections with [SPECULATIVE] tag

FORMAT YOUR OUTPUT AS:
## Conceptual Framework & Mapping

### Glossary of Key Terms
| Term/Acronym | Full Name | Definition | Source |
|--------------|-----------|------------|--------|
| [Acronym] | [Full name] | [One-sentence definition] | [Citation #] |
[Include 10-15 key terms used in this research]

### Concept Hierarchy

#### Core Concepts (Established in Literature)
**1. [Concept Name]** [Source #]
   - Definition: [Clear definition from source]
   - 1.1 [Sub-concept] - [Brief description]
   - 1.2 [Sub-concept] - [Brief description]

#### Contributing Factors & Moderators
[Continue with same format, citing sources]

#### Outcomes & Effects
[Continue with evidence strength indicators]

### Relationship Matrix
| Concept A | Relationship Type | Concept B | Evidence Level | Sources |
|-----------|------------------|-----------|----------------|---------|
| [X] | causes/correlates/moderates | [Y] | Strong/Moderate/Weak | [#,#] |

### Conceptual Framework Diagram
\`\`\`mermaid
graph TD
    subgraph Core["Core Concepts"]
        A["Theory 1"]
        B["Theory 2"]
    end
    subgraph Factors["Contributing Factors"]
        C["Factor 1"]
        D["Factor 2"]
    end
    subgraph Outcomes["Outcomes"]
        E["Outcome 1"]
    end
    A -->|"strong evidence"| C
    B -.->|"weak evidence"| D
    C --> E
    D --> E
\`\`\`
**Diagram Legend:**
- Solid arrows (---->) = Strong evidence from multiple sources
- Dashed arrows (....>) = Weak/theoretical evidence
- [SPECULATIVE] = Proposed relationship needing more research

### Theoretical Integration Summary
[Unified perspective showing how frameworks connect]

### Framework Limitations
- **Concepts needing more research:** [List with confidence]
- **Theoretical gaps:** [What's missing or contested]
- **Framework confidence:** [High/Medium/Low] - [Justification]`,

            forensic: `You are executing Phase 3: Deep Analysis & Evidence Review for the following research task:

${researchPrompt}

PREVIOUS PHASE OUTPUTS:
${previousOutputs.join('\\n\\n---\\n\\n')}

CRITICAL FORMATTING RULES:
- Use ONLY ASCII characters - NO Unicode symbols (no checkmarks, triangles, etc.)
- Use these markers: [VERIFIED], [EXTRAPOLATED], [ESTIMATED]
- COMPLETE ALL TEXT - every table cell must have full content, no truncation
- Include full sample sizes, complete confidence intervals

QUALITY REQUIREMENTS:
- Verify ALL quantitative claims against source papers
- Include sample sizes, confidence intervals, effect sizes where available
- Mark metrics as: [VERIFIED], [EXTRAPOLATED], [ESTIMATED]
- Acknowledge contradictory findings across studies
- Use LOE ratings: 1a (Meta-analysis), 1b (RCT), 2 (Quasi-exp), 3 (Observational), 4 (Expert)

FORMAT YOUR OUTPUT AS:
## Deep Analysis & Evidence Review

### Evidence Quality Summary
| Component | # Sources | LOE Range | Confidence | Key Gap (complete) |
|-----------|-----------|-----------|------------|-------------------|
| [Name] | [N] | [1a-4] | High/Med/Low | [Full description] |

---

### Component 1: [Name]

**Definition:** [Complete technical definition with citation [#]]

**Key Characteristics:**
1. [Characteristic] - Source: [#], LOE: [X]
2. [Characteristic] - Source: [#], LOE: [X]

**Evidence Strength Matrix:**
| Source | Type | LOE | Finding (complete) | n= | Effect | Status |
|--------|------|-----|-------------------|-----|--------|--------|
| [Author (Year)] | fMRI/Behavioral/Review | 1a-4 | [Full result] | [N] | [d=X.X] | [VERIFIED] |

**Quantitative Evidence:**
| Metric | Value | 95% CI | Sample | Source | Status |
|--------|-------|--------|--------|--------|--------|
| [Metric] | [X%] | [X-Y%] | n=[N] | [#] | [VERIFIED] |

**Contradictory Findings:**
| Finding A | Finding B | Explanation |
|-----------|-----------|-------------|
| [Study X found...] | [Study Y found...] | [Differences explained] |

**Limitations & Caveats:**
- Methodological: [Study design issues]
- Generalizability: [Population/context limits]
- Recency: [How current is evidence?]
- Risk of Bias: [Publication bias, etc.]

**Critical Research Questions:**
1. [Q1] - Priority: High/Medium/Low
2. [Q2] - Suggested experiment: [Description]

**Component Confidence:** High/Medium/Low - [Justification]

---
[Repeat for 4-6 major components]

### Cross-Component Synthesis
| Component A | Relationship | Component B | Evidence | Confidence |
|-------------|--------------|-------------|----------|------------|

### Overall Analysis Confidence: High/Medium/Low
Based on: [X sources verified, Y% high-quality evidence, Z contradictions addressed]`,

            quantitative: `You are executing Phase 4: Methodology & Framework Design for the following research task:

${researchPrompt}

PREVIOUS PHASE OUTPUTS:
${previousOutputs.slice(-2).join('\\n\\n---\\n\\n')}

INSTRUCTIONS:
1. Propose a methodological framework or analytical approach
2. Define key variables, metrics, or indicators
3. Describe relationships between variables (if applicable)
4. Identify measurement approaches or data collection strategies
5. Suggest implementation or application guidelines

FORMAT YOUR OUTPUT AS:
## Methodology & Framework Design

### Proposed Framework Overview
[Describe the overall approach or methodology]

### Key Variables & Metrics
| Variable/Metric | Definition | Measurement Approach | Data Source |
|-----------------|------------|---------------------|-------------|
[Fill table with 8-12 key variables]

### Relationships & Dependencies
[Describe how variables relate to each other]

### Framework Diagram
\`\`\`mermaid
flowchart LR
    A[Input] --> B[Process 1]
    B --> C[Process 2]
    C --> D[Output]
    [Adapt to your framework...]
\`\`\`

### Implementation Guidelines
1. Step 1: [Description]
2. Step 2: [Description]
[Continue with key steps]

### Data & Resource Requirements
[List what's needed to apply this framework]

### Validation Approach
[How to verify the framework works]`,

            synthesis: `You are executing Phase 5: Synthesis & Recommendations for the following research task:

${researchPrompt}

ALL PREVIOUS PHASE OUTPUTS:
${previousOutputs.join('\\n\\n---\\n\\n')}

CRITICAL FORMATTING RULES:
- Use ONLY ASCII characters - NO Unicode symbols
- Use markers: [VERIFIED], [NEEDS-CHECK], [HIGH-CONF], [LOW-CONF]
- COMPLETE ALL TEXT - no truncation anywhere
- Every table cell must contain full content

QUALITY REQUIREMENTS:
- Synthesize ONLY verified findings from previous phases
- Include confidence levels for ALL recommendations
- Acknowledge limitations and uncertainties explicitly
- Provide clear action items with feasibility assessment
- Create professional report suitable for decision-makers
- Include AI-generation disclosure

FORMAT YOUR OUTPUT AS:
## Executive Summary

**Research Question:** [Restated clearly]
**Answer:** [Complete one-paragraph evidence-based answer]
**Overall Confidence:** High/Medium/Low based on [X verified sources, Y% high-quality evidence]

**Key Takeaways:**
1. [HIGH-CONF] [High-confidence takeaway - complete text]
2. [NEEDS-CHECK] [Takeaway requiring validation - complete text]
3. [Continue for 4-6 takeaways with confidence markers]

## Key Insights

### Insight 1: [Title] - Confidence: High/Medium/Low
**Finding:** [Evidence-backed statement - complete]
**Supporting Evidence:** [# of sources, quality assessment]
**Implications:** [What this means]
**Limitations:** [Caveats to consider]

[Continue for 5-7 insights]

## Summary Table
| Finding (complete) | Evidence | Confidence | Priority | Status |
|-------------------|----------|------------|----------|--------|
| [Full finding text] | Strong/Moderate/Weak | High/Med/Low | High/Med/Low | [VERIFIED] |

## Recommendations

### For Researchers [Confidence: X/10]
| Recommendation | Rationale | Feasibility | Priority |
|----------------|-----------|-------------|----------|

### For Practitioners [Confidence: X/10]
| Recommendation | Implementation Steps | Resources Needed | Risk Level |
|----------------|---------------------|------------------|------------|

### For Decision-Makers [Confidence: X/10]
| Strategic Recommendation | Expected Impact | Investment | Timeline |
|--------------------------|-----------------|------------|----------|

## Study Limitations
- **Scope limitations:** [What was not covered]
- **Methodological limitations:** [Research design constraints]
- **Data limitations:** [Quality, recency, coverage issues]
- **Potential biases:** [Language, geographic, publication bias]

## Verification Checklist
- [ ] All citations verified against source databases
- [ ] Quantitative claims cross-checked with original papers
- [ ] Conflicting evidence acknowledged
- [ ] Confidence levels assigned based on evidence quality
- [ ] Limitations clearly stated

## References (Complete Bibliography)
[Full APA formatted references with DOIs - from Phase 1]

---
**Report Metadata:**
- Generated: ${new Date().toISOString()}
- Sources analyzed: [X total]
- High-confidence sources: [Y]
- Items requiring follow-up: [Z]
- ⚠ AI-Generated Content: This report was synthesized by an AI research assistant and requires human verification`
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

