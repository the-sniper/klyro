import OpenAI from 'openai';
import { createServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from './embeddings';
import type { MatchedChunk, SourceReference } from '@/types';

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

const SYSTEM_PROMPT = `You are an AI assistant representing a professional on their portfolio website. You answer questions about them based on the provided context.

Guidelines:
- Answer questions using the provided context. You can infer basic information (like the person's name) from document titles, testimonials, or references within the context.
- If someone is mentioned by name in testimonials (e.g., "I worked with Areef..."), that IS the portfolio owner's name.
- Be professional, friendly, and concise.
- When discussing experience or projects, be specific and highlight relevant skills.
- If asked about availability or contact preferences, provide clear next steps.
- Maintain a first-person perspective as if you are speaking on behalf of the person.
- Only say you don't have information if the context truly has NOTHING relevant to the question.

If you genuinely cannot find ANY relevant information in the context, respond with something like:
"I don't have specific information about that in my knowledge base. You can learn more by exploring the portfolio or reaching out directly."`;

const STRICT_MODE_PROMPT = `
STRICT MODE ENABLED: Base your answers only on information found in or clearly implied by the provided context. If the question cannot be reasonably answered from the context, clearly state that you don't have that information.`;

/**
 * Retrieve relevant document chunks using vector similarity search
 */
export async function retrieveRelevantChunks(
  query: string,
  limit: number = 5,
  threshold: number = 0.5
): Promise<MatchedChunk[]> {
  const supabase = createServerClient();
  
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Perform vector similarity search
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });
  
  if (error) {
    console.error('Error retrieving chunks:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Build context string from matched chunks
 */
export function buildContext(chunks: MatchedChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant information found in the knowledge base.';
  }
  
  const contextParts = chunks.map((chunk, index) => {
    return `[Source ${index + 1}]\n${chunk.content}`;
  });
  
  return contextParts.join('\n\n---\n\n');
}

/**
 * Generate a response using RAG pipeline
 */
export async function generateResponse(
  query: string,
  strictMode: boolean = true
): Promise<{ response: string; sources: SourceReference[] }> {
  const supabase = createServerClient();
  const openai = getOpenAI();
  
  // Retrieve relevant chunks - using lower threshold (0.2) because OpenAI embeddings
  // tend to produce lower similarity scores, and we want to be inclusive of relevant content
  const chunks = await retrieveRelevantChunks(query, 5, 0.2);
  
  // Get document names for sources
  const documentIds = [...new Set(chunks.map((c) => c.document_id))];
  const { data: documents } = await supabase
    .from('documents')
    .select('id, name')
    .in('id', documentIds);
  
  const documentMap = new Map(documents?.map((d) => [d.id, d.name]) || []);
  
  // Build context
  const context = buildContext(chunks);
  
  // Generate response
  const systemPrompt = strictMode 
    ? SYSTEM_PROMPT + STRICT_MODE_PROMPT 
    : SYSTEM_PROMPT;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Context from knowledge base:\n${context}\n\n---\n\nUser question: ${query}` 
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });
  
  const response = completion.choices[0]?.message?.content || 
    'I apologize, but I was unable to generate a response. Please try again.';
  
  // Build source references
  const sources: SourceReference[] = chunks.map((chunk) => ({
    document_id: chunk.document_id,
    document_name: documentMap.get(chunk.document_id) || 'Unknown',
    chunk_content: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    similarity: chunk.similarity,
  }));
  
  return { response, sources };
}
