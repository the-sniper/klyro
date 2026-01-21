import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument, processDocument } from '@/lib/db/documents';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get a single document (only if owned by current user)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// Delete a document (only if owned by current user)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await deleteDocument(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// Reprocess a document (only if owned by current user)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    
    // Verify ownership before reprocessing
    const supabase = createServerClient();
    const { data: doc } = await supabase
      .from('documents')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
