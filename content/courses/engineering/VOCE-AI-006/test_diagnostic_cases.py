import unittest
from diagnostic_cases import diagnose

def req(env='atelier', t=120, operation='invoice.read'):
    return dict(request_id='synthetic', environment=env, observed_at=t, operation=operation)
def sess(env='atelier', expiry=180, permissions=('invoice:read',)):
    return dict(session_id='synthetic', environment=env, expires_at=expiry, permissions=permissions)

class Cases(unittest.TestCase):
    def test_a17(self): self.assertEqual(diagnose(req(),sess()),('admissible',frozenset()))
    def test_a18_boundary(self): self.assertEqual(diagnose(req(t=180),sess()),('single',frozenset({'expired'})))
    def test_b31(self): self.assertEqual(diagnose(req('production',150),sess(expiry=240)),('single',frozenset({'environment'})))
    def test_c45_missing_then_revealed(self):
        s=sess(expiry=210);del s['expires_at']
        self.assertEqual(diagnose(req(t=210),s)[0],'insufficient')
        s['expires_at']=210
        self.assertEqual(diagnose(req(t=210),s)[1],{'expired'})
        s['expires_at']=260
        self.assertEqual(diagnose(req(t=210),s)[0],'admissible')
    def test_d60_all_defects(self): self.assertEqual(diagnose(req('production',300),sess(expiry=290,permissions=('invoice:list',)))[1],{'environment','expired','permission'})
    def test_unknown_operation(self): self.assertEqual(diagnose(req(operation='invoice.delete'),sess())[0],'outside_model')
    def test_full_boolean_matrix(self):
        for environment_matches in (False,True):
            for unexpired in (False,True):
                for allowed in (False,True):
                    status,failures=diagnose(req(),sess(env='atelier' if environment_matches else 'production',expiry=121 if unexpired else 120,permissions=('invoice:read',) if allowed else ()))
                    expected=set()
                    if not environment_matches:expected.add('environment')
                    if not unexpired:expected.add('expired')
                    if not allowed:expected.add('permission')
                    self.assertEqual(failures,expected)
                    self.assertEqual(status=='admissible',not expected)
if __name__=='__main__':unittest.main()
