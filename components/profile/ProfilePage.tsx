import React, { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Bell,
    Save,
    Loader2,
    CheckCircle,
    ArrowLeft,
    Camera
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getUserSettings,
    updateUserProfile,
    updateNotificationSettings,
    UserSettings,
    NotificationSettings
} from '../../services/userDataService';

const ProfilePage: React.FC = () => {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Profile state
    const [displayName, setDisplayName] = useState('');

    // Notification settings
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailOnComplete: true,
        emailDigest: false,
        inAppAlerts: true,
    });

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            // Set display name from auth
            setDisplayName(userProfile?.displayName || user.displayName || '');

            // Try to load settings from Firestore, fallback to localStorage
            try {
                const settings = await getUserSettings(user.uid);
                setNotifications(settings.notifications);
            } catch {
                // Fallback to localStorage
                const savedSettings = localStorage.getItem(`notifications_${user.uid}`);
                if (savedSettings) {
                    setNotifications(JSON.parse(savedSettings));
                }
            }
            setLoading(false);
        };

        loadData();
    }, [user, userProfile]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setError(null);
        try {
            // Update profile
            await updateUserProfile(user.uid, { displayName });

            // Update notification settings
            await updateNotificationSettings(user.uid, notifications);

            // Also save to localStorage as backup
            localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(notifications));

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err: any) {
            console.error('Failed to save:', err);
            // Save to localStorage even if Firestore fails
            localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(notifications));
            setError('Settings saved locally. Enable Firestore in Firebase Console for cloud sync.');
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                setError(null);
            }, 3000);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-ghost btn-icon"
                        title="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                        <p className="text-neutral-400 text-sm">Manage your account and preferences</p>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="card p-6">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-400" />
                        Profile Information
                    </h2>

                    <div className="space-y-4">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <button
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center hover:bg-neutral-700"
                                    title="Change profile photo"
                                >
                                    <Camera className="w-4 h-4 text-neutral-300" />
                                </button>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-400">Profile Photo</p>
                                <p className="text-xs text-neutral-500">Click to upload a new photo</p>
                            </div>
                        </div>

                        {/* Display Name */}
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-neutral-300 mb-1">
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                placeholder="Your name"
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                <input
                                    id="email"
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-400 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="card p-6">
                    <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-purple-400" />
                        Notification Settings
                    </h2>

                    <div className="space-y-4">
                        {/* Email on Complete */}
                        <label className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
                            <div>
                                <p className="text-sm font-medium text-white">Research Complete Email</p>
                                <p className="text-xs text-neutral-500">Get notified when research finishes</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.emailOnComplete}
                                onChange={(e) => setNotifications(prev => ({
                                    ...prev,
                                    emailOnComplete: e.target.checked
                                }))}
                                className="w-5 h-5 rounded border-neutral-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-neutral-900"
                            />
                        </label>

                        {/* Weekly Digest */}
                        <label className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
                            <div>
                                <p className="text-sm font-medium text-white">Weekly Digest</p>
                                <p className="text-xs text-neutral-500">Receive a weekly summary of your research</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.emailDigest}
                                onChange={(e) => setNotifications(prev => ({
                                    ...prev,
                                    emailDigest: e.target.checked
                                }))}
                                className="w-5 h-5 rounded border-neutral-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-neutral-900"
                            />
                        </label>

                        {/* In-App Alerts */}
                        <label className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
                            <div>
                                <p className="text-sm font-medium text-white">In-App Notifications</p>
                                <p className="text-xs text-neutral-500">Show notifications within the app</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.inAppAlerts}
                                onChange={(e) => setNotifications(prev => ({
                                    ...prev,
                                    inAppAlerts: e.target.checked
                                }))}
                                className="w-5 h-5 rounded border-neutral-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-neutral-900"
                            />
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`btn ${saved ? 'bg-green-500/20 border-green-500 text-green-400' : 'btn-primary bg-gradient-to-r from-purple-500 to-pink-500'} px-6`}
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saved ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
