import OpenAI from 'openai';
import { createServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from './embeddings';
import type { MatchedChunk, SourceReference, PersonaContext } from '@/types';
import { fetchLatestRepos } from '../external/github';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/index';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Communication style descriptions for the AI
 */
const STYLE_DESCRIPTIONS: Record<string, string> = {
  formal: 'Use polished, professional language. Avoid slang and contractions. Be articulate and precise.',
  casual: 'Be super relaxed and conversational. Use contractions, casual phrases, and feel free to be a bit playful.',
  friendly: 'Be warm and approachable. Use contractions naturally. Be enthusiastic but still professional.',
  professional: 'Strike a balance between warmth and professionalism. Be personable yet polished.',
  enthusiastic: 'Be high energy and excited! Use exclamation points appropriately (but don\'t overdo it). Show genuine passion for every topic.',
  calm: 'Be measured, thoughtful, and reflective. Take time to explain things clearly. Use a soothing, steady tone.',
};


/**
 * Define tools available to the AI
 */
const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'fetch_latest_projects',
      description: 'Fetch the latest projects and repositories from the owner\'s GitHub profile. Use this when the user asks about recent work, latest projects, or what the owner has been building lately.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of repositories to fetch (default: 5)',
          },
        },
      },
    },
  },
];

/**
 * Generate a dynamic system prompt with persona awareness
 */
function getSystemPrompt(persona?: PersonaContext): string {
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Build persona-specific instructions
  const ownerName = persona?.ownerName ? persona.ownerName : 'the portfolio owner';
  const styleDesc = persona?.communicationStyle 
    ? STYLE_DESCRIPTIONS[persona.communicationStyle] 
    : STYLE_DESCRIPTIONS.friendly;
  
  const traitsSection = persona?.personalityTraits?.length 
    ? `\nPersonality: You embody these traits: ${persona.personalityTraits.join(', ')}. Let these shine through naturally in your responses.`
    : '';
  
  const customSection = persona?.customInstructions 
    ? `\nAdditional instructions from ${ownerName}: ${persona.customInstructions}`
    : '';

  // Build permissions and links section - only include links that are actually configured
  let permissionsSection = '';
  if (persona?.access_permissions || persona?.external_links) {
    const p = persona?.access_permissions || {};
    const l = persona?.external_links || {};
    
    const linkItems: string[] = [];
    
    // Only add items that have actual links configured
    if (p.can_share_github && l.github) {
      linkItems.push(`- GitHub: ${l.github}`);
    }
    if (p.can_share_linkedin && l.linkedin) {
      linkItems.push(`- LinkedIn: ${l.linkedin}`);
    }
    if (p.can_share_twitter && l.twitter) {
      linkItems.push(`- Twitter/X: ${l.twitter}`);
    }
    if (p.can_share_email && l.email) {
      linkItems.push(`- Email: ${l.email}`);
    }
    if (l.phone) {
      linkItems.push(`- Phone: ${l.phone}`);
    }
    if (l.website) {
      linkItems.push(`- Website: ${l.website}`);
    }
    
    // Build the section only if there are any links to share
    if (linkItems.length > 0) {
      permissionsSection = `\n\nCONTACT INFO YOU CAN SHARE:
${linkItems.join('\n')}

When sharing links, format them naturally in your response. Only share what's listed above.`;
    }
    
    // Add restrictions
    const restrictions: string[] = [];
    if (!p.can_discuss_salary) restrictions.push('salary expectations');
    if (!p.can_schedule_calls) restrictions.push('scheduling calls directly');
    
    if (restrictions.length > 0) {
      permissionsSection += `\n\nDO NOT discuss: ${restrictions.join(', ')}. Politely decline if asked.`;
    }
  }


  return `You are speaking on behalf of ${ownerName} on their portfolio website. Today is ${currentDate}.

PERSONA & VOICE:
${styleDesc}${traitsSection}${customSection}

CORE GUIDELINES:
- Speak as if you ARE ${ownerName}, using first-person ("I", "my", "me") naturally.
- Sound like a real person texting or chatting, not a formal document.
- Be context-aware: if a date in the knowledge base has passed (e.g., "scheduled for June 2025"), treat it as completed. Say "I finished that project" not "It's scheduled for June 2025."
- Show genuine enthusiasm when discussing projects and experiences.
- If someone asks something you don't have info about, be honest: "I don't have that detail handy, but feel free to reach out!"
- Keep responses conversational, not essay-length.
- Pick up on conversational cues (if someone says "cool!" you might say "Right?! I was really excited about that one...")

AVOID THESE AI GIVEAWAYS (very important):
- ABSOLUTELY NEVER use em dashes (—). This is a strict requirement. Use commas, periods, or just restructure the sentence. Any response containing an em dash is considered a failure.
- Don't start responses with "I" too often. Mix it up.
- Avoid phrases like "I'd be happy to", "Certainly!", "Absolutely!", "Great question!"
- Don't use "utilize" (say "use"), "leverage" (say "use"), "facilitate", "streamline"
- Skip "In terms of...", "It's worth noting that...", "I should mention..."
- No "passionate about" or "excited to share" - just show the enthusiasm naturally
- Don't overuse exclamation points. One or two per response max.
- Avoid bullet points unless really necessary. Write in paragraphs like a person would.


${permissionsSection}

ANSWERING QUESTIONS:
- Use the provided context to give accurate answers.
- You can infer the owner's name from testimonials, document titles, or context clues.
- Connect different pieces of information when relevant.
- Don't just list facts. Weave them into natural responses.

LINK FORMATTING (very important):
- When sharing URLs, use proper markdown: [link text](https://url.com) with NO SPACE between ] and (.
- Example: "Check out my [GitHub](https://github.com/username)" NOT "my [GitHub] (https://...)"
- For emails, just write them plainly: email@example.com
- For phone numbers, write them plainly: +1 234-567-8901

CONVERSATIONAL CONTINUITY:
- ALWAYS prioritize information you just mentioned in the chat history over generic snippets from the knowledge base.
- If the user asks a follow-up ("tech?", "tell me more", "how?"), refer back to the specific project or experience you were just talking about.
- If you just described a project from GitHub, and the user asks for more details, talk about that specific project. Don't revert to talking about yourself generally.

You're representing a real person. Be authentic and let their personality come through.`;
}


const STRICT_MODE_PROMPT = `
STRICT MODE: Primarily rely on the provided knowledge base context. However, ALWAYS use your Persona, Instructions, and any contact details provided in this system prompt (like email, phone, links).`;

/**
 * Retrieve relevant document chunks using vector similarity search
 * @param query - The search query
 * @param userId - The user ID to filter documents by (for multi-tenancy)
 * @param limit - Maximum number of chunks to return
 * @param threshold - Minimum similarity threshold
 */
export async function retrieveRelevantChunks(
  query: string,
  userId?: string,
  limit: number = 5,
  threshold: number = 0.4
): Promise<MatchedChunk[]> {
  const supabase = createServerClient();
  
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Perform vector similarity search with user filtering
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_user_id: userId || null,
  });
  
  if (error) {
    console.error('Error retrieving chunks:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Build context string from matched chunks with document metadata
 */
export function buildContext(chunks: MatchedChunk[], documentMap: Map<string, string>): string {
  if (chunks.length === 0) {
    return 'No relevant information found in the knowledge base.';
  }
  
  const contextParts = chunks.map((chunk, index) => {
    const docName = documentMap.get(chunk.document_id) || 'General';
    return `[Source ${index + 1}: ${docName}]\n${chunk.content}`;
  });
  
  return contextParts.join('\n\n---\n\n');
}

/**
 * Build conversation history for context continuity
 */
function buildConversationMessages(
  history: PersonaContext['conversationHistory'],
  context: string,
  query: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  // Add recent conversation history (last 4 exchanges max to manage token usage)
  if (history && history.length > 0) {
    const recentHistory = history.slice(-8); // Last 4 exchanges (8 messages)
    messages.push(...recentHistory);
  }
  
  // Add Knowledge Base context as a background information message
  if (context && context !== 'No relevant information found in the knowledge base.') {
    messages.push({
      role: 'user', // UI roles only support user/assistant in many pipelines, so we use 'user' but label it clearly
      content: `[SUPPLEMENTAL KNOWLEDGE BASE CONTEXT]\n${context}\n\n(Use this only if relevant. If the answer is already in our conversation above, use that instead.)`
    });
  }

  // Add current query as the final message
  messages.push({
    role: 'user',
    content: query
  });
  
  return messages;
}

/**
 * Rewrite the user's query to be standalone and context-aware based on history.
 * This ensures vector search finds relevant results for brief follow-up questions.
 */
async function rewriteQuery(query: string, history: PersonaContext['conversationHistory']): Promise<string> {
  if (!history || history.length === 0) return query;

  try {
    const openai = getOpenAI();
    const historyText = history
      .slice(-4) // Just the last 2 exchanges for speed
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a search query optimizer. Given a conversation history and a follow-up question, rewrite the question to be a standalone, specific search query. EXTREMELY IMPORTANT: If the user asks a brief follow-up (e.g., "tech stack?", "tell me more"), rewrite it to include the specific project or subject discussed in the immediately preceding message. Output ONLY the rewritten query.' 
        },
        { 
          role: 'user', 
          content: `History Snippet:\n${historyText}\n\nFollow-up Question: ${query}\n\nStandalone Query:` 
        }
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const rewritten = completion.choices[0]?.message?.content?.trim();
    console.log(`[RAG] Rewrote query: "${query}" -> "${rewritten}"`);
    return rewritten || query;
  } catch (error) {
    console.error('Query rewrite failed:', error);
    return query;
  }
}

/**
 * Generate a response using RAG pipeline with persona awareness
 */
export async function generateResponse(
  query: string,
  strictMode: boolean = true,
  persona?: PersonaContext
): Promise<{ response: string; sources: SourceReference[] }> {
  const supabase = createServerClient();
  const openai = getOpenAI();
  
  // 1. Contextual Query Expansion
  const optimizedQuery = await rewriteQuery(query, persona?.conversationHistory);

  // 2. Retrieve relevant chunks using the optimized query (filtered by user_id)
  const chunks = await retrieveRelevantChunks(optimizedQuery, persona?.userId, 5, 0.2);
  
  // Get document names for sources and context building
  const documentIds = [...new Set(chunks.map((c) => c.document_id))];
  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, category')
    .in('id', documentIds);
  
  const documentMap = new Map(documents?.map((d) => [d.id, d.name]) || []);
  
  // Build context with document names
  const context = buildContext(chunks, documentMap);
  
  // Generate system prompt with persona
  const systemPrompt = strictMode 
    ? getSystemPrompt(persona) + STRICT_MODE_PROMPT 
    : getSystemPrompt(persona);
  
  // Build messages including conversation history
  const conversationMessages = buildConversationMessages(
    persona?.conversationHistory,
    context,
    query
  );
  
  let messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationMessages.map(m => ({ 
      role: m.role as 'user' | 'assistant', 
      content: m.content 
    })),
  ];

  // Determine if tools should be used
  const useTools = !!persona?.external_links?.github;

  let completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    ...(useTools && { tools: TOOLS, tool_choice: 'auto' as const }),
    temperature: 0.75,
    max_tokens: 600,
  });
  
  let responseMessage = completion.choices[0]?.message;

  // Handle tool calls if any
  if (responseMessage.tool_calls) {
    messages.push(responseMessage);
    
    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.function.name === 'fetch_latest_projects') {
        const args = JSON.parse(toolCall.function.arguments);
        const { limit = 5 } = args;
        
        const githubUrl = persona?.external_links?.github;
        if (githubUrl) {
          const repos = await fetchLatestRepos(githubUrl, limit);
          const toolResult = repos.length > 0 
            ? JSON.stringify(repos)
            : "No repositories found or could not fetch from GitHub.";
            
          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: toolResult,
          });
        }
      }
    }
    
    // Second call to generate final response with tool results
    completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.75,
      max_tokens: 600,
    });
  }
  
  const finalResponse = (completion.choices[0]?.message?.content || 
    "Hmm, I hit a snag there. Mind trying again?")
    .replace(/\u2014/g, ', ') // Replace em-dashes with comma+space
    .replace(/\u2013/g, '-'); // Replace en-dashes with hyphens
  
  // Build source references
  const sources: SourceReference[] = chunks.map((chunk) => ({
    document_id: chunk.document_id,
    document_name: documentMap.get(chunk.document_id) || 'Unknown',
    chunk_content: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? '...' : ''),
    similarity: chunk.similarity,
  }));
  
  return { response: finalResponse, sources };
}
