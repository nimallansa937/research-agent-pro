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
    source: 'semantic_scholar' | 'openalex' | 'crossref' | 'arxiv';
}

export interface SearchResult {
    papers: AcademicPaper[];
    total: number;
    query: string;
    source: string;
}

// Extended paper interface with quality scoring
export interface ScoredPaper extends AcademicPaper {
    qualityScore: number;
    verified: boolean;
}

// ============================================
// TIER 1: QUERY DECOMPOSITION & SYNONYMS
// ============================================

// Common research synonyms for query expansion
const RESEARCH_SYNONYMS: Record<string, string[]> = {
    'liquidation': ['deleveraging', 'forced selling', 'margin call', 'position closure'],
    'cascade': ['contagion', 'spillover', 'domino effect', 'systemic failure', 'chain reaction'],
    'cryptocurrency': ['crypto', 'digital asset', 'blockchain', 'DeFi', 'decentralized finance'],
    'mechanisms': ['drivers', 'causes', 'factors', 'dynamics', 'processes'],
    'risk': ['vulnerability', 'exposure', 'hazard', 'threat'],
    'market': ['exchange', 'trading', 'financial'],
    'protocol': ['smart contract', 'platform', 'system'],
    'analysis': ['study', 'research', 'investigation', 'examination'],
    'impact': ['effect', 'consequence', 'outcome', 'result'],
    'model': ['framework', 'theory', 'approach', 'methodology']
};

/**
 * TIER 1: Decompose a research query into multiple search variations
 * Breaks complex queries into component searches with synonyms
 */
export const decomposeQuery = (originalQuery: string): string[] => {
    const queries: string[] = [];
    const words = originalQuery.toLowerCase().split(/\s+/);

    // 1. Original query (exact)
    queries.push(originalQuery);

    // 2. Generate synonym variations
    for (const [term, synonyms] of Object.entries(RESEARCH_SYNONYMS)) {
        if (originalQuery.toLowerCase().includes(term)) {
            for (const syn of synonyms.slice(0, 2)) { // Limit to 2 synonyms per term
                queries.push(originalQuery.toLowerCase().replace(term, syn));
            }
        }
    }

    // 3. Core concept pairs (for broader search)
    if (words.length >= 3) {
        // Take first and last significant words
        queries.push(`${words[0]} ${words[words.length - 1]}`);
        // Take middle concepts
        if (words.length >= 4) {
            queries.push(`${words[1]} ${words[2]}`);
        }
    }

    // 4. Add methodological variations
    queries.push(`${originalQuery} systematic review`);
    queries.push(`${originalQuery} empirical study`);

    // 5. Deduplicate and limit
    const unique = [...new Set(queries)];
    console.log(`Query decomposition: Generated ${unique.length} variations from "${originalQuery}"`);

    return unique.slice(0, 8); // Limit to 8 variations
};

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
 * Search ArXiv for academic papers (Preprints)
 * Free API, no auth required
 * Docs: https://info.arxiv.org/help/api/index.html
 */
export const searchArxiv = async (
    query: string,
    limit: number = 25
): Promise<SearchResult> => {
    // ArXiv supports simple search query like all:term
    const baseUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
    const url = withCorsProxy(baseUrl);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('ArXiv API error:', response.status);
            return { papers: [], total: 0, query, source: 'arxiv' };
        }

        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const entries = Array.from(xmlDoc.querySelectorAll('entry'));

        const papers: AcademicPaper[] = entries.map(entry => {
            const idUrl = entry.querySelector('id')?.textContent || '';
            const paperId = idUrl.split('/abs/')[1] || idUrl;
            const title = entry.querySelector('title')?.textContent || 'Untitled';
            const summary = entry.querySelector('summary')?.textContent || '';
            const published = entry.querySelector('published')?.textContent || '';
            const year = published ? new Date(published).getFullYear() : 0;
            const authors = Array.from(entry.querySelectorAll('author name')).map(n => n.textContent || '');

            // Try to find DOI
            const doiElem = entry.querySelector('arxiv\\:doi, doi'); // Namespace might vary in implementation
            const doi = doiElem?.textContent;

            return {
                paperId,
                title: title.replace(/\n/g, ' ').trim(),
                authors,
                year,
                abstract: summary.replace(/\n/g, ' ').trim().slice(0, 500),
                doi: doi || undefined,
                url: idUrl, // ArXiv URL
                venue: 'ArXiv Preprint',
                citationCount: 0, // ArXiv API doesn't provide citation counts
                source: 'arxiv' as const
            };
        });

        // Parse total results
        const options = xmlDoc.querySelector('opensearch\\:totalResults, totalResults');
        const total = options ? parseInt(options.textContent || '0') : papers.length;

        return {
            papers,
            total,
            query,
            source: 'arxiv'
        };
    } catch (error) {
        console.error('ArXiv search failed:', error);
        return { papers: [], total: 0, query, source: 'arxiv' };
    }
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

// ============================================
// TIER 3: QUALITY SCORING & VERIFICATION
// ============================================

/**
 * Score a paper's quality based on multiple factors
 * Returns score from 0.0 to 1.0
 */
export const scorePaperQuality = (paper: AcademicPaper): number => {
    let score = 0.0;

    // 1. DOI presence (0.2 points)
    if (paper.doi) {
        score += 0.2;
    }

    // 2. Citation count (0.3 points max)
    const citations = paper.citationCount || 0;
    if (citations >= 100) {
        score += 0.3;
    } else if (citations >= 50) {
        score += 0.25;
    } else if (citations >= 10) {
        score += 0.15;
    } else if (citations >= 1) {
        score += 0.05;
    }

    // 3. Venue quality (0.2 points)
    const venue = (paper.venue || '').toLowerCase();
    const topVenues = ['nature', 'science', 'ieee', 'acm', 'journal', 'conference', 'proceedings'];
    if (topVenues.some(v => venue.includes(v))) {
        score += 0.2;
    } else if (venue && venue !== 'arxiv preprint') {
        score += 0.1;
    }

    // 4. Recency (0.15 points)
    const currentYear = new Date().getFullYear();
    const age = currentYear - (paper.year || 0);
    if (age <= 2) {
        score += 0.15; // Very recent
    } else if (age <= 5) {
        score += 0.1;  // Recent
    } else if (age <= 10) {
        score += 0.05; // Somewhat recent
    }

    // 5. Abstract presence (0.1 points)
    if (paper.abstract && paper.abstract.length > 100) {
        score += 0.1;
    }

    // 6. Author presence (0.05 points)
    if (paper.authors && paper.authors.length > 0) {
        score += 0.05;
    }

    return Math.min(score, 1.0); // Cap at 1.0
};

/**
 * Filter and score papers, rejecting low-quality ones
 * Returns only papers that meet quality threshold
 */
export const filterAndScorePapers = (
    papers: AcademicPaper[],
    minQualityScore: number = 0.3
): ScoredPaper[] => {
    const scoredPapers: ScoredPaper[] = papers.map(paper => ({
        ...paper,
        qualityScore: scorePaperQuality(paper),
        verified: !!paper.doi // Considered verified if DOI exists
    }));

    // Filter by quality threshold
    const filtered = scoredPapers.filter(p => p.qualityScore >= minQualityScore);

    // Sort by quality score (descending)
    filtered.sort((a, b) => b.qualityScore - a.qualityScore);

    console.log(`Quality filter: ${filtered.length}/${papers.length} papers passed (threshold: ${minQualityScore})`);

    return filtered;
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

// ============================================
// TIER 4: ITERATIVE SEARCH REFINEMENT
// ============================================

/**
 * Search a single query across all sources
 * Internal helper for iterative search
 */
const searchSingleQuery = async (
    query: string,
    limitPerSource: number = 10
): Promise<AcademicPaper[]> => {
    const [semanticResult, openAlexResult, arxivResult] = await Promise.all([
        searchSemanticScholar(query, limitPerSource),
        searchOpenAlex(query, limitPerSource),
        searchArxiv(query, limitPerSource)
    ]);

    return [
        ...semanticResult.papers,
        ...openAlexResult.papers,
        ...arxivResult.papers
    ];
};

/**
 * TIER 4: Search all academic sources with ITERATIVE REFINEMENT
 * If initial search returns < minResults, automatically broadens query and retries
 */
export const searchAllAcademicSources = async (
    query: string,
    limitPerSource: number = 15,
    minResults: number = 20
): Promise<ScoredPaper[]> => {
    console.log(`[TIER 4] Starting iterative search for: "${query}"`);

    const seen = new Set<string>();
    const allPapers: AcademicPaper[] = [];

    const addPapers = (papers: AcademicPaper[]) => {
        for (const paper of papers) {
            const key = paper.doi || paper.title.toLowerCase().slice(0, 50);
            if (!seen.has(key)) {
                seen.add(key);
                allPapers.push(paper);
            }
        }
    };

    // ATTEMPT 1: Original query + decomposed variations
    const decomposedQueries = decomposeQuery(query);
    console.log(`[ATTEMPT 1] Searching ${decomposedQueries.length} query variations...`);

    for (const q of decomposedQueries.slice(0, 4)) { // First 4 variations
        const papers = await searchSingleQuery(q, Math.ceil(limitPerSource / 2));
        addPapers(papers);

        // Early exit if we have enough
        if (allPapers.length >= minResults * 2) {
            console.log(`[ATTEMPT 1] Found ${allPapers.length} papers - sufficient!`);
            break;
        }
    }

    // ATTEMPT 2: If still insufficient, try remaining decomposed queries
    if (allPapers.length < minResults) {
        console.log(`[ATTEMPT 2] Only ${allPapers.length} papers found. Trying more variations...`);

        for (const q of decomposedQueries.slice(4)) {
            const papers = await searchSingleQuery(q, limitPerSource);
            addPapers(papers);
        }
    }

    // ATTEMPT 3: If still insufficient, broaden to core concepts only
    if (allPapers.length < minResults) {
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        if (words.length >= 2) {
            const broadQuery = `${words[0]} ${words[1]}`;
            console.log(`[ATTEMPT 3] Broadening to core concepts: "${broadQuery}"`);

            const papers = await searchSingleQuery(broadQuery, limitPerSource);
            addPapers(papers);
        }
    }

    // ATTEMPT 4: Cross-domain search (traditional finance terms)
    if (allPapers.length < minResults) {
        console.log(`[ATTEMPT 4] Cross-domain search with finance terms...`);
        const financeQueries = [
            'market contagion systemic risk',
            'financial cascade deleveraging',
            'margin call crisis'
        ];

        for (const fq of financeQueries) {
            const papers = await searchSingleQuery(fq, 5);
            addPapers(papers);
        }
    }

    console.log(`[TIER 4] Total unique papers found: ${allPapers.length}`);

    // Apply quality scoring and filtering
    const scoredPapers = filterAndScorePapers(allPapers, 0.2);

    // Sort by quality score, then by citations
    scoredPapers.sort((a, b) => {
        const qualityDiff = b.qualityScore - a.qualityScore;
        if (Math.abs(qualityDiff) > 0.1) return qualityDiff;
        return (b.citationCount || 0) - (a.citationCount || 0);
    });

    console.log(`[TIER 4] After quality filter: ${scoredPapers.length} papers`);

    // Return top papers (cap at reasonable limit to avoid token overflow)
    return scoredPapers.slice(0, 60);
};

/**
 * Format all papers for inclusion in LLM prompt
 * Includes quality scores for transparency
 */
export const formatPapersForPrompt = (papers: (AcademicPaper | ScoredPaper)[]): string => {
    if (papers.length === 0) {
        return `⚠️ WARNING: No academic papers found for this query.
The search system attempted multiple query variations but could not locate relevant sources.
Please generate analysis based on general knowledge, but clearly mark any claims as "Unverified - No Source".`;
    }

    if (papers.length < 10) {
        console.warn(`[TIER 5 WARNING] Only ${papers.length} papers found - below recommended minimum of 20`);
    }

    const formatted = papers.map((paper, i) => {
        const scoredPaper = paper as ScoredPaper;
        const qualityBadge = scoredPaper.qualityScore !== undefined
            ? ` [Quality: ${(scoredPaper.qualityScore * 100).toFixed(0)}%]`
            : '';
        const verifiedBadge = scoredPaper.verified ? ' ✓' : '';

        return formatPaperForLLM(paper, i) + qualityBadge + verifiedBadge;
    });

    // Calculate statistics
    const withDoi = papers.filter(p => p.doi).length;
    const avgCitations = Math.round(papers.reduce((sum, p) => sum + (p.citationCount || 0), 0) / papers.length);

    return `## Verified Academic Sources (${papers.length} papers)
### Source Statistics: ${withDoi}/${papers.length} have DOI | Avg Citations: ${avgCitations}

${formatted.join('\n\n')}`;
};
