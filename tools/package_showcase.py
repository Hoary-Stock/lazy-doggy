#!/usr/bin/env python3
"""Build a self-contained HTML appendix and a documentation-only archive."""
import base64
import hashlib
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'lazy-doggy-offline.html'
ARCHIVE = ROOT / 'lazy-doggy-blueprint.zip'


def inline_hash(text):
    return 'sha256-' + base64.b64encode(hashlib.sha256(text.encode()).digest()).decode()


def main():
    html = (ROOT / 'index.html').read_text()
    css = '\n' + (ROOT / 'assets/showcase.css').read_text() + '\n'
    scripts = []
    for name in ['gallery-data.js', 'showcase.js']:
        source = (ROOT / 'assets' / name).read_text()
        if name == 'gallery-data.js':
            def image_data(match):
                path = ROOT / match.group(0)
                assert path.is_file() and not path.is_symlink()
                return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()
            source = re.sub(r'assets/screenshots/[A-Za-z0-9_-]+\.png', image_data, source)
        # Scene and topology controls assign Markdown links at runtime too.
        source = re.sub(r"(['\"])(docs/[A-Za-z0-9_-]+\.md)\1", lambda m: m.group(1) + 'https://github.com/Hoary-Stock/lazy-doggy/blob/main/' + m.group(2) + m.group(1), source)
        scripts.append('\n' + source + '\n')
        html = html.replace('<script src="assets/' + name + '"></script>', '<script>' + scripts[-1] + '</script>')
    html = html.replace('<link rel="stylesheet" href="assets/showcase.css">', '<style>' + css + '</style>')
    html = html.replace("script-src 'self'; style-src 'self';", 'script-src ' + ' '.join("'" + inline_hash(s) + "'" for s in scripts) + "; style-src '" + inline_hash(css) + "';")
    # Markdown links remain useful online when this single file is shared alone.
    html = re.sub(r'href="((?:docs/)[^"]+\.md|AI_BUILD_PROMPT\.md)"', lambda m: 'href="https://github.com/Hoary-Stock/lazy-doggy/blob/main/' + m.group(1) + '"', html)
    html = html.replace('href="lazy-doggy-blueprint.zip"', 'href="https://github.com/Hoary-Stock/lazy-doggy/archive/refs/heads/main.zip"')
    html = html.replace('href="lazy-doggy-offline.html" download', 'href="https://hoary-stock.github.io/lazy-doggy/lazy-doggy-offline.html" download')
    HTML.write_text(html)
    paths = [p for p in ROOT.rglob('*') if p.is_file() and not p.is_symlink()
             and '.git' not in p.relative_to(ROOT).parts
             and '__pycache__' not in p.relative_to(ROOT).parts and p != ARCHIVE
             and p.suffix in {'.md', '.html', '.css', '.js', '.json', '.png', '.py'}]
    paths += [ROOT / 'LICENSE', ROOT / '.gitignore', ROOT / '.nojekyll']
    assert all(p.exists() for p in paths)
    assert not any(p.suffix in {'.apk', '.exe', '.db', '.log'} for p in paths)
    with zipfile.ZipFile(ARCHIVE, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as out:
        for path in sorted(set(paths)):
            # Do not export local ownership IDs or private absolute paths.
            info = zipfile.ZipInfo('lazy-doggy/' + path.relative_to(ROOT).as_posix())
            info.date_time = (2026, 10, 10, 0, 0, 0)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            out.writestr(info, path.read_bytes())
    print('Built lazy-doggy-offline.html and lazy-doggy-blueprint.zip; documentation and presentation assets only.')


if __name__ == '__main__':
    main()
