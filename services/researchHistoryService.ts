// Research History Service
// Manages saving and retrieving research history from Firestore

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface ResearchPhase {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    output?: string;
}

export interface ResearchItem {
    id?: string;
    title: string;
    prompt: string;
    report: string;
    createdAt: Date | Timestamp;
    phases: ResearchPhase[];
    status: 'complete' | 'error';
}

/**
 * Save a completed research to Firestore
 */
export const saveResearch = async (
    userId: string,
    research: Omit<ResearchItem, 'id' | 'createdAt'>
): Promise<string> => {
    try {
        const historyRef = collection(db, 'users', userId, 'researchHistory');
        const docRef = await addDoc(historyRef, {
            ...research,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Failed to save research:', error);
        throw error;
    }
};

/**
 * Get all research history for a user
 */
export const getResearchHistory = async (
    userId: string,
    maxItems: number = 50
): Promise<ResearchItem[]> => {
    try {
        const historyRef = collection(db, 'users', userId, 'researchHistory');
        const q = query(historyRef, orderBy('createdAt', 'desc'), limit(maxItems));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                prompt: data.prompt,
                report: data.report,
                phases: data.phases || [],
                status: data.status,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as ResearchItem;
        });
    } catch (error) {
        console.warn('Could not fetch research history:', error);
        return [];
    }
};

/**
 * Get a single research item by ID
 */
export const getResearchById = async (
    userId: string,
    researchId: string
): Promise<ResearchItem | null> => {
    try {
        const docRef = doc(db, 'users', userId, 'researchHistory', researchId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                title: data.title,
                prompt: data.prompt,
                report: data.report,
                phases: data.phases || [],
                status: data.status,
                createdAt: data.createdAt?.toDate() || new Date(),
            } as ResearchItem;
        }
        return null;
    } catch (error) {
        console.warn('Could not fetch research:', error);
        return null;
    }
};

/**
 * Delete a research item
 */
export const deleteResearch = async (
    userId: string,
    researchId: string
): Promise<void> => {
    try {
        const docRef = doc(db, 'users', userId, 'researchHistory', researchId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Failed to delete research:', error);
        throw error;
    }
};

/**
 * Generate a title from a prompt
 */
export const generateTitleFromPrompt = (prompt: string): string => {
    // Take first line or first 50 characters
    const firstLine = prompt.split('\n')[0].trim();
    if (firstLine.length <= 50) {
        return firstLine;
    }
    return firstLine.substring(0, 47) + '...';
};
