"""Finite tool-boundary model; no live model, payment or network calls."""
import unittest

def prepare(args, tenant, allowed, invoices):
    if type(args) is not dict or set(args) != {'invoice_id','expected_version'}:
        raise ValueError('Invalid fields')
    ident, version = args['invoice_id'], args['expected_version']
    if type(ident) is not str or not 1 <= len(ident) <= 80:
        raise ValueError('Invalid identifier')
    if type(version) is not int or version <= 0:
        raise ValueError('Invalid version')
    if (tenant,ident) not in allowed:
        raise PermissionError('Outside scope')
    row=invoices[(tenant,ident)]
    if version != row['version']:
        raise ValueError('Stale version')
    return (tenant,ident,version,row['amount_minor'],row['destination_id'])

class ToolBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.rows={('A','42'):{'version':2,'amount_minor':125000,'destination_id':'registered-A'},
                   ('B','99'):{'version':1,'amount_minor':90000,'destination_id':'registered-B'}}
        self.allowed={('A','42')}
    def call(self,args):
        return prepare(args,'A',self.allowed,self.rows)
    def test_server_values(self):
        self.assertEqual(self.call({'invoice_id':'42','expected_version':2}),('A','42',2,125000,'registered-A'))
    def test_invented_authority_and_routing(self):
        for key,value in [('approved',True),('tenant','B'),('destination_url','https://example.invalid'),('amount_minor',1)]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.call({'invoice_id':'42','expected_version':2,key:value})
    def test_foreign_object(self):
        with self.assertRaises(PermissionError):
            self.call({'invoice_id':'99','expected_version':1})
    def test_stale_version(self):
        with self.assertRaises(ValueError):
            self.call({'invoice_id':'42','expected_version':1})
    def test_boolean_not_version(self):
        with self.assertRaises(ValueError):
            self.call({'invoice_id':'42','expected_version':True})
    def test_malformed_input(self):
        for args in [None,[],{}, {'invoice_id':'','expected_version':2}]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                self.call(args)

if __name__ == '__main__': unittest.main()
