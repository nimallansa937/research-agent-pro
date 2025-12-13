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

// Default settings
export const DEFAULT_SETTINGS: AISettings = {
    primaryProvider: 'deepseek',
    secondaryProvider: undefined,
    dialecticalMode: false,
    providers: {
        gemini: {
            apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
            model: 'gemini-1.5-flash',
            enabled: false
        },
        deepseek: {
            apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-29275de38df64487b2fe1ec52a8895ae',
            model: 'deepseek-chat',
            enabled: true
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
            // Merge with defaults to handle any missing fields
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                providers: {
                    ...DEFAULT_SETTINGS.providers,
                    ...parsed.providers,
                },
            };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
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
        // Use local proxy request to avoid CORS
        // Endpoint: /api/gemini/v1beta/models/{model}:generateContent?key={apiKey}
        const endpoint = `/api/gemini/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: message }]
                    }]
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
        // Use local proxy request to avoid CORS
        const response = await fetch('/api/deepseek/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: message }],
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response generated.';
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
