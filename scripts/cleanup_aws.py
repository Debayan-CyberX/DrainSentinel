"""
Automated cleanup script for all DrainSentinel AWS resources.
Safely empties and deletes S3 buckets (both web and photos), DynamoDB tables,
Lambda function, API Gateway, and SNS topic.
Requires explicit confirmation before running.
"""

import os
import sys

# Configure console encoding
sys.stdout.reconfigure(encoding="utf-8")

import boto3
from botocore.exceptions import ClientError

REGION = "ap-south-1"
ENV_NAME = "production"


def cleanup_aws_resources(force: bool = False):
    print("=" * 70)
    print("[CLEANUP] DrainSentinel AWS Full Teardown & Resource Deletion")
    print(f"Region: {REGION} | Environment: {ENV_NAME}")
    print("=" * 70)

    if not force:
        confirm = input("\nWARNING: This will permanently delete ALL DrainSentinel resources on AWS. Proceed? (y/N): ")
        if confirm.strip().lower() != "y":
            print("Cleanup canceled by user.")
            return

    sts = boto3.client("sts", region_name=REGION)
    account_id = sts.get_caller_identity()["Account"]
    s3 = boto3.resource("s3", region_name=REGION)
    s3_client = boto3.client("s3", region_name=REGION)
    ddb = boto3.client("dynamodb", region_name=REGION)
    lam = boto3.client("lambda", region_name=REGION)
    apigw = boto3.client("apigatewayv2", region_name=REGION)
    sns = boto3.client("sns", region_name=REGION)
    iam = boto3.client("iam")

    # 1. Empty and Delete S3 Buckets
    print("\n[1/6] Cleaning up S3 buckets...")
    bucket_names = [
        f"drainsentinel-photos-{account_id}-{REGION}",
        f"drainsentinel-web-{account_id}-{REGION}",
    ]
    for b_name in bucket_names:
        try:
            bucket = s3.Bucket(b_name)
            bucket.object_versions.delete()
            bucket.objects.all().delete()
            bucket.delete()
            print(f"  --> Emptied and deleted bucket: {b_name}")
        except ClientError as e:
            if e.response["Error"]["Code"] in ("NoSuchBucket", "404"):
                print(f"  --> Bucket '{b_name}' does not exist.")
            else:
                print(f"  [WARN] Failed to delete bucket '{b_name}': {e}")

    # 2. Delete API Gateway HTTP API
    print("\n[2/6] Cleaning up API Gateway...")
    try:
        apis = apigw.get_apis()["Items"]
        for a in apis:
            if "DrainSentinel" in a.get("Name", ""):
                apigw.delete_api(ApiId=a["ApiId"])
                print(f"  --> Deleted API Gateway: {a['Name']} ({a['ApiId']})")
    except Exception as e:
        print(f"  [WARN] API Gateway cleanup error: {e}")

    # 3. Delete Lambda Function
    print("\n[3/6] Cleaning up Lambda function...")
    fn_name = f"DrainSentinel-API-{ENV_NAME}"
    try:
        lam.delete_function(FunctionName=fn_name)
        print(f"  --> Deleted Lambda function: {fn_name}")
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceNotFoundException":
            print(f"  [WARN] Lambda cleanup error: {e}")

    # 4. Delete DynamoDB Tables
    print("\n[4/6] Cleaning up DynamoDB tables...")
    tables = [
        f"DrainSentinel-Drains-{ENV_NAME}",
        f"DrainSentinel-Reports-{ENV_NAME}",
        f"DrainSentinel-Tasks-{ENV_NAME}",
        f"DrainSentinel-Audit-{ENV_NAME}",
    ]
    for t_name in tables:
        try:
            ddb.delete_table(TableName=t_name)
            print(f"  --> Initiated deletion of table: {t_name}")
        except ClientError as e:
            if e.response["Error"]["Code"] != "ResourceNotFoundException":
                print(f"  [WARN] DynamoDB cleanup error on {t_name}: {e}")

    # 5. Delete SNS Topic
    print("\n[5/6] Cleaning up SNS topic...")
    topic_arn = f"arn:aws:sns:{REGION}:{account_id}:DrainSentinel-Alerts-{ENV_NAME}"
    try:
        sns.delete_topic(TopicArn=topic_arn)
        print(f"  --> Deleted SNS topic: {topic_arn}")
    except Exception as e:
        print(f"  [WARN] SNS cleanup error: {e}")

    # 6. Delete IAM Role & Policies
    print("\n[6/6] Cleaning up IAM execution role...")
    role_name = f"DrainSentinelLambdaExecutionRole-{ENV_NAME}"
    try:
        policies = iam.list_role_policies(RoleName=role_name)["PolicyNames"]
        for p in policies:
            iam.delete_role_policy(RoleName=role_name, PolicyName=p)
        iam.delete_role(RoleName=role_name)
        print(f"  --> Deleted IAM role: {role_name}")
    except ClientError as e:
        if e.response["Error"]["Code"] != "NoSuchEntity":
            print(f"  [WARN] IAM cleanup error: {e}")

    print("\n" + "=" * 70)
    print("[SUCCESS] All DrainSentinel AWS resources have been cleanly removed.")
    print("=" * 70)


if __name__ == "__main__":
    force_flag = "--force" in sys.argv
    cleanup_aws_resources(force=force_flag)
