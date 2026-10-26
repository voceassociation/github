"""Synthetic teaching model only: not an authorization implementation."""
REQUIRED = {'invoice.read': 'invoice:read'}

def diagnose(request, session):
    required_request = {'request_id', 'environment', 'operation', 'observed_at'}
    required_session = {'session_id', 'environment', 'expires_at', 'permissions'}
    if not required_request <= request.keys() or not required_session <= session.keys():
        return 'insufficient', frozenset()
    if request['operation'] not in REQUIRED:
        return 'outside_model', frozenset()
    failures = set()
    if request['environment'] != session['environment']:
        failures.add('environment')
    if request['observed_at'] >= session['expires_at']:
        failures.add('expired')
    if REQUIRED[request['operation']] not in session['permissions']:
        failures.add('permission')
    return ('admissible' if not failures else 'single' if len(failures) == 1 else 'multiple', frozenset(failures))
