#!/usr/bin/env python3
"""Read-only public discovery audit. UA probes do not prove real bot access/indexing."""
import concurrent.futures
import datetime
import hashlib
import io
import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://voce.life"


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.canonicals, self.ld, self.titles = {}, [], [], []
        self.capture = None
        self.buffer = ""

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            key = a.get("property", a.get("name", ""))
            self.meta.setdefault(key, []).append(a.get("content", ""))
        if tag == "link" and a.get("rel") == "canonical":
            self.canonicals.append(a.get("href"))
        if tag == "title" or (tag == "script" and a.get("type") == "application/ld+json"):
            self.capture, self.buffer = tag, ""

    def handle_data(self, data):
        if self.capture:
            self.buffer += data

    def handle_endtag(self, tag):
        if tag == self.capture:
            if tag == "title":
                self.titles.append(self.buffer)
            else:
                try:
                    self.ld.append(json.loads(self.buffer))
                except ValueError:
                    self.ld.append({"parse_error": True})
            self.capture = None


def fetch(job):
    url, ua, expected_text = job
    with tempfile.TemporaryDirectory() as tmp:
        body, headers = Path(tmp) / "body", Path(tmp) / "headers"
        p = subprocess.run(["curl", "--silent", "--show-error", "--max-time", "35",
                            "-A", ua, "-D", str(headers), "-o", str(body),
                            "-w", "%{http_code}", url], capture_output=True, text=True)
        result = {"url": url, "user_agent": ua, "status": p.stdout,
                  "transport_error": p.stderr if p.returncode else None}
        if not body.exists():
            return result
        raw = body.read_bytes()
        h = headers.read_text(errors="replace")
        fields = {}
        for line in h.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                fields[k.lower()] = v.strip()
        result.update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(),
                      headers={k: fields.get(k) for k in
                               ["content-type", "x-robots-tag", "location", "cf-mitigated"]})
        if "text/html" in fields.get("content-type", ""):
            head = Head()
            head.feed(raw.decode("utf-8", errors="replace"))
            result.update(title=head.titles, canonical=head.canonicals, meta=head.meta,
                          jsonld_types=[x.get("@type") for x in head.ld if isinstance(x, dict)],
                          jsonld_parse_errors=sum(bool(x.get("parse_error")) for x in head.ld if isinstance(x, dict)))
            if expected_text is not None:
                result["original_articleBody_exact"] = any(
                    isinstance(x, dict) and x.get("articleBody") == expected_text for x in head.ld)
        elif url.endswith("robots.txt"):
            result["body"] = raw.decode()
        elif url.endswith("sitemap.xml"):
            tree = ET.fromstring(raw)
            locs = [x.text for x in tree.findall("{*}url/{*}loc")]
            result.update(url_count=len(locs), unique_url_count=len(set(locs)),
                          local_sitemap_exact=raw == (ROOT / "sitemap.xml").read_bytes())
        elif url.endswith("voce-corpus-backup"):
            result["backup"] = json.loads(raw)
        elif "image/jpeg" in fields.get("content-type", ""):
            try:
                from PIL import Image
                im = Image.open(io.BytesIO(raw))
                im.load()
                result.update(image_decodes=True, image_format=im.format,
                              image_dimensions=list(im.size))
            except Exception as error:
                result.update(image_decodes=False, image_error=str(error))
        return result


def main():
    corpus = json.loads((ROOT / "data/corpus.json").read_text())["items"]
    routes = json.loads((ROOT / "data/article-routes.json").read_text())["items"]
    by_id = {x["id"]: x for x in corpus}
    active = [x for x in routes if not x.get("redirect_to")]
    route_by_id = {x["id"]: x for x in active}
    selected_ids = {min(corpus, key=lambda x: x["date_published"])["id"],
                    max(corpus, key=lambda x: x["date_published"])["id"],
                    "linkedin:7510307518246559744"}
    ultra = next((x for x in corpus if "ULTRA®" in x["text"]), None)
    if ultra:
        selected_ids.add(ultra["id"])
    samples = [(BASE + route_by_id[i]["path"], "VOCE-Public-Discovery-Audit/1.0", by_id[i]["text"])
               for i in sorted(selected_ids)]
    article_url = BASE + route_by_id["linkedin:7510307518246559744"]["path"]
    uas = ["Googlebot", "Bingbot", "facebookexternalhit/1.1", "Facebot", "meta-externalfetcher/1.1",
           "Meta-WebIndexer/1.1", "SemrushBot", "SiteAuditBot", "LinkedInBot", "Twitterbot",
           "Applebot", "DuckDuckBot", "OAI-SearchBot", "PerplexityBot"]
    jobs = samples + [(article_url, ua, by_id["linkedin:7510307518246559744"]["text"]) for ua in uas]
    paths = ["/", "/archive", "/archive/2026-06-27", "/atlas", "/fr/atlas", "/it/atlas",
             "/art", "/governance", "/robots.txt", "/sitemap.xml", "/voce-og.jpg",
             "/.well-known/voce-corpus-backup"]
    jobs += [(BASE + p, "VOCE-Public-Discovery-Audit/1.0", None) for p in paths]
    jobs += [(BASE + "/", ua, None) for ua in ["Googlebot", "Bingbot", "facebookexternalhit/1.1", "SiteAuditBot"]]
    jobs += [(BASE + "/voce-og.jpg", "facebookexternalhit/1.1", None)]
    aliases = [x for x in routes if x.get("redirect_to")]
    jobs += [(BASE + x["path"], "Googlebot", None) for x in aliases]
    jobs += [("http://voce.life/", "VOCE-Public-Discovery-Audit/1.0", None),
             ("https://www.voce.life/", "VOCE-Public-Discovery-Audit/1.0", None)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(fetch, jobs))
    locs = [x.text for x in ET.parse(ROOT / "sitemap.xml").getroot().findall("{*}url/{*}loc")]
    report = {
        "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "scope": "Public HTTP and server-rendered metadata; real search indexing and bot IP access not measured",
        "local": {"corpus_items": len(corpus), "canonical_article_routes": len(active),
                  "unique_ids": len(by_id), "unique_texts": len({x["text"] for x in corpus}),
                  "all_articles_in_sitemap": all(BASE + x["path"] in locs for x in active),
                  "redirect_aliases_excluded_from_sitemap": all(BASE + x["path"] not in locs for x in aliases),
                  "sitemap_urls": len(locs), "sitemap_unique_urls": len(set(locs))},
        "http_checks": results,
    }
    out = ROOT / f"backfill/reports/seo-crawlers-{datetime.datetime.now(datetime.timezone.utc).date()}.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"report": str(out), "local": report["local"],
                      "checks": [{"url": x["url"], "ua": x["user_agent"], "status": x["status"],
                                  "exact_text": x.get("original_articleBody_exact"),
                                  "error": x.get("transport_error")} for x in results]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
