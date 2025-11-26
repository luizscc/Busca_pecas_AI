// src/lib/fetch-utils.ts
export async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

export async function retry<T>(fn: () => Promise<T>, retries = 2, delay = 300): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === retries) break;
      await new Promise((r) => setTimeout(r, delay * 2 ** i));
    }
  }
  throw lastErr;
}
