import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

// Get all available persona presets
export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data: presets, error } = await supabase
      .from('persona_presets')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(presets || []);
  } catch (error) {
    console.error('Error fetching persona presets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona presets' },
      { status: 500 }
    );
  }
}
