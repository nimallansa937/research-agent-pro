// Prompt Enhancement Service
// Provides intelligent prompt enhancement with pilot survey for Deep Research

import { loadSettings, sendToProvider } from './aiProviders';

export interface PilotSource {
    title: string;
    snippet: string;
    relevance: string;
    keyTerms: string[];
}

export interface EnhancedPrompt {
    original: string;
    enhanced: string;
    pilotSources: PilotSource[];
    keyTerms: string[];
    suggestedMethodology: string;
    scope: {
        timeframe: string;
        domains: string[];
        depth: 'surface' | 'moderate' | 'deep';
    };
    wordCount: {
        original: number;
        enhanced: number;
    };
}

// Character threshold for triggering enhancement suggestion
export const ENHANCEMENT_THRESHOLD = 5000;

/**
 * Check if a prompt should trigger the enhancement suggestion
 */
export const shouldSuggestEnhancement = (prompt: string): boolean => {
    return prompt.trim().length < ENHANCEMENT_THRESHOLD;
};

/**
 * Run a pilot survey to find initial sources related to the prompt
 * This helps identify key themes, terminology, and scope for enhancement
 */
export const runPilotSurvey = async (prompt: string): Promise<PilotSource[]> => {
    const settings = loadSettings();

    const pilotPrompt = `You are conducting a preliminary literature survey for the following research topic:

"${prompt}"

TASK: Identify 10 highly relevant academic sources, papers, or authoritative resources that would be foundational for researching this topic.

For each source, provide:
1. Title (real or representative of what exists in literature)
2. A brief snippet describing its relevance (1-2 sentences)
3. Why it's relevant to the research question
4. 3-5 key terms or concepts from this source

FORMAT YOUR RESPONSE AS JSON:
{
  "sources": [
    {
      "title": "Source Title",
      "snippet": "Brief description of the source content and findings",
      "relevance": "Why this source is important for the research",
      "keyTerms": ["term1", "term2", "term3"]
    }
  ]
}

Return ONLY valid JSON, no additional text.`;

    try {
        const response = await sendToProvider(settings.primaryProvider, settings, pilotPrompt);

        // Parse the JSON response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.sources || [];
        }
        return [];
    } catch (error) {
        console.error('Pilot survey failed:', error);
        return [];
    }
};

/**
 * Enhance a research prompt based on pilot survey results
 * Creates a well-structured, comprehensive, and organized prompt
 */
export const enhancePrompt = async (
    originalPrompt: string,
    pilotSources: PilotSource[]
): Promise<EnhancedPrompt> => {
    const settings = loadSettings();

    // Extract all key terms from pilot sources
    const allKeyTerms = pilotSources.flatMap(s => s.keyTerms);
    const uniqueKeyTerms = [...new Set(allKeyTerms)];

    const enhancementPrompt = `You are an expert research methodology consultant. Your task is to enhance and expand a research prompt into a comprehensive, well-structured research brief.

ORIGINAL PROMPT:
"${originalPrompt}"

PILOT SURVEY FINDINGS (10 initial sources identified):
${pilotSources.map((s, i) => `${i + 1}. ${s.title}
   - ${s.snippet}
   - Relevance: ${s.relevance}
   - Key Terms: ${s.keyTerms.join(', ')}`).join('\n\n')}

KEY TERMS IDENTIFIED: ${uniqueKeyTerms.join(', ')}

TASK: Create an enhanced research prompt that is:
1. Well-structured with clear sections
2. Comprehensive in scope
3. Methodologically sound
4. Specific about desired outputs

The enhanced prompt should include:
- Clear research question(s)
- Scope definition (timeframe, domains, depth)
- Specific aspects to investigate
- Desired output format
- Quality criteria for sources

FORMAT YOUR RESPONSE AS JSON:
{
  "enhanced": "The full enhanced prompt text (can be multiple paragraphs)",
  "keyTerms": ["extracted", "key", "terms"],
  "suggestedMethodology": "Recommended research methodology approach",
  "scope": {
    "timeframe": "e.g., 2020-present, or all time",
    "domains": ["list", "of", "relevant", "academic", "domains"],
    "depth": "surface | moderate | deep"
  }
}

Return ONLY valid JSON, no additional text.`;

    try {
        const response = await sendToProvider(settings.primaryProvider, settings, enhancementPrompt);

        // Parse the JSON response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            return {
                original: originalPrompt,
                enhanced: parsed.enhanced || originalPrompt,
                pilotSources,
                keyTerms: parsed.keyTerms || uniqueKeyTerms,
                suggestedMethodology: parsed.suggestedMethodology || 'Systematic Literature Review',
                scope: parsed.scope || {
                    timeframe: 'Recent 5 years',
                    domains: ['General'],
                    depth: 'moderate'
                },
                wordCount: {
                    original: originalPrompt.split(/\s+/).length,
                    enhanced: (parsed.enhanced || originalPrompt).split(/\s+/).length
                }
            };
        }

        // Fallback if parsing fails
        return {
            original: originalPrompt,
            enhanced: originalPrompt,
            pilotSources,
            keyTerms: uniqueKeyTerms,
            suggestedMethodology: 'Systematic Literature Review',
            scope: {
                timeframe: 'Recent 5 years',
                domains: ['General'],
                depth: 'moderate'
            },
            wordCount: {
                original: originalPrompt.split(/\s+/).length,
                enhanced: originalPrompt.split(/\s+/).length
            }
        };
    } catch (error) {
        console.error('Prompt enhancement failed:', error);

        // Return original prompt with extracted terms if enhancement fails
        return {
            original: originalPrompt,
            enhanced: originalPrompt,
            pilotSources,
            keyTerms: uniqueKeyTerms,
            suggestedMethodology: 'Systematic Literature Review',
            scope: {
                timeframe: 'Recent 5 years',
                domains: ['General'],
                depth: 'moderate'
            },
            wordCount: {
                original: originalPrompt.split(/\s+/).length,
                enhanced: originalPrompt.split(/\s+/).length
            }
        };
    }
};

/**
 * Full enhancement flow: pilot survey + prompt enhancement
 */
export const runFullEnhancement = async (originalPrompt: string): Promise<EnhancedPrompt> => {
    // Step 1: Run pilot survey
    const pilotSources = await runPilotSurvey(originalPrompt);

    // Step 2: Enhance prompt based on pilot results
    const enhanced = await enhancePrompt(originalPrompt, pilotSources);

    return enhanced;
};
