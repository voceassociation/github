# VOCE Applied / Post-SaaS — implementation and QA

Date: 2026-10-17. Scope: three native static pages, local financial model, Applied links, and responsive shared navigation corrections.

## Source and editorial decisions

The supplied deployment mandate was read in full. Its linked prototype package could not be resolved through the available file access. This implementation was therefore built from the mandate and the actual repository, not represented as a reuse or verification of unavailable prototype files.

EN is the default route; FR and IT follow the repository's existing prefixes. Each page inherits the actual Applied header/footer markup, VOCE wordmark and shared typography. Generate pages with `python3 scripts/build-post-saas.py`. The script reads the existing Applied shells and selected corpus articles.

The page covers museums, foundations, hospitality, OTAs/distribution, enterprise operations, accounting and legal workflows. These are scoped engagements, not invented customer references. LÉGIS is a concrete architectural example grounded in `legis-worker.js`, `legis-core.js` and `wrangler.jsonc`: Workers API, curated sources, output checks, Workers AI Qwen/GLM, D1 quotas/metrics. Its France/EU beta scope remains explicit.

Four existing corpus articles are linked: accesso Passport (16 October), Digits (16 October), SAP/Deloitte close (16 October), Harvey NDA workflows (2 October). Articles are labelled as French-language research, not partnerships or implemented integrations. No new vendor performance claim is made on this page.

## Financial model

36 months, EUR excluding VAT; annual increases from months 13 and 25. Upfront investment is counted once. Coexistence includes existing subscriptions AND retained legacy administration, separately from new operating costs. Residual licences must not duplicate subscriptions already in coexistence. Gains, additional cost and equal cost are separately labelled. Zero baseline has no percentage. First crossover is distinguished from sustained payback. Sensitivity: migration +20%, coexistence +6 months capped at 36. No implied productivity gain, revenue or cost of capital.

Values remain in module memory during language switches. No localStorage, sessionStorage, query-string serialization or financial request payload. Refresh resets values. CSV is generated locally; monthly amounts have two decimals and displayed summaries use whole euros. Invalid inputs hide stale results and disable export.

The Worker serves these pages before shared analytics/audio injection, rejects submissions, and adds a CSP with `form-action 'none'`. Language requests retrieve static pages only. Guide and legal links are preserved explicitly in this isolated shell.

## Verification

- 45 Node tests pass, no skips, including existing LÉGIS, Atlas and public-page suites plus 10 Post-SaaS tests. DOM suites used JSDOM.
- 8 existing Python backfill/discovery tests pass.
- Browser tests: three page languages at 320, 390, 768 and 1440 px; exactly one H1; no horizontal overflow; visible language controls; FR/EN/IT transitions preserve inputs; invalid state and additional-cost state verified.
- Additional browser audit: 24 principal routes at all four widths. Shared headers have no overlapping or off-screen controls. Initially observed narrow-screen content defects on home, About, Courses and Italian Applied were corrected with scoped wrapping/min-width rules.
- Inline language-switch audit: Home, Research, Academy, Standards, Publications, Art and About through FR → EN → IT → FR at 320 and 390 px.
- Local CSV export verified; only static GET requests observed during calculator language changes, with no financial values sent.
- All relative links on the new pages resolve to repository files; selected corpus URLs are taken directly from the current corpus. Canonical/hreflang, translated title/description and OG/Twitter metadata provided. Three URLs added to the sitemap.
- Font QA used the exact Google Fonts resources referenced by the existing stylesheet, locally fulfilled in the browser harness because direct browser font retrieval was unavailable. Cormorant Garamond 500 and Inter were confirmed loaded. Production font resources are unchanged.
- `node --check` on changed JavaScript and `git diff --check` pass. Static repository: no package/build/typecheck script exists.

## Responsive change

The previous page-specific mobile menus used nowrap plus horizontal scrolling, placing language controls at the far end. A shared override now wraps links below 1200 px while retaining the existing markup and all navigation items. The existing site has no hamburger menu on these pages; no new menu system was invented. Long translated grid content can shrink, a home CTA can wrap, and the About signature scales at narrow widths. Desktop identity remains unchanged.

## Reproduction and deployment

- `node --test tests/post-saas.test.mjs`
- `LEGIS_JSDOM_MODULE=/path/to/jsdom node --test tests/*.test.mjs`
- `python3 -m unittest discover -s backfill/tests`
- `POST_SAAS_BASE=http://localhost:8787 node tests/post-saas.browser.mjs` (Playwright and Chromium required; optional PLAYWRIGHT_MODULE/CHROMIUM_EXECUTABLE)

Browser QA used a local clean-URL static server; Worker privacy behavior was tested separately through its fetch handler. Screenshots in this folder show the new page in French at desktop and mobile widths. Hosted preview / production verification remains a separate deployment step. No production release is claimed by this report.
