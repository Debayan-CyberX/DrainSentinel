import os
import sys
import json
import hashlib
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

def download_file(url, target_path):
    target_path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
    with open(target_path, "wb") as f:
        f.write(content)
    sha256 = hashlib.sha256(content).hexdigest()
    print(f"  [SAVED] {target_path.name} ({len(content)} bytes, sha256: {sha256[:12]}...)")
    return sha256

def main():
    print("=" * 70)
    print("Extracting SylvaHero (living-green) bundle from ThreeUI")
    print("=" * 70)

    url = 'https://threeui.com/source-code/sylva-hero.json'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    # Extract text and remote files
    for item in data.get('files', []):
        fpath = FRONTEND_DIR / item['path']
        fpath.parent.mkdir(parents=True, exist_ok=True)
        if 'code' in item:
            content = item['code']
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            sha256 = hashlib.sha256(content.encode('utf-8')).hexdigest()
            print(f"  [EXTRACTED] {item['path']} ({len(content)} chars, sha256: {sha256[:12]}...)")
        elif 'sourceUrl' in item:
            source_url = "https://threeui.com" + item['sourceUrl']
            download_file(source_url, fpath)

    # Download binary assets
    assets = [
        ('https://threeui.com/landing-pages/inner-green-assets/card-ecostove.jpg',
         FRONTEND_DIR / 'public' / 'landing-pages' / 'inner-green-assets' / 'card-ecostove.jpg'),
        ('https://threeui.com/landing-pages/inner-green-assets/card-ethos.jpg',
         FRONTEND_DIR / 'public' / 'landing-pages' / 'inner-green-assets' / 'card-ethos.jpg'),
        ('https://threeui.com/landing-pages/inner-green-assets/lexend-latin.woff2',
         FRONTEND_DIR / 'public' / 'landing-pages' / 'inner-green-assets' / 'lexend-latin.woff2'),
    ]

    for asset_url, target_path in assets:
        download_file(asset_url, target_path)

    print("\n[SUCCESS] SylvaHero bundle extracted successfully.")

if __name__ == '__main__':
    main()
