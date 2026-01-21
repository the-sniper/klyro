import { NextRequest, NextResponse } from 'next/server';
import { 
  createDocument, 
  listDocuments, 
  processDocument 
} from '@/lib/db/documents';

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

// Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sourceType, content, sourceUrl, category } = body;
    
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
