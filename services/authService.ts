// Authentication Service
// Provides authentication methods using Firebase Auth

import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User,
    updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    createdAt: any;
    lastLoginAt: any;
}

/**
 * Create or update user profile in Firestore
 * Fails gracefully if Firestore is not available
 */
const createUserProfile = async (user: User): Promise<void> => {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // New user - create profile
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
            });
        } else {
            // Existing user - update last login
            await setDoc(userRef, {
                lastLoginAt: serverTimestamp(),
            }, { merge: true });
        }
    } catch (error) {
        // Log but don't throw - auth should still work without Firestore
        console.warn('Could not create/update user profile in Firestore:', error);
    }
};

/**
 * Sign in with Google popup
 */
export const signInWithGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfile(result.user);
    return result.user;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createUserProfile(result.user);
    return result.user;
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name if provided
    if (displayName) {
        await updateProfile(result.user, { displayName });
    }

    await createUserProfile(result.user);
    return result.user;
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
};

/**
 * Listen for auth state changes
 */
export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    return firebaseOnAuthStateChanged(auth, callback);
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
};
