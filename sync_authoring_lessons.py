"""Read-only drift check. Changed sources require lesson review, never automatic import."""
from pathlib import Path
import argparse
import hashlib
import json


def check(vault: Path):
    manifest = json.loads(Path(__file__).with_name('authoring-lessons.json').read_text(encoding='utf-8'))
    results = []
    for source in manifest['sources']:
        path = vault / source['document']
        state = 'missing' if not path.is_file() else 'unchanged' if hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'] else 'review_needed'
        results.append({'document': source['document'], 'status': state})
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vault', type=Path, required=True)
    args = parser.parse_args()
    results = check(args.vault)
    print(json.dumps(results, ensure_ascii=False, indent=2))
    raise SystemExit(0 if all(r['status'] == 'unchanged' for r in results) else 1)
