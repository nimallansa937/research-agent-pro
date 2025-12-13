import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { Paper, SearchResult, SearchFilters } from '../types';

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const initializeGenAI = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const startChat = async () => {
  genAI = initializeGenAI();
  if (!genAI) throw new Error("API Key not found");

  const chat = genAI.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  chatSession = chat;
  return chat;
};

export const sendMessage = async (message: string): Promise<string> => {
  if (!chatSession) {
    await startChat();
  }

  if (!chatSession) throw new Error("Failed to initialize chat session");

  try {
    const result = await chatSession.sendMessage({
      message: message
    });
    return result.text || "No response generated.";
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

// Search papers using AI
export const searchPapers = async (query: string, filters?: SearchFilters): Promise<SearchResult> => {
  genAI = initializeGenAI();
  if (!genAI) throw new Error("API Key not found");

  try {
    const searchPrompt = `You are a research paper search assistant. The user is searching for: "${query}"

Filters applied:
- Year range: ${filters?.yearStart || 2020} to ${filters?.yearEnd || 2025}
- Sort by: ${filters?.sortBy || 'relevance'}

Provide a response in this exact JSON format:
{
  "aiSummary": "A 2-3 sentence summary of the research landscape for this query",
  "papers": [
    {
      "id": "unique_id",
      "title": "Paper Title",
      "authors": ["Author 1", "Author 2"],
      "year": 2024,
      "abstract": "Paper abstract (2-3 sentences)",
      "venue": "Journal or Conference Name",
      "doi": "10.xxxx/xxxxx",
      "citations": 50
    }
  ]
}

Return 5 realistic, plausible academic papers that would be relevant to this query. Make them sound like real academic papers with appropriate titles, venues, and abstracts.`;

    const chat = genAI.chats.create({
      model: "gemini-2.5-flash",
      config: {
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage({ message: searchPrompt });
    const responseText = result.text || '';

    // Try to parse JSON from response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          papers: parsed.papers || [],
          totalCount: (parsed.papers || []).length,
          query,
          filters: filters || {},
          aiSummary: parsed.aiSummary
        };
      }
    } catch (parseError) {
      console.error("Failed to parse search response:", parseError);
    }

    // Return empty result on parse failure
    return {
      papers: [],
      totalCount: 0,
      query,
      filters: filters || {},
      aiSummary: "Unable to generate search results. Please try again."
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// Generate deep research report
export const generateDeepResearch = async (topic: string, papers: Paper[]): Promise<string> => {
  genAI = initializeGenAI();
  if (!genAI) throw new Error("API Key not found");

  const paperContext = papers.map(p =>
    `- "${p.title}" by ${p.authors.join(', ')} (${p.year}): ${p.abstract}`
  ).join('\n');

  const prompt = `Generate a comprehensive research report on: "${topic}"

Based on these papers:
${paperContext}

Follow the 5-Tier Quality Framework:
1. Thematic synthesis across papers
2. State-of-art consensus identification
3. Areas of disagreement
4. Research gaps
5. Actionable recommendations

Format with clear sections and citations.`;

  const chat = genAI.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  const result = await chat.sendMessage({ message: prompt });
  return result.text || "Unable to generate report.";
};

// Extract data from papers for literature review
export const extractPaperData = async (paper: Paper, columns: string[]): Promise<Record<string, string>> => {
  genAI = initializeGenAI();
  if (!genAI) throw new Error("API Key not found");

  const prompt = `Analyze this research paper and extract the following information:

Paper: "${paper.title}" by ${paper.authors.join(', ')} (${paper.year})
Abstract: ${paper.abstract}

Extract for each category (be concise, 1-2 sentences max):
${columns.map(c => `- ${c}`).join('\n')}

Return as JSON object with column names as keys.`;

  try {
    const chat = genAI.chats.create({
      model: "gemini-2.5-flash",
      config: { temperature: 0.5 },
    });

    const result = await chat.sendMessage({ message: prompt });
    const responseText = result.text || '';

    // Try to parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Extraction error:", error);
  }

  // Return placeholder on failure
  const placeholder: Record<string, string> = {};
  columns.forEach(col => { placeholder[col] = '[Extraction failed]'; });
  return placeholder;
};

// AI writing assistance
export const generateSection = async (
  sectionType: string,
  title: string,
  context?: string
): Promise<string> => {
  genAI = initializeGenAI();
  if (!genAI) throw new Error("API Key not found");

  const prompt = `You are an academic writing assistant. Write a ${sectionType} section for a research paper.

Title: "${title}"
${context ? `Context: ${context}` : ''}

Write a well-structured, academic ${sectionType} section (2-3 paragraphs).
Include placeholder citations where appropriate using [Author, Year] format.`;

  const chat = genAI.chats.create({
    model: "gemini-2.5-flash",
    config: { temperature: 0.7 },
  });

  const result = await chat.sendMessage({ message: prompt });
  return result.text || "Unable to generate content.";
};