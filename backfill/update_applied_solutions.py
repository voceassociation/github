import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "data" / "corpus.json"
REGISTRY = ROOT / "data" / "applied-solutions.json"

if not CORPUS.exists() or not REGISTRY.exists():
    raise SystemExit(0)

corpus = json.loads(CORPUS.read_text())
registry = json.loads(REGISTRY.read_text())
evidence = registry.setdefault("evidence", [])
routes_file = ROOT / "data" / "article-routes.json"
routes = json.loads(routes_file.read_text()).get("items", []) if routes_file.exists() else []
individual_by_post = {
    str(route.get("post_id") or str(route.get("id", "")).removeprefix("linkedin:")):
        route.get("redirect_to") or route.get("path")
    for route in routes if route.get("path")
}

def canonical_evidence_path(path):
    match = re.fullmatch(r"/archive/\d{4}-\d{2}-\d{2}#post-(\d+)", path or "")
    return individual_by_post.get(match[1], path) if match else path

changed = False
for record in evidence:
    canonical_path = canonical_evidence_path(record.get("path"))
    if canonical_path != record.get("path"):
        record["path"] = canonical_path
        changed = True
by_path = {x.get("path"): x for x in evidence if x.get("path")}

def title_of(item):
    if item.get("title"):
        return item["title"]
    return next((x.strip() for x in item.get("text", "").splitlines() if x.strip()), "Publication VOCE")

def classify(text):
    value = text.lower()
    sectors = []
    rules = [
        ("legal", ["juriste","juridique","avocat","nda","contrat","conformité","compliance","grc"]),
        ("hr", ["ressources humaines"," responsable rh"," workforce staffing","recrut","salarié","planning","horaire"]),
        ("finance", ["comptable","comptabilité","finance","facture","ledger","clôture","écriture","recouvrement"]),
        ("culture", ["musée","louvre","billetterie","ticket","culture","exposition"]),
        ("marketing", ["marketing","seo","social","campagne","crm","prospect","marque"]),
        ("banking", ["banque","bancaire","assurance","prêt","kyc","wealth"]),
        ("healthops", ["clinique","patient","rendez-vous","dossier médical"]),
        ("it", ["cyber","mcp","api","agent framework","ag-ui","servicenow","logiciel","cloud","pentest"])
    ]
    for sector, words in rules:
        if any(word in value for word in words):
            sectors.append(sector)
    return sectors or ["cross"]

for item in corpus.get("items", []):
    text = item.get("text", "")
    marker = re.search(r"(?:li!ght|light)\s+workforce", text, re.I)
    if not marker:
        continue
    canonical = item.get("canonical_url", "")
    if not canonical.startswith("https://voce.life/"):
        continue
    path = canonical_evidence_path(canonical.removeprefix("https://voce.life"))
    if path in by_path:
        continue
    platform_id = re.sub(r"[^a-zA-Z0-9]+", "-", str(item.get("platform_id") or item.get("id") or "")).strip("-").lower()
    published = item.get("date_published", "")
    record = {
        "id": "lw-auto-" + (platform_id[-24:] or re.sub(r"[^0-9]", "", published)),
        "date": published[:10],
        "title": title_of(item),
        "path": path,
        "sectors": classify(text),
        "themes": (["LI!GHT WORKFORCE ©"] if marker else []) + ["agents", "work transformation"]
    }
    evidence.append(record)
    by_path[path] = record
    changed = True

evidence.sort(key=lambda x: (x.get("date",""), x.get("title","")))
registry["generated_at"] = max(registry.get("generated_at",""), max((x.get("date","") for x in evidence), default=""))
if changed:
    REGISTRY.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"evidence_records": len(evidence), "added": sum(1 for x in evidence if str(x.get("id","")).startswith("lw-auto-"))}, ensure_ascii=False))
