import { db, auth } from './firebase';
import { 
  ref, set, remove, update, onValue, off 
} from 'firebase/database';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { Novel, ReaderSettings } from '../types';

const DEFAULT_SETTINGS: ReaderSettings = {
  themeMode: 'dark',
  fontSize: 18,
  lineHeight: 1.6,
  fontFamily: 'Georgia, serif',
  backgroundColor: '#1a1a1a',
  textColor: '#e5e5e5',
  autoScrollEnabled: false,
  autoScrollSpeed: 2,
};

let currentUser: User | null = null;
let novelsRef: any = null;
let settingsRef: any = null;

// Helper to use email as key (sanitized)
const getUserKey = (user: User) => {
    if (user.email) return user.email.replace(/\./g, '_');
    return user.uid;
};

export const initializeAuth = (
    onUserAvailable: (user: User | null) => void, 
    onLoading: (isLoading: boolean) => void,
    onError: (errorMessage: string) => void
) => {
    onLoading(true);
    // Listen for auth state changes
    const unsub = onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        onUserAvailable(user);
        onLoading(false);
    }, (error) => {
        console.error("Auth Error", error);
        onError(error.message);
        onLoading(false);
    });
    return unsub;
};

export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error: any) {
        console.error("Login failed:", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        currentUser = null;
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

// --- Novels ---

export const subscribeToNovels = (
    callback: (novels: Novel[]) => void,
    onError?: (error: any) => void
) => {
    if (!currentUser) return () => {};

    const userKey = getUserKey(currentUser);
    novelsRef = ref(db, `users/${userKey}/novels`);
    
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
        const userKey = getUserKey(currentUser);
        const novelRef = ref(db, `users/${userKey}/novels/${novel.id}`);
        await set(novelRef, novel);
    } catch (e) {
        console.error("Error adding novel:", e);
    }
};

export const removeNovelFromStore = async (id: string) => {
    if (!currentUser) return;
    try {
        const userKey = getUserKey(currentUser);
        const novelRef = ref(db, `users/${userKey}/novels/${id}`);
        await remove(novelRef);
    } catch (e) {
        console.error("Error deleting novel:", e);
    }
};

export const updateNovelProgress = async (id: string, chapter: number, scroll: number) => {
    if (!currentUser) return;
    try {
        const userKey = getUserKey(currentUser);
        const novelRef = ref(db, `users/${userKey}/novels/${id}`);
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

    const userKey = getUserKey(currentUser);
    settingsRef = ref(db, `users/${userKey}/settings`);
    
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
        const userKey = getUserKey(currentUser);
        const sRef = ref(db, `users/${userKey}/settings`);
        await set(sRef, settings);
    } catch (e) {
        console.error("Error saving settings:", e);
    }
};