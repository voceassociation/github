"""Synthetic migration contract; no provider integration or group inheritance."""
import unittest

def ingest(rows):
    out={}
    for row in rows:
        if set(row)!={'id','version','text','teams','deleted'}:raise ValueError('fields')
        if not isinstance(row['id'],str) or not row['id']:raise ValueError('id')
        if type(row['version']) is not int or row['version']<1:raise ValueError('version')
        if not isinstance(row['text'],str) or type(row['deleted']) is not bool:raise ValueError('content')
        if not isinstance(row['teams'],list) or any(not isinstance(t,str) or not t for t in row['teams']):raise ValueError('teams')
        key=(row['id'],row['version'])
        if key in out:raise ValueError('duplicate')
        out[key]={**row,'teams':frozenset(row['teams'])}
    return out

def resolve(store,key,team):
    row=store.get(key)
    if row is None or row['deleted'] or team not in row['teams']:return None
    return row['text']

class ManifestTests(unittest.TestCase):
    def row(self,**changes):return dict(id='D1',version=1,text='Texte',teams=['sales'],deleted=False,**{})|changes
    def test_allowed(self):self.assertEqual(resolve(ingest([self.row()]),('D1',1),'sales'),'Texte')
    def test_direct_citation_denied(self):self.assertIsNone(resolve(ingest([self.row()]),('D1',1),'research'))
    def test_empty_acl(self):self.assertIsNone(resolve(ingest([self.row(teams=[])]),('D1',1),'sales'))
    def test_deleted(self):self.assertIsNone(resolve(ingest([self.row(deleted=True)]),('D1',1),'sales'))
    def test_duplicate(self):
        with self.assertRaises(ValueError):ingest([self.row(),self.row()])
    def test_missing_rights(self):
        row=self.row();del row['teams']
        with self.assertRaises(ValueError):ingest([row])
    def test_distinct_same_text(self):self.assertEqual(len(ingest([self.row(),self.row(id='D2')])),2)
    def test_exact_version(self):
        s=ingest([self.row(),self.row(version=2,text='Révision')]);self.assertEqual(resolve(s,('D1',1),'sales'),'Texte');self.assertIsNone(resolve(s,('D1',3),'sales'))
    def test_invalid_version(self):
        with self.assertRaises(ValueError):ingest([self.row(version=True)])
if __name__=='__main__':unittest.main()
