import { NextRequest, NextResponse } from 'next/server';
import { 
  createDocument, 
  listDocuments, 
  processDocument 
} from '@/lib/db/documents';
import type { DocumentSourceType, DocumentCategory } from '@/types';

// List all documents
export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}

// Helper function to extract text from file based on type
async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Handle plain text files (.txt, .md)
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return buffer.toString('utf-8');
  }
  
  // Handle PDF files using unpdf
  if (fileName.endsWith('.pdf')) {
    try {
      const { extractText } = await import('unpdf');
      // unpdf expects Uint8Array
      const uint8Array = new Uint8Array(arrayBuffer);
      const result = await extractText(uint8Array);
      // unpdf returns text as an array of strings (one per page)
      const text = result.text;
      return Array.isArray(text) ? text.join('\n') : String(text);
    } catch (error) {
      console.error('PDF parsing error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse PDF file: ${errorMessage}`);
    }
  }
  
  // Handle Word documents (.doc, .docx)
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    try {
      // Dynamic import for mammoth
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Word document parsing error:', error);
      throw new Error('Failed to parse Word document. Make sure mammoth is installed.');
    }
  }
  
  throw new Error(`Unsupported file type: ${fileName}`);
}

// Create a new document
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let name: string;
    let sourceType: DocumentSourceType;
    let content: string | undefined;
    let sourceUrl: string | undefined;
    let category: DocumentCategory;
    
    // Handle multipart/form-data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      name = formData.get('name') as string;
      sourceType = (formData.get('sourceType') as DocumentSourceType) || 'file';
      category = (formData.get('category') as DocumentCategory) || 'general';
      
      if (!file) {
        return NextResponse.json(
          { error: 'File is required for file uploads' },
          { status: 400 }
        );
      }
      
      if (!name) {
        // Use filename without extension as default name
        name = file.name.replace(/\.[^/.]+$/, '');
      }
      
      // Extract text content from the file
      try {
        content = await extractTextFromFile(file);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to extract text from file' },
          { status: 400 }
        );
      }
      
      // Set sourceType to 'file' for file uploads
      sourceType = 'file';
      
    } else {
      // Handle JSON body (text/url)
      const body = await request.json();
      name = body.name;
      sourceType = body.sourceType as DocumentSourceType;
      content = body.content;
      sourceUrl = body.sourceUrl;
      category = (body.category as DocumentCategory) || 'general';
    }
    
    if (!name || !sourceType) {
      return NextResponse.json(
        { error: 'Name and sourceType are required' },
        { status: 400 }
      );
    }
    
    if (sourceType === 'text' && !content) {
      return NextResponse.json(
        { error: 'Content is required for text documents' },
        { status: 400 }
      );
    }
    
    if (sourceType === 'file' && !content) {
      return NextResponse.json(
        { error: 'Could not extract content from file' },
        { status: 400 }
      );
    }
    
    if (sourceType === 'url' && !sourceUrl) {
      return NextResponse.json(
        { error: 'Source URL is required for URL documents' },
        { status: 400 }
      );
    }
    
    // Create the document
    const document = await createDocument(
      name,
      sourceType,
      content,
      sourceUrl,
      category
    );
    
    // Process the document asynchronously
    processDocument(document.id).catch((err) => {
      console.error('Background processing error:', err);
    });
    
    return NextResponse.json(document, { status: 201 });
    
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

