interface RateLimitState {
  remaining: number;
  resetAt: number;
}

let state: RateLimitState = { remaining: 5000, resetAt: 0 };

export function updateRateLimitFromHeaders(headers: Headers): void {
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  if (remaining) state.remaining = parseInt(remaining, 10);
  if (reset) state.resetAt = parseInt(reset, 10) * 1000;
}

export function getRateLimitState(): RateLimitState {
  return { ...state };
}

export async function throttledFetch(
  url: string,
  options: RequestInit,
): Promise<Response> {
  if (state.remaining < 10 && state.resetAt > Date.now()) {
    const waitMs = state.resetAt - Date.now() + 1000;
    console.log(`Rate limit nearly exhausted, waiting ${Math.round(waitMs / 1000)}s`);
    await sleep(waitMs);
  } else if (state.remaining < 100) {
    await sleep(500);
  } else {
    await sleep(50);
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, options);
    updateRateLimitFromHeaders(response.headers);

    if (response.ok) return response;

    if (response.status === 403 || response.status === 429) {
      const backoff = Math.pow(2, attempt) * 1000;
      console.log(`Rate limited (${response.status}), backing off ${backoff}ms`);
      await sleep(backoff);
      lastError = new Error(`Rate limited: ${response.status}`);
      continue;
    }

    return response;
  }

  throw lastError || new Error('Request failed after retries');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
