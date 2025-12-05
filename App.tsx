import React, { useState, useEffect } from 'react';
import { ViewState, Novel, ReaderSettings } from './types';
import { getNovels, saveNovels, getSettings, saveSettings } from './services/storageService';
import Library from './components/Library';
import Reader from './components/Reader';
import AIReport from './components/AIReport';
import { Book, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('library');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null);
  const [settings, setSettings] = useState<ReaderSettings>(getSettings());

  // Load initial state
  useEffect(() => {
    setNovels(getNovels());
    setSettings(getSettings());
  }, []);

  // Sync settings with DOM for Tailwind dark mode
  useEffect(() => {
    if (settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

  const handleAddNovel = (novel: Novel) => {
    const updated = [novel, ...novels];
    setNovels(updated);
    saveNovels(updated);
  };

  const handleDeleteNovel = (id: string) => {
    const updated = novels.filter(n => n.id !== id);
    setNovels(updated);
    saveNovels(updated);
  };

  const handleSelectNovel = (novel: Novel) => {
    setCurrentNovel(novel);
    setView('reader');
  };

  const handleUpdateSettings = (newSettings: ReaderSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleBackFromReader = () => {
    // Refresh novels list to get updated progress
    setNovels(getNovels());
    setCurrentNovel(null);
    setView('library');
  };

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
