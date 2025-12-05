import { GoogleGenAI } from "@google/genai";
import { Novel } from '../types';

const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return retryOperation(operation, retries - 1);
        }
        throw error;
    }
}

export const generateReadingReport = async (novels: Novel[]): Promise<string> => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    return "API Key is missing. Unable to generate AI report.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Prepare data for the model
    const stats = novels.map(n => ({
      title: n.title,
      currentChapter: n.currentChapter,
      lastRead: new Date(n.lastReadAt).toLocaleDateString()
    }));

    const prompt = `
      Analyze the following reading list data and provide a fun, short, and encouraging reading personality report for the user.
      Keep it under 150 words.
      Use emojis.
      Data: ${JSON.stringify(stats)}
    `;

    const response = await retryOperation(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("AI Error:", error);
    return "The AI is taking a nap. Please try again later.";
  }
};

export const explainText = async (text: string, contextTitle: string): Promise<string> => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) return "API Key missing.";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = `
      You are a helpful reading assistant. 
      The user is reading the novel "${contextTitle}".
      They selected the following text: "${text}".
      
      Please do the following:
      1. If the text is not in English, translate it.
      2. Provide a definition of difficult words.
      3. Explain the cultural context or idiom if applicable.
      4. Keep the response concise (under 100 words) and easy to read.
    `;

    const response = await retryOperation(() => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("AI Explanation Error:", error);
    return "Could not fetch explanation. Please check connection.";
  }
};