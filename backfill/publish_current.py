import html
import json
import re
import sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
corpus_path = ROOT / "data" / "corpus.json"
routes_path = ROOT / "data" / "article-routes.json"
corpus = json.loads(corpus_path.read_text())
routes = json.loads(routes_path.read_text())
route_by_id = {x["id"]: x for x in routes["items"]}

raw_days = sorted(
    p.stem for p in (ROOT / "backfill" / "raw").glob("*.json")
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", p.stem)
)
DAYS = sys.argv[1:] or raw_days[-4:]
DAYS = sorted(dict.fromkeys(DAYS))
histories = {}
for day in DAYS:
    path = ROOT / "data" / "history" / f"{day}.json"
    if path.exists():
        histories[day] = json.loads(path.read_text())

now = datetime.now(timezone.utc).isoformat()
corpus_by_id = {x["id"]: x for x in corpus["items"]}
for day, history in histories.items():
    items = sorted(history.get("items", []), key=lambda x: x["date_published"])
    for item in items:
        item["academy_classification"] = {
            "class": "A",
            "label": "editorial/archive",
            "reviewed_at": now,
            "reason": "Published editorial or OPÉRA VOCE item; not a formal research output."
        }
        corpus_by_id[item["id"]].update(item)
    history["items"] = items
    history["item_count"] = len(items)
    (ROOT / "data" / "history" / f"{day}.json").write_text(
        json.dumps(history, ensure_ascii=False, indent=2) + "\n"
    )

corpus["items"] = list(corpus_by_id.values())
corpus["item_count"] = len(corpus["items"])
corpus["generated_at"] = now
corpus_path.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n")
(ROOT / "data" / "corpus.ndjson").write_text(
    "".join(json.dumps(x, ensure_ascii=False) + "\n" for x in corpus["items"])
)

MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"]
def day_label(day):
    dt = datetime.fromisoformat(day)
    return f"{dt.day} {MONTHS[dt.month-1]} {dt.year}"

def title_of(item):
    return item.get("title") or next((x.strip() for x in item["text"].splitlines() if x.strip()), "Publication VOCE")

def excerpt_of(item):
    lines = [x.strip() for x in item["text"].splitlines() if x.strip()]
    title = title_of(item)
    rest = lines[1:] if lines and lines[0] == title else lines
    return next((x for x in rest if x not in {"ULTRA®", "Sources", "Source"}), title)[:240]

def article_html(item, day):
    title = title_of(item)
    excerpt = excerpt_of(item)
    canonical = item["canonical_url"]
    published = item["date_published"]
    same_as = [item["source_url"]] + [
        x["source_url"] for x in item.get("alternate_publications", []) if x.get("source_url")
    ]
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
        "sameAs": same_as,
        "inLanguage": item.get("language", "fr"),
        "articleBody": item["text"],
        "isPartOf": {"@type": "CollectionPage", "@id": f"https://voce.life/archive/{day}"}
    }
    body = "\n".join(
        "<p>" + html.escape(x).replace("\n", "<br>") + "</p>"
        for x in item["text"].split("\n\n") if x.strip()
    )
    date_display = datetime.fromisoformat(published).strftime("%d/%m/%Y %H:%M")
    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)} — VOCE</title><meta name="description" content="{html.escape(excerpt, quote=True)}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large"><link rel="canonical" href="{html.escape(canonical, quote=True)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="VOCE"><meta property="og:title" content="{html.escape(title, quote=True)}">
<meta property="og:description" content="{html.escape(excerpt, quote=True)}"><meta property="og:url" content="{html.escape(canonical, quote=True)}">
<meta property="article:published_time" content="{html.escape(published, quote=True)}"><link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")}</script></head>
<body><a class="skip-link" href="#main-content">Aller au contenu</a><header><div class="wrap nav"><a class="voce-mark" href="/" aria-label="VOCE"><span></span></a>
<nav class="menu" aria-label="Navigation principale"><a href="/#themes">Thèmes</a><a href="/research">Research</a><a href="/archive">Academy</a><a href="/standards">Standards</a><a href="/publications">Publications</a><a href="/art">Art</a><a class="keep" href="/about">About</a></nav></div></header>
<main id="main-content"><section class="topic-hero"><div class="wrap"><div class="topic-kicker">Corpus VOCE · {day_label(day)}</div>
<h1 class="topic-title">{html.escape(title)}</h1><p class="topic-deck">{html.escape(excerpt)}</p><div class="topic-meta"><span>VOCE Association</span><span>{date_display}</span><span>Archive canonique</span></div></div></section>
<section class="topic-body"><div class="wrap topic-layout"><aside class="topic-nav"><div class="topic-nav-label">Corpus</div><a href="/archive/{day}">{day_label(day)}</a><a href="/archive">Toutes les archives</a><a href="/publications">Publications</a></aside><div class="longform">
<article class="chapter" data-publication-id="{html.escape(item["platform_id"], quote=True)}"><div class="chapter-no">VOCE</div><p class="signal"><a href="{html.escape(item["source_url"], quote=True)}" rel="noopener">Publication LinkedIn originale</a></p>{body}</article>
<section class="chapter"><div class="chapter-no">VOCE Academy</div><p class="signal">Ce texte appartient au corpus pédagogique et éditorial de VOCE Association. Lecture, découverte et citation sont publiques; les droits sur le texte et le corpus restent détenus par VOCE Association. <a href="/CORPUS_RIGHTS.txt">Droits du corpus</a>.</p></section>
</div></div></section></main><footer><div class="wrap"><div class="footer"><a class="voce-mark" href="/" aria-label="VOCE"><span></span></a><div class="footer-right"><div>Paris · London · Dubai · Hangzhou · Shanghai · Hong Kong</div><div><a href="/art">VOCE Art</a> · <a href="/archive">VOCE Academy</a> · © 2026 VOCE Association</div></div></div></div></footer></body></html>"""

for day, history in histories.items():
    items = history["items"]
    for item in items:
        route = route_by_id[item["id"]]
        target = ROOT / (route["path"].lstrip("/") + ".html")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(article_html(item, day))
    cards = []
    for item in sorted(items, key=lambda x: x["date_published"], reverse=True):
        route = route_by_id[item["id"]]
        when = datetime.fromisoformat(item["date_published"]).strftime("%H:%M")
        cards.append(f'<article class="chapter"><div class="chapter-no">{when}</div><h2><a href="{html.escape(route["path"], quote=True)}">{html.escape(title_of(item))}</a></h2><p>{html.escape(excerpt_of(item))}</p></article>')
    daily = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Archive VOCE du {day_label(day)}</title><meta name="description" content="{len(items)} publications VOCE du {day_label(day)}."><meta name="robots" content="index,follow"><link rel="canonical" href="https://voce.life/archive/{day}"><link rel="stylesheet" href="/styles.css"></head><body><header><div class="wrap nav"><a class="voce-mark" href="/" aria-label="VOCE"><span></span></a><nav class="menu"><a href="/#themes">Thèmes</a><a href="/research">Research</a><a href="/archive">Academy</a><a href="/standards">Standards</a><a href="/publications">Publications</a><a href="/art">Art</a><a href="/about">About</a></nav></div></header><main><section class="topic-hero"><div class="wrap"><div class="topic-kicker">VOCE Academy</div><h1 class="topic-title">{day_label(day)}</h1><p class="topic-deck">Index chronologique reliant chaque publication à son adresse documentaire permanente.</p><div class="topic-meta"><span>{len(items)} publications</span><span>Texte intégral</span><span>URL permanentes</span></div></div></section><section class="topic-body"><div class="wrap topic-layout"><aside class="topic-nav"><a href="/archive">Toutes les archives</a></aside><div class="longform">{''.join(cards)}</div></div></section></main></body></html>"""
    (ROOT / "archive" / f"{day}.html").write_text(daily)

for route in routes["items"]:
    if route.get("redirect_to") and route.get("date") in DAYS:
        target = ROOT / (route["path"].lstrip("/") + ".html")
        target.parent.mkdir(parents=True, exist_ok=True)
        canonical = "https://voce.life" + route["redirect_to"]
        target.write_text(f'<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="{html.escape(canonical, quote=True)}"><title>Redirection VOCE</title></head><body><p><a href="{html.escape(canonical, quote=True)}">Texte canonique</a></p></body></html>')

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
    ET.SubElement(node, "pubDate").text = format_datetime(datetime.fromisoformat(item["date_published"]))
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

ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", ns)
sitemap_path = ROOT / "sitemap.xml"
tree = ET.parse(sitemap_path)
smroot = tree.getroot()
by_loc = {}
for node in smroot.findall(f"{{{ns}}}url"):
    loc = node.find(f"{{{ns}}}loc")
    if loc is not None:
        by_loc[loc.text] = node
def touch(url, lastmod):
    node = by_loc.get(url)
    if node is None:
        node = ET.SubElement(smroot, f"{{{ns}}}url")
        ET.SubElement(node, f"{{{ns}}}loc").text = url
        by_loc[url] = node
    mod = node.find(f"{{{ns}}}lastmod")
    if mod is None:
        mod = ET.SubElement(node, f"{{{ns}}}lastmod")
    mod.text = lastmod
for route in routes["items"]:
    if not route.get("redirect_to") and route.get("date") in DAYS:
        touch("https://voce.life" + route["path"], route["date"])
for day in histories:
    touch(f"https://voce.life/archive/{day}", day)
tree.write(sitemap_path, encoding="utf-8", xml_declaration=True)

checkpoint_path = ROOT / "backfill" / "checkpoint.json"
checkpoint = json.loads(checkpoint_path.read_text())
integration = checkpoint.setdefault("integration", {})
integration["current_publication_ingest"] = {
    "dates": list(histories),
    "verified_source": "Metricool LinkedIn connector, brand 7090850",
    "items_processed": sum(len(x["items"]) for x in histories.values()),
    "corpus_items_after": count,
    "classification": "A editorial/archive",
    "static_pages_verified_for_generation": sum(len(x["items"]) for x in histories.values()),
    "daily_archives": [f"archive/{day}.html" for day in histories],
    "completed_at": now
}
checkpoint_path.write_text(json.dumps(checkpoint, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"dates": list(histories), "items": sum(len(x["items"]) for x in histories.values()), "corpus_items": count}, ensure_ascii=False))
