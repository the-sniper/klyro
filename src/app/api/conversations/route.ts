import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();
    
    // First, get the user's widgets to know which sessions they have access to
    const { data: widgets, error: widgetsError } = await supabase
      .from('widgets')
      .select('widget_key')
      .eq('user_id', user.id);
      
    if (widgetsError) {
      throw widgetsError;
    }
    
    if (!widgets || widgets.length === 0) {
      return NextResponse.json([]);
    }
    
    const widgetKeys = widgets.map(w => w.widget_key);
    
    // Fetch sessions along with their messages
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        widget_key,
        visitor_id,
        created_at,
        chat_messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .in('widget_key', widgetKeys)
      .order('created_at', { ascending: false });
      
    if (sessionsError) {
      throw sessionsError;
    }
    
    // Process the results to match frontend needs
    const processedSessions = sessions?.map(session => {
      // Sort messages to find the latest
      const sortedMessages = [...(session.chat_messages || [])].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
      
      return {
        id: session.id,
        visitor_id: session.visitor_id,
        created_at: session.created_at,
        messageCount: session.chat_messages ? session.chat_messages.length : 0,
        latestMessage: lastMessage ? {
          content: lastMessage.content,
          role: lastMessage.role,
          created_at: lastMessage.created_at
        } : null
      };
    }) || [];
    
    return NextResponse.json(processedSessions);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
