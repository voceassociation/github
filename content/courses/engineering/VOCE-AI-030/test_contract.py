"""Synthetic invoice contract; no OCR, LLM, network or payment integration."""
import unittest
from copy import deepcopy
from jsonschema import Draft202012Validator
S = {'type':'string','minLength':1}
I = {'type':'integer','minimum':0,'maximum':100000000}
LINE = {'type':'object','properties':{'sku':S,'quantity':{'type':'integer','minimum':1,'maximum':10000},'unit_minor':I},'required':['sku','quantity','unit_minor'],'additionalProperties':False}
PROPS = {'invoice_id':S,'supplier_id':S,'currency':{'const':'EUR'},'lines':{'type':'array','minItems':1,'maxItems':1000,'items':LINE},'net_minor':I,'tax_minor':I,'gross_minor':I}
SCHEMA = {'$schema':'https://json-schema.org/draft/2020-12/schema','type':'object','properties':PROPS,'required':list(PROPS),'additionalProperties':False}
Draft202012Validator.check_schema(SCHEMA)
VALIDATOR = Draft202012Validator(SCHEMA)
BASE = dict(invoice_id='F-17',supplier_id='S-2',currency='EUR',lines=[dict(sku='A',quantity=3,unit_minor=1250),dict(sku='B',quantity=2,unit_minor=875)],net_minor=5500,tax_minor=1100,gross_minor=6600)
REF = dict(supplier_id='S-2',currency='EUR',items={'A':(1250,3),'B':(875,2)})
def totals(x):
 n=sum(l['quantity']*l['unit_minor'] for l in x['lines']); t=(n*2000+5000)//10000
 return n,t,n+t
def recalc(x):
 x['net_minor'],x['tax_minor'],x['gross_minor']=totals(x)
 return x
def check(x,ref):
 if not VALIDATOR.is_valid(x):return 'contradictory','SHAPE'
 if totals(x)!=(x['net_minor'],x['tax_minor'],x['gross_minor']):return 'contradictory','TOTAL_MISMATCH'
 if ref is None:return 'unknown','REFERENCE_UNAVAILABLE'
 if (x['supplier_id'],x['currency'])!=(ref['supplier_id'],ref['currency']):return 'contradictory','CONTEXT'
 qty={}
 for l in x['lines']:
  k=l['sku']
  if k not in ref['items']:return 'contradictory','UNKNOWN_SKU'
  price,available=ref['items'][k]
  if l['unit_minor']!=price:return 'contradictory','PRICE'
  qty[k]=qty.get(k,0)+l['quantity']
 if any(v>ref['items'][k][1] for k,v in qty.items()):return 'contradictory','RECEIPT'
 return 'compatible','CHECKED_SNAPSHOT_ONLY'
class ContractTests(unittest.TestCase):
 def setUp(self):self.x=deepcopy(BASE)
 def test_valid(self):self.assertEqual(check(self.x,REF)[0],'compatible')
 def test_missing(self):del self.x['tax_minor'];self.assertEqual(check(self.x,REF)[1],'SHAPE')
 def test_null(self):self.x['tax_minor']=None;self.assertEqual(check(self.x,REF)[1],'SHAPE')
 def test_claimed_approval(self):self.x['approved']=True;self.assertEqual(check(self.x,REF)[1],'SHAPE')
 def test_consistent_false_totals(self):self.x.update(net_minor=5600,tax_minor=1120,gross_minor=6720);self.assertEqual(check(self.x,REF)[1],'TOTAL_MISMATCH')
 def test_supplier(self):self.x['supplier_id']='S-3';self.assertEqual(check(self.x,REF)[1],'CONTEXT')
 def test_unavailable(self):self.assertEqual(check(self.x,None)[0],'unknown')
 def test_unknown_sku(self):self.x['lines'][0]['sku']='X';self.assertEqual(check(self.x,REF)[1],'UNKNOWN_SKU')
 def test_price(self):self.x['lines'][0]['unit_minor']=1251;recalc(self.x);self.assertEqual(check(self.x,REF)[1],'PRICE')
 def test_receipt(self):self.x['lines'][0]['quantity']=4;recalc(self.x);self.assertTrue(VALIDATOR.is_valid(self.x));self.assertEqual(check(self.x,REF)[1],'RECEIPT')
 def test_split_quantity(self):self.x['lines']=[dict(sku='A',quantity=2,unit_minor=1250)]*2;recalc(self.x);self.assertEqual(check(self.x,REF)[1],'RECEIPT')
 def test_rounding_order(self):self.x['lines']=[dict(sku='Z',quantity=1,unit_minor=3)]*2;self.assertEqual(totals(self.x),(6,1,7));self.assertEqual(sum((3*2000+5000)//10000 for _ in range(2)),2)
if __name__=='__main__':unittest.main()
