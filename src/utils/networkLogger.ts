const REDACTED_VALUE = '[REDACTED]';

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
  'x-api-key',
  'x-auth-token',
]);

let fetchLoggerInstalled = false;

const toHeaderRecord = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) {
    return {};
  }

  const result: Record<string, string> = {};
  const appendHeader = (key: string, value: string) => {
    result[key.toLowerCase()] = SENSITIVE_HEADER_NAMES.has(key.toLowerCase()) ? REDACTED_VALUE : value;
  };

  if (headers instanceof Headers) {
    headers.forEach((value, key) => appendHeader(key, value));
    return result;
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      appendHeader(key, value);
    }
    return result;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      appendHeader(key, value.join(', '));
      continue;
    }

    if (value !== undefined) {
      appendHeader(key, String(value));
    }
  }

  return result;
};

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const readRequestBody = (init?: RequestInit): unknown => {
  if (!init?.body) {
    return undefined;
  }

  if (typeof init.body === 'string') {
    return safeJsonParse(init.body);
  }

  if (init.body instanceof URLSearchParams) {
    return Object.fromEntries(init.body.entries());
  }

  if (init.body instanceof FormData) {
    return Object.fromEntries(init.body.entries());
  }

  if (init.body instanceof Blob) {
    return `[Blob ${init.body.type || 'application/octet-stream'} (${init.body.size} bytes)]`;
  }

  if (init.body instanceof ArrayBuffer) {
    return `[ArrayBuffer (${init.body.byteLength} bytes)]`;
  }

  if (ArrayBuffer.isView(init.body)) {
    return `[TypedArray (${init.body.byteLength} bytes)]`;
  }

  return String(init.body);
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  try {
    const text = await response.clone().text();

    if (!text) {
      return null;
    }

    return safeJsonParse(text);
  } catch {
    return '[Unreadable response body]';
  }
};

const shouldEnableLogging = (): boolean => {
  const explicitFlag = import.meta.env.VITE_ENABLE_NETWORK_LOGGING;
  if (explicitFlag === 'true') {
    return true;
  }

  if (explicitFlag === 'false') {
    return false;
  }

  return import.meta.env.DEV;
};

const nowIso = (): string => new Date().toISOString();

export const installFetchNetworkLogger = (): void => {
  if (fetchLoggerInstalled || typeof window === 'undefined' || !shouldEnableLogging()) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const timestamp = nowIso();
    const startedAt = performance.now();

    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    const url = input instanceof Request ? input.url : String(input);
    const headers = toHeaderRecord(init?.headers ?? (input instanceof Request ? input.headers : undefined));

    console.groupCollapsed(`🌐 HTTP Request ${method.toUpperCase()} ${url}`);
    console.log('timestamp', timestamp);
    console.log('request', {
      method: method.toUpperCase(),
      url,
      headers,
      payload: readRequestBody(init),
    });

    try {
      const response = await originalFetch(input, init);
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      const responseBody = await readResponseBody(response);

      console.log('response', {
        status: response.status,
        statusText: response.statusText,
        headers: toHeaderRecord(response.headers),
        body: responseBody,
        durationMs,
      });
      console.groupEnd();

      return response;
    } catch (error) {
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      console.error('response_error', {
        error,
        durationMs,
      });
      console.groupEnd();
      throw error;
    }
  };

  fetchLoggerInstalled = true;
};

export const __networkLoggerTestUtils = {
  toHeaderRecord,
  shouldEnableLogging,
  resetInstalled: () => {
    fetchLoggerInstalled = false;
  },
};
