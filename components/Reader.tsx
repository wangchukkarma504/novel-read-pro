import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChapterData, Novel, ReaderSettings } from '../types';
import { fetchChapterContent, constructChapterUrl } from '../services/novelService';
import { updateNovelProgress } from '../services/storageService';
import { explainText } from '../services/geminiService';
import { ArrowLeft, Settings, ChevronRight, ChevronLeft, Loader2, Play, Sparkles, X } from 'lucide-react';
import SettingsSheet from './SettingsSheet';

interface Props {
  novel: Novel;
  settings: ReaderSettings;
  onUpdateSettings: (s: ReaderSettings) => void;
  onBack: () => void;
  onLogout: () => void;
  userEmail: string;
}

// Non-linear speed mapping for better control
// Index 0 (Speed 1) = 0.2px/frame (Very slow)
// Index 9 (Speed 10) = 5.0px/frame (Fast skim)
const SCROLL_SPEEDS = [0.1, 0.2, 0.4, 0.7, 1.0, 1.5, 2.2, 3.0, 4.0, 6.0];

const Reader: React.FC<Props> = ({ novel, settings, onUpdateSettings, onBack, onLogout, userEmail }) => {
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Selection AI State
  const [selectionRect, setSelectionRect] = useState<{top: number, left: number} | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationResult, setExplanationResult] = useState("");

  // Initialize with novel prop, but keep local state to allow fast UI updates before DB sync
  const [currentChapter, setCurrentChapter] = useState(novel.currentChapter);

  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Sync internal chapter state if novel prop updates (e.g. from external db change)
  useEffect(() => {
     // Optional: You might want to sync if the user opens the same novel on another device
  }, [novel.currentChapter]);

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

  // --- Auto Scroll Logic ---
  useEffect(() => {
    // Stop scrolling if:
    // 1. Feature disabled
    // 2. Settings sheet is open
    // 3. Controls are visible
    // 4. Text is selected or explanation is showing
    if (!settings.autoScrollEnabled || showSettings || showControls || selectionRect || showExplanation) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const scrollLoop = () => {
      const speedIndex = (settings.autoScrollSpeed || 2) - 1;
      const safeIndex = Math.max(0, Math.min(speedIndex, SCROLL_SPEEDS.length - 1));
      const speed = SCROLL_SPEEDS[safeIndex];
      
      // Stop at bottom
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
         return;
      }

      window.scrollBy(0, speed);
      animationFrameRef.current = requestAnimationFrame(scrollLoop);
    };

    animationFrameRef.current = requestAnimationFrame(scrollLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [settings.autoScrollEnabled, settings.autoScrollSpeed, showSettings, showControls, selectionRect, showExplanation]);

  // --- Handle Scroll Saving ---
  useEffect(() => {
    const handleScroll = () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = window.setTimeout(() => {
         updateNovelProgress(novel.id, currentChapter, window.scrollY);
      }, 1000); 
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [novel.id, currentChapter]);

  // --- Text Selection Handler ---
  useEffect(() => {
    const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Only show if selection is within the reader container
            if (containerRef.current && containerRef.current.contains(selection.anchorNode)) {
                setSelectedText(selection.toString());
                // Position button just above the selection, centered
                setSelectionRect({
                    top: rect.top + window.scrollY - 50, 
                    left: rect.left + (rect.width / 2) - 60 // Center the 120px wide button
                });
            }
        } else {
            setSelectionRect(null);
        }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleExplain = async () => {
      if (!selectedText) return;
      setShowExplanation(true);
      setExplanationLoading(true);
      setSelectionRect(null); // Hide the floating button
      
      const result = await explainText(selectedText, novel.title);
      setExplanationResult(result);
      setExplanationLoading(false);
      
      // Clear native selection so it doesn't annoy user
      window.getSelection()?.removeAllRanges();
  };

  const changeChapter = (delta: number) => {
    const next = currentChapter + delta;
    if (next > 0) {
      setCurrentChapter(next);
      window.scrollTo(0,0);
      updateNovelProgress(novel.id, next, 0);
    }
  };

  const handleToggleControls = () => {
    // Don't toggle controls if user is selecting text
    if (window.getSelection()?.toString().length) return;
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
        className="px-4 py-20 mx-auto max-w-3xl cursor-pointer select-text"
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
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {/* Controls Bar */}
          <div className="flex justify-between items-center">
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
      </div>
      
      {/* Visual Indicator for Auto Scroll */}
      {settings.autoScrollEnabled && !showControls && !selectionRect && !showExplanation && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-none opacity-30">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                <Play className="w-5 h-5 text-white fill-white" />
            </div>
        </div>
      )}

      {/* Floating AI Action Button (When text is selected) */}
      {selectionRect && !showExplanation && (
        <div 
            className="fixed z-50 animate-in fade-in zoom-in duration-200"
            style={{ top: selectionRect.top, left: selectionRect.left }}
        >
            <button 
                onMouseDown={(e) => {
                    e.preventDefault(); // Prevent clearing selection
                    handleExplain();
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-xl hover:scale-105 transition-transform font-medium text-sm"
            >
                <Sparkles className="w-4 h-4" /> Explain
            </button>
        </div>
      )}

      {/* AI Explanation Modal */}
      {showExplanation && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowExplanation(false)}>
              <div 
                  className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-purple-600 dark:text-purple-400">
                          <Sparkles className="w-5 h-5" /> AI Insight
                      </h3>
                      <button onClick={() => setShowExplanation(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
                          <X className="w-5 h-5 text-gray-500" />
                      </button>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg mb-4 text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-purple-500 line-clamp-2">
                      "{selectedText}"
                  </div>

                  {explanationLoading ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-500" />
                          <p className="text-sm">Analyzing context...</p>
                      </div>
                  ) : (
                      <div className="prose dark:prose-invert prose-sm max-h-[40vh] overflow-y-auto">
                          <p className="whitespace-pre-wrap leading-relaxed">{explanationResult}</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      <SettingsSheet 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={onUpdateSettings}
        onLogout={onLogout}
        userEmail={userEmail}
      />
    </div>
  );
};

export default Reader;