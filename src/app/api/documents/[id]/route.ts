import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument, processDocument } from '@/lib/db/documents';
import { createServerClient } from '@/lib/supabase/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get a single document
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    await deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// Reprocess a document
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (body.action === 'reprocess') {
      // Process document asynchronously
      processDocument(id).catch((err) => {
        console.error('Background processing error:', err);
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Document queued for reprocessing' 
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
