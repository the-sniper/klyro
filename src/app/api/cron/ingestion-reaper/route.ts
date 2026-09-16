import { NextRequest, NextResponse } from 'next/server';
import { reapStalledDocuments } from '@/lib/db/ingestion-reaper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Retrying a stalled document re-runs the whole embedding pipeline.
export const maxDuration = 60;

/** Constant-time comparison, so the secret is not discoverable by timing. */
function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return mismatch === 0;
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.error('[reaper] CRON_SECRET is not configured; refusing to run.');
    return false;
  }

  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  return token.length > 0 && secretsMatch(token, expected);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await reapStalledDocuments();

    if (report.scanned > 0) {
      console.log('[reaper] Swept stalled documents:', report);
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('[reaper] Sweep failed:', error);
    return NextResponse.json({ error: 'Reaper sweep failed' }, { status: 500 });
  }
}
