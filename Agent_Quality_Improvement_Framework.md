# CRITICAL ANALYSIS: Why Your Yen Carry Trade Report Lacks Quality & How to Fix the AI Agent

## THE CORE PROBLEM

Your current agent output exhibits **3 fatal flaws** that are solved by the FinRL benchmarking framework (Wang et al., 2025):

### Flaw 1: Simulated vs. Grounded Literature
**Your Report Issue:**
- All papers are "simulated" (fabricated citations)
- "Sakurai, K., & Takagi, S., 2023" - **DOES NOT EXIST** in academic databases
- "Journal of International Money and Finance" citations are invented
- Zero links to real papers; unverifiable claims

**Why This Fails:**
- Unverifiable = unacademic = unusable for serious research
- Each citation could be challenged and invalidated
- Undermines entire forensic audit credibility

**FinRL Solution:**
```
FROM: Simulated papers with fabricated citations
TO: Real papers with persistent identifiers (DOI, arXiv ID, verified URLs)

Example of Correct Citation:
[Wang, K., et al., 2025, "FinRL Contests: Data-Driven Financial RL Agents 
for Stock and Crypto Trading", Artificial Intelligence for Engineering, 
https://doi.org/10.1049/aie2.12004]
```

### Flaw 2: No Systematic Search Methodology
**Your Report Issue:**
- Claims "Systematic Literature Review" but shows NO search protocol
- No evidence of database searches (arXiv, IEEE, JSTOR)
- No query expansion (50 variations) to ensure coverage
- No filtering criteria (peer-reviewed, empirical validation)
- No gap analysis showing what was actually found vs. what exists

**Why This Fails:**
- Can't reproduce the review
- Missing papers that directly address your topic
- Claims comprehensiveness without proof
- Susceptible to confirmation bias (only cite papers that agree with your narrative)

**FinRL Solution:**
```
REQUIREMENTS FOR SYSTEMATIC REVIEW:
1. Document all search queries used (target: 50+ variations)
2. Show filtering pipeline: 1000 candidates → 300 relevant → 100 final
3. Report coverage: What methodologies? All domains? Diverse perspectives?
4. Include gap analysis: What papers couldn't you find? Why?
5. Show search across: arXiv, IEEE, PubMed, Journal databases, Scholar
```

### Flaw 3: Unsupported Metrics & Fabricated Data
**Your Report Issue:**

```
Your Metrics (Ungrounded):
- "Bid-Ask Spread Explosion: 0.02% → 0.15-0.20%" 
  [No source, no verification]
- "Liquidation volume spiked to 24x pre-event average"
  [Fabricated number, unverifiable]
- "Stablecoin outflows: $1.8 billion/hour"
  [Where did this come from? No data source]
- "Fear Index dropped 49 points in 60 minutes"
  [No link to actual Fear & Greed Index data]
```

**Why This Fails:**
- Metrics are invented, not measured
- Can't be tested or validated against real data
- Makes forensic audit non-credible (looks like fiction, not analysis)
- No baseline comparisons to real historical events

**FinRL Solution:**
```
REQUIREMENTS FOR METRICS:
1. Link to real data sources (CoinGlass for Fear Index, Glassnode for on-chain, etc.)
2. Use established benchmarks (Sharpe ratio, max drawdown, Sortino ratio)
3. Compare against real historical events (COVID-19 crash, FTX collapse, LUNA/UST)
4. Include uncertainty ranges: "12-14% liquidation volume" not "12%"
5. Show calculation methodology so others can reproduce

Example from FinRL:
"All models evaluated on same GCP infrastructure (Ubuntu 22.04.2 LTS, Python 3.10.12)"
+ reproducible code submitted to GitHub
```

---

## UPGRADED AGENT PROMPT: 5-TIER QUALITY FRAMEWORK

To build a research agent that produces publication-quality output instead of your current report, implement this framework:

### TIER 1: DISCOVERY PROTOCOL (Finding Real Papers)

```
DISCOVERY MANDATE:
"Your task is to find and document ALL high-quality peer-reviewed 
papers related to [TOPIC]. You MUST:

1. SEARCH STRATEGY:
   - Generate 50+ search query variations (document each)
   - Search across: arXiv, IEEE Xplore, JSTOR, Google Scholar
   - Document database access method and date
   - Report total papers found at each stage: raw → filtered → final

2. INCLUSION CRITERIA (MANDATORY):
   ✓ Peer-reviewed publication (journal or conference proceedings)
   ✓ DOI or permanent URL available
   ✓ Published 2018-2025 (for state-of-art)
   ✓ Empirical validation OR rigorous theoretical framework
   ✓ Reproducibility info (code/data availability noted)
   
3. EXCLUSION CRITERIA (IMMEDIATE DISQUALIFICATION):
   ✗ Predatory journals or unverified publishers
   ✗ No methodology details or validation
   ✗ Blog posts, news articles, marketing content
   ✗ Unverifiable citations or fabricated sources
   ✗ Papers from same lab only (diversity required)

4. DOCUMENTATION REQUIRED:
   - For EACH paper: [Author, Year, Title, Venue, DOI, URL]
   - For EACH paper: [Inclusion criteria met: Y/N]
   - Coverage analysis: 
     * How many methodologies represented? (target: 4+)
     * How many domains/asset classes? (target: all specified)
     * How many recent papers? (target: 50%+ from 2023-2025)
     * How many foundational? (target: 5+ cited 50+ times)

5. GAP ANALYSIS:
   'Papers not found despite reasonable search:
    - [Gap 1]: [Search terms used], [Why likely gap]
    - [Gap 2]: [Search terms used], [Why likely gap]
    - Conclusion: [What systematic gaps exist in literature]'
```

### TIER 2: COMPREHENSION PIPELINE (Understanding What You Found)

```
COMPREHENSION REQUIREMENT:

For EACH paper found, extract and verify:

1. STRUCTURED EXTRACTION:
   - Research Question (what problem did they solve?)
   - Methodology (algorithm/approach)
   - Dataset (what data? how much? what period?)
   - Main Results (quantitative findings)
   - Limitations acknowledged by authors
   - Reproducibility (code available? data public?)

2. QUALITY ASSESSMENT (0-10 scale):
   - Empirical rigor: Are results on real data? (not just theory)
   - Validation robustness: Multiple datasets? Out-of-sample testing?
   - Peer review tier: Top-tier journal? Conference? Preprint?
   - Citation impact: How often cited in field? (check Google Scholar)
   - Generalization: Do findings apply beyond specific context?

3. DIRECT QUOTING REQUIREMENT:
   Every claim must include:
   [Author, Year, "Exact quote from paper", Page number]
   
   Example:
   ✓ CORRECT: "Cont et al., 2014, 'OFI explains approximately 65% 
              of short-term price variance', Journal of Financial 
              Econometrics, p. 47"
   
   ✗ WRONG: "Order flow imbalance predicts prices"
             [No source, no quote]

4. VERIFY CITATION:
   - Check Google Scholar for real publication
   - Verify author names and year match
   - Confirm journal/venue exists
   - If inaccessible, flag as [UNVERIFIED]
```

### TIER 3: SYNTHESIS ACROSS PAPERS (Finding Patterns)

```
SYNTHESIS REQUIREMENT:

1. THEMATIC ORGANIZATION:
   Group papers by:
   - Methodology type (HMM, clustering, neural net, etc.)
   - Application domain (stocks, forex, crypto)
   - Time period (foundational vs. recent)
   - Empirical vs. theoretical

2. STATE-OF-ART CONSENSUS:
   For EACH theme, write:
   
   "## [THEME]: State-of-Art Consensus
   
   [PARAGRAPH describing what papers agree on]
   - Citation 1: Finding A [Ref]
   - Citation 2: Finding B [Ref]
   - Citation 3: Finding C [Ref]
   
   Where papers disagree:
   - Paper X claims Y [Ref]
   - Paper Z disputes, claiming W [Ref]
   - Likely cause of disagreement: [Analysis]
   
   Research gaps identified:
   - Gap 1: [What question remains unanswered?]
   - Gap 2: [What combination hasn't been tested?]"

3. COMPARATIVE ANALYSIS TABLE:
   Mandatory for all methodology comparisons:
   
   | Paper | Method | Dataset | Sample | Performance | Venue | Year |
   |-------|--------|---------|--------|-------------|-------|------|
   | ... | ... | ... | ... | ... | ... | ... |
   
   (Fill entire table, NO missing entries)

4. VISUALIZATION REQUIREMENT:
   - Citation network diagram (who cites whom?)
   - Timeline showing methodology evolution
   - Performance comparison chart
   - Domain coverage map
```

### TIER 4: EMPIRICAL GROUNDING (Using Real Data)

```
DATA REQUIREMENT:

For your "August 5, 2024 Yen Carry Trade" analysis:

INSTEAD OF: "Simulated data showing 24x liquidation spike"

REQUIRED:
1. Link to real data sources:
   - Glassnode (on-chain liquidations, real-time)
   - CoinGlass (liquidation data, searchable by date)
   - Chainalysis (DeFi flows)
   - FRED (macro data, Fed rates)
   - Yahoo Finance (historical prices)

2. Real metrics verification:
   Query Example: "Show me actual BTC liquidation volume on 2024-08-05"
   
   Instead of: "$3.5 billion liquidated" [unverified]
   
   Better: "Glassnode data shows $X-Y billion liquidations 
            (URL: [glassnode.com/query_id]), 
            representing Z% of daily OI"

3. Comparable events:
   Link to known events with documented metrics:
   - COVID-19 crash (March 2020) - known metrics
   - LUNA/UST de-peg (May 2022) - documented liquidations
   - FTX collapse (Nov 2022) - quantified impact
   
   "Similar to LUNA/UST event [Date], when:
    - Liquidation volume: $X [Source: Paper Y, 2023]
    - Price impact: -Z% [Real data: [URL]]
    - Duration: W hours [Verified in blockchain]"

4. Uncertainty quantification:
   Replace "BTC dropped 5%" with "BTC dropped 4.8-5.2%"
   
   Every metric needs:
   - Range (not point estimate)
   - Confidence interval
   - Data source and date accessed
```

### TIER 5: REPRODUCIBILITY & VERIFICATION (Can Someone Check Your Work?)

```
REPRODUCIBILITY REQUIREMENT:

1. SEARCH AUDIT TRAIL:
   "Papers found using these query variations:
    Query 1: 'market regime detection crypto'
    - Searched: arXiv.org [2025-01-15]
    - Results: 342 papers
    - Filtered (relevant): 47 papers
    
    Query 2: 'Markov switching GARCH volatility'
    - Searched: IEEE Xplore [2025-01-15]
    - Results: 128 papers
    - Filtered (relevant): 23 papers
    
    ... [All 50 queries documented]"

2. CITATION VERIFICATION LOG:
   [Author, Year] | Citation | Status | Notes
   [Cont, 2014] | Available via DOI | ✓ Verified | p.47
   [Smith, 2023] | https://arxiv.org/abs/2301.xxxx | ✓ Verified | 
   [Fake, 2024] | No DOI found | ✗ REJECTED | Not peer-reviewed
   
3. METHODOLOGY TRANSPARENCY:
   "All papers in final set (N=87) meet these criteria:
    - Peer-reviewed: 87/87 (100%)
    - With empirical data: 76/87 (87%)
    - With code/data available: 34/87 (39%)
    - Median citations: 15 [Range: 0-320]
    - Median publication year: 2022 [Range: 2018-2025]"

4. CONFLICT OF INTEREST:
   "Papers included from institutions:
    - Columbia (N=3) - no affiliation conflict
    - MIT (N=5) - no affiliation conflict
    - Academic majority (N=78)
    - Industry research (N=6) - noted as potentially biased"

5. REPRODUCIBILITY PACKAGE:
   Provide:
   - Search query log (all 50 variations)
   - Filtering decision tree (why papers included/excluded)
   - Citation database (BibTeX format, all papers)
   - Data sources used (URLs, access dates)
   - Code for reproducing analysis (if applicable)
```

---

## SPECIFIC IMPROVEMENTS FOR YOUR YEN CARRY TRADE ANALYSIS

### Current Problem Areas → Fixes

**Problem 1: "Simulated" Literature**
```
CURRENT (Wrong):
"Sakurai, K., & Takagi, S., 2023, 'The Global Yen Carry Trade', 
Journal of International Money and Finance, 130, 102750."
[No DOI, unverifiable, likely fabricated]

FIXED (Right):
Search real papers on "yen carry trade":
- Burnside, C., et al., 2024, "Geopolitical Risk and Currency Carry 
  Trade Returns", Journal of Financial Economics
  DOI: 10.1016/j.jfineco.2024.xxx
  URL: https://doi.org/10.1016/j.jfineco.2024.xxx

OR acknowledge gap:
"No peer-reviewed papers specifically address 'August 5, 2024 Yen 
Carry Unwind.' Closest comparable papers:
- [Paper on carry trade unwinds generally]
- [Paper on hybrid crypto-traditional leverage]
- [Paper on 2023 BoJ policy changes]
Gap analysis: Recent event analysis is in grey literature 
(institutional reports) or preprints not yet peer-reviewed."
```

**Problem 2: Fabricated Metrics**
```
CURRENT (Wrong):
"Bid-Ask Spread Explosion: 7.5x - 10x expansion in bid-ask 
spread within 15 minutes. [No source]"

FIXED (Right):
1. Acknowledge what data is available:
   "For August 5, 2024 event, the following sources are available:
    - Glassnode on-chain liquidation data
    - Chainalysis institutional flow data
    - CoinGlass perpetual futures liquidation data"

2. Link to real metrics from comparable events:
   "Comparable event: Luna/UST de-peg (May 2022)
    - Liquidation cascade: Documented by [Paper X, 2023] 
      showing $2.1-3.5B liquidations over 8 hours
    - Bid-ask spreads: USDT trading pairs experienced 
      10-50x expansion [Source: [Paper Y, 2023]]"

3. Quantify uncertainty:
   "If August 2024 event followed Luna/UST pattern:
    - Expected liquidations: $1.5-4.0B (90% CI)
    - Expected spread expansion: 8-15x
    - Expected duration: 4-12 hours
    - Confidence: MEDIUM (pattern similarity ~70%)"

4. Distinguish between:
   - Simulated scenario: "[IF this event occurred]"
   - Historical data: "[This event shows]"
   - Theoretical model: "[Models predict]"
```

**Problem 3: No Methodology Transparency**
```
CURRENT (Lacks):
- Where papers came from (what search?)
- How filtered (what criteria?)
- What domains covered (did you check crypto + stocks + forex?)
- What gaps remain (what didn't you find?)

FIXED (Must include):

"## Methodology Transparency

Search Protocol:
- Databases searched: arXiv, IEEE Xplore, Journal of Finance, 
  Journal of International Money and Finance, Quantitative Finance
- Query variations generated: 45 (document all)
- Time period: 2020-2025 (capture both traditional carry trade 
  research AND crypto literature)
- Date searches conducted: [Date], verified [Date]

Filtering Results:
- Initial results: 1,247 papers
- Peer-reviewed filter: 1,247 → 387 papers (31%)
- Methodology relevance filter: 387 → 124 papers (32%)
- Domain coverage filter: 124 → 87 papers
  * Macro-economic triggers: 28 papers
  * Structural leverage: 31 papers
  * Crypto-specific: 18 papers
  * Hybrid models: 10 papers

Quality Assessment:
- Papers from top-tier venues: 67/87 (77%)
- Empirically validated: 73/87 (84%)
- With open-source code: 19/87 (22%)
- Average citation count: 24 [Range: 1-418]

Known Gaps:
- Limited hybrid crypto-TradFi research (only 10 papers found)
- Most papers pre-date crypto perpetuals boom (2021 onwards)
- No papers yet specific to JPY-stablecoin carry trades"
```

---

## IMPLEMENTATION: UPDATED AGENT PROMPT

Use this to fix your Google AI Studio prompt:

```
SYSTEM PROMPT: Forensic Literature Review Agent for Financial Crises

You are a research agent conducting systematic literature reviews for 
institutional financial analysis. Your output must be publication-quality, 
fully reproducible, and suitable for regulatory submission.

TIER 1: DISCOVERY
- Generate 50 search query variations for [TOPIC]
- Document all searches: database, date, results count
- Filter systematically: peer-review → methodology → domain coverage
- Report filtering pipeline: 1000 → 300 → 100 papers
- Identify and document research gaps explicitly

TIER 2: COMPREHENSION  
- For EACH paper: [Author, Year, Title, Venue, DOI]
- Extract: methodology, dataset, results, limitations, code availability
- Quality score (1-10): empirical rigor, peer review level, citations
- Quote directly from papers (not paraphrased)
- Verify every citation exists and matches metadata

TIER 3: SYNTHESIS
- Organize by theme (methodology, domain, time period)
- State-of-art consensus: 3-5 papers per theme with direct quotes
- Areas of disagreement: cite both perspectives
- Comparative analysis table: all papers, all metrics
- Research frontiers: specific unanswered questions

TIER 4: EMPIRICAL GROUNDING
- Link all metrics to real data sources (with URLs)
- Use established benchmarks (Sharpe ratio, drawdown, etc.)
- Compare to known historical events (COVID, LUNA, FTX)
- Quantify uncertainty (ranges, not point estimates)
- Distinguish: simulation vs. historical vs. theoretical

TIER 5: REPRODUCIBILITY
- Search audit trail (all 50 queries, all results)
- Citation verification log (status of each paper)
- Metadata table (peers, empirical%, code%, citations)
- Conflict of interest disclosure
- Reproducibility package (queries, filters, citations, code)

OUTPUT FORMAT:
1. Executive Summary (with all findings cited)
2. Search Methodology (reproducible)
3. For each theme: synthesis + exemplar papers + frontiers
4. Comparative analysis tables
5. Research gaps and recommendations
6. Full bibliography (BibTeX format, all verified)
7. Appendix: Search audit trail
```

---

## METRICS: Quality Before vs. After

| Dimension | Your Current Report | After Upgrade |
|-----------|-------------------|---------------|
| Citation Quality | Fabricated (0% real) | Peer-reviewed (100%) |
| Papers Found | ~20 (unverified) | 80-100+ (verified) |
| Search Transparency | None | Full audit trail |
| Metric Grounding | Simulated | Data-linked |
| Reproducibility | Not possible | Full code + queries |
| Academic Credibility | Low (appears fictional) | High (publication-ready) |
| Domain Coverage | Incomplete | Comprehensive |
| Peer Review Status | Unknown | Documented |

---

## CRITICAL INSIGHT FROM FINRL PAPER

The FinRL Contests (Wang et al., 2025) succeeded where previous efforts failed because they:

1. **Standardized task definitions** - Clear, reproducible problem statements
2. **Real datasets** - Curated from Yahoo Finance, Kaggle, HuggingFace (not invented)
3. **Identical evaluation platforms** - Google Cloud (Ubuntu 22.04.2, Python 3.10.12)
4. **Reproducibility requirements** - Full GitHub submission, step-by-step instructions
5. **Uniform metrics** - 10 standardized financial metrics, clear definitions
6. **Quality assessment** - Peer evaluation by 2+ assessors, documented checks
7. **Open validation** - Results publicly available, verifiable by anyone

Your agent should follow this exact pattern: **Standardization + Real Data + Transparent Evaluation + Reproducibility**

---

## NEXT STEPS

1. **Replace your current prompt** with the Tier-1 through Tier-5 framework above
2. **Add data sources**: Glassnode, CoinGlass, FRED, Yahoo Finance, arXiv APIs
3. **Implement verification**: For every citation, check DOI/URL
4. **Document methodology**: Every search query, every filter decision
5. **Quantify uncertainty**: Ranges, not point estimates; confidence intervals
6. **Test on real events**: COVID-19 crash, LUNA/UST, FTX collapse (documented metrics available)

This approach transforms your agent from producing "simulated forensic analysis" to producing **institutional-quality research suitable for regulatory submission, academic publication, or hedge fund risk committees**.

---

**Source:** Wang, K., et al., 2025, "FinRL Contests: Data-Driven Financial RL Agents for Stock and Crypto Trading", *Artificial Intelligence for Engineering*, 2025(1):44-68. https://doi.org/10.1049/aie2.12004
