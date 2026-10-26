"""Toy exposure classifier. No distributed logging or learner validation."""
import unittest
from fractions import Fraction

def classify(events):
    if 'TRACE_INCOMPLETE' in events: return 'unknown'
    if 'REVEAL_SOLUTION' in events: return 'solution_exposed'
    if 'REVEAL_HINT' in events: return 'hint_exposed'
    return 'no_help_recorded'

class Checks(unittest.TestCase):
    def test_request_is_not_exposure(self):
        self.assertEqual(classify(['OPEN','REQUEST_HINT','HELP_FAILED']),'no_help_recorded')
    def test_reset_does_not_erase_solution(self):
        self.assertEqual(classify(['REVEAL_SOLUTION','RESET','SUBMIT_FINAL']),'solution_exposed')
    def test_incomplete_trace(self):
        self.assertEqual(classify(['TRACE_INCOMPLETE','SUBMIT_FINAL']),'unknown')
    def test_accessibility_not_substantive_help(self):
        self.assertEqual(classify(['OPEN','LARGE_TEXT','READ_HEADER_ALOUD']),'no_help_recorded')
    def test_hint_then_solution(self):
        self.assertEqual(classify(['REVEAL_HINT']),'hint_exposed')
        self.assertEqual(classify(['REVEAL_HINT','REVEAL_SOLUTION']),'solution_exposed')
    def test_denominators(self):
        self.assertEqual(Fraction(14+20+15,20+25+15),Fraction(49,60))
        self.assertEqual(Fraction(14,20),Fraction(7,10))
        self.assertEqual(Fraction(14,60),Fraction(7,30))
        self.assertEqual(Fraction(20,25),Fraction(4,5))
if __name__=='__main__':unittest.main()
