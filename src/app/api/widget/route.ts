import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

// Simple nanoid implementation for widget key generation
function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// List all widgets for the current user
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error listing widgets:', error);
    return NextResponse.json(
      { error: 'Failed to list widgets' },
      { status: 500 }
    );
  }
}

// Create a new widget for the current user
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      name, 
      headerTitle = 'Chat Assistant',
      welcomeHeadline = '',
      position = 'bottom-right', 
      theme = 'auto',
      welcomeMessage = 'Hi! How can I help you learn more about me?',
      allowedDomains = [],
      primaryColor = '#6366f1',
      // Persona configuration
      ownerName,
      personalityTraits = [],
      communicationStyle = 'friendly',
      customInstructions,
      launcherMode = 'icon',
      launcherText = '',
      // Route visibility
      allowedRoutes = [],
      logoUrl = null,
    } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Widget name is required' },
        { status: 400 }
      );
    }
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('widgets')
      .insert({
        widget_key: generateWidgetKey(),
        name,
        header_title: headerTitle,
        welcome_headline: welcomeHeadline || null,
        position,
        theme,
        welcome_message: welcomeMessage,
        allowed_domains: allowedDomains,
        primary_color: primaryColor,
        // Persona fields
        owner_name: ownerName || null,
        personality_traits: personalityTraits,
        communication_style: communicationStyle,
        custom_instructions: customInstructions || null,
        launcher_mode: launcherMode,
        launcher_text: launcherText || null,
        allowed_routes: allowedRoutes,
        logo_url: logoUrl,
        // Associate with current user
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating widget:', error);
    return NextResponse.json(
      { error: 'Failed to create widget' },
      { status: 500 }
    );
  }
}
