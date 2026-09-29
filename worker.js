const CORE_FILES = [
  "archive.html",
  "data/corpus.json",
  "data/corpus.ndjson",
  "data/corpus-schema-v1.json",
  "data/voce-index-registry.json",
  "feed.xml",
  "llms.txt",
  "CORPUS_RIGHTS.txt",
  "sitemap.xml"
];

function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getAsset(env, path) {
  const response = await env.ASSETS.fetch(new Request(`https://voce.life/${path}`));
  if (!response.ok) throw new Error(`Asset ${path} returned ${response.status}`);
  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "application/octet-stream"
  };
}

async function storeIfChanged(env, path, timestamp) {
  const { bytes, contentType } = await getAsset(env, path);
  const sha256 = hex(await crypto.subtle.digest("SHA-256", bytes));
  const existing = await env.VOCE_CORPUS.head(path);

  if (existing?.customMetadata?.sha256 === sha256) {
    return { path, changed: false, sha256 };
  }

  const metadata = {
    sha256,
    source: `https://voce.life/${path}`,
    synced_at: timestamp
  };

  await env.VOCE_CORPUS.put(path, bytes, {
    httpMetadata: { contentType },
    customMetadata: metadata
  });

  const versionStamp = timestamp.replace(/[:.]/g, "-");
  await env.VOCE_CORPUS.put(`versions/${versionStamp}/${path}`, bytes, {
    httpMetadata: { contentType },
    customMetadata: metadata
  });

  return { path, changed: true, sha256 };
}

async function syncCorpus(env) {
  const timestamp = new Date().toISOString();
  const registryAsset = await getAsset(env, "data/voce-index-registry.json");
  const registryText = new TextDecoder().decode(registryAsset.bytes);
  const registry = JSON.parse(registryText);

  const paths = new Set(CORE_FILES);
  for (const date of Object.keys(registry.archived_days || {})) {
    paths.add(`archive/${date}.html`);
  }

  const results = [];
  for (const path of paths) {
    results.push(await storeIfChanged(env, path, timestamp));
  }

  const manifest = {
    schema: 1,
    owner: "VOCE Association",
    bucket: "voce-sovereign-corpus",
    synced_at: timestamp,
    source: "https://voce.life",
    objects: results
  };

  await env.VOCE_CORPUS.put("manifest.json", JSON.stringify(manifest, null, 2) + "\n", {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: { synced_at: timestamp }
  });
}

export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(syncCorpus(env));
  }
};
