import React, { useState, useEffect } from 'react';
import { ViewState, Novel, ReaderSettings } from './types';
import { 
    initializeAuth, 
    subscribeToNovels, 
    subscribeToSettings, 
    addNovelToStore, 
    removeNovelFromStore, 
    saveSettingsToStore,
    loginWithGoogle,
    logout
} from './services/storageService';
import Library from './components/Library';
import Reader from './components/Reader';
import AIReport from './components/AIReport';
import { Book, LayoutDashboard, Loader2, AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('library');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [currentNovelId, setCurrentNovelId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReaderSettings | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleDbError = (error: any) => {
      let msg = "Database connection failed.";
      if (error.code === 'PERMISSION_DENIED' || error.code === 'permission-denied') {
          msg = "Permission Denied: Database rules may need update for email-based keys.";
      } else if (error.message && error.message.includes("Client is offline")) {
          msg = "You are offline. Changes will sync when you reconnect.";
      } else if (error.message) {
          msg = error.message;
      }
      setAuthError(msg);
  };

  // Initialize Auth and Data Subscriptions
  useEffect(() => {
    const unsubAuth = initializeAuth(
        (u) => {
            setUser(u);
            if (u) {
                // Subscribe if user exists
                subscribeToNovels(
                    (data) => setNovels(data),
                    (err) => handleDbError(err)
                );
                subscribeToSettings(
                    (data) => setSettings(data),
                    (err) => handleDbError(err)
                );
            } else {
                setNovels([]);
                setSettings(null);
            }
        }, 
        setAuthLoading,
        (errorMessage) => setAuthError(errorMessage)
    );

    return () => unsubAuth();
  }, []);

  // Sync settings with DOM for Tailwind dark mode
  useEffect(() => {
    if (settings) {
      if (settings.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings]);

  const currentNovel = novels.find(n => n.id === currentNovelId) || null;

  const handleAddNovel = (novel: Novel) => {
    addNovelToStore(novel);
  };

  const handleDeleteNovel = (id: string) => {
    removeNovelFromStore(id);
    if (currentNovelId === id) {
        setView('library');
        setCurrentNovelId(null);
    }
  };

  const handleSelectNovel = (novel: Novel) => {
    setCurrentNovelId(novel.id);
    setView('reader');
  };

  const handleUpdateSettings = (newSettings: ReaderSettings) => {
    saveSettingsToStore(newSettings);
  };

  const handleBackFromReader = () => {
    setCurrentNovelId(null);
    setView('library');
  };

  const handleLogout = () => {
      logout();
      setView('library');
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
        await loginWithGoogle();
    } catch (error: any) {
        console.error("Login Error:", error);
        if (error.code === 'auth/unauthorized-domain') {
            setAuthError(`Domain unauthorized: ${window.location.hostname}. Please add this domain to the Authorized Domains list in your Firebase Console (Authentication > Settings).`);
        } else if (error.code !== 'auth/popup-closed-by-user') {
            setAuthError(error.message || "Login failed due to an unknown error.");
        }
    }
  };

  // Error Screen
  if (authError) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-lg mb-8 leading-relaxed break-words select-all">
                {authError}
            </p>
            <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
                <RefreshCw className="w-5 h-5" /> Reload App
            </button>
        </div>
    );
  }

  // Loading Screen
  if (authLoading) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
              <p>Initializing...</p>
          </div>
      );
  }

  // Login Screen
  if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20">
                <Book className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ZenReader</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                Your distraction-free novel reader. Sync your library across devices.
            </p>
            <button 
                onClick={handleLogin}
                className="flex items-center gap-3 bg-white text-gray-800 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200 font-medium"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
            </button>
        </div>
      );
  }

  // App Content
  if (view === 'reader' && currentNovel && settings) {
    return (
      <Reader 
        novel={currentNovel} 
        settings={settings} 
        onUpdateSettings={handleUpdateSettings}
        onBack={handleBackFromReader}
        onLogout={handleLogout}
        userEmail={user.email || ''}
      />
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 min-h-screen">
      
      {view === 'library' && (
        <Library 
          novels={novels} 
          onAddNovel={handleAddNovel} 
          onSelectNovel={handleSelectNovel}
          onDeleteNovel={handleDeleteNovel}
          onLogout={handleLogout}
          userEmail={user.email || ''}
        />
      )}

      {view === 'ai-report' && (
        <AIReport novels={novels} />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 flex justify-around p-3 pb-6 z-50">
        <button 
          onClick={() => setView('library')}
          className={`flex flex-col items-center gap-1 ${view === 'library' ? 'text-blue-500' : 'text-gray-400'}`}
        >
          <Book className="w-6 h-6" />
          <span className="text-xs font-medium">Library</span>
        </button>
        <button 
          onClick={() => setView('ai-report')}
          className={`flex flex-col items-center gap-1 ${view === 'ai-report' ? 'text-purple-500' : 'text-gray-400'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xs font-medium">Insights</span>
        </button>
      </div>
    </div>
  );
};

export default App;