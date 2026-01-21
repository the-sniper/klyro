import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai/rag';
import { createServerClient } from '@/lib/supabase/client';
import type { PersonaContext } from '@/types';

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
    
    // Validate widget exists and is active, fetch persona config
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
    
    // Fetch recent conversation history for context continuity
    let conversationHistory: PersonaContext['conversationHistory'] = [];
    if (currentSessionId) {
      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true })
        .limit(8); // Last 4 exchanges
      
      if (recentMessages) {
        conversationHistory = recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
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
    
    // Build persona context from widget configuration
    const persona: PersonaContext = {
      ownerName: widget.owner_name || undefined,
      personalityTraits: widget.personality_traits || [],
      communicationStyle: widget.communication_style || 'friendly',
      customInstructions: widget.custom_instructions || undefined,
      external_links: widget.external_links || undefined,
      access_permissions: widget.access_permissions || undefined,
      conversationHistory,
    };
    
    // Generate response using RAG with persona context
    const { response, sources } = await generateResponse(message, strictMode, persona);
    
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
