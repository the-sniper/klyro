import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/client";
import { generateEmbedding } from "./embeddings";
import type { MatchedChunk, SourceReference, PersonaContext } from "@/types";
import { fetchLatestRepos } from "../external/github";
import {
  fetchPortfolioContent,
  formatPortfolioForAI,
} from "../external/portfolio";
import type {
  ChatCompletionTool,
  ChatCompletionMessageParam,
} from "openai/resources/index";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Communication style descriptions for the AI
 */
const STYLE_DESCRIPTIONS: Record<string, string> = {
  formal:
    "Use polished, professional language. Avoid slang and contractions. Be articulate and precise. Structure responses logically with clear reasoning.",
  casual:
    "Be super relaxed and conversational. Use contractions, casual phrases, and feel free to be a bit playful. Sound like texting a friend.",
  friendly:
    "Be warm and approachable. Use contractions naturally. Be enthusiastic but still professional. Add personal touches to responses.",
  professional:
    "Strike a balance between warmth and professionalism. Be personable yet polished. Focus on delivering value with every response.",
  enthusiastic:
    'You have PERSONALITY. You are not a corporate FAQ. Sound like a smart, charming person who genuinely enjoys explaining things. Use conversational asides ("honestly?", "here\'s the cool part", "plot twist:"). React to things ("which is pretty neat", "no boring static pages here"). Have opinions and voice. Make it feel like a real conversation with someone interesting.',
  calm: "Be measured, thoughtful, and reflective. Take time to explain things clearly. Use a soothing, steady tone.",
};

/**
 * Detailed personality trait behaviors that fundamentally change how the AI responds
 */
const TRAIT_BEHAVIORS: Record<string, string> = {
  // The Muse traits - witty, creative, humorous
  creative:
    "REQUIRED: Use at least one unexpected analogy or comparison per response. Never describe something plainly when a creative comparison works better.",
  curious:
    'REQUIRED: Include phrases like "here\'s the fun part", "plot twist:", "the interesting bit?", or "ever notice how..." to pull readers in.',
  storyteller:
    'REQUIRED: Don\'t just list what something does. Set up the problem first ("You know how portfolios just sit there?"), THEN reveal the solution.',
  empathetic:
    'Connect with what they actually want to know. If they ask "what is this?", they want to know why it matters to THEM.',
  witty:
    'REQUIRED: Add at least one wry observation, playful aside, or clever turn of phrase. Use phrases like "spoiler alert:", "translation:", "fancy way of saying", "basically", or self-aware comments.',
  inspiring:
    'REQUIRED: When something is genuinely cool, SAY it\'s cool. Use "the neat part?", "here\'s where it gets good", "honestly pretty slick".',
  humorous:
    'REQUIRED: Use understatement and contrast for humor. "Does the job while you sleep" beats "Amazing 24/7 availability!" Be dry, not loud.',

  // The Strategist traits - results-driven, business-focused
  confident:
    "Speak with conviction. No hedging with 'might' or 'could'. State things definitively: 'This delivers X' not 'This could help with X'.",
  "big-picture thinker":
    "ALWAYS connect features to business outcomes. Don't just say what it does - say what RESULT it drives. ROI, efficiency gains, competitive advantage.",
  persuasive:
    "Sell the vision. Use phrases like 'the bottom line is', 'what this means for you', 'the real value here'. Make them see why they need this.",
  leader:
    "Guide the conversation with authority. Give recommendations: 'Here's what I'd suggest', 'The smart move is'. Be the trusted advisor.",

  // The Architect traits - technical depth, engineering mindset
  technical:
    "Explain HOW things work, not just WHAT they do. Mention the tech stack, architecture patterns, or implementation details when relevant.",
  methodical:
    "Structure responses with clear logic. Use phrases like 'First... then... finally' or 'The way it works is'. Walk through the process step by step.",
  "detail-oriented":
    "Be specific. Instead of 'it's fast', say 'responses typically come back in under 200ms'. Numbers, specs, concrete details.",
  independent:
    "Anticipate the follow-up technical questions and address them preemptively. Provide complete, self-contained explanations.",

  // Common/suggested traits
  analytical:
    "Break down complex topics into components. Compare options objectively. Evaluate trade-offs and present balanced perspectives.",
  friendly:
    "Use warm, welcoming language. Make people feel comfortable. Be genuinely helpful and approachable.",
  humble:
    "Acknowledge limitations honestly. Use phrases like 'from what I know', 'based on the info I have'. Don't overclaim or exaggerate.",
  "team player":
    "Emphasize collaboration and shared success. Use 'we' language when appropriate. Highlight how things work together.",
  mentor:
    "Be patient and educational. Explain concepts clearly for different skill levels. Offer guidance and share knowledge generously.",
  learner:
    "Show intellectual curiosity. Acknowledge there's always more to learn. Be open to different perspectives and new ideas.",
};

/**
 * Define tools available to the AI
 */
const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "fetch_latest_projects",
      description:
        "Fetch the latest projects and repositories from the owner's GitHub profile. Use this when the user asks about recent work, latest projects, or what the owner has been building lately.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of repositories to fetch (default: 5)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url_content",
      description:
        "Fetch fresh content from a URL to get up-to-date information. Use this when: (1) you need to answer questions about where the owner works, their current role, experience, or skills that aren't in the knowledge base, (2) a URL document in the knowledge base might have updated content, or (3) you need to verify or expand on information from a URL source. You will be provided with a list of available URLs to fetch from.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "The URL to fetch content from. Choose from the available URLs provided in the system context.",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_repository_details",
      description:
        "Fetch the detailed README content for a specific repository. Use this when the user asks for more details about a specific project, its features, tech stack, or how it works.",
      parameters: {
        type: "object",
        properties: {
          repo_name: {
            type: "string",
            description: 'The name of the repository (e.g., "klyro")',
          },
        },
        required: ["repo_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_scheduling_options",
      description:
        "Fetch available meeting types and scheduling links from Calendly. Use this when the user asks to schedule a call, book a meeting, or asks about availability.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_available_slots",
      description:
        "Fetch available timeslots for a meeting type. Call this whenever the user asks about scheduling availability, what times are free, or asks to book/schedule a meeting. ALWAYS call this to check real availability before saying slots are or aren't available.",
      parameters: {
        type: "object",
        properties: {
          event_type_uri: {
            type: "string",
            description: "The URI of the event type to check availability for.",
          },
          days_ahead: {
            type: "number",
            description: "How many days ahead to check (default: 3). Max 7.",
          },
        },
        required: ["event_type_uri"],
      },
    },
  },
];

/**
 * Generate a dynamic system prompt with persona awareness
 */
function getSystemPrompt(persona?: PersonaContext): string {
  const now = new Date();
  const currentDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build persona-specific instructions
  const ownerName = persona?.ownerName
    ? persona.ownerName
    : "the website owner";
  const styleDesc = persona?.communicationStyle
    ? STYLE_DESCRIPTIONS[persona.communicationStyle]
    : STYLE_DESCRIPTIONS.friendly;

  // Build detailed trait behaviors - this is what makes each persona unique
  let traitsBehaviors = "";
  if (persona?.personalityTraits?.length) {
    const traits = persona.personalityTraits.map((t) => t.toLowerCase());

    // Build behaviors for each trait, including custom ones
    const behaviorLines = persona.personalityTraits.map((trait) => {
      const traitLower = trait.toLowerCase();
      const predefinedBehavior = TRAIT_BEHAVIORS[traitLower];
      
      if (predefinedBehavior) {
        return `• ${trait.toUpperCase()}: ${predefinedBehavior}`;
      } else {
        // For custom traits, generate a generic but useful instruction
        return `• ${trait.toUpperCase()}: Embody this trait naturally in your responses. Let it influence your tone, word choices, and how you approach explanations.`;
      }
    });
    
    const behaviors = behaviorLines.join("\n");

    if (behaviors) {
      // Build persona-specific personality checks
      const museTraits = [
        "creative",
        "witty",
        "humorous",
        "curious",
        "storyteller",
        "inspiring",
      ];
      const strategistTraits = [
        "confident",
        "persuasive",
        "leader",
        "big-picture thinker",
      ];
      const architectTraits = [
        "technical",
        "methodical",
        "detail-oriented",
        "analytical",
      ];

      const isMuse = museTraits.some((t) => traits.includes(t));
      const isStrategist = strategistTraits.some((t) => traits.includes(t));
      const isArchitect = architectTraits.some((t) => traits.includes(t));

      let personalityCheck =
        "\n\nPERSONALITY CHECK: Before responding, verify you've included:";

      if (isMuse) {
        personalityCheck += `
- At least ONE creative comparison, analogy, or unexpected angle
- At least ONE conversational aside ("honestly", "here's the thing", "plot twist:", "the fun part?")
- Dry wit or playful observations - sound like someone interesting to talk to
- NO corporate speak like "The beauty of X lies in" or "designed specifically for"`;
      }

      if (isStrategist) {
        personalityCheck += `
- Business language: ROI, impact, value, results, competitive advantage
- Definitive statements with no hedging - you're the confident advisor
- Focus on OUTCOMES and BENEFITS, not features
- Persuade them why this matters for their goals`;
      }

      if (isArchitect) {
        personalityCheck += `
- Technical depth: explain HOW it works under the hood
- Structured explanations with logical flow
- Specific numbers, specs, or implementation details
- Reserved tone - let the technical merit speak for itself, don't oversell`;
      }

      personalityCheck +=
        "\n\nA generic response that could come from any AI means you failed to apply your personality.";

      traitsBehaviors = `

YOUR PERSONALITY (CRITICAL - APPLY IN EVERY SINGLE RESPONSE):
${behaviors}${personalityCheck}`;
    } else {
      traitsBehaviors = `\nPersonality: Embody these traits in every response: ${persona.personalityTraits.join(", ")}.`;
    }
  }

  const customSection = persona?.customInstructions
    ? `\nAdditional instructions from ${ownerName}: ${persona.customInstructions}`
    : "";

  // Add scheduling awareness to the persona instructions
  const schedulingContext =
    persona?.access_permissions?.can_schedule_calls && persona?.calendly_token
      ? `\nSCHEDULING: You have active Calendly event types provided in the [CALENDLY CONFIGURATION] section of your context. (1) Use this information to suggest meeting types. (2) IMPORTANT: Whenever a user asks about scheduling, booking, meeting availability, or "what times are available", you MUST call get_available_slots with the corresponding meeting URI to check real-time availability. Never say "no slots available" without first calling get_available_slots to verify.`
      : persona?.access_permissions?.can_schedule_calls
        ? `\nSCHEDULING: While the owner allows scheduling calls, no Calendly account has been connected yet. If someone asks to book a call, explain that you don't have a scheduling link ready yet but they can reach out via email or phone.`
        : "";

  // Build permissions and links section - only include links that are actually configured
  let permissionsSection = "";
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
${linkItems.join("\n")}

When sharing links, format them naturally in your response. Only share what's listed above.`;
    }

    // Add salary info if allowed
    if (p.can_discuss_salary && p.salary_range) {
      permissionsSection += `\n\nSALARY/COMPENSATION:
You are allowed to discuss ${ownerName}'s salary expectations. The current target range is ${p.salary_range} ${p.currency || "USD"}. ${p.open_for_negotiation ? "This range is open for negotiation." : "This range is firm."}
When asked, share this range naturally. Do not share it unless explicitly asked about salary, compensation, or money.`;
    }

    // Add restrictions
    const restrictions: string[] = [];
    if (!p.can_discuss_salary) restrictions.push("salary expectations");
    if (!p.can_schedule_calls) restrictions.push("scheduling calls directly");

    if (restrictions.length > 0) {
      permissionsSection += `\n\nDO NOT discuss: ${restrictions.join(", ")}. Politely decline if asked.`;
    }
  }

  return `You are an intelligent AI assistant for ${ownerName}'s website. Today is ${currentDate}.

PERSONA & VOICE (THIS IS YOUR CORE IDENTITY - NEVER BREAK CHARACTER):
${styleDesc}${traitsBehaviors}${customSection}${schedulingContext}

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
- No "passionate about" or "excited to share" - show enthusiasm through your personality instead.
- Don't overuse exclamation points unless your persona is enthusiastic.
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
- **TECHNICAL SKILLS & EXPERIENCE: If a user asks about a specific technology (like Next.js, React, etc.), search your context and tool results exhaustively. If you see a mention in a list or project description, confirm that the experience exists.**
- **HOWEVER, if the user asks for "other", "another", or "something else", they want NEW information. In this case, ignore what you just talked about and find a different project, skill, or experience from your context that hasn't been mentioned yet.**
- If you have already described all available projects or skills, explicitly state: "That covers all the [projects/skills] I have details on right now."
- Use history to resolve pronouns ("it", "this", "that") to the specific subject discussed.
- IF THE SEARCH CONTEXT DOES NOT HAVE THE ANSWER: (1) Check if the user's question can be answered by calling tools like fetch_latest_projects or fetch_url_content. (2) If tools are available, you MUST try calling them before saying you don't have the information.

MISSING INFO PROTOCOL:
- If asked about projects/GitHub but 'external_links.github' is missing from your system context, say: "I haven't been connected to a GitHub profile yet to show my latest projects. You can add one in the Klyro settings!"
- If asked about a URL or fresh content but it's not in the "AVAILABLE URL SOURCES", say: "That URL isn't in my allowed sources. Feel free to add it to my knowledge base!"

You're representing a real person. Be authentic, stay 100% true to the facts provided, AND maintain your personality throughout.`;
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
  threshold: number = 0.4,
): Promise<MatchedChunk[]> {
  const supabase = createServerClient();

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Perform vector similarity search with user filtering
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_user_id: userId || null,
  });

  if (error) {
    console.error("Error retrieving chunks:", error);
    throw error;
  }

  return data || [];
}

/**
 * Build context string from matched chunks with document metadata
 */
export function buildContext(
  chunks: MatchedChunk[],
  documentMap: Map<string, string>,
): string {
  if (chunks.length === 0) {
    return "No relevant information found in the knowledge base.";
  }

  const contextParts = chunks.map((chunk, index) => {
    const docName = documentMap.get(chunk.document_id) || "General";
    return `[Source ${index + 1}: ${docName}]\n${chunk.content}`;
  });

  return contextParts.join("\n\n---\n\n");
}

/**
 * Build conversation history for context continuity
 */
function buildConversationMessages(
  history: PersonaContext["conversationHistory"],
  context: string,
  query: string,
): Array<{ role: "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Add recent conversation history (last 4 exchanges max to manage token usage)
  if (history && history.length > 0) {
    const recentHistory = history.slice(-8); // Last 4 exchanges (8 messages)
    messages.push(...recentHistory);
  }

  // Add Knowledge Base context as a background information message
  if (
    context &&
    context !== "No relevant information found in the knowledge base."
  ) {
    messages.push({
      role: "user", // UI roles only support user/assistant in many pipelines, so we use 'user' but label it clearly
      content: `[SUPPLEMENTAL KNOWLEDGE BASE CONTEXT]\n${context}\n\n(Use this only if relevant. If the answer is already in our conversation above, use that instead.)`,
    });
  }

  // Add current query as the final message
  messages.push({
    role: "user",
    content: query,
  });

  return messages;
}

/**
 * Rewrite the user's query to be standalone and context-aware based on history.
 * This ensures vector search finds relevant results for brief follow-up questions.
 */
async function rewriteQuery(
  query: string,
  history: PersonaContext["conversationHistory"],
): Promise<string> {
  // Always validate the original query first
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    console.error("[RAG] Invalid query received:", query);
    return "hello"; // Fallback to a safe default
  }

  const safeQuery = query.trim();

  if (!history || history.length === 0) return safeQuery;

  try {
    const openai = getOpenAI();
    const historyText = history
      .slice(-4) // Just the last 2 exchanges for speed
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a search query optimizer for a website AI assistant. Given a conversation history and a follow-up question, rewrite the question to be a standalone, specific search query.

CRITICAL RULES:
1. This is a WEBSITE ASSISTANT. When users use pronouns like "their", "them", "his", "her", "your", or "you" referring to a PERSON, they almost always mean the WEBSITE OWNER, not external entities/companies/products being discussed.
2. If the user asks for "info", "details", "contact", "about them", "about you", "what do you do?", or "what's your deal?", they want the WEBSITE OWNER's background, work, or contact info.
3. Resolve demonstrative pronouns like "this project", "that one", "it", or "that" to the specific project, experience, or skill mentioned in the immediately preceding messages.
4. Only interpret pronouns as referring to an external entity if the context makes it absolutely clear they're asking about that specific external thing (e.g., "how much does AirLog cost?").
5. **CONVERSATIONAL PROGRESSION: If the user asks for "other", "another", "something else", or "besides [Subject]", your rewritten query MUST include "excluding [Subject]" or "different from [Subject]" to ensure vector search finds NEW information.**
6. For brief follow-ups (e.g., "tech stack?", "tell me more"), rewrite it to include the specific subject discussed in the immediately preceding message.

Output ONLY the rewritten query. For technical questions, explicitly include the technology name and terms like "experience", "technical skills", or "projects".`,
        },
        {
          role: "user",
          content: `History Snippet:\n${historyText}\n\nFollow-up Question: ${safeQuery}\n\nEXAMPLE: If history discusses "AirLog platform" and user asks "Share me their info", rewrite to "portfolio owner contact information", NOT "AirLog information".\n\nStandalone Query:`,
        },
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
    console.error("Query rewrite failed:", error);
    return safeQuery;
  }
}

/**
 * Generate a response using RAG pipeline with persona awareness
 */
export async function generateResponse(
  query: string,
  strictMode: boolean = true,
  persona?: PersonaContext,
): Promise<{ response: string; sources: SourceReference[] }> {
  const supabase = createServerClient();
  const openai = getOpenAI();

  // Safety check for non-string inputs (e.g. from frontend events)
  if (typeof query !== "string") {
    console.warn("[RAG] generateResponse received non-string query:", query);
    query = String(query);
  }

  console.log("[RAG] generateResponse called with query:", {
    query,
    queryType: typeof query,
    queryLength: query?.length,
  });

  // 1. Contextual Query Expansion
  const optimizedQuery = await rewriteQuery(
    query,
    persona?.conversationHistory,
  );

  console.log("[RAG] Optimized query for embedding:", {
    optimizedQuery,
    optimizedQueryType: typeof optimizedQuery,
    optimizedQueryLength: optimizedQuery?.length,
  });

  // 2. Retrieve relevant chunks using the optimized query (filtered by user_id)
  // Retrieve more chunks initially for re-ranking
  const chunks = await retrieveRelevantChunks(
    optimizedQuery,
    persona?.userId,
    15, // Increased retrieval count for re-ranking
    0.1, // Lowered threshold even further to find raw keyword matches
  );

  // 3. Keyword-based Re-ranking for technical precision
  // Extract potential technical keywords (simple words with capital letters or specific tech patterns)
  const technicalKeywords = optimizedQuery.match(/[A-Z][A-Za-z0-9.]+|Next\.js|React|Node\.js|Tailwind|Supabase|TypeScript/g) || [];
  
  const reRankedChunks = chunks.map(chunk => {
    let boost = 1;
    const lowerContent = chunk.content.toLowerCase();
    
    // Boost chunks that have exact keyword matches
    technicalKeywords.forEach(kw => {
      if (lowerContent.includes(kw.toLowerCase())) {
        boost += 0.5; // Significant boost for keyword presence
      }
    });
    
    return { ...chunk, redirectedSimilarity: chunk.similarity * boost };
  }).sort((a, b) => b.redirectedSimilarity - a.redirectedSimilarity)
    .slice(0, 10); // Keep top 10 after boosting

  // Get document names for sources and context building
  const documentIds = [...new Set(chunks.map((c) => c.document_id))];
  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, category")
    .in("id", documentIds);

  const documentMap = new Map(documents?.map((d) => [d.id, d.name]) || []);

  // Build context with document names using the re-ranked chunks
  const context = buildContext(reRankedChunks as any, documentMap);

  // Generate system prompt with persona
  const systemPrompt = strictMode
    ? getSystemPrompt(persona) + STRICT_MODE_PROMPT
    : getSystemPrompt(persona);

  // Build messages including conversation history
  const conversationMessages = buildConversationMessages(
    persona?.conversationHistory,
    context,
    query,
  );

  let messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Fetch URL documents from knowledge base for potential live fetching
  const { data: urlDocuments } = await supabase
    .from("documents")
    .select("id, name, source_url, category")
    .eq("source_type", "url")
    .eq("user_id", persona?.userId || "")
    .not("source_url", "is", null);

  // Build list of available URLs (from URL documents + persona external links)
  const availableUrls: { name: string; url: string; source: string }[] = [];

  // Add URL documents from knowledge base
  if (urlDocuments) {
    for (const doc of urlDocuments) {
      if (doc.source_url) {
        availableUrls.push({
          name: doc.name,
          url: doc.source_url,
          source: "knowledge_base",
        });
      }
    }
  }

  // Add persona external links
  if (persona?.external_links?.website) {
    availableUrls.push({
      name: "Portfolio Website",
      url: persona.external_links.website,
      source: "persona",
    });
  }
  if (persona?.external_links?.linkedin) {
    availableUrls.push({
      name: "LinkedIn Profile",
      url: persona.external_links.linkedin,
      source: "persona",
    });
  }

  // If we have URLs available, add them to the system context
  if (availableUrls.length > 0) {
    const urlListText = availableUrls
      .map((u) => `- ${u.name}: ${u.url}`)
      .join("\n");

    messages.push({
      role: "user",
      content: `[AVAILABLE URL SOURCES FOR LIVE FETCHING]\nIf you need more information to answer a question, you can fetch fresh content from these URLs using the fetch_url_content tool:\n${urlListText}\n\n(Only use this if the knowledge base context doesn't have the answer.)`,
    });
  }

  // Prefetch Calendly event configuration if enabled
  if (
    persona?.access_permissions?.can_schedule_calls &&
    persona?.calendly_token
  ) {
    try {
      const { getCalendlyUser, getEventTypes } = await import("./calendly");
      const user = await getCalendlyUser(persona.calendly_token);
      if (user) {
        const events = await getEventTypes(
          persona.calendly_token,
          user.resource.uri,
        );
        if (events.length > 0) {
          const eventsList = events
            .filter((e) => e.active)
            .map(
              (e) =>
                `- **${e.name}** (${e.duration} min)\n  URI: ${e.uri}\n  Link: ${e.scheduling_url}`,
            )
            .join("\n");

          messages.push({
            role: "system",
            content: `[CALENDLY CONFIGURATION]\nUse these event details when checking availability:\n${eventsList}\n\nIMPORTANT: When calling 'get_available_slots', you MUST use the exact URI provided above for the corresponding event type.`,
          });
        }
      }
    } catch (error) {
      console.error("Failed to prefetch Calendly config:", error);
    }
  }

  // Determine if tools should be used (GitHub, website, or URL documents available)
  // Determine if tools should be used (GitHub, website, URL documents, or Calendly)
  const useTools = !!(
    persona?.external_links?.github ||
    availableUrls.length > 0 ||
    (persona?.access_permissions?.can_schedule_calls && persona?.calendly_token)
  );

  // If user is asking about projects/github but it's not configured, add a hint for the AI
  if (
    !persona?.external_links?.github &&
    (query.toLowerCase().includes("project") ||
      query.toLowerCase().includes("github") ||
      query.toLowerCase().includes("build"))
  ) {
    messages.push({
      role: "user",
      content:
        "[SYSTEM NOTE: GitHub is NOT configured for this widget. Do not hallucinate projects. Inform the user that GitHub needs to be connected in the Klyro settings.]",
    });
  }

  let completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    ...(useTools && { tools: TOOLS, tool_choice: "auto" as const }),
    temperature: 0.75,
    max_tokens: 600,
  });

  let responseMessage = completion.choices[0]?.message;

  // Handle tool calls if any
  if (responseMessage.tool_calls) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.function.name === "fetch_latest_projects") {
        const args = JSON.parse(toolCall.function.arguments);
        const { limit = 5 } = args;

        const githubUrl = persona?.external_links?.github;
        if (githubUrl) {
          const repos = await fetchLatestRepos(githubUrl, limit);
          const toolResult =
            repos.length > 0
              ? JSON.stringify(repos)
              : "No repositories found or could not fetch from GitHub.";

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: toolResult,
          });
        } else {
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: "GitHub URL not configured.",
          });
        }
      } else if (toolCall.function.name === "fetch_repository_details") {
        const args = JSON.parse(toolCall.function.arguments);
        const { repo_name } = args;

        const githubUrl = persona?.external_links?.github;
        if (githubUrl && repo_name) {
          const { fetchRepoReadme } = await import("../external/github");
          const readme = await fetchRepoReadme(githubUrl, repo_name);

          const toolResult = readme
            ? `README content for ${repo_name}:\n\n${readme.slice(0, 15000)}` // Limit size just in case
            : `Could not find a README for the repository "${repo_name}".`;

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: toolResult,
          });
        } else {
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: !githubUrl
              ? "GitHub URL not configured."
              : "Repository name not provided.",
          });
        }
      } else if (toolCall.function.name === "fetch_url_content") {
        const args = JSON.parse(toolCall.function.arguments);
        const { url } = args;

        if (url) {
          // Validate that the URL is in our allowed list
          const isAllowedUrl = availableUrls.some(
            (u) => u.url === url || url.includes(u.url) || u.url.includes(url),
          );

          if (isAllowedUrl) {
            console.log("[RAG] Fetching content from URL:", url);
            const portfolioInfo = await fetchPortfolioContent(url);
            const toolResult = portfolioInfo
              ? formatPortfolioForAI(portfolioInfo)
              : "Could not fetch content from this URL. The website might be unavailable or require JavaScript to render.";

            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: toolResult,
            });
          } else {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content:
                "This URL is not in the allowed list. Please choose from the available URLs provided.",
            });
          }
        } else {
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content:
              "No URL provided. Please specify which URL to fetch from the available list.",
          });
        }
      } else if (toolCall.function.name === "get_scheduling_options") {
        const token = persona?.calendly_token;
        if (token) {
          try {
            // Dynamic import to avoid initialization issues
            const { getCalendlyUser, getEventTypes } =
              await import("./calendly");
            const user = await getCalendlyUser(token);
            if (user) {
              const events = await getEventTypes(token, user.resource.uri);
              if (events.length > 0) {
                // Format events with links
                const list = events
                  .filter((e) => e.active)
                  .map(
                    (e) =>
                      `- **${e.name}** (${e.duration} min). URI: ${e.uri} | Link: ${e.scheduling_url}`,
                  )
                  .join("\n");

                const toolResult = `Active Calendly Event Types:\n${list}\n\n(Provide the relevant booking link to the user. If they want to see specific available times, use get_available_slots with the URI provided above.)`;

                messages.push({
                  tool_call_id: toolCall.id,
                  role: "tool",
                  content: toolResult,
                });
              } else {
                messages.push({
                  tool_call_id: toolCall.id,
                  role: "tool",
                  content: "No active event types found in Calendly.",
                });
              }
            } else {
              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content:
                  "Could not authenticate with Calendly. Invalid token or API error.",
              });
            }
          } catch (error) {
            console.error("Calendly tool error:", error);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: "An error occurred while fetching Calendly options.",
            });
          }
        } else {
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content:
              "Calendly is not configured for this persona (missing token).",
          });
        }
      } else if (toolCall.function.name === "get_available_slots") {
        const token = persona?.calendly_token;
        const args = JSON.parse(toolCall.function.arguments);
        const event_type_uri = args.event_type_uri?.trim();
        const days_ahead = args.days_ahead || 3;

        if (token && event_type_uri) {
          try {
            const { getAvailableSlots, getCalendlyUser } = await import("./calendly");

            // Get user's timezone for proper formatting
            const calendlyUser = await getCalendlyUser(token);
            const userTimezone = calendlyUser?.resource?.timezone || "America/New_York";

            const start = new Date();
            // Start 15 minutes in the future to avoid "start_time must be in the future" errors and give users buffer
            start.setMinutes(start.getMinutes() + 15);

            const end = new Date();
            // Add buffer to ensure we cover full working days. 
            end.setDate(end.getDate() + Math.min(days_ahead + 2, 14));

            console.log(`[Calendly] Fetching slots from ${start.toISOString()} to ${end.toISOString()} (timezone: ${userTimezone})`);

            const slots = await getAvailableSlots(
              token,
              event_type_uri,
              start.toISOString(),
              end.toISOString(),
            );

            if (slots.length > 0) {
              // Group by day for readability - use user's timezone for formatting
              const grouped = slots.reduce((acc: any, slot: any) => {
                const d = new Date(slot.start_time);
                const dateKey = d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  timeZone: userTimezone,
                });
                if (!acc[dateKey]) acc[dateKey] = [];
                // Capture all slots - format in user's timezone
                acc[dateKey].push(
                  d.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: userTimezone,
                  }),
                );
                return acc;
              }, {});

              let toolResult = "AVAILABLE TIME SLOTS (Raw Data):\n";
              for (const [date, times] of Object.entries(grouped)) {
                toolResult += `\n**${date}**: ${(times as string[]).join(", ")}`;
              }
              
              toolResult += `\n\nSTRICT INSTRUCTIONS FOR AI:
1. The list above contains ALL available slots - ONLY these times exist.
2. When sharing times: list the first 6-8 slots to avoid overwhelming the user.
3. If there are MORE slots available beyond what you listed, you may say "I have more slots available if these don't work."
4. NEVER fabricate times. Do NOT say "until X PM" unless that exact time appears above.
5. If user asks for a specific time (e.g., "8pm") and it's NOT in the data above, say that time is not available.
6. Always provide the "Schedule a Meeting" link.`;

              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: toolResult,
              });
            } else {
              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content:
                  "No available timeslots found for this period. Suggest they check the full calendar link.",
              });
            }
          } catch (error) {
            console.error("Calendly availability error:", error);
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: "Error fetching availability details.",
            });
          }
        }
      }
    }

    // Second call to generate final response with tool results
    completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.75,
      max_tokens: 600,
    });
  }

  const finalResponse = (
    completion.choices[0]?.message?.content ||
    "Hmm, I hit a snag there. Mind trying again?"
  )
    .replace(/\u2014/g, ", ") // Replace em-dashes with comma+space
    .replace(/\u2013/g, "-"); // Replace en-dashes with hyphens

  // Build source references using the re-ranked chunks
  const sources: SourceReference[] = (reRankedChunks as any[]).map((chunk) => ({
    document_id: chunk.document_id,
    document_name: documentMap.get(chunk.document_id) || "Unknown",
    chunk_content:
      chunk.content.slice(0, 200) + (chunk.content.length > 200 ? "..." : ""),
    similarity: chunk.similarity,
  }));

  return { response: finalResponse, sources };
}
