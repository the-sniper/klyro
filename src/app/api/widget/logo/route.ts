import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/**
 * Upload a widget logo.
 *
 * This exists so the browser never writes to storage directly. The logo bucket
 * previously accepted writes from the anon role, which meant anyone holding the
 * public anon key could overwrite or delete any customer's logo. Uploads now go
 * through here, authenticated by the session cookie, and are written with the
 * service role.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file');
    const widgetKey = formData.get('widgetKey');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A file is required' }, { status: 400 });
    }

    if (typeof widgetKey !== 'string' || widgetKey.length === 0) {
      return NextResponse.json({ error: 'widgetKey is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${file.type || 'unknown'}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_LOGO_BYTES) {
      return NextResponse.json(
        { error: 'Logo must be 2MB or smaller' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Only the widget's owner may set its logo.
    const { data: widget } = await supabase
      .from('widgets')
      .select('widget_key')
      .eq('widget_key', widgetKey)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    const extension = EXTENSION_BY_TYPE[file.type];
    const path = `${widgetKey}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('logos').getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}
