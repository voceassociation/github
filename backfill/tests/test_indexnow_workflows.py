"""Exercise actual workflow submission blocks without issuing network requests."""
import contextlib
import io
import json
import os
import re
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
KEY = re.search(r'const INDEXNOW_KEY = "([^"]+)"', (ROOT / "worker.js").read_text()).group(1)


class Response:
    status = 200

    def __init__(self, body=b""):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self.body


def run_submission(workflow, step, *, changed=None, live_key=KEY, event="push", request_data=None):
    source = (ROOT / ".github/workflows" / workflow).read_text()
    section = source.split(f"- name: {step}", 1)[1]
    configured_key = re.search(r"INDEXNOW_KEY: ([a-z0-9]+)", section).group(1)
    script = re.search(r"python3 -?\s*<<'PY'\n(.*?)\n          PY", section, re.S).group(1)
    script = "\n".join(line[10:] for line in script.splitlines())
    script = script.replace("${{ github.event.before }}", "before").replace("${{ github.sha }}", "current")
    calls = []
    original_read_text = Path.read_text

    def read_text(path, *args, **kwargs):
        if request_data is not None and str(path) == "backfill/indexnow-resubmit.json":
            return json.dumps(request_data)
        return original_read_text(path, *args, **kwargs)

    def urlopen(request, timeout):
        if isinstance(request, str):
            assert request == f"https://voce.life/{KEY}.txt", "Workflow used an obsolete ownership key"
            return Response(live_key.encode())
        payload = json.loads(request.data)
        calls.append(payload)
        return Response()

    env = {"INDEXNOW_KEY": configured_key, "SITE_ORIGIN": "https://voce.life",
           "SITE_HOST": "voce.life", "EVENT_NAME": event}
    with patch.dict(os.environ, env), patch("urllib.request.urlopen", urlopen), \
            patch.object(Path, "read_text", read_text), \
            patch("subprocess.check_output", return_value="\n".join(changed or [])), \
            contextlib.redirect_stdout(io.StringIO()):
        exec(compile(script, workflow, "exec"), {})
    return calls


class IndexNowRegression(unittest.TestCase):
    def setUp(self):
        self.previous_cwd = Path.cwd()
        os.chdir(ROOT)

    def tearDown(self):
        os.chdir(self.previous_cwd)

    def test_daily_ingest_uses_published_key_and_only_recent_canonical_urls(self):
        payload, = run_submission("ingest-current-publications.yml", "Submit published article URLs to IndexNow")
        self.assertEqual(payload["key"], KEY)
        self.assertEqual(payload["keyLocation"], f"https://voce.life/{KEY}.txt")
        recent_days = set(sorted(p.stem for p in (ROOT / "backfill/raw").glob("*.json")
                                 if len(p.stem) == 10)[-4:])
        routes = json.loads((ROOT / "data/article-routes.json").read_text())["items"]
        by_url = {"https://voce.life" + r["path"]: r["date"] for r in routes if not r.get("redirect_to")}
        for url in payload["urlList"]:
            self.assertIn(by_url[url] if url in by_url else url.rsplit("/", 1)[1], recent_days)
        self.assertLess(len(payload["urlList"]), len(by_url))
        self.assertFalse(any("7510307538911862784" in u for u in payload["urlList"]))

    def test_dated_retry_does_not_resubmit_historical_sitemap(self):
        payload, = run_submission("indexnow.yml", "Submit changed pages to IndexNow",
                                  changed=["backfill/indexnow-resubmit.json"],
                                  request_data={"scope": "current_days", "dates":
                                                ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"]})
        self.assertEqual(len(payload["urlList"]), 64)
        self.assertEqual(len(set(payload["urlList"])), 64)
        self.assertTrue(all("/archive/2026/10/0" in u or "/archive/2026-10-0" in u
                            for u in payload["urlList"]))

    def test_manual_full_sitemap_submission_is_preserved(self):
        payload, = run_submission("indexnow.yml", "Submit changed pages to IndexNow", event="workflow_dispatch")
        self.assertGreater(len(payload["urlList"]), 2000)

    def test_wrong_live_key_stops_both_workflows_before_submission(self):
        for workflow, step in [("indexnow.yml", "Submit changed pages to IndexNow"),
                               ("ingest-current-publications.yml", "Submit published article URLs to IndexNow")]:
            with self.subTest(workflow=workflow), self.assertRaisesRegex(RuntimeError, "ownership key"):
                run_submission(workflow, step, changed=["backfill/indexnow-resubmit.json"], live_key="wrong-key")


if __name__ == "__main__":
    unittest.main()
