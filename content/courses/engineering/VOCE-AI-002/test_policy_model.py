"""Unit evidence for a finite policy model, excluding production integration."""
import itertools
import unittest
from dataclasses import replace
from policy_model import Context, Invoice, can_read, resolve, visible_page

class PolicyTests(unittest.TestCase):
    def context(self, **kw):
        base = Context('A', frozenset({'A'}), frozenset({('A','invoice_reader')}),
                       frozenset(), frozenset())
        return replace(base, **kw)

    def test_matrix(self):
        # 256 combinations; allowed cases are enumerated independently by category.
        for active, owner, member, role, relation, restricted, clearance, known in itertools.product((False,True), repeat=8):
            tenant = 'A' if owner else 'B'
            ctx = Context('A' if active else 'B', frozenset({tenant}) if member else frozenset(),
                          frozenset({(tenant,'invoice_reader')}) if role else frozenset(),
                          frozenset({(tenant,'D')}) if relation else frozenset(),
                          frozenset({tenant}) if clearance else frozenset())
            obj = Invoice(tenant,'42','D', ('restricted' if restricted else 'ordinary') if known else 'unknown')
            expected = False
            if active == owner and member and known:
                if restricted:
                    expected = clearance and (role or relation)
                else:
                    expected = role or relation
            self.assertEqual(can_read(ctx,obj), expected)

    def test_relation_cannot_bypass_scope(self):
        ctx=self.context(audits=frozenset({('B','D')}),memberships=frozenset({'A','B'}))
        self.assertFalse(can_read(ctx,Invoice('B','42','D')))

    def test_identical_local_ids_resolve_separately(self):
        a,b=Invoice('A','42','D'),Invoice('B','42','D')
        db={('A','42'):a,('B','42'):b}
        self.assertEqual(resolve(db,'A','42'),a)
        self.assertFalse(can_read(self.context(),resolve(db,'B','42')))

    def test_clearance_does_not_grant_role(self):
        ctx=self.context(roles=frozenset(),clearances=frozenset({'A'}))
        self.assertFalse(can_read(ctx,Invoice('A','42','D','restricted')))

    def test_remove_clearance_closes_restricted(self):
        obj=Invoice('A','42','D','restricted')
        ctx=self.context(clearances=frozenset({'A'}))
        self.assertTrue(can_read(ctx,obj))
        self.assertFalse(can_read(replace(ctx,clearances=frozenset()),obj))

    def test_limit_after_filter(self):
        ranked=[Invoice(t,str(i),'D') for i,t in enumerate(['B','A','B','A','A'])]
        ctx=self.context()
        self.assertEqual([o.local_id for o in visible_page(ctx,ranked,3)],['1','3','4'])
        self.assertEqual(len([o for o in ranked[:3] if can_read(ctx,o)]),1)
        self.assertEqual(visible_page(ctx,ranked,0),[])

if __name__ == '__main__':
    unittest.main()
