"""Generate bounded discovery resources from the authoritative, intact corpus."""
import json
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

RSS_LIMIT = 50
COUNTER_LABELS = ("archived publications", "publications archivées", "pubblicazioni archiviate")


def publication_time(item):
    value = datetime.fromisoformat(item["date_published"].replace("Z", "+00:00"))
    # Day-precision records are ordered by their known day, without inventing a pubDate.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def synchronize_counter(source, count):
    for label in COUNTER_LABELS:
        source, matches = re.subn(r"\d+ " + re.escape(label), f"{count} {label}", source)
        if not matches:
            raise ValueError(f"Academy counter label missing: {label}")
    return source


def build_feed(corpus):
    items = corpus["items"]
    if corpus["item_count"] != len(items):
        raise ValueError("Corpus count does not match its records")
    if len({x["canonical_url"] for x in items}) != len(items):
        raise ValueError("Corpus has duplicate canonical URLs")
    rss = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = "VOCE Academy"
    ET.SubElement(channel, "link").text = "https://voce.life/archive"
    ET.SubElement(channel, "description").text = (
        "The 50 latest VOCE publications, with full original text and permanent URLs. "
        "The complete corpus remains available at https://voce.life/data/corpus.json "
        "and https://voce.life/data/corpus.ndjson."
    )
    ET.SubElement(channel, "language").text = "fr"
    built = datetime.fromisoformat(corpus["generated_at"].replace("Z", "+00:00"))
    if built.tzinfo is None:
        built = built.replace(tzinfo=timezone.utc)
    ET.SubElement(channel, "lastBuildDate").text = format_datetime(built.astimezone(timezone.utc))
    recent = sorted(items, key=lambda x: (publication_time(x), x["canonical_url"]), reverse=True)[:RSS_LIMIT]
    for item in recent:
        node = ET.SubElement(channel, "item")
        title = item.get("title") or next((x.strip() for x in item["text"].splitlines() if x.strip()), "Publication VOCE")
        ET.SubElement(node, "title").text = title
        ET.SubElement(node, "link").text = item["canonical_url"]
        ET.SubElement(node, "guid", {"isPermaLink": "true"}).text = item["canonical_url"]
        if item.get("date_precision") != "day":
            ET.SubElement(node, "pubDate").text = format_datetime(publication_time(item))
        ET.SubElement(node, "author").text = "VOCE Association"
        ET.SubElement(node, "description").text = item["text"]
        ET.SubElement(node, "source", {"url": item["source_url"]}).text = item["platform"].title()
    return ET.tostring(rss, encoding="utf-8", xml_declaration=True)


def validate_discovery(root, corpus):
    count = len(corpus["items"])
    if corpus["item_count"] != count:
        raise ValueError("Corpus count does not match its records")
    archive = (root / "archive.html").read_text()
    for label in COUNTER_LABELS:
        values = re.findall(r"(\d+) " + re.escape(label), archive)
        if not values or any(int(x) != count for x in values):
            raise ValueError(f"Stale Academy counter: {label}")
    nodes = ET.parse(root / "feed.xml").findall("channel/item")
    recent = sorted(corpus["items"], key=lambda x: (publication_time(x), x["canonical_url"]), reverse=True)[:RSS_LIMIT]
    if [x.findtext("link") for x in nodes] != [x["canonical_url"] for x in recent]:
        raise ValueError("RSS does not contain exactly the latest canonical publications")
    if [x.findtext("description") for x in nodes] != [x["text"] for x in recent]:
        raise ValueError("RSS original text was changed")
    return {"corpus_items": count, "rss_items": len(nodes), "rss_bytes": (root / "feed.xml").stat().st_size, "academy_counters_consistent": True}


def write_discovery(root, corpus):
    archive = root / "archive.html"
    archive.write_text(synchronize_counter(archive.read_text(), len(corpus["items"])))
    (root / "feed.xml").write_bytes(build_feed(corpus))
    return validate_discovery(root, corpus)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    print(json.dumps(write_discovery(root, json.loads((root / "data/corpus.json").read_text()))))
