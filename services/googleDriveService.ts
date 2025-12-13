// Google Drive Service
// Provides OAuth2 authentication and file operations for saving research results

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    createdTime: string;
    modifiedTime: string;
}

export interface DriveSettings {
    connected: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    userEmail: string | null;
    autoSave: boolean;
    folderId: string | null;
    folderName: string;
}

// Default settings
export const DEFAULT_DRIVE_SETTINGS: DriveSettings = {
    connected: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    userEmail: null,
    autoSave: false,
    folderId: null,
    folderName: 'Deep Research Results'
};

const STORAGE_KEY = 'researchAgent_driveSettings';

// Google OAuth Configuration
// These would typically come from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

/**
 * Load Drive settings from localStorage
 */
export const loadDriveSettings = (): DriveSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_DRIVE_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to load Drive settings:', error);
    }
    return DEFAULT_DRIVE_SETTINGS;
};

/**
 * Save Drive settings to localStorage
 */
export const saveDriveSettings = (settings: DriveSettings): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save Drive settings:', error);
    }
};

/**
 * Check if Google Drive is properly configured
 */
export const isDriveConfigured = (): boolean => {
    return !!GOOGLE_CLIENT_ID;
};

/**
 * Check if user is authenticated with valid token
 */
export const isAuthenticated = (): boolean => {
    const settings = loadDriveSettings();
    if (!settings.accessToken || !settings.expiresAt) return false;
    return settings.expiresAt > Date.now();
};

/**
 * Generate OAuth URL for authentication
 */
export const getAuthUrl = (): string => {
    const redirectUri = window.location.origin + '/__/auth/handler';
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: GOOGLE_SCOPES,
        prompt: 'consent'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Open OAuth popup for authentication
 */
export const authenticate = (): Promise<DriveSettings> => {
    return new Promise((resolve, reject) => {
        if (!isDriveConfigured()) {
            reject(new Error('Google Drive is not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment.'));
            return;
        }

        const authUrl = getAuthUrl();
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            authUrl,
            'Google Drive Auth',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
            reject(new Error('Failed to open authentication popup. Please allow popups.'));
            return;
        }

        // Poll for the access token in the URL hash
        const pollTimer = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(pollTimer);
                    reject(new Error('Authentication cancelled.'));
                    return;
                }

                const popupUrl = popup.location.href;
                if (popupUrl.includes('access_token=')) {
                    clearInterval(pollTimer);
                    popup.close();

                    // Parse the token from the URL hash
                    const hash = new URL(popupUrl).hash.substring(1);
                    const params = new URLSearchParams(hash);
                    const accessToken = params.get('access_token');
                    const expiresIn = parseInt(params.get('expires_in') || '3600', 10);

                    if (accessToken) {
                        // Get user info
                        fetchUserInfo(accessToken).then(userEmail => {
                            const settings: DriveSettings = {
                                ...loadDriveSettings(),
                                connected: true,
                                accessToken,
                                expiresAt: Date.now() + expiresIn * 1000,
                                userEmail
                            };
                            saveDriveSettings(settings);
                            resolve(settings);
                        }).catch(() => {
                            const settings: DriveSettings = {
                                ...loadDriveSettings(),
                                connected: true,
                                accessToken,
                                expiresAt: Date.now() + expiresIn * 1000
                            };
                            saveDriveSettings(settings);
                            resolve(settings);
                        });
                    } else {
                        reject(new Error('Failed to get access token.'));
                    }
                }
            } catch {
                // Cross-origin errors are expected while on Google's domain
            }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
            clearInterval(pollTimer);
            if (!popup.closed) popup.close();
            reject(new Error('Authentication timed out.'));
        }, 300000);
    });
};

/**
 * Fetch user info from Google
 */
const fetchUserInfo = async (accessToken: string): Promise<string> => {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error('Failed to fetch user info');
    const data = await response.json();
    return data.email;
};

/**
 * Disconnect from Google Drive
 */
export const disconnect = (): void => {
    const settings = loadDriveSettings();

    // Revoke the token if we have one
    if (settings.accessToken) {
        fetch(`https://oauth2.googleapis.com/revoke?token=${settings.accessToken}`, {
            method: 'POST'
        }).catch(() => { });
    }

    saveDriveSettings(DEFAULT_DRIVE_SETTINGS);
};

/**
 * Ensure the research folder exists, create if not
 */
const ensureFolder = async (accessToken: string, folderName: string): Promise<string> => {
    const settings = loadDriveSettings();

    // Return cached folder ID if we have one
    if (settings.folderId) {
        return settings.folderId;
    }

    // Search for existing folder
    const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!searchResponse.ok) throw new Error('Failed to search for folder');

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
        const folderId = searchData.files[0].id;
        saveDriveSettings({ ...settings, folderId });
        return folderId;
    }

    // Create the folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        })
    });

    if (!createResponse.ok) throw new Error('Failed to create folder');

    const createData = await createResponse.json();
    saveDriveSettings({ ...settings, folderId: createData.id });
    return createData.id;
};

/**
 * Save a file to Google Drive
 */
export const saveFileToDrive = async (
    content: string,
    filename: string,
    mimeType: 'text/markdown' | 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' = 'text/markdown'
): Promise<DriveFile> => {
    const settings = loadDriveSettings();

    if (!settings.accessToken) {
        throw new Error('Not authenticated with Google Drive');
    }

    // Ensure folder exists
    const folderId = await ensureFolder(settings.accessToken, settings.folderName);

    // Create the file metadata
    const metadata = {
        name: filename,
        mimeType,
        parents: [folderId]
    };

    // Create a multipart request
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n` +
        content +
        closeDelimiter;

    const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,modifiedTime',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${settings.accessToken}`,
                'Content-Type': `multipart/related; boundary="${boundary}"`
            },
            body: multipartBody
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload file: ${error}`);
    }

    return await response.json();
};

/**
 * List files in the research folder
 */
export const listResearchFiles = async (): Promise<DriveFile[]> => {
    const settings = loadDriveSettings();

    if (!settings.accessToken) {
        throw new Error('Not authenticated with Google Drive');
    }

    const folderId = await ensureFolder(settings.accessToken, settings.folderName);

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&orderBy=modifiedTime desc&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime)`,
        { headers: { Authorization: `Bearer ${settings.accessToken}` } }
    );

    if (!response.ok) {
        throw new Error('Failed to list files');
    }

    const data = await response.json();
    return data.files || [];
};

/**
 * Toggle auto-save setting
 */
export const setAutoSave = (enabled: boolean): void => {
    const settings = loadDriveSettings();
    saveDriveSettings({ ...settings, autoSave: enabled });
};
