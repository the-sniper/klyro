import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Verify the session belongs to a widget owned by the user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('widget_key')
      .eq('id', id)
      .single();
      
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('user_id')
      .eq('widget_key', session.widget_key)
      .eq('user_id', user.id)
      .single();
      
    if (widgetError || !widget) {
      return NextResponse.json({ error: 'Unauthorized to view this session' }, { status: 403 });
    }
    
    // Fetch all messages for the session correctly ordered
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, role, content, sources, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true });
      
    if (messagesError) {
      throw messagesError;
    }
    
    return NextResponse.json(messages || []);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching session messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session messages' },
      { status: 500 }
    );
  }
}
