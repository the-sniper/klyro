import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ key: string }>;
}

// CORS headers for cross-origin widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Get widget configuration by key (public - for chat widget to load)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { key } = await params;
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('widget_key', key)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Return only public configuration (No suggestions)
    return NextResponse.json({
      widgetKey: data.widget_key,
      position: data.position,
      theme: data.theme,
      welcomeMessage: data.welcome_message,
      welcomeHeadline: data.welcome_headline,
      welcomeTitle: data.welcome_title || 'Hey there!',
      headerTitle: data.header_title || 'Chat Assistant',
      primaryColor: data.primary_color,
      launcherMode: data.launcher_mode || 'icon',
      launcherText: data.launcher_text || '',
      allowedRoutes: data.allowed_routes || [],
      logoUrl: data.logo_url || null,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching widget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Update widget configuration (requires ownership)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { key } = await params;
    const body = await request.json();
    const supabase = createServerClient();
    
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.welcomeMessage !== undefined) updateData.welcome_message = body.welcomeMessage;
    if (body.welcomeHeadline !== undefined) updateData.welcome_headline = body.welcomeHeadline || null;
    if (body.welcomeTitle !== undefined) updateData.welcome_title = body.welcomeTitle || 'Hey there!';
    if (body.allowedDomains !== undefined) updateData.allowed_domains = body.allowedDomains;
    if (body.primaryColor !== undefined) updateData.primary_color = body.primaryColor;
    if (body.headerTitle !== undefined) updateData.header_title = body.headerTitle;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    
    // Persona configuration
    if (body.ownerName !== undefined) updateData.owner_name = body.ownerName || null;
    if (body.personalityTraits !== undefined) updateData.personality_traits = body.personalityTraits;
    if (body.communicationStyle !== undefined) updateData.communication_style = body.communicationStyle;
    if (body.customInstructions !== undefined) updateData.custom_instructions = body.custom_instructions || null;
    if (body.launcherMode !== undefined) updateData.launcher_mode = body.launcherMode;
    if (body.launcherText !== undefined) updateData.launcher_text = body.launcherText || null;
    if (body.allowedRoutes !== undefined) updateData.allowed_routes = body.allowedRoutes;
    if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl || null;

    
    const { data, error } = await supabase
      .from('widgets')
      .update(updateData)
      .eq('widget_key', key)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Widget not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating widget:', error);
    return NextResponse.json(
      { error: 'Failed to update widget' },
      { status: 500 }
    );
  }
}

// Delete widget (requires ownership)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const { key } = await params;
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('widgets')
      .delete()
      .eq('widget_key', key)
      .eq('user_id', user.id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting widget:', error);
    return NextResponse.json(
      { error: 'Failed to delete widget' },
      { status: 500 }
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
