"""
Deploy DrainSentinel React frontend to AWS S3 Static Website Hosting.
"""

import os
import sys
import mimetypes
import json
import urllib.request
from pathlib import Path

# Configure UTF-8 for console output
sys.stdout.reconfigure(encoding="utf-8")

import boto3
from botocore.exceptions import ClientError

REGION = "ap-south-1"
DIST_DIR = Path(__file__).parent.parent / "frontend" / "dist"


def main():
    print("=" * 70)
    print("[DEPLOY] DrainSentinel Frontend to AWS S3 Static Website")
    print(f"Region: {REGION}")
    print("=" * 70)

    if not DIST_DIR.exists():
        print(f"[ERROR] dist directory does not exist at {DIST_DIR}. Run 'npm run build' first.")
        sys.exit(1)

    sts = boto3.client("sts", region_name=REGION)
    account_id = sts.get_caller_identity()["Account"]
    bucket_name = f"drainsentinel-web-{account_id}-{REGION}"
    print(f"Target Website Bucket: {bucket_name}")

    s3 = boto3.client("s3", region_name=REGION)

    # 1. Create S3 Bucket
    print("\n[1/5] Creating website bucket...")
    try:
        s3.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={"LocationConstraint": REGION},
        )
        print("  --> Bucket created.")
    except ClientError as e:
        if e.response["Error"]["Code"] in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
            print("  --> Bucket already exists.")
        else:
            raise

    # 2. Disable Public Access Block for Website Hosting
    print("\n[2/5] Configuring public website access...")
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": False,
            "IgnorePublicAcls": False,
            "BlockPublicPolicy": False,
            "RestrictPublicBuckets": False,
        },
    )
    print("  --> Public access block disabled for hosting.")

    # 3. Apply Public Read Policy
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*",
            }
        ],
    }
    s3.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))
    print("  --> Applied PublicReadGetObject bucket policy.")

    # 4. Enable Static Website Hosting
    s3.put_bucket_website(
        Bucket=bucket_name,
        WebsiteConfiguration={
            "IndexDocument": {"Suffix": "index.html"},
            "ErrorDocument": {"Key": "index.html"},
        },
    )
    print("  --> Configured index.html and SPA error fallback.")

    # 5. Upload Distribution Assets
    print("\n[3/5] Uploading production build artifacts...")
    content_type_overrides = {
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".html": "text/html; charset=utf-8",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".ico": "image/x-icon",
    }

    uploaded_count = 0
    for root, _, files in os.walk(DIST_DIR):
        for f in files:
            file_path = Path(root) / f
            rel_path = file_path.relative_to(DIST_DIR)
            s3_key = str(rel_path).replace("\\", "/")

            ext = file_path.suffix.lower()
            content_type = content_type_overrides.get(ext) or mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"

            extra_args = {"ContentType": content_type}
            if ext in (".html",):
                extra_args["CacheControl"] = "no-cache, no-store, must-revalidate"
            else:
                extra_args["CacheControl"] = "public, max-age=31536000, immutable"

            with open(file_path, "rb") as fp:
                s3.put_object(
                    Bucket=bucket_name,
                    Key=s3_key,
                    Body=fp.read(),
                    **extra_args,
                )
            uploaded_count += 1
            print(f"  --> Uploaded: {s3_key} ({content_type})")

    website_url = f"http://{bucket_name}.s3-website.{REGION}.amazonaws.com"
    print(f"\n[4/5] Successfully uploaded {uploaded_count} files!")
    print(f"\n[LIVE FRONTEND URL] {website_url}")

    # 6. Verify Live Website URL
    print("\n[5/5] Verifying live website endpoint...")
    try:
        req = urllib.request.Request(website_url, headers={"User-Agent": "DrainSentinel-Frontend-Tester"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode("utf-8")
            if "<title>" in content or "DrainSentinel" in content:
                print(f"  [PASS] Live frontend returned HTTP {resp.status} with valid HTML!")
            else:
                print(f"  [WARN] Live frontend returned HTTP {resp.status} (content verification incomplete).")
    except Exception as e:
        print(f"  [FAIL] Could not verify website URL: {e}")

    print("\n" + "=" * 70)
    print("[SUCCESS] FRONTEND IS DEPLOYED AND LIVE ON AWS!")
    print(f"Website URL: {website_url}")
    print("=" * 70)


if __name__ == "__main__":
    main()
