import React from 'react';
import { ReaderSettings } from '../types';
import { X, Type, Sun, Moon, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdate: (s: ReaderSettings) => void;
}

const SettingsSheet: React.FC<Props> = ({ isOpen, onClose, settings, onUpdate }) => {
  if (!isOpen) return null;

  const themes = [
    { name: 'Light', bg: '#ffffff', text: '#1a202c' },
    { name: 'Sepia', bg: '#fbf0d9', text: '#5f4b32' },
    { name: 'Dark', bg: '#1a1a1a', text: '#e5e5e5' },
    { name: 'Midnight', bg: '#000000', text: '#94a3b8' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5" /> Appearance
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Font Size */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-500 mb-2">Font Size</label>
          <div className="flex items-center gap-4 bg-gray-100 dark:bg-zinc-800 p-3 rounded-lg">
            <Type className="w-4 h-4 text-gray-500" />
            <input 
              type="range" 
              min="12" 
              max="32" 
              value={settings.fontSize}
              onChange={(e) => onUpdate({ ...settings, fontSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <Type className="w-6 h-6 text-gray-900 dark:text-white" />
          </div>
        </div>

        {/* Themes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-500 mb-2">Theme</label>
          <div className="grid grid-cols-4 gap-2">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => onUpdate({ 
                  ...settings, 
                  backgroundColor: t.bg, 
                  textColor: t.text,
                  themeMode: t.name === 'Light' || t.name === 'Sepia' ? 'light' : 'dark'
                })}
                className={`h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all
                  ${settings.backgroundColor === t.bg ? 'border-blue-500 scale-105' : 'border-transparent opacity-80'}
                `}
                style={{ backgroundColor: t.bg, color: t.text }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div className="mb-4">
           <label className="block text-sm font-medium text-gray-500 mb-2">Typeface</label>
           <div className="flex gap-2">
             {['sans-serif', 'serif', 'monospace'].map(font => (
               <button
                key={font}
                onClick={() => onUpdate({ ...settings, fontFamily: font })}
                className={`flex-1 py-2 rounded-lg capitalize border ${settings.fontFamily.includes(font) ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300'}`}
               >
                 {font}
               </button>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsSheet;
