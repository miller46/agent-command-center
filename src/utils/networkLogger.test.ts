import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __networkLoggerTestUtils, installFetchNetworkLogger } from './networkLogger';

describe('network logger', () => {
  const originalFetch = window.fetch;
  const originalEnvFlag = import.meta.env.VITE_ENABLE_NETWORK_LOGGING;

  beforeEach(() => {
    __networkLoggerTestUtils.resetInstalled();
    (import.meta.env as Record<string, string | boolean | undefined>).VITE_ENABLE_NETWORK_LOGGING = 'true';
  });

  afterEach(() => {
    window.fetch = originalFetch;
    (import.meta.env as Record<string, string | boolean | undefined>).VITE_ENABLE_NETWORK_LOGGING = originalEnvFlag;
    vi.restoreAllMocks();
  });

  it('redacts sensitive headers', () => {
    const headers = __networkLoggerTestUtils.toHeaderRecord({
      Authorization: 'Bearer token',
      'X-Api-Key': 'secret',
      'Content-Type': 'application/json',
    });

    expect(headers).toEqual({
      authorization: '[REDACTED]',
      'x-api-key': '[REDACTED]',
      'content-type': 'application/json',
    });
  });

  it('logs request and response without consuming response body', async () => {
    const payload = { ok: true, value: 42 };
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    window.fetch = fetchSpy as typeof window.fetch;

    const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

    installFetchNetworkLogger();

    const response = await fetch('/api/test', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer abc',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'forge' }),
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);

    expect(groupSpy).toHaveBeenCalledWith('🌐 HTTP Request POST /api/test');
    expect(logSpy).toHaveBeenCalledWith(
      'request',
      expect.objectContaining({
        method: 'POST',
        url: '/api/test',
        headers: expect.objectContaining({
          authorization: '[REDACTED]',
          'content-type': 'application/json',
        }),
        payload: { name: 'forge' },
      }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      'response',
      expect.objectContaining({
        status: 200,
        body: payload,
      }),
    );
    expect(groupEndSpy).toHaveBeenCalled();
  });
});
