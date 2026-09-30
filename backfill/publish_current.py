import html
import json
import re
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DAY = "2026-09-30"
history_path = ROOT / "data" / "history" / f"{DAY}.json"
corpus_path = ROOT / "data" / "corpus.json"
routes_path = ROOT / "data" / "article-routes.json"

corpus = json.loads(corpus_path.read_text())
routes = json.loads(routes_path.read_text())
history = json.loads(history_path.read_text())
route_by_id = {x["id"]: x for x in routes["items"]}
items = sorted(history["items"], key=lambda x: x["date_published"])

for item in items:
    item["academy_classification"] = {
        "class": "A",
        "label": "editorial/archive",
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "reason": "Published editorial or OPÉRA VOCE item; not a formal research output."
    }

corpus_by_id = {x["id"]: x for x in corpus["items"]}
for item in items:
    corpus_by_id[item["id"]].update(item)

history["items"] = items
history["item_count"] = len(items)
history_path.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n")
corpus["items"] = list(corpus_by_id.values())
corpus["item_count"] = len(corpus["items"])
corpus_path.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n")
(ROOT / "data" / "corpus.ndjson").write_text(
    "".join(json.dumps(x, ensure_ascii=False) + "\n" for x in corpus["items"])
)

def title_of(item):
    return item.get("title") or next((x.strip() for x in item["text"].splitlines() if x.strip()), "Publication VOCE")

def excerpt_of(item):
    lines = [x.strip() for x in item["text"].splitlines() if x.strip()]
    title = title_of(item)
    rest = lines[1:] if lines and lines[0] == title else lines
    value = next((x for x in rest if x not in {"ULTRA®", "Sources", "Source"}), title)
    return value[:240]

def article_html(item):
    title = title_of(item)
    excerpt = excerpt_of(item)
    canonical = item["canonical_url"]
    published = item["date_published"]
    route = route_by_id[item["id"]]
    parts = [x.strip() for x in item["text"].split("\n\n") if x.strip()]
    body = "\n".join("<p>" + html.escape(x).replace("\n", "<br>") + "</p>" for x in parts)
    ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "datePublished": published,
        "dateModified": published,
        "author": {"@type": "Organization", "name": "VOCE Association", "url": "https://voce.life/"},
        "publisher": {"@type": "Organization", "name": "VOCE Association", "url": "https://voce.life/"},
        "copyrightHolder": {"@type": "Organization", "name": "VOCE Association"},
        "copyrightNotice": "Copyright © VOCE Association. All rights reserved.",
        "mainEntityOfPage": canonical,
        "url": canonical,
        "sameAs": item["source_url"],
        "inLanguage": item.get("language", "fr"),
        "articleBody": item["text"],
        "isPartOf": {"@type": "CollectionPage", "@id": f"https://voce.life/archive/{DAY}"}
    }
    date_display = datetime.fromisoformat(published).strftime("%d/%m/%Y %H:%M")
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)} — VOCE</title>
<meta name="description" content="{html.escape(excerpt, quote=True)}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<link rel="canonical" href="{html.escape(canonical, quote=True)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="VOCE">
<meta property="og:title" content="{html.escape(title, quote=True)}">
<meta property="og:description" content="{html.escape(excerpt, quote=True)}">
<meta property="og:url" content="{html.escape(canonical, quote=True)}">
<meta property="article:published_time" content="{html.escape(published, quote=True)}">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")}</script>
</head>
<body>
<a class="skip-link" href="#main-content">Aller au contenu</a>
<header><div class="wrap nav"><a class="voce-mark" href="/" aria-label="VOCE"><span></span></a><nav class="menu" aria-label="Navigation principale"><a href="/#themes">Thèmes</a><a href="/research">Research</a><a href="/archive">Academy</a><a href="/standards">Standards</a><a href="/publications">Publications</a><a href="/art">Art</a><a class="keep" href="/about">About</a></nav></div></header>
<main id="main-content">
<section class="topic-hero"><div class="wrap"><div class="topic-kicker">Corpus VOCE · 30 septembre 2026</div><h1 class="topic-title">{html.escape(title)}</h1><p class="topic-deck">{html.escape(excerpt)}</p><div class="topic-meta"><span>VOCE Association</span><span>{date_display}</span><span>Archive canonique</span></div></div></section>
<section class="topic-body"><div class="wrap topic-layout"><aside class="topic-nav"><div class="topic-nav-label">Corpus</div><a href="/archive/2026-09-30">30 septembre 2026</a><a href="/archive">Toutes les archives</a><a href="/publications">Publications</a></aside><div class="longform">
<article class="chapter" data-publication-id="{html.escape(item["platform_id"], quote=True)}"><div class="chapter-no">VOCE</div><p class="signal"><a href="{html.escape(item["source_url"], quote=True)}" rel="noopener">Publication LinkedIn originale</a></p>{body}</article>
<section class="chapter"><div class="chapter-no">VOCE Academy</div><p class="signal">Ce texte appartient au corpus pédagogique et éditorial de VOCE Association. Lecture, découverte et citation sont publiques; les droits sur le texte et le corpus restent détenus par VOCE Association. <a href="/CORPUS_RIGHTS.txt">Droits du corpus</a>.</p></section>
</div></div></section></main>
<footer><div class="wrap"><div class="footer"><a class="voce-mark" href="/" aria-label="VOCE"><span></span></a><div class="footer-right"><div>Paris · London · Dubai · Hangzhou · Shanghai · Hong Kong</div><div><a href="/art">VOCE Art</a> · <a href="/archive">VOCE Academy</a> · © 2026 VOCE Association</div></div></div></div></footer>
</body></html>
"""

for item in items:
    route = route_by_id[item["id"]]
    target = ROOT / (route["path"].lstrip("/") + ".html")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(article_html(item))

cards = []
for item in sorted(items, key=lambda x: x["date_published"], reverse=True):
    route = route_by_id[item["id"]]
    when = datetime.fromisoformat(item["date_published"]).strftime("%H:%M")
    cards.append(f'<article class="chapter"><div class="chapter-no">{when}</div><h2><a href="{html.escape(route["path"], quote=True)}">{html.escape(title_of(item))}</a></h2><p>{html.escape(excerpt_of(item))}</p></article>')
daily = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Archive VOCE du 30 septembre 2026</title><meta name="description" content="{len(items)} publications VOCE du 30 septembre 2026."><meta name="robots" content="index,follow"><link rel="canonical" href="https://voce.life/archive/2026-09-30"><link rel="stylesheet" href="/styles.css"></head><body><header><div class="wrap nav"><a class="voce-mark" href="/" aria-label="VOCE"><span></span></a><nav class="menu"><a href="/#themes">Thèmes</a><a href="/research">Research</a><a href="/archive">Academy</a><a href="/standards">Standards</a><a href="/publications">Publications</a><a href="/art">Art</a><a href="/about">About</a></nav></div></header><main><section class="topic-hero"><div class="wrap"><div class="topic-kicker">VOCE Academy</div><h1 class="topic-title">30 septembre 2026</h1><p class="topic-deck">Index chronologique reliant chaque publication à son adresse documentaire permanente.</p><div class="topic-meta"><span>{len(items)} publications</span><span>Texte intégral</span><span>URL permanentes</span></div></div></section><section class="topic-body"><div class="wrap topic-layout"><aside class="topic-nav"><a href="/archive">Toutes les archives</a></aside><div class="longform">{''.join(cards)}</div></div></section></main></body></html>"""
(ROOT / "archive" / f"{DAY}.html").write_text(daily)

# Rebuild a complete full-text RSS feed from the canonical corpus.
rss = ET.Element("rss", {"version": "2.0"})
channel = ET.SubElement(rss, "channel")
ET.SubElement(channel, "title").text = "VOCE Academy"
ET.SubElement(channel, "link").text = "https://voce.life/archive"
ET.SubElement(channel, "description").text = "VOCE Association canonical editorial and educational corpus."
ET.SubElement(channel, "language").text = "fr"
ET.SubElement(channel, "lastBuildDate").text = format_datetime(datetime.now(timezone.utc))
for item in sorted(corpus["items"], key=lambda x: x["date_published"], reverse=True):
    node = ET.SubElement(channel, "item")
    ET.SubElement(node, "title").text = title_of(item)
    ET.SubElement(node, "link").text = item["canonical_url"]
    ET.SubElement(node, "guid", {"isPermaLink": "true"}).text = item["canonical_url"]
    dt = datetime.fromisoformat(item["date_published"])
    ET.SubElement(node, "pubDate").text = format_datetime(dt)
    ET.SubElement(node, "author").text = "VOCE Association"
    ET.SubElement(node, "description").text = item["text"]
    ET.SubElement(node, "source", {"url": item["source_url"]}).text = item["platform"].title()
ET.ElementTree(rss).write(ROOT / "feed.xml", encoding="utf-8", xml_declaration=True)

count = len(corpus["items"])
llms = (ROOT / "llms.txt").read_text()
llms = re.sub(r"[\d,]+ archived LinkedIn texts", f"{count:,} archived LinkedIn texts", llms)
(ROOT / "llms.txt").write_text(llms)

archive = (ROOT / "archive.html").read_text()
archive = re.sub(r"\d+ archived publications", f"{count} archived publications", archive)
archive = re.sub(r"\d+ publications archivées", f"{count} publications archivées", archive)
archive = re.sub(r"\d+ pubblicazioni archiviate", f"{count} pubblicazioni archiviate", archive)
(ROOT / "archive.html").write_text(archive)

checkpoint_path = ROOT / "backfill" / "checkpoint.json"
checkpoint = json.loads(checkpoint_path.read_text())
checkpoint["integration"]["current_publication_ingest"] = {
    "date": DAY,
    "verified_source": "Metricool LinkedIn connector, brand 7090850",
    "items_added": len(items),
    "corpus_items_after": count,
    "classification": "A editorial/archive",
    "static_pages_created": len(items),
    "daily_archive": f"archive/{DAY}.html",
    "completed_at": datetime.now(timezone.utc).isoformat()
}
checkpoint_path.write_text(json.dumps(checkpoint, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"date": DAY, "items": len(items), "corpus_items": count}, ensure_ascii=False))
