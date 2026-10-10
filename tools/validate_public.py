#!/usr/bin/env python3
"""Check portable links, visible citation anchors, and accidental artifact export."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]
errors = []


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.citations = set(), [], []

    def handle_starttag(self, tag, attrs):
        row = dict(attrs)
        if 'id' in row:
            if row['id'] in self.ids:
                errors.append('duplicate HTML id: ' + row['id'])
            self.ids.add(row['id'])
        for key in ['href', 'src']:
            if key in row:
                self.refs.append(row[key])
        if tag == 'a' and row.get('href', '').startswith('#ref-'):
            self.citations.append(row)


def local_link(source, value, ids=None):
    parts = urlsplit(value)
    if parts.scheme or value.startswith('//'):
        return
    target = (source.parent / unquote(parts.path)).resolve() if parts.path else source
    if not target.is_relative_to(ROOT):
        errors.append(str(source.relative_to(ROOT)) + ': link escapes public tree')
    elif not target.is_file():
        errors.append(str(source.relative_to(ROOT)) + ': missing link ' + parts.path)
    elif parts.fragment and target.suffix == '.html':
        parser = Links()
        parser.feed(target.read_text())
        if unquote(parts.fragment) not in parser.ids:
            errors.append(str(source.relative_to(ROOT)) + ': missing anchor ' + parts.fragment)


def main():
    for required in ['index.html', 'README.md', 'AI_BUILD_PROMPT.md', 'LICENSE', 'licenses/PolyForm-Noncommercial-1.0.0.txt', 'licenses/CC-BY-NC-4.0.txt', 'docs/licensing.md', 'docs/backup-recovery.md', 'docs/whiteboard-example.md', 'docs/network-path.md', 'docs/repository-map.md', 'docs/demo-scenarios.md', 'demos/index.html', 'examples/whiteboard/server.py', 'assets/demo/lazy-doggy-demo.mp4', 'assets/demo/lazy-doggy-demo.zh.vtt', 'docs/screenshots.md', 'assets/screenshots/manifest.json', 'assets/gallery-data.js', 'lazy-doggy-offline.html', 'lazy-doggy-blueprint.zip']:
        if not (ROOT / required).is_file():
            errors.append('missing required public file: ' + required)
    files = [p for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.relative_to(ROOT).parts
             and '__pycache__' not in p.relative_to(ROOT).parts]
    for p in files:
        relative = p.relative_to(ROOT).as_posix()
        if p.is_symlink() or p.suffix in {'.apk', '.exe', '.msi', '.sqlite', '.db', '.log', '.har', '.pem', '.key'}:
            errors.append('forbidden export: ' + relative)
        if p.suffix == '.md':
            for value in re.findall(r'\]\(([^)]+)\)', p.read_text()):
                local_link(p, value)
        elif p.suffix == '.html':
            parser = Links()
            parser.feed(p.read_text())
            for value in parser.refs:
                local_link(p, value)
            for row in parser.citations:
                if not row.get('aria-label'):
                    errors.append('citation lacks accessible label: ' + relative)
    archive = ROOT / 'lazy-doggy-blueprint.zip'
    manifest = ROOT / 'assets/screenshots/manifest.json'
    if manifest.exists():
        rows = json.loads(manifest.read_text())
        counts = {'tmux':0, 'remote':0, 'windows':0}
        for row in rows:
            if row.get('client') not in counts:
                errors.append('unknown gallery client')
                continue
            counts[row['client']] += 1
            local_link(ROOT / 'index.html', row['src'])
            if not all(row.get(field) for field in ['title', 'alt', 'caption', 'description']):
                errors.append('incomplete image description')
        if not all(n >= 3 for n in counts.values()):
            errors.append('native gallery incomplete')
    if archive.exists():
        with zipfile.ZipFile(archive) as source:
            for name in source.namelist():
                if not name.startswith('lazy-doggy/') or '..' in Path(name).parts or Path(name).suffix in {'.apk', '.exe', '.db', '.log'}:
                    errors.append('invalid archive entry')
    print(json.dumps({'ok':not errors,'public_files_checked':len(files),'errors':errors}, ensure_ascii=False, indent=2))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
