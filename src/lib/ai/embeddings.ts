import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const CHUNK_SIZE = 500; // tokens (approximately 4 chars per token)
const CHUNK_OVERLAP = 100; // tokens

/**
 * Split text into overlapping chunks for embedding
 */
export function chunkDocument(content: string): string[] {
  const chunks: string[] = [];
  const charChunkSize = CHUNK_SIZE * 4; // Approximate chars per chunk
  const charOverlap = CHUNK_OVERLAP * 4;
  
  if (content.length <= charChunkSize) {
    return [content.trim()];
  }
  
  let startIndex = 0;
  
  while (startIndex < content.length) {
    let endIndex = startIndex + charChunkSize;
    
    // Try to end at a sentence or paragraph boundary
    if (endIndex < content.length) {
      const searchWindow = content.slice(endIndex - 100, endIndex + 100);
      const sentenceEnd = searchWindow.search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        endIndex = endIndex - 100 + sentenceEnd + 2;
      }
    }
    
    const chunk = content.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    startIndex = endIndex - charOverlap;
  }
  
  return chunks;
}

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  
  return response.data.map((item) => item.embedding);
}
