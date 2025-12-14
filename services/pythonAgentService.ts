/**
 * Python Research Agent API Client
 * Connects the React frontend to the Python backend
 * 
 * Usage:
 *   import { searchWithPythonAgent } from './pythonAgentService';
 *   const results = await searchWithPythonAgent('cryptocurrency liquidation');
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
    verified: boolean;
    source: string;
}

export interface PythonAgentResult {
    query: string;
    analysis: {
        original_query: string;
        key_concepts: string[];
        fields: string[];
        research_types: string[];
    };
    papers: PythonAgentPaper[];
    statistics: {
        raw_count: number;
        unique_count: number;
        final_count: number;
        with_doi: number;
        avg_citations: number;
        avg_quality_score: number;
    };
    timestamp: string;
}

/**
 * Check if Python API is available
 */
export const isPythonAgentAvailable = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${PYTHON_API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Search for papers using the Python Research Agent
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
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Python Agent API error: ${response.status}`);
    }

    return response.json();
};

/**
 * Analyze a query without searching (faster)
 */
export const analyzeQuery = async (query: string): Promise<{
    query: string;
    analysis: {
        key_concepts: string[];
        fields: string[];
        research_types: string[];
    };
    search_plan: {
        total_queries: number;
        recommended_sources: string[];
    };
}> => {
    const response = await fetch(`${PYTHON_API_URL}/analyze?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error(`Query analysis failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Get LLM-formatted text output
 */
export const getFormattedOutput = async (
    query: string,
    limit: number = 30
): Promise<string> => {
    const params = new URLSearchParams({
        query,
        limit: limit.toString()
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

    return `${authors} (${paper.year}). ${paper.title}.${doi}`;
};
