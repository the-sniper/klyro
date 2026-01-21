import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// Get persona configuration (from the default widget for now)
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Get the first widget's persona config (or create default)
    const { data: widget, error } = await supabase
      .from('widgets')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Return persona config
    const config = {
      owner_name: widget?.owner_name || '',
      communication_style: widget?.communication_style || 'friendly',
      personality_traits: widget?.personality_traits || [],
      custom_instructions: widget?.custom_instructions || '',
      external_links: widget?.external_links || {},
      access_permissions: widget?.access_permissions || {
        can_share_github: true,
        can_share_linkedin: true,
        can_share_twitter: true,
        can_share_email: true,
        can_discuss_salary: false,
        can_schedule_calls: true,
      },
    };
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching persona config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona config' },
      { status: 500 }
    );
  }
}

// Update persona configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();
    
    // Update all widgets with the new persona config
    const { error } = await supabase
      .from('widgets')
      .update({
        owner_name: body.owner_name || null,
        communication_style: body.communication_style || 'friendly',
        personality_traits: body.personality_traits || [],
        custom_instructions: body.custom_instructions || null,
        external_links: body.external_links || {},
        access_permissions: body.access_permissions || {},
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all widgets
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating persona config:', error);
    return NextResponse.json(
      { error: 'Failed to update persona config' },
      { status: 500 }
    );
  }
}
