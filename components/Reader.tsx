import React, { useEffect, useState, useRef } from 'react';
import { ChapterData, Novel, ReaderSettings } from '../types';
import { fetchChapterContent, constructChapterUrl } from '../services/novelService';
import { updateNovelProgress } from '../services/storageService';
import { ArrowLeft, Settings, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import SettingsSheet from './SettingsSheet';

interface Props {
  novel: Novel;
  settings: ReaderSettings;
  onUpdateSettings: (s: ReaderSettings) => void;
  onBack: () => void;
}

const Reader: React.FC<Props> = ({ novel, settings, onUpdateSettings, onBack }) => {
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(novel.currentChapter);

  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<number | null>(null);

  // Load Chapter Content
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = constructChapterUrl(novel.baseUrlPattern, currentChapter);
        const chapterData = await fetchChapterContent(url);
        setData(chapterData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentChapter, novel.baseUrlPattern]);

  // Restore Scroll Position on Load
  useEffect(() => {
    if (!loading && data && containerRef.current) {
      if (currentChapter === novel.currentChapter) {
        window.scrollTo({ top: novel.scrollPosition, behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [loading, data]);

  // Handle Scroll Saving
  useEffect(() => {
    const handleScroll = () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = window.setTimeout(() => {
         updateNovelProgress(novel.id, currentChapter, window.scrollY);
      }, 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [novel.id, currentChapter]);

  const changeChapter = (delta: number) => {
    const next = currentChapter + delta;
    if (next > 0) {
      setCurrentChapter(next);
      window.scrollTo(0,0);
    }
  };

  const handleToggleControls = () => {
    setShowControls(prev => !prev);
  };

  return (
    <div 
      style={{ 
        backgroundColor: settings.backgroundColor, 
        color: settings.textColor,
        fontFamily: settings.fontFamily,
        minHeight: '100vh'
      }}
      className="relative transition-colors duration-300"
    >
      {/* Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-40 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}
           style={{ backgroundColor: settings.backgroundColor, borderBottom: '1px solid rgba(128,128,128,0.2)' }}
      >
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-sm font-semibold truncate max-w-[200px]">
          {novel.title}
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-white/10">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className="px-4 py-20 mx-auto max-w-3xl cursor-pointer"
        onClick={handleToggleControls}
        style={{ 
          fontSize: `${settings.fontSize}px`, 
          lineHeight: settings.lineHeight 
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm opacity-70">Fetching Chapter {currentChapter}...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center">{data?.title || `Chapter ${currentChapter}`}</h2>
            <div 
              className="chapter-content"
              dangerouslySetInnerHTML={{ __html: data?.content || '' }} 
            />
          </div>
        )}
      </div>

      {/* Sticky Footer / Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 z-40 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ backgroundColor: settings.backgroundColor, borderTop: '1px solid rgba(128,128,128,0.2)' }}
      >
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); changeChapter(-1); }}
            disabled={currentChapter <= 1}
            className="flex items-center px-4 py-3 rounded-lg bg-black/10 hover:bg-black/20 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Prev
          </button>

          <span className="font-mono font-bold">Ch. {currentChapter}</span>

          <button 
            onClick={(e) => { e.stopPropagation(); changeChapter(1); }}
            className="flex items-center px-4 py-3 rounded-lg bg-black/10 hover:bg-black/20"
          >
            Next <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>

      <SettingsSheet 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={onUpdateSettings}
      />
    </div>
  );
};

export default Reader;