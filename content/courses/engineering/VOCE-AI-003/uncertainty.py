"""Planning formulas only: independent Bernoulli trials, fixed design."""
import math


def probability(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 < value < 1:
        raise ValueError('Expected probability strictly between zero and one')


def zero_upper(n, alpha=0.05):
    if type(n) is not int or n <= 0:
        raise ValueError('Expected positive integer sample size')
    probability(alpha)
    return -math.expm1(math.log(alpha) / n)


def required_zero_trials(epsilon, alpha=0.05):
    probability(epsilon)
    probability(alpha)
    return math.ceil(math.log(alpha) / math.log1p(-epsilon))


def finite_bounds(failures, unknown, total):
    if any(type(x) is not int for x in (failures, unknown, total)):
        raise ValueError('Expected integer counts')
    if total <= 0 or min(failures, unknown) < 0 or failures + unknown > total:
        raise ValueError('Inconsistent counts')
    return failures / total, (failures + unknown) / total
