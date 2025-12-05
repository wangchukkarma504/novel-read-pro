import { db, auth } from './firebase';
import { 
  ref, set, remove, update, onValue, off, push, child 
} from 'firebase/database';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { Novel, ReaderSettings } from '../types';

const DEFAULT_SETTINGS: ReaderSettings = {
  themeMode: 'dark',
  fontSize: 18,
  lineHeight: 1.6,
  fontFamily: 'Georgia, serif',
  backgroundColor: '#1a1a1a',
  textColor: '#e5e5e5',
};

let currentUser: User | null = null;
let novelsRef: any = null;
let settingsRef: any = null;

export const initializeAuth = (
    onUserAvailable: (user: User) => void, 
    onLoading: (isLoading: boolean) => void,
    onError: (errorMessage: string) => void
) => {
    onLoading(true);
    // Persist login across refreshes
    const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            onUserAvailable(user);
            onLoading(false);
        } else {
            // Sign in anonymously if no user exists
            try {
                await signInAnonymously(auth);
            } catch (error: any) {
                console.error("Auth Error", error);
                let msg = "Authentication failed. Please check your internet connection.";
                
                if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
                    msg = "Access Denied: Anonymous Authentication is disabled. Go to Firebase Console > Build > Authentication > Sign-in method and enable 'Anonymous'.";
                } else if (error.message) {
                    msg = error.message;
                }
                
                onError(msg);
                onLoading(false);
            }
        }
    });
    return unsub;
};

// --- Novels ---

export const subscribeToNovels = (
    callback: (novels: Novel[]) => void,
    onError?: (error: any) => void
) => {
    if (!currentUser) return () => {};

    novelsRef = ref(db, `users/${currentUser.uid}/novels`);
    
    const unsubscribe = onValue(novelsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            callback([]);
            return;
        }

        // Convert object to array and sort client-side (RTDB sorting is limited)
        const novels: Novel[] = Object.values(data);
        novels.sort((a, b) => b.lastReadAt - a.lastReadAt); // Descending order
        
        callback(novels);
    }, (error) => {
        console.error("Database Novels Error:", error);
        if (onError) onError(error);
    });

    return () => off(novelsRef);
};

export const addNovelToStore = async (novel: Novel) => {
    if (!currentUser) return;
    try {
        const novelRef = ref(db, `users/${currentUser.uid}/novels/${novel.id}`);
        await set(novelRef, novel);
    } catch (e) {
        console.error("Error adding novel:", e);
    }
};

export const removeNovelFromStore = async (id: string) => {
    if (!currentUser) return;
    try {
        const novelRef = ref(db, `users/${currentUser.uid}/novels/${id}`);
        await remove(novelRef);
    } catch (e) {
        console.error("Error deleting novel:", e);
    }
};

export const updateNovelProgress = async (id: string, chapter: number, scroll: number) => {
    if (!currentUser) return;
    try {
        const novelRef = ref(db, `users/${currentUser.uid}/novels/${id}`);
        await update(novelRef, {
            currentChapter: chapter,
            scrollPosition: scroll,
            lastReadAt: Date.now()
        });
    } catch (e) {
        console.error("Error updating progress:", e);
    }
};

// --- Settings ---

export const subscribeToSettings = (
    callback: (settings: ReaderSettings) => void,
    onError?: (error: any) => void
) => {
    if (!currentUser) return () => {};

    settingsRef = ref(db, `users/${currentUser.uid}/settings`);
    
    const unsubscribe = onValue(settingsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback({ ...DEFAULT_SETTINGS, ...data });
        } else {
            // Initialize defaults if empty
            set(settingsRef, DEFAULT_SETTINGS);
            callback(DEFAULT_SETTINGS);
        }
    }, (error) => {
        console.error("Database Settings Error:", error);
        if (onError) onError(error);
    });

    return () => off(settingsRef);
};

export const saveSettingsToStore = async (settings: ReaderSettings) => {
    if (!currentUser) return;
    try {
        const sRef = ref(db, `users/${currentUser.uid}/settings`);
        await set(sRef, settings);
    } catch (e) {
        console.error("Error saving settings:", e);
    }
};