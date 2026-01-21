import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai/rag';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, widgetKey, strictMode = true } = body;
    
    if (!message || !widgetKey) {
      return NextResponse.json(
        { error: 'Message and widgetKey are required' },
        { status: 400 }
      );
    }
    
    const supabase = createServerClient();
    
    // Validate widget exists and is active
    const { data: widget, error: widgetError } = await supabase
      .from('widgets')
      .select('*')
      .eq('widget_key', widgetKey)
      .eq('is_active', true)
      .single();
    
    if (widgetError || !widget) {
      return NextResponse.json(
        { error: 'Invalid or inactive widget' },
        { status: 404 }
      );
    }
    
    // Check domain if allowed_domains is configured
    const origin = request.headers.get('origin');
    if (widget.allowed_domains?.length > 0 && origin) {
      const originHost = new URL(origin).hostname;
      const isAllowed = widget.allowed_domains.some((domain: string) => 
        originHost === domain || originHost.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Domain not allowed' },
          { status: 403 }
        );
      }
    }
    
    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          widget_key: widgetKey,
          visitor_id: request.headers.get('x-forwarded-for') || 'unknown',
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('Session creation error:', sessionError);
      } else {
        currentSessionId = session.id;
      }
    }
    
    // Save user message
    if (currentSessionId) {
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content: message,
      });
    }
    
    // Generate response using RAG with strictMode from request
    const { response, sources } = await generateResponse(message, strictMode);
    
    // Save assistant message
    if (currentSessionId) {
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: response,
        sources,
      });
    }
    
    return NextResponse.json({
      response,
      sources,
      sessionId: currentSessionId,
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
