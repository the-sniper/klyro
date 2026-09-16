import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai/rag';
import { createServerClient } from '@/lib/supabase/client';
import { checkOrigin, isUnrestricted } from '@/lib/security/origin';
import { recordRequestMetrics } from '@/lib/db/metrics';
import { isExternalRequestError } from '@/lib/net/fetch-with-timeout';
import {
  clientIpFrom,
  enforceChatRateLimits,
  readLimitFromEnv,
} from '@/lib/security/rate-limit';
import type { PersonaContext, SourceReference } from '@/types';

// The SSE path holds a connection open while the model generates, which the
// Edge runtime's default budget does not accommodate.
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Longest message we will embed and answer. Overridable per deployment. */
const DEFAULT_MAX_MESSAGE_LENGTH = 2000;

/** Widget keys we have already warned about running without domain restrictions. */
const warnedUnrestrictedWidgets = new Set<string>();

/**
 * Turn an upstream failure into something a visitor can read. A third party
 * being slow is not an internal server error, and should not look like one.
 */
function friendlyErrorMessage(error: unknown): string | null {
  if (!isExternalRequestError(error)) return null;
  
  return error.isTimeout
    ? `I could not reach ${error.service} in time, so I cannot answer that right now. Please try again in a moment.`
    : `I could not reach ${error.service} just now, so I cannot answer that right now. Please try again in a moment.`;
}

// CORS headers for cross-origin widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Retry-After is not CORS-safelisted, so cross-origin widgets cannot read it
  // off a 429 unless it is explicitly exposed.
  'Access-Control-Expose-Headers': 'Retry-After',
};

function jsonResponse(data: object, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...extraHeaders },
  });
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
    
    if (typeof message !== 'string' || typeof widgetKey !== 'string') {
      return jsonResponse(
        { error: 'Message and widgetKey must be strings' },
        400
      );
    }
    
    const maxMessageLength = readLimitFromEnv(
      'CHAT_MAX_MESSAGE_LENGTH',
      DEFAULT_MAX_MESSAGE_LENGTH
    );
    
    if (message.length > maxMessageLength) {
      return jsonResponse(
        {
          error: `Message is too long (${message.length} characters, limit ${maxMessageLength})`,
        },
        400
      );
    }
    
    // Rate limit before touching any other table, so a flood costs one RPC.
    const clientIp = clientIpFrom(request.headers);
    const rejection = await enforceChatRateLimits(widgetKey, clientIp);
    
    if (rejection) {
      console.warn('[CHAT] Rate limited:', {
        scope: rejection.scope,
        limit: rejection.limit,
        widgetKey,
        ip: clientIp,
      });
      return jsonResponse(
        {
          error: 'Too many requests. Please slow down and try again shortly.',
          scope: rejection.scope,
          retryAfter: rejection.retryAfterSeconds,
        },
        429,
        { 'Retry-After': String(rejection.retryAfterSeconds) }
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
    
    // Check domain if allowed_domains is configured.
    // Fails closed on a missing Origin: a restricted widget must not be usable
    // from a server-side caller that simply omits the header.
    const origin = request.headers.get('origin');
    const originDecision = checkOrigin(origin, widget.allowed_domains);
    
    if (!originDecision.allowed) {
      console.warn('[CHAT] Origin rejected:', {
        widgetKey,
        origin: origin || 'none',
        reason: originDecision.reason,
      });
      return jsonResponse(
        {
          error:
            originDecision.reason === 'missing_origin'
              ? 'Origin header required for this widget'
              : 'Domain not allowed',
        },
        403
      );
    }
    
    if (isUnrestricted(widget.allowed_domains) && !warnedUnrestrictedWidgets.has(widgetKey)) {
      warnedUnrestrictedWidgets.add(widgetKey);
      console.warn(
        `[CHAT] Widget "${widgetKey}" has no allowed_domains configured and accepts requests from any origin.`
      );
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
          visitor_id: clientIp,
          // Which customer domain this conversation came from.
          origin: origin || null,
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
    
    // Persist the assistant turn and hand back its id, shared by both paths.
    const persistAssistantMessage = async (
      response: string,
      sources: SourceReference[]
    ): Promise<string | null> => {
      if (!currentSessionId) return null;
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'assistant',
          content: response,
          sources,
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('[CHAT] Failed to persist assistant message:', error);
        return null;
      }
      
      return data?.id ?? null;
    };
    
    // Opt in to streaming with Accept: text/event-stream or {"stream": true}.
    const wantsStream =
      request.headers.get('accept')?.includes('text/event-stream') === true ||
      body.stream === true;
    
    if (wantsStream) {
      const encoder = new TextEncoder();
      let closed = false;
      
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (event: object) => {
            if (closed) return;
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch {
              // Client went away mid-stream; stop trying to write to it.
              closed = true;
            }
          };
          
          try {
            const { response, sources, metrics } = await generateResponse(
              message,
              strictMode,
              persona,
              { onToken: (text) => send({ type: 'token', text }) }
            );
            
            // Persist before announcing completion so the id is real.
            const messageId = await persistAssistantMessage(response, sources);
            
            recordRequestMetrics({
              ...metrics,
              widgetKey,
              userId: widget.user_id || null,
              sessionId: currentSessionId,
              messageId,
            });
            
            send({ type: 'sources', sources });
            send({ type: 'done', messageId, sessionId: currentSessionId });
            
            console.log('[CHAT] Streamed response:', {
              sessionIdReturned: currentSessionId || 'NONE',
              responseLength: response.length,
              sourcesCount: sources?.length || 0,
            });
          } catch (error) {
            console.error('[CHAT] Streaming error:', error);
            send({
              type: 'error',
              message:
                friendlyErrorMessage(error) ??
                'Sorry, I hit a problem generating that answer. Please try again.',
            });
          } finally {
            closed = true;
            try {
              controller.close();
            } catch {
              // Already closed by the client disconnecting.
            }
          }
        },
      });
      
      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          // Stop proxies from buffering the stream into one lump.
          'X-Accel-Buffering': 'no',
        },
      });
    }
    
    // Generate response using RAG with persona context
    const { response, sources, metrics } = await generateResponse(
      message,
      strictMode,
      persona
    );
    
    const messageId = await persistAssistantMessage(response, sources);
    
    recordRequestMetrics({
      ...metrics,
      widgetKey,
      userId: widget.user_id || null,
      sessionId: currentSessionId,
      messageId,
    });
    
    console.log('[CHAT] Sending response:', {
      sessionIdReturned: currentSessionId || 'NONE',
      responseLength: response.length,
      sourcesCount: sources?.length || 0
    });
    
    return jsonResponse({
      response,
      sources,
      sessionId: currentSessionId,
      messageId,
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    const friendly = friendlyErrorMessage(error);
    if (friendly) {
      // An upstream timeout is a 503, not an unexplained 500.
      return jsonResponse({ error: friendly }, 503);
    }
    
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

