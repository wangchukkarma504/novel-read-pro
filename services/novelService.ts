import { ChapterData } from '../types';

// Extract the base pattern from a URL like .../novel/lord-of-the-truth_1.html
// Returns .../novel/lord-of-the-truth_{chapter}.html
export const extractUrlPattern = (url: string): { pattern: string, startChapter: number, title: string } => {
  // Regex to match the number at the end of the filename before extension
  // Example: http://site.com/novel/name_1.html -> 1
  const match = url.match(/_(\d+)\.html$/);
  
  let pattern = url;
  let startChapter = 1;
  let title = "Unknown Novel";

  if (match) {
    startChapter = parseInt(match[1], 10);
    pattern = url.replace(/_\d+\.html$/, '_{chapter}.html');
    
    // Attempt to guess title from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    title = filename.replace(/_\d+\.html$/, '').replace(/-/g, ' ').toUpperCase();
  } else {
    // Fallback for URLs that might not match exact pattern, assuming appending numbers
    pattern = url + '?page={chapter}'; 
  }

  return { pattern, startChapter, title };
};

export const constructChapterUrl = (pattern: string, chapter: number): string => {
  return pattern.replace('{chapter}', chapter.toString());
};

export const fetchChapterContent = async (url: string): Promise<ChapterData> => {
  // Use a CORS proxy to fetch the content. 
  // AllOrigins is a free public proxy. In production, you'd want your own proxy.
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error("No content received from proxy");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    // Specific selector requested by user
    const contentElement = doc.querySelector('.chapter-content');
    
    // Fallback selectors if the specific class isn't found (robustness)
    const finalContent = contentElement 
      ? contentElement.innerHTML 
      : (doc.querySelector('article') || doc.body).innerHTML;

    // Try to find a title
    const title = doc.querySelector('h1')?.textContent || `Chapter`;

    return {
      title,
      content: finalContent,
    };
  } catch (error) {
    console.error("Failed to fetch chapter:", error);
    throw new Error("Could not load chapter. Please check the URL or your internet connection.");
  }
};
