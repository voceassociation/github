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

changed = False
for item in corpus.get("items", []):
    text = item.get("text", "")
    if not re.search(r"(?:li!ght|light)\s+workforce", text, re.I):
        continue
    canonical = item.get("canonical_url", "")
    if not canonical.startswith("https://voce.life/"):
        continue
    path = canonical.removeprefix("https://voce.life")
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
