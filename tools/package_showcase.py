#!/usr/bin/env python3
"""Build a standalone report and an archive of public teaching material."""
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
    # Keep the single-file appendix small and useful offline. The larger video
    # and interactive demo are separate, explicitly online resources.
    html = re.sub(r'<video id="flow-video".*?</video>', '<div class="note"><b>单文件阅读版</b><span>本页文字、图片与教学交互可以离线阅读。视频单独提供：<a href="https://hoary-stock.github.io/lazy-doggy/assets/demo/lazy-doggy-demo.mp4">联网打开教学视频</a>；<a href="https://hoary-stock.github.io/lazy-doggy/demos/index.html">联网打开可暂停流程演示</a>。完整 ZIP 包含视频和示例。</span></div>', html, flags=re.S)
    html = re.sub(r'href="(demos/index\.html|examples/whiteboard/index\.html|assets/demo/[^\"]+\.(?:mp4|vtt))"', lambda m: 'href="https://hoary-stock.github.io/lazy-doggy/' + m.group(1) + '"', html)
    HTML.write_text(html)
    paths = [p for p in ROOT.rglob('*') if p.is_file() and not p.is_symlink()
             and '.git' not in p.relative_to(ROOT).parts
             and '__pycache__' not in p.relative_to(ROOT).parts and p != ARCHIVE
             and (p.suffix in {'.md', '.html', '.css', '.js', '.json', '.png', '.py'}
                  or (p.suffix == '.txt' and p.parent == ROOT / 'licenses')
                  or (p.suffix == '.svg' and p.parent == ROOT / 'assets/demo')
                  or (p.suffix in {'.mp4', '.vtt'} and p.parent == ROOT / 'assets/demo'))]
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
    print('Built standalone report and public teaching archive; licenses, mock example and demo video included, no original installers.')


if __name__ == '__main__':
    main()
