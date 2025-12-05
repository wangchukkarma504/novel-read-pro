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

// Define multiple proxies to ensure reliability
const PROXIES = [
    {
        name: 'AllOrigins',
        fetch: async (url: string) => {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            return data.contents;
        }
    },
    {
        name: 'CorsProxy',
        fetch: async (url: string) => {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return await response.text();
        }
    },
    {
        name: 'CodeTabs',
        fetch: async (url: string) => {
            const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return await response.text();
        }
    }
];

export const fetchChapterContent = async (url: string): Promise<ChapterData> => {
  let finalContent: string | null = null;
  let lastError: Error | null = null;

  // Try proxies in sequence
  for (const proxy of PROXIES) {
      try {
          // console.log(`Attempting to fetch via ${proxy.name}...`);
          finalContent = await proxy.fetch(url);
          
          // Basic validation to ensure we didn't just get an empty response or error page
          if (finalContent && finalContent.length > 100) {
              break; // Success, exit loop
          }
      } catch (e: any) {
          console.warn(`Proxy ${proxy.name} failed:`, e.message);
          lastError = e;
      }
  }

  if (!finalContent) {
    console.error("All proxies failed to fetch chapter.");
    throw new Error("Unable to load chapter. The source site may be blocking access or you are offline.");
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(finalContent, 'text/html');

    // Specific selector requested by user
    const contentElement = doc.querySelector('.chapter-content');
    
    // Fallback selectors if the specific class isn't found (robustness)
    // We try common content wrappers used in novel sites
    const contentHtml = contentElement 
      ? contentElement.innerHTML 
      : (
          doc.querySelector('#chapter-content') || 
          doc.querySelector('.entry-content') || 
          doc.querySelector('#content') || 
          doc.querySelector('article') || 
          doc.body
        ).innerHTML;

    // Try to find a title, prioritizing h1, then specific classes
    const title = doc.querySelector('.chapter-title')?.textContent || 
                  doc.querySelector('h1')?.textContent || 
                  `Chapter`;

    // Remove script tags to prevent potential issues
    const cleanContent = contentHtml.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "");

    return {
      title: title.trim(),
      content: cleanContent,
    };
  } catch (error) {
    console.error("Failed to parse chapter:", error);
    throw new Error("Failed to parse chapter content.");
  }
};