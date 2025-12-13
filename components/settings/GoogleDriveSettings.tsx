import React, { useState, useEffect } from 'react';
import {
    Cloud,
    LogIn,
    LogOut,
    Loader2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    FolderOpen,
    Save,
    RefreshCw,
    ExternalLink,
    HardDrive
} from 'lucide-react';
import {
    DriveSettings,
    loadDriveSettings,
    saveDriveSettings,
    isDriveConfigured,
    isAuthenticated,
    authenticate,
    disconnect,
    listResearchFiles,
    DriveFile
} from '../../services/googleDriveService';

const GoogleDriveSettings: React.FC = () => {
    const [settings, setSettings] = useState<DriveSettings | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    useEffect(() => {
        setSettings(loadDriveSettings());
    }, []);

    useEffect(() => {
        if (settings?.connected && isAuthenticated()) {
            loadFiles();
        }
    }, [settings?.connected]);

    const loadFiles = async () => {
        setLoadingFiles(true);
        try {
            const driveFiles = await listResearchFiles();
            setFiles(driveFiles);
        } catch (err) {
            console.error('Failed to load files:', err);
        }
        setLoadingFiles(false);
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const newSettings = await authenticate();
            setSettings(newSettings);
        } catch (err: any) {
            setError(err.message || 'Failed to connect');
        }
        setIsConnecting(false);
    };

    const handleDisconnect = () => {
        disconnect();
        setSettings(loadDriveSettings());
        setFiles([]);
    };

    const handleAutoSaveToggle = (enabled: boolean) => {
        if (settings) {
            const newSettings = { ...settings, autoSave: enabled };
            setSettings(newSettings);
            saveDriveSettings(newSettings);
        }
    };

    const configured = isDriveConfigured();
    const authenticated = isAuthenticated();

    if (!settings) return null;

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                        <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Google Drive</h3>
                        <p className="text-white/70 text-xs">
                            {authenticated ? settings.userEmail || 'Connected' : 'Not connected'}
                        </p>
                    </div>
                </div>
                {authenticated && (
                    <CheckCircle className="w-5 h-5 text-white" />
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Not Configured Warning */}
                {!configured && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-300 text-sm font-medium">Configuration Required</p>
                            <p className="text-amber-400/70 text-xs mt-1">
                                Add <code className="bg-neutral-800 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to your
                                <code className="bg-neutral-800 px-1 rounded">.env.local</code> file to enable Google Drive integration.
                            </p>
                        </div>
                    </div>
                )}

                {/* Connection Status */}
                {configured && (
                    <>
                        {authenticated ? (
                            <div className="space-y-4">
                                {/* Auto-save toggle */}
                                <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Save className="w-4 h-4 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-white">Auto-save reports</p>
                                            <p className="text-xs text-neutral-500">
                                                Automatically save to Drive after research completes
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoSave}
                                            onChange={(e) => handleAutoSaveToggle(e.target.checked)}
                                            className="sr-only peer"
                                            aria-label="Toggle auto-save for research reports"
                                        />
                                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                    </label>
                                </div>

                                {/* Folder info */}
                                <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                                    <FolderOpen className="w-4 h-4 text-blue-400" />
                                    <div className="flex-1">
                                        <p className="text-sm text-white">Save folder</p>
                                        <p className="text-xs text-neutral-500">{settings.folderName}</p>
                                    </div>
                                </div>

                                {/* Recent files */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                                            <HardDrive className="w-4 h-4" />
                                            Recent Research Files
                                        </h4>
                                        <button
                                            onClick={loadFiles}
                                            disabled={loadingFiles}
                                            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                                            title="Refresh file list"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>
                                    </div>
                                    {loadingFiles ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                                        </div>
                                    ) : files.length > 0 ? (
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {files.slice(0, 5).map(file => (
                                                <a
                                                    key={file.id}
                                                    href={file.webViewLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-2 bg-neutral-800/30 rounded hover:bg-neutral-800/50 group"
                                                >
                                                    <span className="text-xs text-neutral-300 truncate">{file.name}</span>
                                                    <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-blue-400" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-neutral-500 py-2">No research files saved yet</p>
                                    )}
                                </div>

                                {/* Disconnect button */}
                                <button
                                    onClick={handleDisconnect}
                                    className="w-full btn btn-secondary text-red-400 border-red-500/30 hover:bg-red-500/10"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Disconnect Google Drive
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-neutral-400">
                                    Connect your Google Drive to automatically save research reports and access them from anywhere.
                                </p>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className="w-full btn btn-primary bg-gradient-to-r from-blue-500 to-cyan-500"
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-4 h-4" />
                                            Connect Google Drive
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GoogleDriveSettings;
