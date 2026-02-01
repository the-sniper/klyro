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

const CHUNK_SIZE = 300; // Reduced from 500 for sharper embeddings in dense docs like resumes
const CHUNK_OVERLAP = 50; // tokens

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
  // Validate input - OpenAI requires a non-empty string
  if (!text || typeof text !== 'string') {
    console.error('[Embeddings] Invalid input received:', { text, type: typeof text });
    throw new Error('Invalid input: text must be a non-empty string');
  }
  
  const cleanedText = text.trim();
  if (cleanedText.length === 0) {
    console.error('[Embeddings] Empty text after trimming');
    throw new Error('Invalid input: text cannot be empty');
  }
  
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: cleanedText,
  });
  
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * Note: Empty/invalid texts should be filtered out BEFORE calling this function
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) return [];
  
  // Validate all texts are non-empty strings
  const invalidIndex = texts.findIndex(t => !t || typeof t !== 'string' || t.trim().length === 0);
  if (invalidIndex !== -1) {
    console.error(`[Embeddings] Invalid text at index ${invalidIndex}:`, texts[invalidIndex]);
    throw new Error(`Invalid input: text at index ${invalidIndex} is empty or invalid`);
  }
  
  console.log(`[Embeddings] Generating embeddings for ${texts.length} chunks`);
  
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  
  return response.data.map((item) => item.embedding);
}
