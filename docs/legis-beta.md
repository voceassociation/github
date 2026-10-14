# LEGIS beta 0.1

Owner and operator: VOCE Association. Authorised launch: 14 October 2026.

## Available behaviour

- `/legis` (EN), `/fr/legis` and `/it/legis`: static, indexable entry pages with the existing VOCE typography.
- Browser-local preparation: institution context, a fictional/anonymised question or clause, a sourced checklist, evidence gathering status, TXT export and browser print/PDF.
- Explicit per-analysis consent before any user text leaves the browser.
- Qwen3-30B-A3B-FP8 (Apache 2.0 upstream) and GLM-4.7-Flash (MIT upstream), hosted through the existing Cloudflare Workers AI binding. A comparative reading runs both models independently against the same source packet.
- `GET /api/legis/status` reports actual source freshness and binding readiness.
- `POST /api/legis/analyse` serves the on-site beta with a strict input schema, bounded JSON body, source packet and validated output references. It is not a public cross-origin or authenticated partner API.

## Legal perimeter and sources

France / EU: museum ticketing contracts, personal data processors, security, international transfer principles and French market/concession definitions. Seven documentary references are held in `data/legis-sources.json`, checked on 14 October 2026. Summaries are VOCE paraphrases, not quotations or live consolidated legislation. Each record contains its limitations. There is no exhaustive legal search, current jurisprudence, historical law lookup, procurement threshold calculation or compliance certification.

Légifrance and Judilibre API connections remain a next step requiring PISTE credentials and versioned retrieval tests. The current beta must never claim these connections are active. Before enabling them, define scopes, source normalisation, version dates, failures and result permissions.

## Costs and data

- No new model subscription or paid-plan upgrade is part of this release.
- Atomic D1 quota reservation before inference: 60 generation attempts per UTC day overall; 8 per network per day. Comparison reserves two attempts. Invalid outputs and failed calls do not refund reservations.
- Model outputs are bounded at 1,700 tokens per call; inputs at 900 characters for a question and 3,200 for a clause. There are no automatic model retries or external-provider fallbacks.
- The dedicated D1 database is restricted to the EU. It stores no question, clause or response. Quota keys are daily HMACs of network address, using the `LEGIS_QUOTA_SALT` secret; quota rows expire and are purged on use. Aggregate token/Neuron counters are retained for 60 days.
- EU storage does not guarantee EU AI execution. The UI restricts beta use to fictional/anonymised inputs and names Cloudflare as the inference processor.
- Model results and analysis endpoints carry private/no-store and noindex response headers. No input is added to Academy, the public corpus, sitemap or R2 backups.
- Sources expire after 30 days until reviewed. Expired packets block inference and retain the local checklist with its dated reference information.

## Verification and operation

Run `node scripts/build-legis.mjs`, `node --test tests/legis.test.mjs` and `wrangler deploy --dry-run`. The tests exercise atomic quotas, transaction rollback, strict input and output schemas, untrusted input boundaries, cross-origin blocking, missing quota controls, source expiry, separate/partial comparisons and content-free metrics.

Provider access and licences were verified against official model cards and Cloudflare documentation on 14 October 2026. Small live model readings are a smoke test, not a legal quality certification. Browser interaction and responsive rendering require a browser QA pass when that capability is available.

Deployment follows the existing GitHub `main` to Cloudflare Workers build. Preserve existing AI/R2 bindings, cron, article routes, Academy and corpus. Rollback is a source revert through the same build. The dedicated database and salt may remain unused after a revert; no user content is retained there.

## Next steps

1. Review beta observations with a legal professional and expand the evaluation set before confidential or client use.
2. Connect and validate versioned official legal APIs once the credentials are available.
3. Add private case spaces only after access controls, retention/deletion and execution residency are defined and tested.
4. Build partner API/MCP access with authentication and permissions, then use LEGIS results to sequence the later paid verticals.

Academy, courses and the VOCE corpus remain active. Their future evolution is for review around October 2027, with no automatic removal.
