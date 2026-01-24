import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai/rag';
import { createServerClient } from '@/lib/supabase/client';
import type { PersonaContext } from '@/types';

// CORS headers for cross-origin widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, widgetKey, strictMode = true } = body;
    
    if (!message || !widgetKey) {
      return jsonResponse(
        { error: 'Message and widgetKey are required' },
        400
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
      return jsonResponse(
        { error: 'Invalid or inactive widget' },
        404
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
        return jsonResponse(
          { error: 'Domain not allowed' },
          403
        );
      }
    }
    
    // Create or validate session
    let currentSessionId = null;
    
    console.log('[CHAT] Incoming request:', {
      widgetKey,
      incomingSessionId: sessionId || 'none',
      hasMessage: !!message,
      strictMode
    });
    
    // If sessionId provided, verify it exists
    if (sessionId) {
      console.log('[CHAT] Validating provided sessionId:', sessionId);
      const { data: existingSession, error: sessionLookupError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('widget_key', widgetKey)
        .single();
      
      if (sessionLookupError) {
        console.log('[CHAT] Session lookup error:', sessionLookupError.message);
      }
      
      if (existingSession) {
        currentSessionId = sessionId;
        console.log('[CHAT] Session validated, using existing:', currentSessionId);
      } else {
        console.log('[CHAT] Invalid sessionId provided, will create new session');
      }
    } else {
      console.log('[CHAT] No sessionId provided, will create new session');
    }
    
    // Create new session if needed
    if (!currentSessionId) {
      console.log('[CHAT] Creating new session for widget:', widgetKey);
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          widget_key: widgetKey,
          visitor_id: request.headers.get('x-forwarded-for') || 'unknown',
        })
        .select('id')
        .single();
      
      if (sessionError) {
        console.error('[CHAT] Session creation FAILED:', sessionError);
      } else {
        currentSessionId = session.id;
        console.log('[CHAT] New session created:', currentSessionId);
      }
    }
    
    console.log('[CHAT] Final sessionId for this request:', currentSessionId || 'NONE');
    
    // Fetch recent conversation history for context continuity
    let conversationHistory: PersonaContext['conversationHistory'] = [];
    if (currentSessionId) {
      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: false })
        .limit(8); // Last 8 messages
      
      if (recentMessages) {
        // Reverse to maintain chronological order [oldest -> newest]
        conversationHistory = recentMessages.reverse().map(m => ({
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
    // Include userId for multi-tenancy filtering in RAG
    const persona: PersonaContext = {
      userId: widget.user_id || undefined, // Widget owner's user_id for document filtering
      ownerName: widget.owner_name || undefined,
      personalityTraits: widget.personality_traits || [],
      communicationStyle: widget.communication_style || 'friendly',
      customInstructions: widget.custom_instructions || undefined,
      external_links: widget.external_links || undefined,
      access_permissions: widget.access_permissions || {
        can_share_github: true,
        can_share_linkedin: true,
        can_share_twitter: true,
        can_share_email: true,
        can_discuss_salary: false,
        can_schedule_calls: true,
        salary_range: '',
        currency: 'USD',
        open_for_negotiation: true,
      },
      calendly_token: widget.calendly_token || undefined,
      conversationHistory,
    };

    console.log('DEBUG: Chat Persona Context:', {
      widgetKey,
      userId: persona.userId,
      ownerName: persona.ownerName,
      hasExternalLinks: !!persona.external_links,
      links: persona.external_links,
      permissions: persona.access_permissions,
      hasCalendly: !!persona.calendly_token,
      calendlyLength: persona.calendly_token?.length || 0
    });
    
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
    
    console.log('[CHAT] Sending response:', {
      sessionIdReturned: currentSessionId || 'NONE',
      responseLength: response.length,
      sourcesCount: sources?.length || 0
    });
    
    return jsonResponse({
      response,
      sources,
      sessionId: currentSessionId,
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return jsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

