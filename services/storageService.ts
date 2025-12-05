import { db, auth } from './firebase';
import { 
  collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, 
  query, orderBy, serverTimestamp, getDoc 
} from 'firebase/firestore';
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
let unsubscribeNovels: () => void = () => {};
let unsubscribeSettings: () => void = () => {};

export const initializeAuth = (
    onUserAvailable: (user: User) => void, 
    onLoading: (isLoading: boolean) => void
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
            } catch (error) {
                console.error("Auth Error", error);
                onLoading(false);
            }
        }
    });
    return unsub;
};

// --- Novels ---

export const subscribeToNovels = (callback: (novels: Novel[]) => void) => {
    if (!currentUser) return;

    const q = query(collection(db, 'users', currentUser.uid, 'novels'), orderBy('lastReadAt', 'desc'));
    
    unsubscribeNovels();
    unsubscribeNovels = onSnapshot(q, (snapshot) => {
        const novels: Novel[] = [];
        snapshot.forEach((doc) => {
            novels.push({ id: doc.id, ...doc.data() } as Novel);
        });
        callback(novels);
    });
    return unsubscribeNovels;
};

export const addNovelToStore = async (novel: Novel) => {
    if (!currentUser) return;
    try {
        // We use the ID generated in the app logic, or let Firestore generate one
        const docRef = doc(db, 'users', currentUser.uid, 'novels', novel.id);
        await setDoc(docRef, novel);
    } catch (e) {
        console.error("Error adding novel:", e);
    }
};

export const removeNovelFromStore = async (id: string) => {
    if (!currentUser) return;
    try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'novels', id));
    } catch (e) {
        console.error("Error deleting novel:", e);
    }
};

export const updateNovelProgress = async (id: string, chapter: number, scroll: number) => {
    if (!currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid, 'novels', id);
        await updateDoc(docRef, {
            currentChapter: chapter,
            scrollPosition: scroll,
            lastReadAt: Date.now() // Use client timestamp for immediate UI sort, or serverTimestamp() if strict
        });
    } catch (e) {
        console.error("Error updating progress:", e);
    }
};

// --- Settings ---

export const subscribeToSettings = (callback: (settings: ReaderSettings) => void) => {
    if (!currentUser) return;

    const docRef = doc(db, 'users', currentUser.uid, 'settings', 'config');
    
    unsubscribeSettings();
    unsubscribeSettings = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ ...DEFAULT_SETTINGS, ...docSnap.data() } as ReaderSettings);
        } else {
            // Initialize default settings if they don't exist
            setDoc(docRef, DEFAULT_SETTINGS);
            callback(DEFAULT_SETTINGS);
        }
    });
    return unsubscribeSettings;
};

export const saveSettingsToStore = async (settings: ReaderSettings) => {
    if (!currentUser) return;
    try {
        const docRef = doc(db, 'users', currentUser.uid, 'settings', 'config');
        await setDoc(docRef, settings);
    } catch (e) {
        console.error("Error saving settings:", e);
    }
};
