/**
 * Google Deep Research API Service
 * Uses Google's official Interactions API with the deep-research-pro-preview-12-2025 agent
 * Documentation: https://ai.google.dev/gemini-api/docs/interactions
 */

export interface DeepResearchStatus {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    outputs?: string[];
    error?: string;
}

export interface DeepResearchResult {
    success: boolean;
    report?: string;
    error?: string;
    interactionId?: string;
}

// Check if environment is development
const isDevelopment = (): boolean => {
    try {
        return import.meta.env?.DEV === true || window.location.hostname === 'localhost';
    } catch {
        return false;
    }
};

// CORS proxy for production
const withCorsProxy = (url: string): string => {
    if (isDevelopment()) {
        return url;
    }
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
};

/**
 * Start a deep research task using Google's Interactions API
 */
export const startGoogleDeepResearch = async (
    apiKey: string,
    query: string
): Promise<{ interactionId: string } | { error: string }> => {
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/interactions';
    const endpoint = withCorsProxy(`${baseUrl}?key=${apiKey}`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: query,
                agent: 'deep-research-pro-preview-12-2025',
                background: true
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.error?.message || `API Error: ${response.status} ${response.statusText}`
            };
        }

        const data = await response.json();
        return { interactionId: data.name || data.id };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Failed to start deep research'
        };
    }
};

/**
 * Get the status of a deep research task
 */
export const getGoogleDeepResearchStatus = async (
    apiKey: string,
    interactionId: string
): Promise<DeepResearchStatus> => {
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/${interactionId}`;
    const endpoint = withCorsProxy(`${baseUrl}?key=${apiKey}`);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return {
                id: interactionId,
                status: 'failed',
                error: `API Error: ${response.status}`
            };
        }

        const data = await response.json();

        // Map API status to our status
        let status: DeepResearchStatus['status'] = 'pending';
        if (data.done === true) {
            status = data.error ? 'failed' : 'completed';
        } else if (data.metadata?.state === 'RUNNING') {
            status = 'running';
        }

        // Extract outputs
        const outputs: string[] = [];
        if (data.response?.outputs) {
            for (const output of data.response.outputs) {
                if (output.text) {
                    outputs.push(output.text);
                }
            }
        }

        return {
            id: interactionId,
            status,
            progress: data.metadata?.progress || undefined,
            outputs,
            error: data.error?.message
        };
    } catch (error) {
        return {
            id: interactionId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Failed to get status'
        };
    }
};

/**
 * Run Google Deep Research and poll for completion
 * Returns the final report when done
 */
export const runGoogleDeepResearch = async (
    apiKey: string,
    query: string,
    onStatusUpdate?: (status: DeepResearchStatus) => void,
    pollIntervalMs: number = 5000,
    maxWaitMs: number = 600000 // 10 minutes max
): Promise<DeepResearchResult> => {
    // Start the research
    const startResult = await startGoogleDeepResearch(apiKey, query);

    if ('error' in startResult) {
        return { success: false, error: startResult.error };
    }

    const interactionId = startResult.interactionId;
    const startTime = Date.now();

    // Poll for completion
    while (Date.now() - startTime < maxWaitMs) {
        const status = await getGoogleDeepResearchStatus(apiKey, interactionId);

        if (onStatusUpdate) {
            onStatusUpdate(status);
        }

        if (status.status === 'completed') {
            const report = status.outputs?.join('\n\n') || '';
            return {
                success: true,
                report,
                interactionId
            };
        }

        if (status.status === 'failed' || status.status === 'cancelled') {
            return {
                success: false,
                error: status.error || `Research ${status.status}`,
                interactionId
            };
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    return {
        success: false,
        error: 'Research timed out after ' + (maxWaitMs / 60000) + ' minutes',
        interactionId
    };
};

/**
 * Check if Google Deep Research API is available
 */
export const testGoogleDeepResearchConnection = async (apiKey: string): Promise<boolean> => {
    try {
        // Try a simple API call to verify the key works
        const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        const endpoint = withCorsProxy(`${baseUrl}?key=${apiKey}`);

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.ok;
    } catch {
        return false;
    }
};
