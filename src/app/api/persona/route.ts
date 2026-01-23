import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

// Get persona configuration for the current user's widget
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();
    
    // Get the user's widget persona config (or return defaults if none exists)
    const { data: widget, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to avoid error if no rows
    
    console.log('DEBUG: Fetched Widget for Persona:', {
      hasWidget: !!widget,
      widgetName: widget?.name,
      externalLinks: widget?.external_links,
      userId: user.id
    });

    if (error) {
      throw error;
    }
    
    // Return persona config or defaults
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
      selected_preset_id: widget?.selected_preset_id || null,
    };
    
    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching persona config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona config' },
      { status: 500 }
    );
  }
}

// Update persona configuration for the current user
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const supabase = createServerClient();
    
    // Check if user has any widgets
    const { count, error: countError } = await supabase
      .from('widgets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    if (countError) throw countError;
    
    const updateData = {
      owner_name: body.owner_name || null,
      communication_style: body.communication_style || 'friendly',
      personality_traits: body.personality_traits || [],
      custom_instructions: body.custom_instructions || null,
      external_links: body.external_links || {},
      access_permissions: body.access_permissions || {},
      selected_preset_id: body.selected_preset_id || null,
    };

    if (count === 0) {
      // Create a default widget for this user if none exist
      const { error: insertError } = await supabase
        .from('widgets')
        .insert({
          widget_key: Math.random().toString(36).substring(2, 14),
          name: 'Default Persona',
          is_active: true,
          user_id: user.id,
          ...updateData
        });
        
      if (insertError) throw insertError;
    } else {
      // Update only this user's widgets
      const { error: updateError } = await supabase
        .from('widgets')
        .update(updateData)
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating persona config:', error);
    return NextResponse.json(
      { error: 'Failed to update persona config' },
      { status: 500 }
    );
  }
}
