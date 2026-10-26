"""Illustrative positive field projection, not a production audit collector."""
import json
import unittest

FIELDS=('event_id','operation_id','tenant','principal_id','action','decision','policy_version')
def encode_event(event):
    return json.dumps({key:event[key] for key in FIELDS}, ensure_ascii=True, separators=(',',':'))

class AuditProjectionTests(unittest.TestCase):
    def event(self):
        return dict(zip(FIELDS,('e1','o1','A','u1','prepare','allow','v1')))
    def test_excludes_unapproved_fields(self):
        e=self.event();e.update(token='secret',prompt='private',bank_account='sensitive')
        out=encode_event(e)
        self.assertEqual(set(json.loads(out)),set(FIELDS))
        for marker in ('secret','private','sensitive'): self.assertNotIn(marker,out)
    def test_control_characters_remain_data(self):
        e=self.event();e['principal_id']='u1\nforged=allow'
        out=encode_event(e)
        self.assertNotIn('\n',out)
        self.assertEqual(json.loads(out)['principal_id'],e['principal_id'])
    def test_missing_required_field_is_explicit(self):
        e=self.event();del e['event_id']
        with self.assertRaises(KeyError): encode_event(e)
    def test_capacity_example(self):
        self.assertEqual(20*800*3600,57600000)
        self.assertEqual(5760000000/(20*800*3600),100)

if __name__ == '__main__': unittest.main()
