"""Discovery policy for the expanded catalogue, without rewriting lessons or URLs."""
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPDATED = "2026-10-18"
REGISTRY = "https://voce.life/data/voce-vclf-public.json"
POST_DESCRIPTIONS = {
    "en": "VOCE Post-SaaS: assess ERP and CRM dependencies, compare total costs over 36 months and design business systems with controlled AI agents.",
    "fr": "VOCE Post-SaaS: évaluer les dépendances ERP et CRM, comparer les coûts sur 36 mois et concevoir des systèmes métiers avec des agents IA contrôlés.",
    "it": "VOCE Post-SaaS: valutare dipendenze ERP e CRM, confrontare i costi su 36 mesi e progettare sistemi aziendali con agenti IA controllati.",
}


def set_meta(head, key, value, *, prop=False):
    attr = "property" if prop else "name"
    pattern = r'<meta\b(?=[^>]*\b' + attr + r'="' + re.escape(key) + r'")[^>]*>'
    tag = f'<meta {attr}="{key}" content="{html.escape(value, quote=True)}">'
    return re.sub(pattern, lambda _: tag, head) if re.search(pattern, head) else head + "\n" + tag


def schema_from(head):
    return json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', head, re.S)[1])


def set_schema(head, schema):
    tag = '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace("</", "<\\/") + '</script>'
    return re.sub(r'<script type="application/ld\+json">.*?</script>', lambda _: tag, head, count=1, flags=re.S)


def share_metadata(head, title, description, url, image=None):
    if image is None:
        existing = re.search(r'<meta property="og:image" content="([^"]*)"', head)
        image = html.unescape(existing[1]) if existing else "https://voce.life/voce-og.jpg"
    head = set_meta(head, "description", description)
    for key, value in {"og:type": "website", "og:site_name": "VOCE", "og:title": title,
                       "og:description": description, "og:url": url, "og:image": image,
                       "og:image:width": "2400" if "/course-cards/" in image else "1200",
                       "og:image:height": "1260" if "/course-cards/" in image else "630"}.items():
        head = set_meta(head, key, value, prop=True)
    for key, value in {"twitter:card": "summary_large_image", "twitter:title": title,
                       "twitter:description": description, "twitter:image": image}.items():
        head = set_meta(head, key, value)
    return head


def persist(path, before, head, body):
    after = head + "</head>" + body
    if after == before:
        return False
    path.write_text(after)
    return True


def update(root=ROOT):
    registry_path = root / "data/voce-vclf-public.json"
    registry = json.loads(registry_path.read_text())
    legacy_path = root / "data/voce-courses.json"
    legacy = json.loads(legacy_path.read_text())
    historical = {"https://voce.life" + c["url"]: c for c in legacy["courses"]}
    drafts, changed_urls, maturity = set(), set(), {}
    for course in registry["courses"]:
        url = course["url"]
        path = root / (url.removeprefix("https://voce.life/") + ".html")
        before = path.read_text()
        head, body = before.split("</head>", 1)
        schema = schema_from(head)
        capsule = schema.get("learningResourceType") == "Capsule introductive"
        if capsule and "Capsule introductive en développement" not in body:
            raise ValueError(f"Capsule status is ambiguous: {url}")
        explicitly_ready = course.get("resource_type") == "written_course" and course.get("indexing_policy", {}).get("eligible") is True
        if not capsule and url not in historical and not explicitly_ready:
            raise ValueError(f"New course needs an explicit editorial indexing decision: {url}")
        objective = course["objective"].strip().rstrip(".")
        suffix = ("Capsule VOCE® en développement, avec exercice corrigé et références." if capsule else
                  "Cours VOCE® en accès libre, avec exercice corrigé. Revue indépendante en attente.")
        description = objective[0].upper() + objective[1:] + ". " + suffix
        title = html.unescape(re.search(r'<title>(.*?)</title>', head, re.S)[1])
        image = ("https://voce.life/assets/course-cards/fr-" + historical[url]["id"] + ".png" if url in historical else
                 "https://voce.life/voce-og.jpg")
        head = share_metadata(head, title, description, url, image)
        head = set_meta(head, "robots", "noindex,follow" if capsule else "index,follow,max-image-preview:large")
        schema.update(description=description, teaches=course["objective"], dateModified=UPDATED,
                      creativeWorkStatus="Work in progress" if capsule else "Published; independent expert review pending",
                      publisher={"@type": "Organization", "name": "VOCE Association", "url": "https://voce.life/"})
        if not capsule:
            schema.update({"@type": ["Course", "LearningResource"], "courseCode": course["id"], "provider": schema["publisher"]})
        if persist(path, before, set_schema(head, schema), body):
            changed_urls.add(url)
        course.update(resource_type="introductory_capsule" if capsule else "historical_written_course" if url in historical else "written_course", seo_description=description,
                      indexing_policy={"eligible": not capsule, "robots": "noindex,follow" if capsule else "index,follow",
                                       "reason": "introductory_capsule_in_development" if capsule else "historical_written_course_available"},
                      available_languages=["fr", "en", "it"] if url in historical else course.get("available_languages", ["fr"]))
        if capsule:
            drafts.add(url)
        elif url in historical:
            stem = historical[url]["url"]
            course["localized_urls"] = {lang: "https://voce.life" + ("" if lang == "fr" else "/" + lang) + stem for lang in ["fr", "en", "it"]}
        maturity[url] = schema
    registry["discovery_policy"] = {"updated_at": UPDATED, "indexable_historical_courses": len(historical),
                                     "development_capsules_noindex": len(drafts),
                                     "description": "Development capsules remain accessible but are excluded from search until editorial completion. Independent scientific validation is a separate, unverified status."}
    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n")
    legacy["catalogue_scope"] = {"type": "historical_course_translations", "course_count": len(historical),
                                 "full_french_catalogue": "https://voce.life/cours", "full_registry": REGISTRY,
                                 "full_french_module_count": len(registry["courses"]), "additional_capsules_translated": False}
    by_url = {c["url"]: c for c in registry["courses"]}
    for courses in [legacy["courses"], legacy["localized_courses"]["fr"]]:
        for c in courses:
            full = by_url["https://voce.life" + c["url"]]
            c.update(vclf_id=full["id"], seo_description=full["seo_description"])
    legacy_path.write_text(json.dumps(legacy, ensure_ascii=False, indent=2) + "\n")
    notes = {
        "fr": ('<p class="courses-indexing-policy">Les capsules en développement restent consultables à leurs URL permanentes. Leur indexation est différée jusqu’à leur finalisation éditoriale; cela ne constitue pas une validation scientifique.</p>',
               "120 ressources VOCE®: 16 cours historiques et 104 capsules en développement, en IA, art et cognition. Accès libre; aucune certification délivrée."),
        "en": ('<p class="courses-access courses-language-scope">This English edition contains the 16 historical written courses. The <a href="/cours">French catalogue</a> also lists 104 introductory capsules in development; those capsules are not yet translated. Independent scientific review and educational pilots remain pending.</p>',
               "Sixteen historical VOCE® courses in English, with exercises and answers. The expanded French catalogue also includes 104 capsules in development."),
        "it": ('<p class="courses-access courses-language-scope">Questa edizione italiana comprende i 16 corsi scritti storici. Il <a href="/cours">catalogo francese</a> include anche 104 capsule introduttive in sviluppo, non ancora tradotte. La revisione scientifica indipendente e i progetti pilota didattici restano da realizzare.</p>',
               "Sedici corsi storici VOCE® in italiano, con esercizi e soluzioni. Il catalogo francese ampliato include anche 104 capsule in sviluppo."),
    }
    for lang, (note, description) in notes.items():
        url = "https://voce.life/" + ("" if lang == "fr" else lang + "/") + "cours"
        path = root / (url.removeprefix("https://voce.life/") + ".html")
        before = path.read_text()
        head, body = before.split("</head>", 1)
        marker = "courses-indexing-policy" if lang == "fr" else "courses-language-scope"
        if marker not in body:
            pattern = r'(<p class="courses-access">16 cours historiques.*?</p>)' if lang == "fr" else r'(<p class="courses-access">.*?</p>)'
            body, n = re.subn(pattern, lambda m: m[1] + note, body, count=1)
            if n != 1:
                raise ValueError(f"Catalogue disclosure anchor missing: {url}")
        title = html.unescape(re.search(r'<title>(.*?)</title>', head, re.S)[1])
        head = share_metadata(head, title, description, url)
        schema = schema_from(head)
        schema.update(description=description, inLanguage=lang, dateModified=UPDATED)
        schema["mainEntity"]["numberOfItems"] = len(schema["mainEntity"]["itemListElement"])
        if lang == "fr":
            for row in schema["mainEntity"]["itemListElement"]:
                item = maturity[row["url"]]
                row["item"] = {k: item[k] for k in ["@type", "name", "url", "description", "creativeWorkStatus", "learningResourceType"]}
        if persist(path, before, set_schema(head, schema), body):
            changed_urls.add(url)
    for lang, description in POST_DESCRIPTIONS.items():
        url = "https://voce.life/" + ("" if lang == "en" else lang + "/") + "applied/post-saas"
        path = root / (url.removeprefix("https://voce.life/") + ".html")
        before = path.read_text()
        head, body = before.split("</head>", 1)
        title = html.unescape(re.search(r'<title>(.*?)</title>', head, re.S)[1])
        if persist(path, before, share_metadata(head, title, description, url), body):
            changed_urls.add(url)
    llms_path = root / "llms.txt"
    llms = re.sub(r'\n\n## VCLF expanded learning registry and maturity\n.*?(?=\n## |\Z)', '', llms_path.read_text(), flags=re.S)
    section = ("\n\n## VCLF expanded learning registry and maturity\n\n"
               "Full French catalogue: https://voce.life/cours\n"
               f"Full public learning registry: {REGISTRY}\n"
               "Historical translations registry (16 courses, not the full catalogue): https://voce.life/data/voce-courses.json\n"
               "The French catalogue contains 120 resources: 16 historical written courses and 104 introductory capsules in development. "
               "English and Italian currently cover the 16 historical courses. Development capsules remain accessible at permanent URLs with noindex,follow "
               "and are excluded from the search sitemap until editorial completion. Read resource_type, indexing_policy and available_languages in the registry. "
               "Independent expert/scientific validation and educational pilots are not established; no certification or university partnership is implied.\n")
    llms_path.write_text(llms.rstrip() + section)
    sitemap = root / "sitemap.xml"
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", ns)
    tree = ET.parse(sitemap)
    removed = 0
    for row in list(tree.getroot()):
        loc = row.find(f"{{{ns}}}loc")
        if loc is None:
            continue
        if loc.text in drafts:
            tree.getroot().remove(row)
            removed += 1
        elif loc.text in changed_urls:
            mod = row.find(f"{{{ns}}}lastmod")
            if mod is not None:
                mod.text = UPDATED
    tree.write(sitemap, encoding="utf-8", xml_declaration=True)
    return {"module_pages": len(registry["courses"]), "historical_indexable": len(historical), "development_noindex": len(drafts),
            "development_sitemap_removed_this_run": removed, "post_saas_pages": 3, "lesson_bodies_and_permanent_urls_preserved": True}


def validate(root=ROOT):
    registry = json.loads((root / "data/voce-vclf-public.json").read_text())
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    urls = [node.text for node in ET.parse(root / "sitemap.xml").findall(f".//{{{ns}}}loc")]
    if len(urls) != len(set(urls)):
        raise ValueError("Duplicate sitemap URLs")
    if len({c["id"] for c in registry["courses"]}) != len(registry["courses"]):
        raise ValueError("Duplicate learning identifiers")
    indexable = 0
    for course in registry["courses"]:
        url = course["url"]
        source = (root / (url.removeprefix("https://voce.life/") + ".html")).read_text()
        head = source.split("</head>", 1)[0]
        eligible = course["indexing_policy"]["eligible"]
        robots = re.search(r'<meta name="robots" content="([^"]*)"', head)[1].split(",")
        canonical = re.findall(r'<link rel="canonical" href="([^"]*)"', head)
        if canonical != [url] or (("noindex" not in robots) != eligible) or ((url in urls) != eligible):
            raise ValueError(f"Inconsistent learning indexing policy: {url}")
        for name, prop in [("description", False), ("og:title", True), ("og:description", True), ("og:image", True)]:
            attr = "property" if prop else "name"
            values = re.findall(r'<meta ' + attr + '="' + name + r'" content="([^"]*)"', head)
            if len(values) != 1 or not values[0]:
                raise ValueError(f"Missing/duplicate learning metadata: {url}, {name}")
        indexable += int(eligible)
    if REGISTRY not in (root / "llms.txt").read_text():
        raise ValueError("Expanded learning registry is absent from llms.txt")
    return {"modules": len(registry["courses"]), "indexable": indexable,
            "development_noindex": len(registry["courses"]) - indexable, "sitemap_urls": len(urls)}
