import { Novel, ReaderSettings } from '../types';

const NOVELS_KEY = 'zenreader_novels';
const SETTINGS_KEY = 'zenreader_settings';

const DEFAULT_SETTINGS: ReaderSettings = {
  themeMode: 'dark',
  fontSize: 18,
  lineHeight: 1.6,
  fontFamily: 'Georgia, serif',
  backgroundColor: '#1a1a1a',
  textColor: '#e5e5e5',
};

export const saveNovels = (novels: Novel[]) => {
  try {
    localStorage.setItem(NOVELS_KEY, JSON.stringify(novels));
  } catch (e) {
    console.error("Failed to save novels", e);
  }
};

export const getNovels = (): Novel[] => {
  try {
    const data = localStorage.getItem(NOVELS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveSettings = (settings: ReaderSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): ReaderSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
};

export const updateNovelProgress = (id: string, chapter: number, scroll: number) => {
  const novels = getNovels();
  const index = novels.findIndex(n => n.id === id);
  if (index !== -1) {
    novels[index].currentChapter = chapter;
    novels[index].scrollPosition = scroll;
    novels[index].lastReadAt = Date.now();
    saveNovels(novels);
  }
};
