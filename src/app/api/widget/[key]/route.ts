import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

interface RouteParams {
  params: Promise<{ key: string }>;
}

// Get widget configuration by key
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
        { status: 404 }
      );
    }
    
    // Return only public configuration
    return NextResponse.json({
      widgetKey: data.widget_key,
      position: data.position,
      theme: data.theme,
      welcomeMessage: data.welcome_message,
      primaryColor: data.primary_color,
    });
  } catch (error) {
    console.error('Error fetching widget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget' },
      { status: 500 }
    );
  }
}

// Update widget configuration
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { key } = await params;
    const body = await request.json();
    const supabase = createServerClient();
    
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.welcomeMessage !== undefined) updateData.welcome_message = body.welcomeMessage;
    if (body.allowedDomains !== undefined) updateData.allowed_domains = body.allowedDomains;
    if (body.primaryColor !== undefined) updateData.primary_color = body.primaryColor;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    
    const { data, error } = await supabase
      .from('widgets')
      .update(updateData)
      .eq('widget_key', key)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating widget:', error);
    return NextResponse.json(
      { error: 'Failed to update widget' },
      { status: 500 }
    );
  }
}

// Delete widget
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { key } = await params;
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('widgets')
      .delete()
      .eq('widget_key', key);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
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
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
