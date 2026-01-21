import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
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

// List all widgets
export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error listing widgets:', error);
    return NextResponse.json(
      { error: 'Failed to list widgets' },
      { status: 500 }
    );
  }
}

// Create a new widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      position = 'bottom-right', 
      theme = 'auto',
      welcomeMessage = 'Hi! How can I help you learn more about me?',
      allowedDomains = [],
      primaryColor = '#6366f1',
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
        position,
        theme,
        welcome_message: welcomeMessage,
        allowed_domains: allowedDomains,
        primary_color: primaryColor,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating widget:', error);
    return NextResponse.json(
      { error: 'Failed to create widget' },
      { status: 500 }
    );
  }
}
