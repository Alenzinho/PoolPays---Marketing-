import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// MODELS CONFIGURATION
export const FAST_MODEL = 'gemini-2.5-flash'; 
export const SMART_MODEL = 'gemini-3-pro-preview';
export const EMBEDDING_MODEL = 'text-embedding-004'; // Specific model for embeddings

/**
 * Generates a vector embedding using a dedicated embedding model.
 * Validates input to prevent empty request errors.
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    if (!text || text.trim().length === 0) return [];
    
    // The SDK expects 'contents' (plural) for embedContent
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text 
    });
    
    // Fix: Access embeddings (plural) as per SDK type definition for EmbedContentResponse
    return response.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error("Embedding Error:", error);
    // Fail silently with empty array to prevent app crash, but log for debugging
    return [];
  }
};

/**
 * Generates text content using the specified model.
 */
export const generateText = async (model: string, prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });
    return response.text || "";
  } catch (error) {
    console.error("Generation Error:", error);
    return `[SYSTEM ERROR]: Could not generate response using model ${model}. Please check API Key or Quota.`;
  }
};