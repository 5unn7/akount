import { describe, it, expect, vi, beforeEach } from 'vitest';
import { securityHeaders, strictSecurityHeaders, getHSTSHeader } from '../security-headers';

describe('securityHeaders', () => {
  let hookCallback: (request: unknown, reply: unknown) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Capture the onSend hook callback when securityHeaders registers it
    const mockFastify = {
      addHook: vi.fn((event: string, fn: (req: unknown, rep: unknown) => Promise<void>) => {
        if (event === 'onSend') {
          hookCallback = fn;
        }
      }),
    };

    await securityHeaders(mockFastify as never);
    expect(mockFastify.addHook).toHaveBeenCalledWith('onSend', expect.any(Function));
  });

  function createMockReply() {
    const headers: Record<string, string> = {};
    return {
      header: vi.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      getHeader: vi.fn((name: string) => headers[name]),
      _headers: headers,
    };
  }

  it('should set X-Frame-Options to DENY', async () => {
    const reply = createMockReply();
    await hookCallback({}, reply);

    expect(reply.header).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  it('should set X-Content-Type-Options to nosniff', async () => {
    const reply = createMockReply();
    await hookCallback({}, reply);

    expect(reply.header).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it('should set X-XSS-Protection', async () => {
    const reply = createMockReply();
    await hookCallback({}, reply);

    expect(reply.header).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
  });

  it('should set Referrer-Policy', async () => {
    const reply = createMockReply();
    await hookCallback({}, reply);

    expect(reply.header).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
  });

  it('should set Permissions-Policy', async () => {
    const reply = createMockReply();
    await hookCallback({}, reply);

    expect(reply.header).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
  });

  it('should set Cache-Control when not already set', async () => {
    const reply = createMockReply();
    await hookCallback({}, reply);

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
  });

  it('should NOT override existing Cache-Control header', async () => {
    const reply = createMockReply();
    // Simulate existing Cache-Control
    reply._headers['Cache-Control'] = 'public, max-age=3600';

    await hookCallback({}, reply);

    // Cache-Control should NOT have been re-set
    const cacheControlCalls = reply.header.mock.calls.filter(
      (call: unknown[]) => call[0] === 'Cache-Control'
    );
    expect(cacheControlCalls).toHaveLength(0);
  });
});

describe('strictSecurityHeaders', () => {
  function createMockReply() {
    return {
      header: vi.fn(),
    };
  }

  it('should set no-cache headers', async () => {
    const request = {};
    const reply = createMockReply();

    await strictSecurityHeaders(request as never, reply as never);

    expect(reply.header).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );
    expect(reply.header).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(reply.header).toHaveBeenCalledWith('Expires', '0');
  });

  it('should set X-Download-Options', async () => {
    const request = {};
    const reply = createMockReply();

    await strictSecurityHeaders(request as never, reply as never);

    expect(reply.header).toHaveBeenCalledWith('X-Download-Options', 'noopen');
  });

  it('should mark response as sensitive', async () => {
    const request = {};
    const reply = createMockReply();

    await strictSecurityHeaders(request as never, reply as never);

    expect(reply.header).toHaveBeenCalledWith('X-Sensitive-Data', 'true');
  });
});

describe('getHSTSHeader', () => {
  it('should return valid HSTS header value', () => {
    const header = getHSTSHeader();
    expect(header).toBe('max-age=31536000; includeSubDomains; preload');
  });

  it('should include max-age of 1 year (31536000 seconds)', () => {
    const header = getHSTSHeader();
    expect(header).toContain('max-age=31536000');
  });

  it('should include includeSubDomains directive', () => {
    const header = getHSTSHeader();
    expect(header).toContain('includeSubDomains');
  });

  it('should include preload directive', () => {
    const header = getHSTSHeader();
    expect(header).toContain('preload');
  });
});
