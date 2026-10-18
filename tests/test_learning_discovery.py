"""Exercise selective indexing and repeatable metadata against the actual catalogue."""
import hashlib
import json
import shutil
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from learning_discovery import update, validate


class LearningDiscoveryTests(unittest.TestCase):
    def fixture(self, destination):
        paths = ["data/voce-vclf-public.json", "data/voce-courses.json", "llms.txt", "sitemap.xml",
                 "cours.html", "en/cours.html", "it/cours.html", "applied/post-saas.html",
                 "fr/applied/post-saas.html", "it/applied/post-saas.html"]
        registry = json.loads((ROOT / paths[0]).read_text())
        paths += [c["url"].removeprefix("https://voce.life/") + ".html" for c in registry["courses"]]
        for name in paths:
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        return paths

    def test_repeat_generation_preserves_every_lesson_and_post_saas_body(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            paths = self.fixture(root)
            bodies = {p: (root / p).read_text().split("</head>", 1)[1] for p in paths if p.endswith(".html")}
            update(root)
            for p, body in bodies.items():
                self.assertEqual((root / p).read_text().split("</head>", 1)[1], body)
            hashes = {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in paths}
            update(root)
            self.assertEqual(hashes, {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in paths})
            self.assertEqual(validate(root)["development_noindex"], 104)

    def test_draft_cannot_silently_reenter_search_sitemap(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.fixture(root)
            registry = json.loads((root / "data/voce-vclf-public.json").read_text())
            draft = next(c for c in registry["courses"] if not c["indexing_policy"]["eligible"])
            ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
            path = root / "sitemap.xml"
            tree = ET.parse(path)
            node = ET.SubElement(tree.getroot(), f"{{{ns}}}url")
            ET.SubElement(node, f"{{{ns}}}loc").text = draft["url"]
            tree.write(path, encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Inconsistent learning indexing"):
                validate(root)
            update(root)
            self.assertEqual(validate(root)["indexable"], 16)


if __name__ == "__main__":
    unittest.main()
