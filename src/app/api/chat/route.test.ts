import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  generateResponse: vi.fn(),
  inserts: [] as Record<string, unknown>[],
}));
vi.mock('@/lib/ai/rag', () => ({ generateResponse: mocks.generateResponse }));
vi.mock('@/lib/db/metrics', () => ({ recordRequestMetrics: vi.fn() }));
vi.mock('@/lib/security/rate-limit', () => ({
  clientIpFrom: () => '127.0.0.1',
  enforceChatRateLimits: async () => null,
  readLimitFromEnv: (_name: string, fallback: number) => fallback,
}));
vi.mock('@/lib/supabase/client', () => ({
  createServerClient: () => ({
    from: (table: string) => {
      const query: Record<string, any> = {};
      for (const method of ['select', 'eq', 'order']) query[method] = () => query;
      query.insert = (value: Record<string, unknown>) => {
        mocks.inserts.push(value);
        return query;
      };
      query.limit = async () => ({ data: [] });
      query.single = async () => ({ data: table === 'widgets'
        ? { user_id: 'owner', allowed_domains: ['example.com'] }
        : { id: table === 'chat_sessions' ? 'session' : 'message' } });
      return query;
    },
  }),
}));
import { POST } from './route';

const privateSources = [{ document_id: 'private-id', document_name: 'private-name',
  chunk_content: 'PRIVATE_EXCERPT_MUST_NOT_LEAVE_SERVER', similarity: 0.99 }];

describe('public chat source confidentiality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.inserts.length = 0;
    mocks.generateResponse.mockImplementation(async (_message, _strict, _persona, options) => {
      options?.onToken('I cannot share that.');
      return { response: 'I cannot share that.', sources: privateSources, metrics: {} };
    });
  });
  for (const mode of ['json', 'body-stream', 'accept-stream']) {
    it(`keeps retrieval sources server-side for ${mode}`, async () => {
      const request = new NextRequest('https://example.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://example.com',
          Accept: mode === 'accept-stream' ? 'text/event-stream' : 'application/json' },
        body: JSON.stringify({ message: 'Tell me something private', widgetKey: 'test', stream: mode === 'body-stream' }),
      });
      const result = await POST(request);
      expect(result.status).toBe(200);
      const body = await result.text();
      expect(body).not.toContain('sources');
      for (const secret of ['private-id', 'private-name', 'PRIVATE_EXCERPT_MUST_NOT_LEAVE_SERVER']) {
        expect(body).not.toContain(secret);
      }
      if (mode === 'json') expect(JSON.parse(body)).toEqual({ response: 'I cannot share that.', sessionId: 'session', messageId: 'message' });
      else {
        const events = body.trim().split('\n\n').map(frame => JSON.parse(frame.slice(6)));
        expect(events).toEqual([{ type: 'token', text: 'I cannot share that.' }, { type: 'done', messageId: 'message', sessionId: 'session' }]);
      }
      expect(mocks.inserts).toContainEqual({ session_id: 'session', role: 'assistant', content: 'I cannot share that.', sources: privateSources });
    });
  }
});
