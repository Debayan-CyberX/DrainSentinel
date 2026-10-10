"""
Create an Amazon CloudFront distribution for DrainSentinel S3 website.
Provides full global HTTPS (SSL) support so mobile browsers (iOS Safari, Android Chrome)
can access the application without HTTP/SSL blocking.
"""

import sys
import time
import json
import boto3
from botocore.exceptions import ClientError

# Set console encoding
sys.stdout.reconfigure(encoding="utf-8")

REGION = "ap-south-1"


def main():
    print("=" * 70)
    print("[CLOUDFRONT] Provisioning HTTPS CDN for DrainSentinel")
    print("=" * 70)

    sts = boto3.client("sts", region_name=REGION)
    account_id = sts.get_caller_identity()["Account"]
    bucket_name = f"drainsentinel-web-{account_id}-{REGION}"
    s3_website_domain = f"{bucket_name}.s3-website.{REGION}.amazonaws.com"
    caller_ref = f"drainsentinel-{int(time.time())}"

    print(f"Origin Website: {s3_website_domain}")

    cf = boto3.client("cloudfront")

    # Check if a distribution already exists
    dist_list = cf.list_distributions().get("DistributionList", {}).get("Items", [])
    existing = next((d for d in dist_list if any(o.get("DomainName") == s3_website_domain for o in d.get("Origins", {}).get("Items", []))), None)

    if existing:
        cf_domain = existing["DomainName"]
        print(f"\n[FOUND] Existing CloudFront distribution: https://{cf_domain}")
        return

    distribution_config = {
        "CallerReference": caller_ref,
        "Comment": "DrainSentinel Mobile-Ready HTTPS Distribution",
        "Enabled": True,
        "DefaultRootObject": "index.html",
        "Origins": {
            "Quantity": 1,
            "Items": [
                {
                    "Id": "S3-Website-Origin",
                    "DomainName": s3_website_domain,
                    "CustomOriginConfig": {
                        "HTTPPort": 80,
                        "HTTPSPort": 443,
                        "OriginProtocolPolicy": "http-only",
                        "OriginSslProtocols": {
                            "Quantity": 1,
                            "Items": ["TLSv1.2"],
                        },
                    },
                }
            ],
        },
        "DefaultCacheBehavior": {
            "TargetOriginId": "S3-Website-Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"],
                "CachedMethods": {
                    "Quantity": 2,
                    "Items": ["GET", "HEAD"],
                },
            },
            "ForwardedValues": {
                "QueryString": True,
                "Cookies": {"Forward": "none"},
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000,
            "Compress": True,
        },
        "CustomErrorResponses": {
            "Quantity": 2,
            "Items": [
                {
                    "ErrorCode": 404,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 0,
                },
                {
                    "ErrorCode": 403,
                    "ResponsePagePath": "/index.html",
                    "ResponseCode": "200",
                    "ErrorCachingMinTTL": 0,
                },
            ],
        },
    }

    print("\nCreating CloudFront distribution (this assigns a global SSL certificate)...")
    res = cf.create_distribution(DistributionConfig=distribution_config)
    dist = res["Distribution"]
    cf_domain = dist["DomainName"]
    dist_id = dist["Id"]

    https_url = f"https://{cf_domain}"
    print(f"\n[SUCCESS] Created CloudFront Distribution: {dist_id}")
    print(f"\n🌟 SECURE HTTPS MOBILE LINK: {https_url}")
    print("\n(Note: CloudFront takes ~1-3 minutes to replicate globally across edge locations).")


if __name__ == "__main__":
    main()
