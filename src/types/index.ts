// Document types
export type DocumentSourceType = 'text' | 'url' | 'file';
export type DocumentStatus = 'queued' | 'processing' | 'ready' | 'failed';
export type DocumentCategory = 
  | 'experience' 
  | 'projects' 
  | 'skills' 
  | 'education' 
  | 'availability' 
  | 'contact' 
  | 'general';

export interface Document {
  id: string;
  name: string;
  source_type: DocumentSourceType;
  content: string | null;
  source_url: string | null;
  status: DocumentStatus;
  error_message: string | null;
  category: DocumentCategory | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[] | null;
  chunk_index: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Chat types
export type MessageRole = 'user' | 'assistant';

export interface ChatSession {
  id: string;
  widget_key: string;
  visitor_id: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  sources: SourceReference[];
  created_at: string;
}

export interface SourceReference {
  document_id: string;
  document_name: string;
  chunk_content: string;
  similarity: number;
}

// Widget types
export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type WidgetTheme = 'light' | 'dark' | 'auto';

export interface Widget {
  id: string;
  widget_key: string;
  name: string;
  user_id: string | null; // Owner of this widget
  position: WidgetPosition;
  theme: WidgetTheme;
  welcome_message: string;
  header_title: string; // Customizable chat header title
  allowed_domains: string[];
  primary_color: string;
  is_active: boolean;
  // Persona configuration
  owner_name: string | null;
  personality_traits: string[];
  communication_style: 'formal' | 'casual' | 'friendly' | 'professional' | 'enthusiastic' | 'calm';
  custom_instructions: string | null;
  // Launcher configuration
  launcher_mode: 'icon' | 'text';
  launcher_text: string | null;
  // Route visibility configuration
  allowed_routes: string[]; // Routes where widget should display, empty means all
  // External links the bot can share
  external_links: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
  // Permissions for what the bot can discuss/share
  access_permissions: {
    can_share_github: boolean;
    can_share_linkedin: boolean;
    can_share_twitter: boolean;
    can_share_email: boolean;
    can_discuss_salary: boolean;
    can_schedule_calls: boolean;
  };
  created_at: string;
  updated_at: string;
}



// API Request/Response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
  widgetKey: string;
}

export interface ChatResponse {
  response: string;
  sources: SourceReference[];
  sessionId: string;
}

export interface DocumentUploadRequest {
  name: string;
  sourceType: DocumentSourceType;
  content?: string;
  sourceUrl?: string;
  category?: DocumentCategory;
}

// Matched chunk from vector search
export interface MatchedChunk {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

// Persona context for natural AI responses
// Persona context for natural AI responses
export interface PersonaContext {
  userId?: string; // User ID for multi-tenancy filtering
  ownerName?: string;
  personalityTraits?: string[];
  communicationStyle?: 'formal' | 'casual' | 'friendly' | 'professional' | 'enthusiastic' | 'calm';
  customInstructions?: string;
  external_links?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
  access_permissions?: {
    can_share_github?: boolean;
    can_share_linkedin?: boolean;
    can_share_twitter?: boolean;
    can_share_email?: boolean;
    can_discuss_salary?: boolean;
    can_schedule_calls?: boolean;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

