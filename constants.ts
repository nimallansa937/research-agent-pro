export const SYSTEM_INSTRUCTION = `
You are a Forensic Literature Review Agent for Financial Crises, following the FinRL-Enhanced quality framework. Your output must be publication-quality, fully reproducible, and suitable for regulatory submission.

Adhere strictly to this 5-TIER QUALITY FRAMEWORK:

TIER 1: DISCOVERY PROTOCOL
- Generate 50+ search query variations for the topic.
- Document all searches: database (arXiv, IEEE, JSTOR), date, results count.
- Implement a rigorous filtering pipeline: 1000 candidates → 300 peer-reviewed → 100 relevant.
- Explicitly identify and document research gaps.

TIER 2: COMPREHENSION PIPELINE
- For EACH paper: Extract [Author, Year, Title, Venue, DOI/URL].
- Verify every citation exists. If a paper is not found in real databases, DO NOT CITE IT.
- Extract: methodology, dataset, results, limitations, code availability.
- Quality Score (1-10): Evaluate empirical rigor, peer review tier, and reproducibility.
- Use DIRECT QUOTES for claims (e.g., "OFI explains ~65% of variance" [Cont, 2014, p.47]).

TIER 3: SYNTHESIS ENGINE
- Organize by THEME (Methodology, Domain), not chronologically.
- State-of-Art Consensus: What do 3-5 papers agree on?
- Disagreements: Cite conflicting perspectives.
- Comparative Analysis Table: Mandatory comparison of method, dataset, and performance.

TIER 4: EMPIRICAL GROUNDING
- Link all metrics to REAL DATA SOURCES (Glassnode, CoinGlass, FRED, St. Louis Fed).
- NEVER invent numbers. If data is unavailable, state "Data unavailable".
- Compare against historical events (COVID-19, LUNA/UST, FTX).
- Quantify uncertainty (use ranges/confidence intervals, e.g., "$1.5-4.0B liquidations").

TIER 5: REPRODUCIBILITY ENGINE
- Provide a Search Audit Trail (list of queries used).
- Provide a Citation Verification Log.
- Disclose conflicts of interest.
- Create a Reproducibility Package (queries, filters, citations, code).

OUTPUT FORMAT:
1. Executive Summary (with all findings cited)
2. Search Methodology (Audit Trail)
3. Thematic Synthesis (with Comparative Tables)
4. Empirical Grounding (Real Data Links)
5. Research Gaps & Recommendations
6. Full Bibliography (BibTeX format, verified DOIs)
7. Appendix: Search audit trail

CITATION & VERIFICATION RULES:
- Every factual claim MUST follow format: Claim [Citation].
- Citation format: [Author, Year, "Title", Journal/Conference]
- Never cite from descriptions: Always cite the original source.
- Flag uncertain claims as [NEEDS VERIFICATION].
- Do not fabricate citations. If a paper doesn't exist, don't invent it.
`;

export const ARCHITECTURE_DATA = [
  {
    id: 'discovery',
    title: 'Tier 1: Discovery Protocol',
    icon: 'Search',
    description: 'Systematic search with 50+ query variations and rigorous filtering.',
    details: [
      'Query Generation (50+ variations)',
      'Multi-Database Search (arXiv, IEEE, Scholar)',
      'Stage-by-Stage Filtering (Peer-review, Empirical)',
      'Gap Analysis identification'
    ]
  },
  {
    id: 'comprehension',
    title: 'Tier 2: Comprehension Pipeline',
    icon: 'BookOpen',
    description: 'Structured extraction and verification of every single paper.',
    details: [
      'DOI/URL Verification (No hallucinations)',
      'Structured Extraction (Method, Data, Results)',
      'Quality Scoring (1-10 Scale)',
      'Direct Quoting Requirement'
    ]
  },
  {
    id: 'synthesis',
    title: 'Tier 3: Synthesis Engine',
    icon: 'Cpu',
    description: 'Thematic organization and conflict resolution across sources.',
    details: [
      'Thematic Clustering (not chronological)',
      'Consensus & Disagreement Mapping',
      'Comparative Analysis Tables',
      'Research Frontier Identification'
    ]
  },
  {
    id: 'grounding',
    title: 'Tier 4: Empirical Grounding',
    icon: 'Database',
    description: 'Linking claims to real-world data and historical baselines.',
    details: [
      'Real Data Links (Glassnode, FRED, CoinGlass)',
      'Historical Event Comparison (LUNA, FTX)',
      'Uncertainty Quantification (Ranges)',
      'Simulation vs. Reality Distinction'
    ]
  },
  {
    id: 'reproducibility',
    title: 'Tier 5: Reproducibility Engine',
    icon: 'FileCheck',
    description: 'Ensuring the entire review process can be audited and repeated.',
    details: [
      'Search Audit Trail (Queries & Dates)',
      'Citation Verification Log',
      'Metadata Summary Tables',
      'Reproducibility Package Generation'
    ]
  }
];

export const GUIDE_CONTENT = [
  {
    title: "Executive Summary: The FinRL Standard",
    content: `Many AI research agents suffer from "hallucination" (inventing citations) and "simulation" (creating plausible but fake metrics). This upgraded ResearchAgent Pro implements the **FinRL Quality Framework** (Wang et al., 2025), transforming the output from simulated fiction to institutional-grade, reproducible research.`
  },
  {
    title: "Tier 1: Discovery Protocol",
    content: `Instead of a "black box" search, the agent must generate and document **50+ search query variations** across multiple databases (arXiv, IEEE Xplore, JSTOR). It applies a transparent filtering pipeline (e.g., 1000 raw papers → 300 peer-reviewed → 100 relevant), explicitly documenting what was excluded and why.`
  },
  {
    title: "Tier 2: Comprehension Pipeline",
    content: `Every citation is treated as a suspect until verified. The agent checks for **DOIs and persistent URLs**. It extracts structured data (Methodology, Dataset, Results) and assigns a Quality Score (0-10) based on empirical rigor. Claims are supported by **direct quotes** from the source text, not paraphrased interpretations.`
  },
  {
    title: "Tier 3: Synthesis Engine",
    content: `Findings are organized **thematically** (e.g., "Regime Detection Methods") rather than chronologically. The agent identifies the "State-of-Art Consensus" (where papers agree) and "Areas of Disagreement" (where they conflict). **Comparative Analysis Tables** are mandatory to visualize performance metrics across different studies.`
  },
  {
    title: "Tier 4: Empirical Grounding",
    content: `This is the antidote to hallucinated numbers. All metrics must be linked to **real data sources** (Glassnode for crypto, FRED for macro, CoinGlass for derivatives). The agent compares current events to historical baselines (e.g., "Similar to the LUNA/UST de-peg...") and quantifies uncertainty using ranges instead of point estimates.`
  },
  {
    title: "Tier 5: Reproducibility Engine",
    content: `To ensure scientific validity, the agent produces a **Reproducibility Package**. This includes a full **Search Audit Trail** (all queries used), a **Citation Verification Log**, and a Conflict of Interest disclosure. This allows any third party to audit the review process and verify the conclusions.`
  }
];
