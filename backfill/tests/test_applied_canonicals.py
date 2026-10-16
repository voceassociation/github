import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]

class AppliedCanonicalTests(unittest.TestCase):
    def test_known_fragment_is_replaced_before_ingestion_and_remains_idempotent(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'data').mkdir()
            (root / 'backfill').mkdir()
            script = root / 'backfill' / 'update_applied_solutions.py'
            script.write_text((ROOT / 'backfill' / 'update_applied_solutions.py').read_text())
            canonical = '/archive/2026/09/25/example'
            registry = {'generated_at':'2026-10-15','solutions':[{'id':'example','voce_evidence':['stable-id']}], 'evidence':[
                {'id':'stable-id','path':'/archive/2026-09-25#post-123','date':'2026-09-25','title':'Example'},
                {'id':'unknown','path':'/archive/2026-09-25#post-456','date':'2026-09-25','title':'Unknown'}]}
            for name,data in [
                ('applied-solutions',registry),
                ('article-routes',{'items':[{'post_id':'123','path':canonical}]}),
                ('corpus',{'items':[{'id':'linkedin:123','platform_id':'123','text':'LI!GHT workforce','canonical_url':'https://voce.life'+canonical}]})
            ]:(root/'data'/f'{name}.json').write_text(json.dumps(data))
            subprocess.run(['python3',str(script)],check=True,capture_output=True)
            result = json.loads((root/'data/applied-solutions.json').read_text())
            self.assertEqual(len(result['evidence']),2)
            by_id={item['id']:item for item in result['evidence']}
            self.assertEqual(by_id['stable-id']['path'],canonical)
            self.assertEqual(by_id['unknown']['path'],'/archive/2026-09-25#post-456')
            self.assertEqual(result['solutions'],registry['solutions'])
            first=(root/'data/applied-solutions.json').read_bytes()
            subprocess.run(['python3',str(script)],check=True,capture_output=True)
            self.assertEqual((root/'data/applied-solutions.json').read_bytes(),first)

if __name__ == '__main__':
    unittest.main()
