// AI Provider Service - Unified interface for multiple AI APIs
// Supports: Gemini, DeepSeek, Claude, OpenAI

export type AIProvider = 'gemini' | 'deepseek' | 'claude' | 'openai';

export interface ProviderConfig {
    apiKey: string;
    model: string;
    enabled: boolean;
}

export interface AISettings {
    primaryProvider: AIProvider;
    secondaryProvider?: AIProvider;
    dialecticalMode: boolean;
    useGoogleDeepResearch: boolean;  // Use Google's official Deep Research API
    providers: Record<AIProvider, ProviderConfig>;
}

export interface AIResponse {
    content: string;
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
}

// Default models for each provider
export const DEFAULT_MODELS: Record<AIProvider, string[]> = {
    gemini: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    claude: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
};

// Provider display names
export const PROVIDER_NAMES: Record<AIProvider, string> = {
    gemini: 'Google Gemini',
    deepseek: 'DeepSeek',
    claude: 'Anthropic Claude',
    openai: 'OpenAI',
};

// Default settings - Use Gemini as primary (DeepSeek quota exhausted)
export const DEFAULT_SETTINGS: AISettings = {
    primaryProvider: 'gemini',  // Use Gemini as primary (reliable, no quota issues)
    secondaryProvider: undefined,  // Disable secondary to reduce API calls
    dialecticalMode: false,  // Disable to reduce API usage
    useGoogleDeepResearch: false,  // Disabled - Interactions API not available
    providers: {
        gemini: {
            apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
            model: 'gemini-2.0-flash',
            enabled: true
        },
        deepseek: {
            apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',  // Remove hardcoded key
            model: 'deepseek-chat',  // Use chat model (more quota-friendly)
            enabled: false  // Disabled by default due to quota issues
        },
        claude: { apiKey: '', model: 'claude-3-5-sonnet-20241022', enabled: false },
        openai: { apiKey: '', model: 'gpt-4o', enabled: false },
    },
};


// Storage key for settings
const SETTINGS_KEY = 'researchAgent_aiSettings';

// Save settings to localStorage
export const saveSettings = (settings: AISettings): void => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
};

// Load settings from localStorage
export const loadSettings = (): AISettings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Deep merge providers to preserve individual provider settings
            const mergedProviders = { ...DEFAULT_SETTINGS.providers };
            for (const provider of Object.keys(DEFAULT_SETTINGS.providers) as AIProvider[]) {
                mergedProviders[provider] = {
                    ...DEFAULT_SETTINGS.providers[provider],
                    ...(parsed.providers?.[provider] || {}),
                };
            }

            // Determine primary provider based on available API keys
            let primaryProvider: AIProvider = 'gemini';
            if (mergedProviders.gemini.apiKey) {
                primaryProvider = 'gemini';
            } else if (mergedProviders.deepseek.apiKey) {
                primaryProvider = 'deepseek';
            } else if (mergedProviders.openai.apiKey) {
                primaryProvider = 'openai';
            } else if (mergedProviders.claude.apiKey) {
                primaryProvider = 'claude';
            }

            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                providers: mergedProviders,
                // Force Gemini as primary if it has an API key, otherwise use what's available
                primaryProvider: primaryProvider,
                // Disable Google Deep Research - Interactions API not available
                useGoogleDeepResearch: false,
                // Disable dialectical mode to reduce API usage
                dialecticalMode: false,
                secondaryProvider: undefined,
            };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
};


// Helper to determine if we need CORS proxy (production only)
const isDevelopment = (): boolean => {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Wrap URL with CORS proxy for production
const withCorsProxy = (url: string): string => {
    if (isDevelopment()) {
        return url; // No proxy needed in development
    }
    // Use corsproxy.io for production
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
};

// Base interface for AI providers
interface IAIProvider {
    sendMessage(message: string): Promise<string>;
    testConnection(): Promise<boolean>;
}

// Gemini Provider
class GeminiProvider implements IAIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(message: string): Promise<string> {
        // Use v1 API (not v1beta) for newer models
        const baseUrl = `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${this.apiKey}`;
        const endpoint = withCorsProxy(baseUrl);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }]
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Gemini API Error details: Status=${response.status}, Endpoint=${endpoint}, Error=${errorText}`);
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        } catch (error) {
            console.error("Gemini Fetch Error:", error);
            throw error;
        }
    }

    // Send message with Google Search grounding enabled
    async sendMessageWithSearch(message: string): Promise<{ content: string; groundingMetadata?: any }> {
        // Use v1beta API for search grounding (required for tools)
        const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const endpoint = withCorsProxy(baseUrl);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }],
                    tools: [{ google_search: {} }]  // Enable search grounding
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Gemini Search API Error: Status=${response.status}, Error=${errorText}`);
                // Fall back to regular message if search grounding fails
                const fallback = await this.sendMessage(message);
                return { content: fallback };
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
            const groundingMetadata = data.candidates?.[0]?.groundingMetadata;

            return { content, groundingMetadata };
        } catch (error) {
            console.error("Gemini Search Fetch Error:", error);
            // Fall back to regular message
            const fallback = await this.sendMessage(message);
            return { content: fallback };
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.sendMessage('Hello, respond with "OK"');
            return true;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
}

// DeepSeek Provider
class DeepSeekProvider implements IAIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(message: string): Promise<string> {
        // Use direct API URL with CORS proxy for production
        const baseUrl = 'https://api.deepseek.com/chat/completions';
        const endpoint = withCorsProxy(baseUrl);

        // Try with current model first
        let modelToUse = this.model;
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: modelToUse,
                        messages: [{ role: 'user', content: message }],
                        stream: false,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();

                    // Check for quota/rate limit errors
                    const isQuotaError = errorText.toLowerCase().includes('quota') ||
                        errorText.toLowerCase().includes('rate limit') ||
                        errorText.toLowerCase().includes('insufficient') ||
                        response.status === 429 ||
                        response.status === 402;

                    // If using deepseek-reasoner and hit quota, fallback to deepseek-chat
                    if (isQuotaError && modelToUse === 'deepseek-reasoner' && attempts === 0) {
                        console.warn('DeepSeek Reasoner quota exceeded, falling back to deepseek-chat');
                        modelToUse = 'deepseek-chat';
                        attempts++;
                        continue;
                    }

                    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                return data.choices?.[0]?.message?.content || 'No response generated.';
            } catch (error) {
                if (attempts === 0 && modelToUse === 'deepseek-reasoner') {
                    // Try with fallback model
                    console.warn('DeepSeek Reasoner failed, falling back to deepseek-chat:', error);
                    modelToUse = 'deepseek-chat';
                    attempts++;
                    continue;
                }
                throw error;
            }
        }

        throw new Error('DeepSeek: Max retry attempts exceeded');
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.sendMessage('Hello, respond with "OK"');
            return true;
        } catch (error) {
            console.error('DeepSeek connection test failed:', error);
            return false;

        }
    }
}

// Claude Provider
class ClaudeProvider implements IAIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(message: string): Promise<string> {
        // Use local proxy request to avoid CORS
        const response = await fetch('/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 8192,
                messages: [{ role: 'user', content: message }],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || 'No response generated.';
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.sendMessage('Hello, respond with "OK"');
            return true;
        } catch (error) {
            console.error('Claude connection test failed:', error);
            return false;
        }
    }
}

// OpenAI Provider
class OpenAIProvider implements IAIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async sendMessage(message: string): Promise<string> {
        // Use local proxy request to avoid CORS
        const response = await fetch('/api/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: message }],
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response generated.';
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.sendMessage('Hello, respond with "OK"');
            return true;
        } catch {
            return false;
        }
    }
}

// Factory function to create provider instance
export const createProvider = (provider: AIProvider, config: ProviderConfig): IAIProvider => {
    switch (provider) {
        case 'gemini':
            return new GeminiProvider(config.apiKey, config.model);
        case 'deepseek':
            return new DeepSeekProvider(config.apiKey, config.model);
        case 'claude':
            return new ClaudeProvider(config.apiKey, config.model);
        case 'openai':
            return new OpenAIProvider(config.apiKey, config.model);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
};

// Send message using specific provider
export const sendToProvider = async (
    provider: AIProvider,
    settings: AISettings,
    message: string
): Promise<AIResponse> => {
    const config = settings.providers[provider];
    if (!config.apiKey) {
        throw new Error(`No API key configured for ${PROVIDER_NAMES[provider]}`);
    }

    const providerInstance = createProvider(provider, config);
    const content = await providerInstance.sendMessage(message);

    return {
        content,
        provider,
        model: config.model,
    };
};

// Send message to Gemini with Google Search grounding
export const sendToGeminiWithSearch = async (
    settings: AISettings,
    message: string
): Promise<{ content: string; groundingMetadata?: any }> => {
    const config = settings.providers.gemini;
    if (!config.apiKey) {
        throw new Error('No API key configured for Google Gemini');
    }

    const provider = new GeminiProvider(config.apiKey, config.model);
    return await provider.sendMessageWithSearch(message);
};

// Dialectical analysis - two models cross-validating
export const runDialecticalAnalysis = async (
    settings: AISettings,
    prompt: string,
    previousOutputs: string[] = []
): Promise<{ primary: AIResponse; secondary: AIResponse; synthesis: string }> => {
    const { primaryProvider, secondaryProvider } = settings;

    if (!secondaryProvider) {
        throw new Error('Dialectical mode requires two providers');
    }

    // Step 1: Both models analyze the prompt
    const [primaryResponse, secondaryResponse] = await Promise.all([
        sendToProvider(primaryProvider, settings, `${prompt}\n\nPrevious context:\n${previousOutputs.join('\n\n')}`),
        sendToProvider(secondaryProvider, settings, `${prompt}\n\nPrevious context:\n${previousOutputs.join('\n\n')}`),
    ]);

    // Step 2: Cross-validation - each model reviews the other's output
    const crossValidationPrompt = (otherOutput: string, otherModel: string) =>
        `Review and critique this analysis from ${otherModel}. Identify strengths, weaknesses, missing points, and alternative perspectives:\n\n${otherOutput}`;

    const [primaryReview, secondaryReview] = await Promise.all([
        sendToProvider(primaryProvider, settings, crossValidationPrompt(secondaryResponse.content, PROVIDER_NAMES[secondaryProvider])),
        sendToProvider(secondaryProvider, settings, crossValidationPrompt(primaryResponse.content, PROVIDER_NAMES[primaryProvider])),
    ]);

    // Step 3: Final synthesis by primary model
    const synthesisPrompt = `You have received analyses from two AI models and their cross-reviews.

ORIGINAL PROMPT: ${prompt}

MODEL A (${PROVIDER_NAMES[primaryProvider]}) ANALYSIS:
${primaryResponse.content}

MODEL B (${PROVIDER_NAMES[secondaryProvider]}) ANALYSIS:
${secondaryResponse.content}

MODEL A's REVIEW OF MODEL B:
${primaryReview.content}

MODEL B's REVIEW OF MODEL A:
${secondaryReview.content}

TASK: Synthesize both analyses, incorporating the cross-validation feedback. Create a comprehensive, balanced analysis that:
1. Combines the strongest elements from both models
2. Resolves any contradictions
3. Addresses gaps identified by each model
4. Provides a unified, authoritative conclusion

Format as a professional research output.`;

    const synthesisResponse = await sendToProvider(primaryProvider, settings, synthesisPrompt);

    return {
        primary: primaryResponse,
        secondary: secondaryResponse,
        synthesis: synthesisResponse.content,
    };
};

// Test provider connection
export const testProviderConnection = async (
    provider: AIProvider,
    apiKey: string,
    model: string
): Promise<boolean> => {
    try {
        const providerInstance = createProvider(provider, { apiKey, model, enabled: true });
        return await providerInstance.testConnection();
    } catch (error) {
        console.error(`Connection test failed for ${provider}:`, error);
        return false;
    }
};
