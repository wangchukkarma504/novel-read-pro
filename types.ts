export interface Novel {
  id: string;
  title: string;
  baseUrlPattern: string; // The URL with a placeholder for chapter number
  currentChapter: number;
  lastReadAt: number; // Timestamp
  scrollPosition: number; // Y offset
  coverImage?: string;
}

export interface ReaderSettings {
  themeMode: 'light' | 'dark';
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  autoScrollEnabled?: boolean;
  autoScrollSpeed?: number; // 1-10
}

export interface ChapterData {
  title: string;
  content: string; // HTML string
  nextChapterUrl?: string;
  prevChapterUrl?: string;
}

export type ViewState = 'library' | 'reader' | 'settings' | 'ai-report';