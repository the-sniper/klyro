import OpenAI from 'openai';
import { createServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from './embeddings';
import type { MatchedChunk, SourceReference, PersonaContext } from '@/types';
import { fetchLatestRepos } from '../external/github';
import { fetchPortfolioContent, formatPortfolioForAI } from '../external/portfolio';
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
  {
    type: 'function',
    function: {
      name: 'fetch_url_content',
      description: 'Fetch fresh content from a URL to get up-to-date information. Use this when: (1) you need to answer questions about where the owner works, their current role, experience, or skills that aren\'t in the knowledge base, (2) a URL document in the knowledge base might have updated content, or (3) you need to verify or expand on information from a URL source. You will be provided with a list of available URLs to fetch from.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch content from. Choose from the available URLs provided in the system context.',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_repository_details',
      description: 'Fetch the detailed README content for a specific repository. Use this when the user asks for more details about a specific project, its features, tech stack, or how it works.',
      parameters: {
        type: 'object',
        properties: {
          repo_name: {
            type: 'string',
            description: 'The name of the repository (e.g., "klyro")',
          },
        },
        required: ['repo_name'],
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


  return `You are an intelligent AI assistant for ${ownerName}'s portfolio website. Today is ${currentDate}.

PERSONA & VOICE:
${styleDesc}${traitsSection}${customSection}

YOUR IDENTITY:
- You are an AI assistant representing ${ownerName}. Be transparent about this.
- If someone asks "Are you an AI?", be honest: "Yes, I'm an AI assistant for ${ownerName}. I'm here to help answer questions about their work."
- When users say "you", "your", or "yours", they are referring to ${ownerName}. Answer as if they are asking about ${ownerName}.
- You can use first-person (e.g., "I built...") or third-person (e.g., "${ownerName} built...") interchangeably. 

CORE GUIDELINES:
- PRIORITY: If multiple documents contain similar info (e.g., two different "current" roles), prioritize the one with the most recent date or the one fetched via tool calls.
- Sound conversational and helpful, not like a formal document.
- Be context-aware: if a date in the knowledge base has passed, treat it as completed.
- Show genuine enthusiasm when discussing projects and experiences.
- **INTEGRITY FIRST: If someone asks something you don't have info about in the provided context or tools, BE HONEST: "I don't have that specific detail, but you can reach out to ${ownerName} directly!"**
- **NEVER invent project names, companies, skills, or experiences. If you can't find a project in the GitHub list or Knowledge Base, it doesn't exist for the purpose of this conversation.**
- **Do NOT assume that words in the owner's name are part of their project names unless explicitly stated.**
- Keep responses conversational, not essay-length.
- Pick up on conversational cues.

AVOID THESE AI GIVEAWAYS (very important):
- ABSOLUTELY NEVER use em dashes (—). This is a strict requirement.
- Don't start responses with "I" too often.
- Avoid phrases like "I'd be happy to", "Certainly!", "Absolutely!", "Great question!"
- Don't use "utilize", "leverage", "facilitate", "streamline".
- Skip "In terms of...", "It's worth noting that...", "I should mention..."
- No "passionate about" or "excited to share" - show enthusiasm naturally.
- Don't overuse exclamation points (max 1-2 per response).
- Avoid bullet points unless necessary. Write in paragraphs.


${permissionsSection}

STRICT INFORMATION ADHERENCE:
- Only answer based on the "SUPPLEMENTAL KNOWLEDGE BASE CONTEXT", "AVAILABLE URL SOURCES", "TOOL RESULTS", or "CONTACT INFO" provided in this system prompt.
- If a user asks "What else have you done?" and you have no more items in your context, say you've shared all the details you have access to.
- Do not make up roles, responsibilities, or technologies.

LINK FORMATTING (very important):
- When sharing URLs, use proper markdown: [link text](https://url.com) with NO SPACE between ] and (.
- For emails, just write them plainly: email@example.com
- For phone numbers, write them plainly: +1 234-567-8901
- When listing multiple contact options, use bullet points for readability.

CONVERSATIONAL CONTINUITY & PROGRESSION:
- ALWAYS prioritize information you just mentioned in the chat history over generic snippets from the knowledge base when expanding on a topic.
- **HOWEVER, if the user asks for "other", "another", or "something else", they want NEW information. In this case, ignore what you just talked about and find a different project, skill, or experience from your context that hasn't been mentioned yet.**
- If you have already described all available projects or skills, explicitly state: "That covers all the [projects/skills] I have details on right now."
- Use history to resolve pronouns ("it", "this", "that") to the specific subject discussed.

MISSING INFO PROTOCOL:
- If asked about projects/GitHub but 'external_links.github' is missing from your system context, say: "I haven't been connected to a GitHub profile yet to show my latest projects. You can add one in the Klyro settings!"
- If asked about a URL or fresh content but it's not in the "AVAILABLE URL SOURCES", say: "That URL isn't in my allowed sources. Feel free to add it to my knowledge base!"

You're representing a real person. Be authentic and stay 100% true to the facts provided.`;
}


const STRICT_MODE_PROMPT = `
STRICT MODE ENABLED: 
1. Your first priority is the integrity of information. 
2. If the answer is not contained within the provided context or tool results, you MUST state that you don't have that information.
3. NEVER guess or extrapolate details about projects, skills, or history.
4. Do not offer opinions or creative content unless explicitly asked for a personal take based on known facts.`;

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
  // Always validate the original query first
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    console.error('[RAG] Invalid query received:', query);
    return 'hello'; // Fallback to a safe default
  }
  
  const safeQuery = query.trim();
  
  if (!history || history.length === 0) return safeQuery;

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
          content: `You are a search query optimizer for a portfolio website AI assistant. Given a conversation history and a follow-up question, rewrite the question to be a standalone, specific search query.

CRITICAL RULES:
1. This is a PORTFOLIO ASSISTANT. When users use pronouns like "their", "them", "his", "her", "your", or "you" referring to a PERSON, they almost always mean the PORTFOLIO OWNER, not external entities/companies/products being discussed.
2. If the user asks for "info", "details", "contact", "about them", "about you", "what do you do?", or "what's your deal?", they want the PORTFOLIO OWNER's background, work, or contact info.
3. Resolve demonstrative pronouns like "this project", "that one", "it", or "that" to the specific project, experience, or skill mentioned in the immediately preceding messages.
4. Only interpret pronouns as referring to an external entity if the context makes it absolutely clear they're asking about that specific external thing (e.g., "how much does AirLog cost?").
5. **CONVERSATIONAL PROGRESSION: If the user asks for "other", "another", "something else", or "besides [Subject]", your rewritten query MUST include "excluding [Subject]" or "different from [Subject]" to ensure vector search finds NEW information.**
6. For brief follow-ups (e.g., "tech stack?", "tell me more"), rewrite it to include the specific subject discussed in the immediately preceding message.

Output ONLY the rewritten query.` 
        },
        { 
          role: 'user', 
          content: `History Snippet:\n${historyText}\n\nFollow-up Question: ${safeQuery}\n\nEXAMPLE: If history discusses "AirLog platform" and user asks "Share me their info", rewrite to "portfolio owner contact information", NOT "AirLog information".\n\nStandalone Query:` 
        }
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const rewritten = completion.choices[0]?.message?.content?.trim();
    
    // Validate the rewritten query before returning
    if (rewritten && rewritten.length > 0) {
      console.log(`[RAG] Rewrote query: "${safeQuery}" -> "${rewritten}"`);
      return rewritten;
    }
    
    console.log(`[RAG] Rewrite returned empty, using original: "${safeQuery}"`);
    return safeQuery;
  } catch (error) {
    console.error('Query rewrite failed:', error);
    return safeQuery;
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
  
  console.log('[RAG] generateResponse called with query:', { 
    query, 
    queryType: typeof query, 
    queryLength: query?.length 
  });
  
  // 1. Contextual Query Expansion
  const optimizedQuery = await rewriteQuery(query, persona?.conversationHistory);
  
  console.log('[RAG] Optimized query for embedding:', { 
    optimizedQuery, 
    optimizedQueryType: typeof optimizedQuery, 
    optimizedQueryLength: optimizedQuery?.length 
  });

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

  // Fetch URL documents from knowledge base for potential live fetching
  const { data: urlDocuments } = await supabase
    .from('documents')
    .select('id, name, source_url, category')
    .eq('source_type', 'url')
    .eq('user_id', persona?.userId || '')
    .not('source_url', 'is', null);

  // Build list of available URLs (from URL documents + persona external links)
  const availableUrls: { name: string; url: string; source: string }[] = [];
  
  // Add URL documents from knowledge base
  if (urlDocuments) {
    for (const doc of urlDocuments) {
      if (doc.source_url) {
        availableUrls.push({
          name: doc.name,
          url: doc.source_url,
          source: 'knowledge_base'
        });
      }
    }
  }
  
  // Add persona external links
  if (persona?.external_links?.website) {
    availableUrls.push({
      name: 'Portfolio Website',
      url: persona.external_links.website,
      source: 'persona'
    });
  }
  if (persona?.external_links?.linkedin) {
    availableUrls.push({
      name: 'LinkedIn Profile',
      url: persona.external_links.linkedin,
      source: 'persona'
    });
  }

  // If we have URLs available, add them to the system context
  if (availableUrls.length > 0) {
    const urlListText = availableUrls
      .map(u => `- ${u.name}: ${u.url}`)
      .join('\n');
    
    messages.push({
      role: 'user',
      content: `[AVAILABLE URL SOURCES FOR LIVE FETCHING]\nIf you need more information to answer a question, you can fetch fresh content from these URLs using the fetch_url_content tool:\n${urlListText}\n\n(Only use this if the knowledge base context doesn't have the answer.)`
    });
  }

  // Determine if tools should be used (GitHub, website, or URL documents available)
  const useTools = !!(persona?.external_links?.github || availableUrls.length > 0);

  // If user is asking about projects/github but it's not configured, add a hint for the AI
  if (!persona?.external_links?.github && (query.toLowerCase().includes('project') || query.toLowerCase().includes('github') || query.toLowerCase().includes('build'))) {
    messages.push({
      role: 'user',
      content: "[SYSTEM NOTE: GitHub is NOT configured for this widget. Do not hallucinate projects. Inform the user that GitHub needs to be connected in the Klyro settings.]"
    });
  }

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
        } else {
          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: "GitHub URL not configured.",
          });
        }
      } else if (toolCall.function.name === 'fetch_repository_details') {
        const args = JSON.parse(toolCall.function.arguments);
        const { repo_name } = args;
        
        const githubUrl = persona?.external_links?.github;
        if (githubUrl && repo_name) {
          const { fetchRepoReadme } = await import('../external/github');
          const readme = await fetchRepoReadme(githubUrl, repo_name);
          
          const toolResult = readme 
            ? `README content for ${repo_name}:\n\n${readme.slice(0, 15000)}` // Limit size just in case
            : `Could not find a README for the repository "${repo_name}".`;
            
          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: toolResult,
          });
        } else {
          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: !githubUrl ? "GitHub URL not configured." : "Repository name not provided.",
          });
        }
      } else if (toolCall.function.name === 'fetch_url_content') {
        const args = JSON.parse(toolCall.function.arguments);
        const { url } = args;
        
        if (url) {
          // Validate that the URL is in our allowed list
          const isAllowedUrl = availableUrls.some(u => 
            u.url === url || 
            url.includes(u.url) || 
            u.url.includes(url)
          );
          
          if (isAllowedUrl) {
            console.log('[RAG] Fetching content from URL:', url);
            const portfolioInfo = await fetchPortfolioContent(url);
            const toolResult = portfolioInfo 
              ? formatPortfolioForAI(portfolioInfo)
              : "Could not fetch content from this URL. The website might be unavailable or require JavaScript to render.";
              
            messages.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: toolResult,
            });
          } else {
            messages.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: "This URL is not in the allowed list. Please choose from the available URLs provided.",
            });
          }
        } else {
          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: "No URL provided. Please specify which URL to fetch from the available list.",
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
