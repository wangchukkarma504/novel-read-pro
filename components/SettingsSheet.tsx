import React from 'react';
import { ReaderSettings } from '../types';
import { X, Type, Sun, Moon, Palette, MoveDown, Rabbit, Turtle, LogOut } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdate: (s: ReaderSettings) => void;
  onLogout: () => void;
  userEmail: string;
}

const SettingsSheet: React.FC<Props> = ({ isOpen, onClose, settings, onUpdate, onLogout, userEmail }) => {
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

        {/* User Profile */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
            <div className="overflow-hidden">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{userEmail}</p>
            </div>
            <button 
                onClick={onLogout}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition"
                title="Sign Out"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>

        {/* Auto Scroll */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
           <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                 <MoveDown className="w-4 h-4 text-blue-500" /> Auto Scroll
              </label>
              <button 
                onClick={() => onUpdate({ ...settings, autoScrollEnabled: !settings.autoScrollEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoScrollEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoScrollEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
           </div>
           
           {settings.autoScrollEnabled && (
             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <Turtle className="w-4 h-4 text-gray-400" />
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={settings.autoScrollSpeed || 2}
                  onChange={(e) => onUpdate({ ...settings, autoScrollSpeed: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <Rabbit className="w-4 h-4 text-gray-400" />
             </div>
           )}
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