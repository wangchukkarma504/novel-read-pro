import React, { useState } from 'react';
import { Novel } from '../types';
import { extractUrlPattern } from '../services/novelService';
import { Plus, BookOpen, Trash2, Search, Book } from 'lucide-react';

interface Props {
  novels: Novel[];
  onAddNovel: (novel: Novel) => void;
  onSelectNovel: (novel: Novel) => void;
  onDeleteNovel: (id: string) => void;
}

const Library: React.FC<Props> = ({ novels, onAddNovel, onSelectNovel, onDeleteNovel }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = () => {
    if (!newUrl) return;
    const { pattern, startChapter, title } = extractUrlPattern(newUrl);
    
    const newNovel: Novel = {
      id: Date.now().toString(),
      title: title,
      baseUrlPattern: pattern,
      currentChapter: startChapter,
      lastReadAt: Date.now(),
      scrollPosition: 0,
    };

    onAddNovel(newNovel);
    setNewUrl('');
    setIsAdding(false);
  };

  const filteredNovels = novels.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <Book className="text-blue-500"/> Library
        </h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Add Novel Section */}
      {isAdding && (
        <div className="mb-6 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-4">
          <label className="block text-sm font-medium mb-2">Enter Novel URL</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="https://www.fanmtl.com/novel/example_1.html"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-100 dark:bg-zinc-700 border-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 rounded-lg font-medium"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Paste the link to the first chapter. We'll handle the rest.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grid */}
      {filteredNovels.length === 0 ? (
        <div className="text-center py-20 opacity-50">
            <BookOpen className="w-16 h-16 mx-auto mb-4" />
            <p>No novels found. Add one to start reading!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredNovels.map(novel => (
            <div 
              key={novel.id}
              onClick={() => onSelectNovel(novel)}
              className="relative group bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg mb-1 line-clamp-2 leading-tight">{novel.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Chapter {novel.currentChapter}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Last read: {new Date(novel.lastReadAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteNovel(novel.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
