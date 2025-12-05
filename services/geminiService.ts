import { GoogleGenAI } from "@google/genai";
import { Novel } from '../types';

export const generateReadingReport = async (novels: Novel[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Unable to generate AI report.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("AI Error:", error);
    return "The AI is taking a nap. Please try again later.";
  }
};
