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
      .maybeSingle(); // Use maybeSingle to avoid error if no rows
    
    console.log('DEBUG: Fetched Widget for Persona:', {
      hasWidget: !!widget,
      widgetName: widget?.name,
      externalLinks: widget?.external_links
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
    
    // Check if any widget exists
    const { count, error: countError } = await supabase
      .from('widgets')
      .select('*', { count: 'exact', head: true });
      
    if (countError) throw countError;
    
    const updateData = {
      owner_name: body.owner_name || null,
      communication_style: body.communication_style || 'friendly',
      personality_traits: body.personality_traits || [],
      custom_instructions: body.custom_instructions || null,
      external_links: body.external_links || {},
      access_permissions: body.access_permissions || {},
    };

    if (count === 0) {
      // Create a default widget to hold settings if none exist
      // We'll call it "Default Persona"
      const { error: insertError } = await supabase
        .from('widgets')
        .insert({
          widget_key: Math.random().toString(36).substring(2, 14),
          name: 'Default Persona',
          is_active: true,
          ...updateData
        });
        
      if (insertError) throw insertError;
    } else {
      // Update all existing widgets
      const { error: updateError } = await supabase
        .from('widgets')
        .update(updateData)
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all widgets
      
      if (updateError) throw updateError;
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
