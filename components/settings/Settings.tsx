import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Key,
    CheckCircle,
    XCircle,
    Loader2,
    Save,
    RefreshCw,
    Sparkles,
    Bot,
    Cpu,
    Brain
} from 'lucide-react';
import {
    AIProvider,
    AISettings,
    PROVIDER_NAMES,
    DEFAULT_MODELS,
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
    testProviderConnection,
} from '../../services/aiProviders';
import GoogleDriveSettings from './GoogleDriveSettings';

const PROVIDER_ICONS: Record<AIProvider, React.ReactNode> = {
    gemini: <Sparkles className="w-5 h-5" />,
    deepseek: <Brain className="w-5 h-5" />,
    claude: <Bot className="w-5 h-5" />,
    openai: <Cpu className="w-5 h-5" />,
};

const PROVIDER_COLORS: Record<AIProvider, string> = {
    gemini: 'from-blue-500 to-purple-500',
    deepseek: 'from-emerald-500 to-teal-500',
    claude: 'from-orange-500 to-amber-500',
    openai: 'from-green-500 to-emerald-500',
};

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
    const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);
    const [testResults, setTestResults] = useState<Record<AIProvider, boolean | null>>({
        gemini: null,
        deepseek: null,
        claude: null,
        openai: null,
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const loaded = loadSettings();
        setSettings(loaded);
    }, []);

    const handleApiKeyChange = (provider: AIProvider, apiKey: string) => {
        setSettings(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                [provider]: { ...prev.providers[provider], apiKey },
            },
        }));
        setTestResults(prev => ({ ...prev, [provider]: null }));
    };

    const handleModelChange = (provider: AIProvider, model: string) => {
        setSettings(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                [provider]: { ...prev.providers[provider], model },
            },
        }));
    };

    const handleEnabledChange = (provider: AIProvider, enabled: boolean) => {
        setSettings(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                [provider]: { ...prev.providers[provider], enabled },
            },
        }));
    };

    const handlePrimaryProviderChange = (provider: AIProvider) => {
        setSettings(prev => ({ ...prev, primaryProvider: provider }));
    };

    const handleSecondaryProviderChange = (provider: AIProvider | '') => {
        setSettings(prev => ({
            ...prev,
            secondaryProvider: provider || undefined,
            dialecticalMode: !!provider,
        }));
    };

    const testConnection = async (provider: AIProvider) => {
        const config = settings.providers[provider];
        if (!config.apiKey) return;

        setTestingProvider(provider);
        try {
            const result = await testProviderConnection(provider, config.apiKey, config.model);
            setTestResults(prev => ({ ...prev, [provider]: result }));
        } catch {
            setTestResults(prev => ({ ...prev, [provider]: false }));
        }
        setTestingProvider(null);
    };

    const handleSave = () => {
        saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const enabledProviders = (Object.keys(settings.providers) as AIProvider[]).filter(
        p => settings.providers[p].enabled && settings.providers[p].apiKey
    );

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">AI Provider Settings</h1>
                        <p className="text-neutral-400 text-sm">Configure API keys for multiple AI providers</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className={`btn ${saved ? 'btn-secondary bg-green-500/20 border-green-500' : 'btn-primary'}`}
                >
                    {saved ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(['gemini', 'deepseek'] as AIProvider[]).map((provider) => {
                    const config = settings.providers[provider];
                    const testResult = testResults[provider];

                    return (
                        <div key={provider} className="card overflow-hidden">
                            {/* Provider Header */}
                            <div className={`p-4 bg-gradient-to-r ${PROVIDER_COLORS[provider]} flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                        {PROVIDER_ICONS[provider]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{PROVIDER_NAMES[provider]}</h3>
                                        <p className="text-white/70 text-xs">{config.model}</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-white/70 text-sm">Enabled</span>
                                    <input
                                        type="checkbox"
                                        checked={config.enabled}
                                        onChange={(e) => handleEnabledChange(provider, e.target.checked)}
                                        className="w-5 h-5 rounded accent-white"
                                    />
                                </label>
                            </div>

                            {/* Provider Config */}
                            <div className="p-4 space-y-4">
                                {/* API Key */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                                        <Key className="w-4 h-4 inline mr-2" />
                                        API Key
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={config.apiKey}
                                            onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                                            placeholder={`Enter ${PROVIDER_NAMES[provider]} API key`}
                                            className="flex-1 input"
                                        />
                                        <button
                                            onClick={() => testConnection(provider)}
                                            disabled={!config.apiKey || testingProvider === provider}
                                            className="btn btn-secondary"
                                            title="Test Connection"
                                        >
                                            {testingProvider === provider ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : testResult === true ? (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            ) : testResult === false ? (
                                                <XCircle className="w-4 h-4 text-red-400" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    {testResult === true && (
                                        <p className="text-green-400 text-xs mt-1">✓ Connection successful</p>
                                    )}
                                    {testResult === false && (
                                        <p className="text-red-400 text-xs mt-1">✗ Connection failed - check API key</p>
                                    )}
                                </div>

                                {/* Model Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Model</label>
                                    <select
                                        value={config.model}
                                        onChange={(e) => handleModelChange(provider, e.target.value)}
                                        className="w-full input"
                                        title={`Select ${PROVIDER_NAMES[provider]} model`}
                                    >
                                        {DEFAULT_MODELS[provider].map((model) => (
                                            <option key={model} value={model}>
                                                {model}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Google Deep Research API */}
            <div className="card p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    Google Deep Research API
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Preview</span>
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                    Use Google's official Deep Research Agent (deep-research-pro-preview-12-2025) for research tasks.
                    This replaces the multi-phase approach with Google's dedicated research model.
                </p>

                <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
                    <div>
                        <p className="text-white font-medium">Enable Google Deep Research</p>
                        <p className="text-neutral-400 text-sm">Requires Gemini API key with Interactions API access</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.useGoogleDeepResearch}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                useGoogleDeepResearch: e.target.checked
                            }))}
                            disabled={!settings.providers.gemini.apiKey}
                            className="sr-only peer"
                            title="Enable Google Deep Research"
                        />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                    </label>
                </div>

                {settings.useGoogleDeepResearch && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-300 text-sm">
                            ✓ Google Deep Research is enabled. Research tasks will use the official Google research agent.
                        </p>
                    </div>
                )}

                {!settings.providers.gemini.apiKey && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-300 text-sm">
                            ⚠ Configure your Gemini API key above to use Google Deep Research.
                        </p>
                    </div>
                )}
            </div>

            {/* Dialectical Mode Settings */}
            <div className="card p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Dialectical Analysis Mode
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                    Enable two-model cross-validation where both AI models analyze and critique each other's output,
                    then synthesize a combined result.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primary Provider */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Primary Model</label>
                        <select
                            value={settings.primaryProvider}
                            onChange={(e) => handlePrimaryProviderChange(e.target.value as AIProvider)}
                            className="w-full input"
                            title="Select primary AI model"
                        >
                            {enabledProviders.map((provider) => (
                                <option key={provider} value={provider}>
                                    {PROVIDER_NAMES[provider]}
                                </option>
                            ))}
                            {enabledProviders.length === 0 && (
                                <option value="">No providers configured</option>
                            )}
                        </select>
                    </div>

                    {/* Secondary Provider */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Secondary Model (Optional)</label>
                        <select
                            value={settings.secondaryProvider || ''}
                            onChange={(e) => handleSecondaryProviderChange(e.target.value as AIProvider | '')}
                            className="w-full input"
                            title="Select secondary AI model for dialectical analysis"
                        >
                            <option value="">Disabled</option>
                            {enabledProviders
                                .filter((p) => p !== settings.primaryProvider)
                                .map((provider) => (
                                    <option key={provider} value={provider}>
                                        {PROVIDER_NAMES[provider]}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div className="flex items-end">
                        <div className={`w-full p-3 rounded-xl border ${settings.dialecticalMode
                            ? 'bg-purple-500/10 border-purple-500'
                            : 'bg-neutral-800 border-neutral-700'
                            }`}>
                            <p className={`text-sm font-medium ${settings.dialecticalMode ? 'text-purple-300' : 'text-neutral-400'}`}>
                                {settings.dialecticalMode ? '✓ Dialectical Mode Active' : 'Single Model Mode'}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                {settings.dialecticalMode
                                    ? 'Two models will cross-validate each other'
                                    : 'Select a secondary model to enable'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="card p-4 bg-blue-500/10 border-blue-500/30">
                <h4 className="font-medium text-blue-300 mb-2">💡 How Dialectical Analysis Works</h4>
                <ol className="text-sm text-neutral-400 space-y-1 list-decimal list-inside">
                    <li>Both AI models analyze the research topic independently</li>
                    <li>Each model reviews and critiques the other's output</li>
                    <li>The primary model synthesizes both analyses into a unified result</li>
                    <li>This approach reduces blind spots and increases research quality</li>
                </ol>
            </div>

            {/* Cloud Storage Section */}
            <div>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    ☁️ Cloud Storage
                </h3>
                <GoogleDriveSettings />
            </div>
        </div>
    );
};

export default Settings;
