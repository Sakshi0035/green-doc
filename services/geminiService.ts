import { GoogleGenAI } from "@google/genai";

const getEnv = (key: string, viteKey: string) => {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) return import.meta.env[viteKey];
    return null;
};

// STRICTLY ENV VARIABLES - NO HARDCODED FALLBACK
const apiKey = getEnv('API_KEY', 'VITE_API_KEY') || getEnv('REACT_APP_API_KEY', 'VITE_API_KEY');

if (!apiKey) {
    console.warn("Gemini API Key is missing. Please check your .env file configuration.");
}

// Initialize with safe fallback for type safety, but requests will fail if key is missing
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

const generateEmbeddingWithRetry = async (text: string, retries = 3): Promise<number[] | null> => {
  if (!apiKey) throw new Error("Missing Gemini API Key in environment variables.");

  const model = "text-embedding-004";
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.embedContent({
        model,
        contents: { parts: [{ text }] },
      });
      return response.embeddings?.[0]?.values || null;
    } catch (error: any) {
      if (attempt === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return null;
};

export const getEmbeddings = async (
  texts: string[],
  onProgress: (progress: number) => void
): Promise<number[][]> => {
  const embeddings: (number[] | null)[] = new Array(texts.length).fill(null);
  const BATCH_SIZE = 15; 

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map((text, idx) => {
        const globalIndex = i + idx;
        return generateEmbeddingWithRetry(text).then(emb => {
            embeddings[globalIndex] = emb;
        }).catch(() => {
            embeddings[globalIndex] = null;
        });
    });

    await Promise.all(batchPromises);
    onProgress(Math.round(((Math.min(i + BATCH_SIZE, texts.length)) / texts.length) * 100));
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const validEmbeddings = embeddings.filter(e => e !== null) as number[][];
  if (validEmbeddings.length === 0 && texts.length > 0) throw new Error("API Limit");
  return validEmbeddings;
};

export const getQueryEmbedding = async (text: string): Promise<number[]> => {
  return (await generateEmbeddingWithRetry(text, 3)) || [];
};

export const generateAnswer = async (
  query: string, 
  context: string[], 
  history: any[]
) => {
  const model = "gemini-2.5-flash";
  const systemInstruction = `You are GreenDoc, a professional document assistant.
  Context: ${context.join('\n\n')}
  Instructions:
  1. Answer based STRICTLY on the context.
  2. If unknown, say "I cannot find that info in the document."
  3. Be concise.`;

  const chat = ai.chats.create({ model, config: { systemInstruction } });
  return await chat.sendMessageStream({ message: query });
};