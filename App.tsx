import React, { useState, useEffect } from 'react';
import { ViewState, Novel, ReaderSettings } from './types';
import { 
    initializeAuth, 
    subscribeToNovels, 
    subscribeToSettings, 
    addNovelToStore, 
    removeNovelFromStore, 
    saveSettingsToStore 
} from './services/storageService';
import Library from './components/Library';
import Reader from './components/Reader';
import AIReport from './components/AIReport';
import { Book, LayoutDashboard, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('library');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [currentNovelId, setCurrentNovelId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReaderSettings | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleDbError = (error: any) => {
      let msg = "Database connection failed.";
      // Realtime Database specific errors
      if (error.code === 'PERMISSION_DENIED' || error.code === 'permission-denied') {
          msg = "Permission Denied: Check your Database Rules in Firebase Console.";
      } else if (error.message && error.message.includes("Client is offline")) {
          msg = "You are offline. Changes will sync when you reconnect.";
      } else if (error.message) {
          msg = error.message;
      }
      // Note: RTDB typically creates itself automatically, unlike Firestore, so the "Create Database" error is less common unless the service is disabled.
      setAuthError(msg);
  };

  // Initialize Auth and Data Subscriptions
  useEffect(() => {
    const unsubAuth = initializeAuth(
        (user) => {
            // Once logged in (anonymously), subscribe to data with error handling
            subscribeToNovels(
                (data) => setNovels(data),
                (err) => handleDbError(err)
            );
            subscribeToSettings(
                (data) => setSettings(data),
                (err) => handleDbError(err)
            );
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

  // Derived state for current novel to ensure we always have the latest progress data
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

  // Error Screen
  if (authError) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configuration Error</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-sm mb-8 leading-relaxed">
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
  if (authLoading || !settings) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
              <p>Syncing Library...</p>
          </div>
      );
  }

  // Render Logic
  if (view === 'reader' && currentNovel) {
    return (
      <Reader 
        novel={currentNovel} 
        settings={settings} 
        onUpdateSettings={handleUpdateSettings}
        onBack={handleBackFromReader}
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