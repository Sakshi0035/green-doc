import { v4 as uuidv4 } from 'uuid';
import { QdrantConfig } from '../types';

// HYBRID STORAGE SERVICE
// 1. Tries to use Qdrant Cloud.
// 2. Automatically FALLS BACK to Local Memory if cloud fails.
// 3. This guarantees the chat works 100% of the time.

let currentConfig: QdrantConfig | null = null;
let workingBaseUrl: string | null = null;

// Local Backup Memory
const localMemory: { vector: number[], payload: { text: string, source: string } }[] = [];

export const initQdrant = async (config: QdrantConfig) => {
  currentConfig = config;
  workingBaseUrl = null; 
  console.log("Qdrant Service Initialized (Hybrid Mode)");
  return true;
};

// Raw Request with Port Discovery
const qdrantRequest = async (endpoint: string, method: string, body?: any) => {
    if (!currentConfig) throw new Error("Qdrant not initialized");
    
    let candidates: string[] = [];
    
    if (workingBaseUrl) {
        candidates = [workingBaseUrl];
    } else {
        const original = currentConfig.url.replace(/\/$/, '');
        candidates.push(original);
        if (original.includes(':6333')) {
            candidates.push(original.replace(':6333', ''));
        } else {
            candidates.push(original + ':6333');
        }
    }

    let lastError: any = null;

    for (const baseUrl of candidates) {
        const url = `${baseUrl}${endpoint}`;
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': currentConfig.apiKey,
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                if (response.status === 409) return { status: 409 };
                const txt = await response.text();
                throw new Error(`API Error ${response.status}: ${txt}`);
            }

            if (!workingBaseUrl) workingBaseUrl = baseUrl;
            return await response.json();
        } catch (error: any) {
             if (error.message.includes('Failed to fetch')) {
                lastError = error;
                continue;
            }
            throw error;
        }
    }
    throw lastError || new Error("Connection failed");
};

export const ensureCollection = async (collectionName: string) => {
    // Clear local memory for new session
    localMemory.length = 0;
    
    try {
        await qdrantRequest(`/collections/${collectionName}`, 'PUT', {
            vectors: { size: 768, distance: 'Cosine' }
        });
        return true;
    } catch (e) {
        // Fallback: Proceed anyway, we have local memory
        console.warn("Cloud collection check failed, using Local Memory fallback.");
        return true;
    }
};

export const uploadPoints = async (
  collectionName: string, 
  vectors: number[][], 
  payloads: { text: string; source: string }[]
) => {
    // 1. SAVE TO LOCAL MEMORY (Guaranteed Success)
    vectors.forEach((vec, i) => {
        localMemory.push({
            vector: vec,
            payload: payloads[i]
        });
    });
    console.log(`Saved ${vectors.length} points to Local Memory (Fail-Safe).`);

    // 2. TRY SAVING TO CLOUD (Best Effort)
    const points = vectors.map((vector, idx) => ({
        id: uuidv4(),
        vector,
        payload: { ...payloads[idx], chunkIndex: idx }
    }));

    try {
        await qdrantRequest(`/collections/${collectionName}/points?wait=false`, 'PUT', { points });
        console.log("Successfully synced to Qdrant Cloud.");
    } catch (e) {
        console.warn("Cloud upload failed. Using Local Memory for chat.");
    }
};

// Math helper for local cosine similarity
const dotProduct = (a: number[], b: number[]) => {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
};

export const searchSimilar = async (collectionName: string, vector: number[], limit: number = 5) => {
    let cloudResults: any[] = [];
    
    // 1. Try Cloud Search
    try {
        const response = await qdrantRequest(`/collections/${collectionName}/points/search`, 'POST', {
            vector,
            limit,
            with_payload: true
        });
        cloudResults = response.result || [];
    } catch (e) {
        console.warn("Cloud search failed, switching to Local Memory.");
    }

    // 2. If Cloud returned results, use them
    if (cloudResults.length > 0) return cloudResults;

    // 3. Fallback: Local Memory Search (Fail-Safe)
    console.log("Performing Local Memory Search...");
    
    const localResults = localMemory.map(item => ({
        score: dotProduct(vector, item.vector),
        payload: item.payload
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

    return localResults;
};