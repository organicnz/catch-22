/**
 * Unit tests for src/app/auth/callback/route.ts
 *
 * The OAuth callback handler:
 *  1. Exchanges an auth code for a session via Supabase
 *  2. Redirects to `next` on success (defaults to /account)
 *  3. Redirects to /login?error=Invalid_Token on failure or missing code
 */
import { afterEach, describe, expect, it, vi } from 'bun:test';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        verifyOtp: mockVerifyOtp,
      },
    })
  ),
}));

// next/headers cookies() — called indirectly by createServerClient mock,
// but our mock above bypasses the real implementation entirely.
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

// Import AFTER mocks
import { GET } from '../../app/auth/callback/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(params: Record<string, string>): Request {
  const url = new URL('https://catch-22.co.nz/auth/callback');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /auth/callback', () => {
  it('exchanges code and redirects to /account by default', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const req = makeRequest({ code: 'valid-code-123' });
    const res = await GET(req);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code-123');
    expect(res.status).toBe(307); // NextResponse.redirect
    expect(res.headers.get('location')).toBe('https://catch-22.co.nz/account');
  });

  it('redirects to custom `next` param on success', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const req = makeRequest({ code: 'valid-code-456', next: '/account/orders' });
    const res = await GET(req);

    expect(res.headers.get('location')).toBe('https://catch-22.co.nz/account/orders');
  });

  it('redirects to /login?error=Invalid_Token when exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: 'invalid JWT' },
    });

    const req = makeRequest({ code: 'bad-code' });
    const res = await GET(req);

    expect(res.headers.get('location')).toBe('https://catch-22.co.nz/login?error=Invalid_Token');
  });

  it('redirects to /login?error=Invalid_Token when no code is provided', async () => {
    const req = makeRequest({});
    const res = await GET(req);

    // No code → skip exchange entirely → error redirect
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toBe('https://catch-22.co.nz/login?error=Invalid_Token');
  });

  it('verifies token_hash and redirects to /account on success', async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const req = makeRequest({ token_hash: 'pkce-token-hash-123', type: 'signup' });
    const res = await GET(req);

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'pkce-token-hash-123',
      type: 'signup',
    });
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://catch-22.co.nz/account');
  });

  it('redirects with error parameter when Supabase returns an auth error description', async () => {
    const req = makeRequest({
      error: 'access_denied',
      error_description: 'Email link is invalid or has expired',
    });
    const res = await GET(req);

    expect(res.headers.get('location')).toBe(
      'https://catch-22.co.nz/login?error=Email+link+is+invalid+or+has+expired'
    );
  });
});
