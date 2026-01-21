import { createServerClient } from '@/lib/supabase/client';
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }
  
  const html = await response.text();
  
  // Simple HTML to text extraction (strip tags)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return textContent;
}

/**
 * Process a document: chunk it and generate embeddings
 * Uses admin client since this runs in background and needs to bypass RLS
 */
export async function processDocument(documentId: string): Promise<void> {
  const supabase = getAdminClient();
  
  try {
    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing', error_message: null })
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
    
    // Delete existing chunks
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);
    
    // Chunk the document
    const chunks = chunkDocument(content);
    
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
      .update({ status: 'ready' })
      .eq('id', documentId);
    
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update status to failed with error message
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
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
