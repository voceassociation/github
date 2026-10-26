"""Synthetic evidence classifier; trusts inputs, never authenticates a log."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Event:
    route: str
    action: str
    committed: bool
    locked_before: bool | None


def classify(events, expected_routes, covered_routes, closed):
    """Return a scoped verdict. Unknown/invalid evidence cannot yield support.

    Relevant events are protected modifications on expected routes. A credible
    violation takes precedence over incompleteness elsewhere in the dossier.
    Coverage and closed are assertions supplied by a trusted test protocol.
    """
    expected = set(expected_routes)
    covered = set(covered_routes)
    if not expected or any(not isinstance(r, str) or not r for r in expected | covered):
        return 'indeterminate'
    incomplete = type(closed) is not bool or not closed or not expected <= covered
    for event in events:
        if not isinstance(event, Event):
            incomplete = True
            continue
        if event.route not in expected:
            continue  # Outside this explicitly scoped claim.
        if event.action not in {'protected_modification', 'audit', 'refusal'}:
            incomplete = True
            continue
        if type(event.committed) is not bool:
            incomplete = True
            continue
        if event.action != 'protected_modification' or not event.committed:
            continue
        if type(event.locked_before) is not bool:
            incomplete = True
        elif event.locked_before:
            return 'contradicted'
    return 'indeterminate' if incomplete else 'supported_in_observed_scope'
