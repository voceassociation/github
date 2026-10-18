"""Refresh learning metadata from VCLF and the historical translation registry."""
import json
from learning_discovery import update

if __name__ == "__main__":
    print(json.dumps(update()))
