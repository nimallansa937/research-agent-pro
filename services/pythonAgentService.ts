/**
 * Python Research Agent API Client
 * Connects the React frontend to the Python backend
 * 
 * Endpoints:
 *   /search      - Rule-based search (fast)
 *   /llm-search  - AI-powered search (smart)
 */

// Python API base URL (change for production)
const PYTHON_API_URL = 'http://localhost:8000';

export interface PythonAgentPaper {
    paper_id: string;
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    doi: string;
    url: string;
    citation_count: number;
    quality_score: number;
    llm_relevance_score?: number;
    llm_reasoning?: string;
    verified: boolean;
    source: string;
}

export interface PythonAgentResult {
    query: string;
    papers: PythonAgentPaper[];
    statistics: {
        raw_count: number;
        unique_count: number;
        final_count?: number;
        high_quality_count?: number;
        with_doi: number;
        avg_citations?: number;
        avg_quality_score?: number;
        avg_relevance?: number;
    };
    classification?: {
        primary_domain: string;
        confidence: number;
        key_concepts: string[];
    };
    timestamp: string;
}

export interface HealthCheckResult {
    status: string;
    agent: string;
    llm_available: boolean;
}

/**
 * Check if Python API is available and if LLM is enabled
 */
export const isPythonAgentAvailable = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${PYTHON_API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Check if LLM features are available
 */
export const isLLMAvailable = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${PYTHON_API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        if (!response.ok) return false;
        const data: HealthCheckResult = await response.json();
        return data.llm_available;
    } catch {
        return false;
    }
};

/**
 * Regular search (rule-based, fast)
 */
export const searchWithPythonAgent = async (
    query: string,
    limit: number = 50,
    minQuality: number = 0.3
): Promise<PythonAgentResult> => {
    const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        min_quality: minQuality.toString()
    });

    const response = await fetch(`${PYTHON_API_URL}/search?${params}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`Python Agent API error: ${response.status}`);
    }

    return response.json();
};

/**
 * LLM-powered search (AI intelligence)
 * Uses Gemini/DeepSeek for domain classification and relevance scoring
 */
export const llmSearchWithPythonAgent = async (
    query: string,
    limit: number = 30,
    minRelevance: number = 30
): Promise<PythonAgentResult> => {
    const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        min_relevance: minRelevance.toString()
    });

    const response = await fetch(`${PYTHON_API_URL}/llm-search?${params}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `LLM Search failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Multi-Agent search (3-tier agent system)
 * Uses Tier 1 (scripted), Tier 2 (Gemini), Tier 3 (DeepSeek)
 * Returns papers with cross-cutting patterns and coverage analysis
 */
export interface MultiAgentResult {
    query: string;
    papers: PythonAgentPaper[];
    patterns: {
        name: string;
        description: string;
        insight: string;
        confidence: number;
        supporting_papers: number[];
    }[];
    statistics: {
        total_papers: number;
        patterns_found: number;
        refinement_rounds: number;
        elapsed_seconds: number;
    };
    decomposition: {
        sub_questions: { question: string; priority: string }[];
        dimensions: Record<string, string[]>;
        baseline_query: string;
    };
    coverage: {
        coverage_score: number;
        dimensions: Record<string, Record<string, number>>;
    };
}

export const multiAgentSearch = async (
    query: string,
    maxRounds: number = 3,
    domain?: string
): Promise<MultiAgentResult> => {
    const params = new URLSearchParams({
        query,
        max_rounds: maxRounds.toString(),
    });
    if (domain) params.append('domain', domain);

    const response = await fetch(`${PYTHON_API_URL}/multi-agent-search?${params}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `Multi-Agent Search failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Analyze a query (optionally with LLM)
 */
export const analyzeQuery = async (query: string, useLLM: boolean = false): Promise<{
    query: string;
    method: string;
    classification?: {
        primary_domain: string;
        confidence: number;
        key_concepts: string[];
    };
    filters?: {
        include_keywords: string[];
        exclude_keywords: string[];
    };
}> => {
    const params = new URLSearchParams({
        query,
        use_llm: useLLM.toString()
    });

    const response = await fetch(`${PYTHON_API_URL}/analyze?${params}`);

    if (!response.ok) {
        throw new Error(`Query analysis failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Get LLM-formatted text output for prompts
 */
export const getFormattedOutput = async (
    query: string,
    limit: number = 30,
    useLLM: boolean = false
): Promise<string> => {
    const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        use_llm: useLLM.toString()
    });

    const response = await fetch(`${PYTHON_API_URL}/format?${params}`);

    if (!response.ok) {
        throw new Error(`Format request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.formatted_text;
};

/**
 * Format papers for display (helper)
 */
export const formatPaperCitation = (paper: PythonAgentPaper): string => {
    const authors = paper.authors.length > 3
        ? `${paper.authors[0]} et al.`
        : paper.authors.join(', ');

    const doi = paper.doi ? ` https://doi.org/${paper.doi}` : '';
    const score = paper.llm_relevance_score
        ? ` [Relevance: ${paper.llm_relevance_score}%]`
        : '';

    return `${authors} (${paper.year}). ${paper.title}.${doi}${score}`;
};
