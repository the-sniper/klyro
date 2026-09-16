/**
 * Recovery for stranded document ingestion.
 *
 * processDocument() runs fire-and-forget inside the request that created the
 * document, so a serverless freeze or timeout leaves the row in 'processing'
 * with nothing scheduled to revisit it. This sweeps those rows: retry a bounded
 * number of times, then fail the document visibly so the user sees a reason
 * instead of a spinner that never stops.
 */

import { createServerClient } from '@/lib/supabase/client';
import {
  MAX_INGESTION_ATTEMPTS,
  processDocument,
  STALLED_AFTER_MS,
} from './documents';

export interface ReaperOutcome {
  documentId: string;
  name: string;
  attempts: number;
  result: 'recovered' | 'failed-permanently' | 'retry-failed';
  error?: string;
}

export interface ReaperReport {
  scanned: number;
  outcomes: ReaperOutcome[];
}

export async function reapStalledDocuments(): Promise<ReaperReport> {
  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - STALLED_AFTER_MS).toISOString();

  const { data: stalled, error } = await supabase
    .from('documents')
    .select('id, name, attempts, processing_started_at')
    .eq('status', 'processing')
    .lt('processing_started_at', cutoff)
    .order('processing_started_at', { ascending: true })
    .limit(10);

  if (error) throw error;

  const outcomes: ReaperOutcome[] = [];

  for (const document of stalled || []) {
    const attempts = (document.attempts || 0) + 1;

    if (attempts > MAX_INGESTION_ATTEMPTS) {
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          error_message: `Ingestion stalled and did not complete after ${MAX_INGESTION_ATTEMPTS} attempts.`,
          processing_started_at: null,
        })
        .eq('id', document.id);

      outcomes.push({
        documentId: document.id,
        name: document.name,
        attempts: attempts - 1,
        result: 'failed-permanently',
      });
      continue;
    }

    // Count the attempt before retrying, so a run that dies again still leaves
    // the counter advanced and cannot loop forever.
    await supabase
      .from('documents')
      .update({ status: 'queued', attempts, processing_started_at: null })
      .eq('id', document.id);

    try {
      await processDocument(document.id);
      outcomes.push({
        documentId: document.id,
        name: document.name,
        attempts,
        result: 'recovered',
      });
    } catch (retryError) {
      // processDocument already marked the row failed with its own message.
      outcomes.push({
        documentId: document.id,
        name: document.name,
        attempts,
        result: 'retry-failed',
        error: retryError instanceof Error ? retryError.message : 'Unknown error',
      });
    }
  }

  return { scanned: (stalled || []).length, outcomes };
}
