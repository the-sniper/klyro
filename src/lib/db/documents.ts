import { createServerClient } from '@/lib/supabase/client';
import { fetchWithTimeout } from '@/lib/net/fetch-with-timeout';
import { decodeHtmlEntities } from '@/lib/text/html-entities';
import { chunkDocument, generateEmbeddings } from '@/lib/ai/embeddings';
import type { Document, DocumentSourceType, DocumentCategory } from '@/types';

/**
 * Get admin client for operations that need to bypass RLS
 * (like processing documents in background jobs)
 */
function getAdminClient() {
  return createServerClient();
}

/**
 * Fetch content from a URL
 */
async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetchWithTimeout(url, {
    service: 'url-scraper',
    timeoutMs: 10_000,
  });
  
  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`,
    );
  }
  
  const html = await response.text();
  
  // Simple HTML to text extraction (strip tags, then decode entities so the
  // stored chunk holds "&" rather than the literal "&amp;")
  const textContent = decodeHtmlEntities(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
  
  return textContent;
}

/** How long a document may sit in 'processing' before it is considered stalled. */
export const STALLED_AFTER_MS = 10 * 60 * 1000;

/** How many times the reaper will retry a stalled document before failing it. */
export const MAX_INGESTION_ATTEMPTS = 3;

/** SHA-256 of the text that produced the current chunks. */
export async function computeContentHash(content: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(content),
  );
  
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Process a document: chunk it and generate embeddings
 * Uses admin client since this runs in background and needs to bypass RLS
 */
export async function processDocument(documentId: string): Promise<void> {
  const supabase = getAdminClient();
  
  try {
    // Stamp the start so a reaper can tell a running job from a stranded one.
    await supabase
      .from('documents')
      .update({
        status: 'processing',
        error_message: null,
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', documentId);
    
    // Fetch the document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (fetchError || !document) {
      throw new Error('Document not found');
    }
    
    let content = document.content;
    
    // Fetch URL content if source type is URL
    if (document.source_type === 'url' && document.source_url) {
      content = await fetchUrlContent(document.source_url);
      
      // Update document with fetched content
      await supabase
        .from('documents')
        .update({ content })
        .eq('id', documentId);
    }
    
    if (!content || content.trim().length === 0) {
      throw new Error('Document has no content');
    }
    
    // Re-embedding identical content is pure cost, so skip it when the hash
    // matches and the chunks from that run are still present.
    const contentHash = await computeContentHash(content);
    
    if (document.content_hash === contentHash) {
      const { count } = await supabase
        .from('document_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('document_id', documentId);
      
      if ((count ?? 0) > 0) {
        console.log(`[Documents] Content unchanged for ${documentId}, skipping re-embedding`);
        
        await supabase
          .from('documents')
          .update({ status: 'ready', error_message: null, processing_started_at: null })
          .eq('id', documentId);
        
        return;
      }
    }
    
    // Delete existing chunks
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);
    
    // Chunk the document and filter out empty chunks
    const rawChunks = chunkDocument(content);
    const chunks = rawChunks.filter(chunk => chunk && chunk.trim().length > 0);
    
    if (chunks.length === 0) {
      throw new Error('Document produced no valid chunks');
    }
    
    console.log(`[Documents] Processing ${chunks.length} chunks (${rawChunks.length - chunks.length} empty chunks filtered)`);
    
    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);
    
    // Insert chunks with embeddings
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      content: chunk,
      embedding: embeddings[index],
      chunk_index: index,
      metadata: {
        document_name: document.name,
        category: document.category,
      },
    }));
    
    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);
    
    if (insertError) {
      throw insertError;
    }
    
    // Update status to ready
    await supabase
      .from('documents')
      .update({
        status: 'ready',
        content_hash: contentHash,
        processing_started_at: null,
      })
      .eq('id', documentId);
    
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update status to failed with error message
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        processing_started_at: null,
      })
      .eq('id', documentId);
    
    throw error;
  }
}

/**
 * Create a new document
 */
export async function createDocument(
  name: string,
  sourceType: DocumentSourceType,
  userId: string,
  content?: string,
  sourceUrl?: string,
  category?: DocumentCategory
): Promise<Document> {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('documents')
    .insert({
      name,
      source_type: sourceType,
      content,
      source_url: sourceUrl,
      category,
      status: 'queued',
      user_id: userId,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

/**
 * List all documents for a specific user
 */
export async function listDocuments(userId: string): Promise<Document[]> {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data || [];
}

/**
 * Delete a document (only if owned by the user)
 */
export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  const supabase = getAdminClient();
  
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);
  
  if (error) {
    throw error;
  }
}

/**
 * Delete all documents for a specific user
 */
export async function clearAllDocuments(userId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
