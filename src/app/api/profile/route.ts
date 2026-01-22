import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

// GET - Fetch current user profile
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();
    
    // Get user profile from public.users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      // If profile doesn't exist, return basic auth info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = (user as any).user_metadata || {};
      return NextResponse.json({
        id: user.id,
        email: user.email,
        full_name: metadata.full_name || null,
        avatar_url: metadata.avatar_url || null,
      });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error in profile GET:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update user profile (name only - password handled separately)
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createServerClient();
    const body = await request.json();
    
    const { full_name } = body;
    
    // Update the public.users table
    const { data, error } = await supabase
      .from('users')
      .update({ 
        full_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error in profile PUT:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
