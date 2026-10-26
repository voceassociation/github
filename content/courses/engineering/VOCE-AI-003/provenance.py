"""Local synthetic envelope check; the caller supplies the trusted manifest."""
import hashlib
import json


def digest(envelope):
    encoded = json.dumps(envelope, sort_keys=True, separators=(',', ':'),
                         ensure_ascii=False, allow_nan=False).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def verify(envelope, manifest, expected_run, expected_source):
    try:
        if type(envelope) is not dict or type(manifest) is not dict:
            return False
        if envelope['run'] != expected_run or envelope['source'] != expected_source:
            return False
        if manifest['run'] != expected_run or manifest['source'] != expected_source:
            return False
        first, last = manifest['first'], manifest['last']
        if type(first) is not int or type(last) is not int or first < 0 or last < first:
            return False
        events = envelope['events']
        if type(events) is not list or len(events) != last - first + 1:
            return False
        for offset, event in enumerate(events):
            if type(event) is not dict or 'payload' not in event:
                return False
            if type(event['seq']) is not int or event['seq'] != first + offset:
                return False
        return digest(envelope) == manifest['sha256']
    except (KeyError, TypeError, ValueError, OverflowError):
        return False
