"""Regression checks for stale translated counters and lossless bounded RSS."""
import copy
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from discovery import build_feed, synchronize_counter, validate_discovery, write_discovery


class DiscoveryTests(unittest.TestCase):
    def corpus(self):
        items = [{"id": str(i), "title": f"Title {i}", "canonical_url": f"https://voce.life/archive/test-{i}",
                  "date_published": f"2026-10-13T12:{i:02d}:00+00:00", "source_url": f"https://www.linkedin.com/test/{i}",
                  "platform": "linkedin", "text": f"Original {i}\n\nULTRA®\nSources <&> \n\n#VOCE"} for i in range(60)]
        # UTC ordering, rather than lexicographic timezone ordering, is essential.
        items[0]["date_published"] = "2026-10-13T15:00:00+02:00"
        return {"items": items, "item_count": 60, "generated_at": "2026-10-13T21:08:00+00:00"}

    def test_newest_fifty_original_texts_survive_xml_roundtrip_without_mutation(self):
        corpus = self.corpus()
        baseline = copy.deepcopy(corpus)
        nodes = ET.fromstring(build_feed(corpus)).findall("channel/item")
        self.assertEqual(len(nodes), 50)
        self.assertEqual(nodes[0].findtext("link"), corpus["items"][0]["canonical_url"])
        by_url = {x["canonical_url"]: x for x in corpus["items"]}
        for n in nodes:
            self.assertEqual(n.findtext("description"), by_url[n.findtext("link")]["text"])
            self.assertEqual(n.findtext("guid"), n.findtext("link"))
        self.assertEqual(corpus, baseline)
        self.assertEqual(build_feed(corpus), build_feed(corpus))

    def test_publication_growth_updates_every_translation_and_rejects_stale_html(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            root.joinpath("archive.html").write_text('1629 archived publications; "1629 archived publications"; "1629 publications archivées"; "1629 pubblicazioni archiviate"')
            corpus = self.corpus()
            self.assertTrue(write_discovery(root, corpus)["academy_counters_consistent"])
            root.joinpath("archive.html").write_text(root.joinpath("archive.html").read_text().replace("60 publications archivées", "59 publications archivées"))
            with self.assertRaisesRegex(ValueError, "Stale Academy"):
                validate_discovery(root, corpus)

    def test_day_precision_keeps_its_uncertainty_and_missing_counter_fails_closed(self):
        corpus = self.corpus()
        corpus["items"][0].update(date_published="2026-10-14", date_precision="day")
        first = ET.fromstring(build_feed(corpus)).find("channel/item")
        self.assertIsNone(first.find("pubDate"))
        with self.assertRaisesRegex(ValueError, "label missing"):
            synchronize_counter("60 archived publications", 61)


if __name__ == "__main__":
    unittest.main()
