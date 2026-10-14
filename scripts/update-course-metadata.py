"""Refresh discovery metadata from the courses' published learning objectives.

Only HTML heads are updated. Written lessons, exercises, answers and routes stay intact.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPDATED = "2026-10-14"
SUFFIX = {
    "fr": "Cours VOCE® {id} en accès libre, avec cas pratique et exercice corrigé.",
    "en": "Free VOCE® course {id} with a business case, exercise and explained answer.",
    "it": "Corso VOCE® {id} ad accesso libero, con caso pratico, esercizio e soluzione commentata.",
}


def description(course, lang):
    objective = course["objective"].strip()
    objective = objective[0].upper() + objective[1:]
    if objective[-1] not in ".!?":
        objective += "."
    return objective + " " + SUFFIX[lang].format(id=course["id"])


def course_schema(course, lang):
    return {
        "@type": "Course", "name": course["title"], "courseCode": course["id"],
        "url": "https://voce.life" + course["url"], "inLanguage": lang,
        "description": course["seo_description"], "teaches": course["objective"],
        "provider": {"@type": "Organization", "name": "VOCE Association", "url": "https://voce.life/"},
        "isAccessibleForFree": True,
    }


def replace_jsonld(source, update):
    def transform(match):
        obj = json.loads(match[1])
        update(obj)
        return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace("</", "<\\/") + '</script>'
    return re.sub(r'<script type="application/ld\+json">(.*?)</script>', transform, source, flags=re.S)


def update(root=ROOT):
    path = root / "data/voce-courses.json"
    data = json.loads(path.read_text())
    updated_paths = []
    for lang, courses in data["localized_courses"].items():
        by_url = {}
        for course in courses:
            course["seo_description"] = description(course, lang)
            by_url["https://voce.life" + course["url"]] = course
            target = root / (course["url"].lstrip("/") + ".html")
            before = target.read_text()
            head, body = before.split("</head>", 1)
            escaped = html.escape(course["seo_description"], quote=True)
            for attr in ['name="description"', 'property="og:description"']:
                pattern = r'(<meta ' + re.escape(attr) + r' content=")[^"]*(">)'
                head, matches = re.subn(pattern, lambda m: m[1] + escaped + m[2], head)
                if matches != 1:
                    raise ValueError(f"Missing/duplicate metadata in {target}: {attr}")
            def enrich(obj):
                types = obj.get("@type", [])
                types = [types] if isinstance(types, str) else types
                if "LearningResource" not in types:
                    raise ValueError(f"Unexpected course schema in {target}")
                additional = course_schema(course, lang)
                additional["@type"] = list(dict.fromkeys(["Course"] + types))
                obj.update(additional)
                obj["dateModified"] = UPDATED
            head = replace_jsonld(head, enrich)
            after = head + "</head>" + body
            assert after.split("</head>", 1)[1] == before.split("</head>", 1)[1]
            target.write_text(after)
            updated_paths.append(str(target.relative_to(root)))
        catalog = root / ("cours.html" if lang == "fr" else f"{lang}/cours.html")
        before = catalog.read_text()
        head, body = before.split("</head>", 1)
        def enrich_catalog(obj):
            for row in obj["mainEntity"]["itemListElement"]:
                row["item"] = course_schema(by_url[row["url"]], lang)
            obj["dateModified"] = UPDATED
        catalog.write_text(replace_jsonld(head, enrich_catalog) + "</head>" + body)
        updated_paths.append(str(catalog.relative_to(root)))
    # The French public list and its localized copy have the same descriptions.
    fr = {c["id"]: c for c in data["localized_courses"]["fr"]}
    for course in data["courses"]:
        course["seo_description"] = fr[course["id"]]["seo_description"]
    data["updated_at"] = UPDATED
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    sitemap = root / "sitemap.xml"
    source = sitemap.read_text()
    for target in updated_paths:
        url = "https://voce.life/" + target.removesuffix(".html")
        pattern = r'(<url>\s*<loc>' + re.escape(url) + r'</loc>\s*<lastmod>)[^<]*(</lastmod>)'
        source, matches = re.subn(pattern, lambda m: m[1] + UPDATED + m[2], source)
        if matches != 1:
            raise ValueError(f"Course sitemap entry missing/duplicated: {url}")
    sitemap.write_text(source)
    return {"courses_with_schema": sum(len(v) for v in data["localized_courses"].values()), "catalogs": len(data["languages"]), "bodies_and_urls_preserved": True}


if __name__ == "__main__":
    print(json.dumps(update()))
