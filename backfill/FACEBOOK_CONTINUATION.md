# VOCE Facebook continuation

Codex reads Facebook texts through Metricool brand `7090850` and handles the
archive. Metricool does not publish, modify or shorten the texts in this process.
The task runs at 08:00 Europe/Podgorica after Metricool's early-morning sync.
This is a polling schedule, not a guaranteed Metricool completion webhook.
Read a rolling three-day window and retain pending days if the sync is late.

Only publications strictly after the verified LinkedIn Diella timestamp
`2026-10-12T12:00:56.377Z` belong to this continuation. Do not backfill older
Facebook posts or replace archived LinkedIn originals.

The authorised Facebook page is `61581153121750`. Metricool's displayed network
identifier `802476986277786` differs, but an actual returned reel permalink was
verified to resolve to the authorised VOCE page. Use observed source URLs and
page canonicals to verify provenance; do not assume that differing IDs mean an
incorrect connection.

Read Metricool fields `FBPO02, FBPO03, FBPO04, FBPO06` for posts and
`FBRE02, FBRE03, FBRE05, FBRE06` for reel captions. Do not fetch the video.
Confirm the timestamp timezone from source evidence before converting it to a
timezone-aware ISO datetime; never infer an exact hour from a relative label or
from a date mentioned in the article body.

Save a verified packet at `backfill/raw/facebook/YYYY-MM-DD.json` with:

- `schema`: `voce.facebook-verified-source.v1`
- `date`: verified Europe/Podgorica civil day matching the filename
- `page_id`: `61581153121750`
- `access_verified`: true
- `verified_posts`: a list of the verified original texts

Each verified post must include literal `facebook_id` as a string, observed
`source_url`, observed `author_page_canonical` containing the authorised page ID
and the post ID, `text`, SHA-256 of the exact UTF-8 text in `text_sha256`, verified
timezone-aware `publication_datetime`, timezone-aware `retrieved_at`, and a
source-supported `date_basis`. Set `url_resolved`, `linebreaks_preserved`,
`date_verified` and `author_verified` to true only after checking them.
Optionally retain a verified source `language`.

Preserve the full base text without any length limit or editorial rewriting,
including ULTRA®, sources, hashtags and authored whitespace. Metadata/footer
text added by the platform is not part of the original article.

`facebook_sources.py` rejects unverified dates/authors, changed text hashes,
numeric IDs, future timestamps and publications before the continuation boundary.
Exact cross-platform duplicate texts enrich the existing document's provenance
without creating another canonical route. Changed versions of an existing title
stay in the original source packet and are reported in
`backfill/facebook-conflicts.json` pending reconciliation; originals are retained.

The existing ingest workflow reconciles verified packets, publishes permanent
article and daily archive pages, maintains JSON/NDJSON/RSS, sitemap and llms.txt,
updates Applied evidence, validates uniqueness and submits IndexNow URLs. The
Worker renders all platforms with a generic original-publication link. Verify
production and the R2 manifest before reporting a successful archive.

The earlier candidate reel `1997995871106377` (Kinexys/CIPS) remains evidence-only
until its publication datetime is verified. Its text must not be silently given
an invented timestamp to make it pass this pipeline.
