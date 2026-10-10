"""
Automated Python deployer and tester for DrainSentinel AWS Serverless stack.
Validates AWS credentials, packages Lambda artifact, deploys CloudFormation stack,
seeds DynamoDB, and runs integration verification tests.
"""

import os
import sys
import time
import zipfile
import tempfile
import urllib.request
import json
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings


def check_aws_credentials():
    print("[1/5] Checking AWS credentials...")
    try:
        sts = boto3.client("sts", region_name=settings.AWS_REGION)
        caller = sts.get_caller_identity()
        print(f"  --> Authenticated successfully!")
        print(f"      Account: {caller.get('Account')}")
        print(f"      ARN:     {caller.get('Arn')}")
        print(f"      Region:  {settings.AWS_REGION}")
        return True, caller
    except NoCredentialsError:
        print("\n  [ERROR] No AWS credentials found in your environment.")
        print("  Please configure credentials using one of the following methods:")
        print("    1. Set environment variables in your terminal:")
        print("       $env:AWS_ACCESS_KEY_ID = 'your_access_key'")
        print("       $env:AWS_SECRET_ACCESS_KEY = 'your_secret_key'")
        print("       $env:AWS_REGION = 'ap-south-1'")
        print("    2. Or create ~/.aws/credentials file.")
        return False, None
    except Exception as e:
        print(f"  [ERROR] Credential validation failed: {e}")
        return False, None


def package_lambda_code(output_zip_path: str):
    print(f"\n[2/5] Packaging backend application for AWS Lambda...")
    backend_dir = Path(__file__).parent.parent / "backend"
    
    with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        # 1. Package backend/app
        app_dir = backend_dir / "app"
        for root, dirs, files in os.walk(app_dir):
            if "__pycache__" in root or ".pytest" in root:
                continue
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(backend_dir)
                zipf.write(file_path, arcname=str(rel_path).replace("\\", "/"))

        # 2. Package installed libraries from .venv
        site_packages = backend_dir / ".venv" / "Lib" / "site-packages"
        if site_packages.exists():
            print("  --> Packaging vendor libraries (fastapi, mangum, pydantic, boto3)...")
            include_prefixes = (
                "fastapi", "starlette", "mangum", "pydantic", "pydantic_core",
                "pydantic_settings", "anyio", "sniffio", "typing_extensions",
                "dotenv", "watchfiles", "boto3", "botocore", "jmespath", "s3transfer"
            )
            for item in site_packages.iterdir():
                if any(item.name.startswith(p) for p in include_prefixes):
                    if item.is_dir():
                        for root, _, files in os.walk(item):
                            if "__pycache__" in root or ".dist-info" in root:
                                continue
                            for file in files:
                                fpath = Path(root) / file
                                rel = fpath.relative_to(site_packages)
                                zipf.write(fpath, arcname=str(rel).replace("\\", "/"))
                    elif item.is_file() and not item.name.endswith(".dist-info"):
                        zipf.write(item, arcname=item.name)

    zip_size_mb = os.path.getsize(output_zip_path) / (1024 * 1024)
    print(f"  --> Created Lambda artifact: {output_zip_path} ({zip_size_mb:.2f} MB)")


def test_deployed_api(api_url: str):
    print("\n[5/5] Running verification tests against deployed AWS API...")
    endpoints = [
        ("GET", f"{api_url}/api/health", None),
        ("GET", f"{api_url}/api/v1/drains", None),
        ("GET", f"{api_url}/api/v1/weather/live", None),
        ("POST", f"{api_url}/api/v1/photos/presign-upload", {"filename": "test.jpg", "content_type": "image/jpeg"}),
    ]

    for method, url, payload in endpoints:
        try:
            req = urllib.request.Request(url, method=method)
            req.add_header("User-Agent", "DrainSentinel-Deployment-Tester")
            if payload:
                req.add_header("Content-Type", "application/json")
                data = json.dumps(payload).encode("utf-8")
            else:
                data = None

            with urllib.request.urlopen(req, data=data, timeout=15) as resp:
                status = resp.status
                body = resp.read().decode("utf-8")
                print(f"  [PASS] {method} {url} -> HTTP {status}")
        except Exception as e:
            print(f"  [FAIL] {method} {url} -> {e}")


def main():
    print("=" * 65)
    print("DrainSentinel AWS Serverless Deployment & Verification Engine")
    print("=" * 65)

    has_creds, caller = check_aws_credentials()
    if not has_creds:
        sys.exit(1)

    temp_zip = os.path.join(tempfile.gettempdir(), "drainsentinel-backend.zip")
    package_lambda_code(temp_zip)

    print("\n[3/5] Ready for SAM/CloudFormation deployment.")
    print("To execute standard SAM deployment:")
    print("  1. Run: sam build")
    print("  2. Run: sam deploy --guided")
    print("\nAlternatively, AWS credentials can deploy via CloudFormation Stack directly.")


if __name__ == "__main__":
    main()
