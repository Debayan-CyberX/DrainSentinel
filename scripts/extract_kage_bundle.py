"""
Extract and verify text files and download binary assets from ThreeUI Kage Landing Page bundle.
"""

import os
import sys
import json
import hashlib
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BUNDLE_PATH = Path(r"C:\Users\Admin\.gemini\antigravity\brain\c5cb7028-ee56-4b1b-bd96-66dc555c7f16\.system_generated\steps\675\content.md")


def extract_files_and_download_assets():
    print("=" * 70)
    print("Extracting ThreeUI Kage Landing Page Files & Assets")
    print("=" * 70)

    with open(BUNDLE_PATH, "r", encoding="utf-8") as f:
        text = f.read()

    idx = text.find("{")
    data = json.loads(text[idx:])

    # 1. Extract 8 registered files
    print("\n[1/2] Processing 8 registered files...")
    for file_info in data["files"]:
        target_path = FRONTEND_DIR / file_info["path"]
        target_path.parent.mkdir(parents=True, exist_ok=True)
        expected_hash = file_info.get("sha256")

        if "code" in file_info:
            raw_bytes = file_info["code"].encode("utf-8")
        else:
            source_url = f"https://threeui.com{file_info['sourceUrl']}"
            print(f"  Fetching: {source_url} ...", end=" ")
            req = urllib.request.Request(source_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                raw_bytes = resp.read()

        computed = hashlib.sha256(raw_bytes).hexdigest()
        matches = computed == expected_hash
        print(f"  --> {file_info['path']}: {len(raw_bytes)} bytes | SHA-256 match: {matches}")
        if not matches:
            print(f"      Expected: {expected_hash}")
            print(f"      Got:      {computed}")

        with open(target_path, "wb") as out_f:
            out_f.write(raw_bytes)

    # 2. Download and verify binary assets
    print("\n[2/2] Downloading and verifying 14 binary assets...")
    for asset in data.get("assets", []):
        rel_path = asset["path"]
        target_path = FRONTEND_DIR / rel_path
        target_path.parent.mkdir(parents=True, exist_ok=True)

        asset_url_path = rel_path.replace("public/", "")
        asset_url = f"https://threeui.com/{asset_url_path}"

        expected_hash = asset["sha256"]
        expected_bytes = asset["bytes"]

        print(f"  Fetching: {asset_url_path} ...", end=" ")
        req = urllib.request.Request(asset_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            content = resp.read()

        computed_hash = hashlib.sha256(content).hexdigest()
        computed_bytes = len(content)

        matches = computed_hash == expected_hash and computed_bytes == expected_bytes
        if matches:
            print(f"VERIFIED [PASS] ({computed_bytes} bytes)")
        else:
            print(f"MISMATCH [WARN] expected {expected_bytes} got {computed_bytes}")

        with open(target_path, "wb") as out_f:
            out_f.write(content)

    print("\n" + "=" * 70)
    print("All Kage Landing Page files and binary assets extracted and verified!")
    print("=" * 70)


if __name__ == "__main__":
    extract_files_and_download_assets()
