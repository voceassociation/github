// Only public editorial HTML is eligible. Versioned keys prevent a deployment
// from reusing rendered pages made by an older version of the Worker.
export async function serveCachedPublicPage(request, env, ctx, render, cache = globalThis.caches?.default) {
  const url = new URL(request.url);
  const publicPage = /^\/(?:archive\/(?:\d{4}\/\d{2}\/\d{2}\/[^/]+|\d{4}-\d{2}-\d{2})|(?:(?:fr|it)\/)?atlas\/(?:[a-z0-9-]+|relations\/[a-z0-9-]+--[a-z0-9-]+))\/?$/.test(url.pathname);
  const version = env.CF_VERSION_METADATA?.id;
  if (!publicPage || request.method !== 'GET' || url.search || request.headers.has('authorization')
      || request.headers.has('cookie') || request.headers.has('range') || !version || !cache || !ctx?.waitUntil) {
    return render();
  }
  const key = new Request(`${url.origin}/.public-render-cache/${encodeURIComponent(version)}${url.pathname}`);
  try {
    const hit = await cache.match(key);
    if (hit) {
      const response = new Response(hit.body, hit);
      response.headers.set('x-voce-render-cache', 'HIT');
      return response;
    }
  } catch { /* An unavailable cache must not make a public page unavailable. */ }
  const response = await render();
  const policy = response.headers.get('cache-control') || '';
  if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')
      && /\bpublic\b/i.test(policy) && !/private|no-store|no-cache/i.test(policy)
      && !response.headers.has('set-cookie') && response.headers.get('vary') !== '*') {
    const saved = response.clone();
    ctx.waitUntil(Promise.resolve().then(() => cache.put(key, saved)).catch(() => {}));
    const outgoing = new Response(response.body, response);
    outgoing.headers.set('x-voce-render-cache', 'MISS');
    return outgoing;
  }
  return response;
}
