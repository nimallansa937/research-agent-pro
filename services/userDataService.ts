// User Data Service
// Manages user profile, settings, and preferences in Firestore

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as firebaseUpdateProfile, User } from 'firebase/auth';
import { db, auth } from './firebase';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string;
    photoURL: string | null;
    createdAt: any;
    lastLoginAt: any;
}

export interface NotificationSettings {
    emailOnComplete: boolean;
    emailDigest: boolean;
    inAppAlerts: boolean;
}

export interface UserSettings {
    notifications: NotificationSettings;
    theme: 'dark' | 'light' | 'system';
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    emailOnComplete: true,
    emailDigest: false,
    inAppAlerts: true,
};

const DEFAULT_USER_SETTINGS: UserSettings = {
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
    theme: 'dark',
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.warn('Could not fetch user profile:', error);
        return null;
    }
};

/**
 * Update user profile in Firestore and Firebase Auth
 */
export const updateUserProfile = async (
    uid: string,
    updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>
): Promise<void> => {
    try {
        // Update Firestore
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        // Update Firebase Auth profile
        const currentUser = auth.currentUser;
        if (currentUser) {
            await firebaseUpdateProfile(currentUser, {
                displayName: updates.displayName,
                photoURL: updates.photoURL,
            });
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
    }
};

/**
 * Get user settings from Firestore
 */
export const getUserSettings = async (uid: string): Promise<UserSettings> => {
    try {
        const settingsRef = doc(db, 'users', uid, 'settings', 'preferences');
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
            return { ...DEFAULT_USER_SETTINGS, ...settingsSnap.data() } as UserSettings;
        }
        return DEFAULT_USER_SETTINGS;
    } catch (error) {
        console.warn('Could not fetch user settings:', error);
        return DEFAULT_USER_SETTINGS;
    }
};

/**
 * Update user settings in Firestore
 */
export const updateUserSettings = async (
    uid: string,
    settings: Partial<UserSettings>
): Promise<void> => {
    try {
        const settingsRef = doc(db, 'users', uid, 'settings', 'preferences');
        await setDoc(settingsRef, {
            ...settings,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('Failed to update settings:', error);
        throw error;
    }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (
    uid: string,
    notifications: Partial<NotificationSettings>
): Promise<void> => {
    try {
        const settingsRef = doc(db, 'users', uid, 'settings', 'preferences');
        await setDoc(settingsRef, {
            notifications,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('Failed to update notification settings:', error);
        throw error;
    }
};
