// Academic Search Service - Real academic paper search using free APIs
// Supports: Semantic Scholar, OpenAlex, CrossRef

export interface AcademicPaper {
    paperId: string;
    title: string;
    authors: string[];
    year: number;
    abstract?: string;
    doi?: string;
    url?: string;
    citationCount?: number;
    venue?: string;
    source: 'semantic_scholar' | 'openalex' | 'crossref';
}

export interface SearchResult {
    papers: AcademicPaper[];
    total: number;
    query: string;
    source: string;
}

// CORS proxy for production
const withCorsProxy = (url: string): string => {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) return url;
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
};

/**
 * Search Semantic Scholar for academic papers
 * Free API, no auth required, 200M+ papers
 * Docs: https://api.semanticscholar.org/api-docs/
 */
export const searchSemanticScholar = async (
    query: string,
    limit: number = 25
): Promise<SearchResult> => {
    const fields = 'paperId,title,authors,year,abstract,citationCount,venue,externalIds,url';
    const baseUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;
    const url = withCorsProxy(baseUrl);

    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            console.error('Semantic Scholar API error:', response.status);
            return { papers: [], total: 0, query, source: 'semantic_scholar' };
        }

        const data = await response.json();
        const papers: AcademicPaper[] = (data.data || []).map((paper: any) => ({
            paperId: paper.paperId,
            title: paper.title || 'Untitled',
            authors: (paper.authors || []).map((a: any) => a.name),
            year: paper.year || 0,
            abstract: paper.abstract,
            doi: paper.externalIds?.DOI,
            url: paper.url || (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined),
            citationCount: paper.citationCount,
            venue: paper.venue,
            source: 'semantic_scholar' as const
        }));

        return {
            papers,
            total: data.total || papers.length,
            query,
            source: 'semantic_scholar'
        };
    } catch (error) {
        console.error('Semantic Scholar search failed:', error);
        return { papers: [], total: 0, query, source: 'semantic_scholar' };
    }
};

/**
 * Search OpenAlex for academic papers
 * Free API, no auth required, 250M+ papers
 * Docs: https://docs.openalex.org/
 */
export const searchOpenAlex = async (
    query: string,
    limit: number = 25
): Promise<SearchResult> => {
    const baseUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${limit}&sort=cited_by_count:desc`;
    const url = withCorsProxy(baseUrl);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ResearchAgentPro/1.0 (mailto:research@example.com)'
            }
        });

        if (!response.ok) {
            console.error('OpenAlex API error:', response.status);
            return { papers: [], total: 0, query, source: 'openalex' };
        }

        const data = await response.json();
        const papers: AcademicPaper[] = (data.results || []).map((work: any) => ({
            paperId: work.id?.replace('https://openalex.org/', '') || '',
            title: work.title || 'Untitled',
            authors: (work.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
            year: work.publication_year || 0,
            abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : undefined,
            doi: work.doi?.replace('https://doi.org/', ''),
            url: work.doi || work.id,
            citationCount: work.cited_by_count,
            venue: work.primary_location?.source?.display_name,
            source: 'openalex' as const
        }));

        return {
            papers,
            total: data.meta?.count || papers.length,
            query,
            source: 'openalex'
        };
    } catch (error) {
        console.error('OpenAlex search failed:', error);
        return { papers: [], total: 0, query, source: 'openalex' };
    }
};

// Helper to reconstruct abstract from OpenAlex inverted index
const reconstructAbstract = (invertedIndex: Record<string, number[]>): string => {
    if (!invertedIndex) return '';
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            words.push([word, pos]);
        }
    }
    words.sort((a, b) => a[1] - b[1]);
    return words.map(w => w[0]).join(' ').slice(0, 500); // Limit abstract length
};

/**
 * Verify a citation exists via CrossRef
 * Free API, no auth required
 * Docs: https://api.crossref.org/
 */
export const verifyCitation = async (doi: string): Promise<boolean> => {
    if (!doi) return false;

    const cleanDoi = doi.replace('https://doi.org/', '');
    const baseUrl = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const url = withCorsProxy(baseUrl);

    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        return response.ok;
    } catch {
        return false;
    }
};

/**
 * Format a paper as APA citation
 */
export const formatAPACitation = (paper: AcademicPaper): string => {
    const authors = paper.authors.length > 0
        ? paper.authors.length > 3
            ? `${paper.authors[0]} et al.`
            : paper.authors.join(', ')
        : 'Unknown Author';

    const year = paper.year || 'n.d.';
    const title = paper.title || 'Untitled';
    const venue = paper.venue ? ` ${paper.venue}.` : '';
    const doi = paper.doi ? ` https://doi.org/${paper.doi}` : '';

    return `${authors} (${year}). ${title}.${venue}${doi}`;
};

/**
 * Format paper for LLM context (detailed)
 */
export const formatPaperForLLM = (paper: AcademicPaper, index: number): string => {
    const citation = formatAPACitation(paper);
    const abstract = paper.abstract ? `\nAbstract: ${paper.abstract.slice(0, 300)}...` : '';
    const citations = paper.citationCount ? ` (${paper.citationCount} citations)` : '';

    return `[${index + 1}] ${citation}${citations}${abstract}`;
};

/**
 * Search all academic sources and combine results
 */
export const searchAllAcademicSources = async (
    query: string,
    limitPerSource: number = 15
): Promise<AcademicPaper[]> => {
    console.log(`Searching academic sources for: "${query}"`);

    // Search both sources in parallel
    const [semanticResult, openAlexResult] = await Promise.all([
        searchSemanticScholar(query, limitPerSource),
        searchOpenAlex(query, limitPerSource)
    ]);

    // Combine and deduplicate by DOI
    const seen = new Set<string>();
    const combined: AcademicPaper[] = [];

    const addPapers = (papers: AcademicPaper[]) => {
        for (const paper of papers) {
            const key = paper.doi || paper.title.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(paper);
            }
        }
    };

    addPapers(semanticResult.papers);
    addPapers(openAlexResult.papers);

    // Sort by citation count (most cited first)
    combined.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));

    console.log(`Found ${combined.length} unique papers from academic sources`);
    return combined;
};

/**
 * Format all papers for inclusion in LLM prompt
 */
export const formatPapersForPrompt = (papers: AcademicPaper[]): string => {
    if (papers.length === 0) {
        return 'No academic papers found for this query.';
    }

    const formatted = papers.map((paper, i) => formatPaperForLLM(paper, i));

    return `## Verified Academic Sources (${papers.length} papers)\n\n${formatted.join('\n\n')}`;
};
