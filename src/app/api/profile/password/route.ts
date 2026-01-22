import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// POST - Update user password
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Create an admin client for password update
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    // First verify the current password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    
    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error in password update:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
