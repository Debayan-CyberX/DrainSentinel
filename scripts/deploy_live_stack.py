"""
DrainSentinel Live AWS Serverless Deployment and End-to-End Verification Script
Deploys S3, DynamoDB, SNS, IAM Role, Lambda Function, and API Gateway HTTP API,
seeds database, and verifies live endpoints.
"""

import os
import sys
import time
import json
import shutil
import zipfile
import urllib.request
from pathlib import Path

# Set up paths
ROOT_DIR = Path(__file__).parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
BUILD_DIR = ROOT_DIR / "build"
PACKAGE_DIR = BUILD_DIR / "package"
ZIP_PATH = BUILD_DIR / "lambda_deploy.zip"

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(BACKEND_DIR))

import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

REGION = "ap-south-1"
ENV_NAME = "production"
DRAINS_TABLE = f"DrainSentinel-Drains-{ENV_NAME}"
REPORTS_TABLE = f"DrainSentinel-Reports-{ENV_NAME}"
TASKS_TABLE = f"DrainSentinel-Tasks-{ENV_NAME}"
AUDIT_TABLE = f"DrainSentinel-Audit-{ENV_NAME}"
TOPIC_NAME = f"DrainSentinel-Alerts-{ENV_NAME}"
ROLE_NAME = f"DrainSentinelLambdaExecutionRole-{ENV_NAME}"
FUNCTION_NAME = f"DrainSentinel-API-{ENV_NAME}"
API_NAME = f"DrainSentinel-HTTP-API-{ENV_NAME}"


def log(step: str, msg: str):
    print(f"\n[{step}] {msg}")


def main():
    print("=" * 70)
    print("[DEPLOY] DrainSentinel Live AWS Serverless Deployment")
    print(f"Region: {REGION} | Environment: {ENV_NAME}")
    print("=" * 70)

    # 1. AWS Identity Check
    sts = boto3.client("sts", region_name=REGION)
    identity = sts.get_caller_identity()
    account_id = identity["Account"]
    bucket_name = f"drainsentinel-photos-{account_id}-{REGION}"
    print(f"Authenticated as: {identity['Arn']} (Account: {account_id})")

    # 2. S3 Photo Bucket
    log("1/7", f"Ensuring private S3 bucket '{bucket_name}'...")
    s3 = boto3.client("s3", region_name=REGION)
    try:
        s3.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={"LocationConstraint": REGION},
        )
        print("  --> S3 Bucket created.")
    except ClientError as e:
        if e.response["Error"]["Code"] in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
            print("  --> S3 Bucket already exists.")
        else:
            raise

    # Block public access
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        },
    )
    # Enable CORS for direct uploads
    s3.put_bucket_cors(
        Bucket=bucket_name,
        CORSConfiguration={
            "CORSRules": [
                {
                    "AllowedHeaders": ["*"],
                    "AllowedMethods": ["GET", "PUT", "POST"],
                    "AllowedOrigins": ["*"],
                    "MaxAgeSeconds": 3600,
                }
            ]
        },
    )
    print("  --> S3 private security & CORS configured.")

    # 3. DynamoDB Tables
    log("2/7", "Ensuring DynamoDB tables...")
    ddb = boto3.client("dynamodb", region_name=REGION)
    tables = [DRAINS_TABLE, REPORTS_TABLE, TASKS_TABLE, AUDIT_TABLE]

    for tbl in tables:
        try:
            ddb.create_table(
                TableName=tbl,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
                SSESpecification={"Enabled": True},
            )
            print(f"  --> Creating table '{tbl}'...")
            waiter = ddb.get_waiter("table_exists")
            waiter.wait(TableName=tbl)
            print(f"  --> Table '{tbl}' ACTIVE.")
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceInUseException":
                print(f"  --> Table '{tbl}' already exists and ACTIVE.")
            else:
                raise

    # 4. Amazon SNS Topic
    log("3/7", f"Ensuring SNS topic '{TOPIC_NAME}'...")
    sns = boto3.client("sns", region_name=REGION)
    topic_res = sns.create_topic(Name=TOPIC_NAME)
    topic_arn = topic_res["TopicArn"]
    print(f"  --> Topic ARN: {topic_arn}")

    # 5. IAM Lambda Execution Role
    log("4/7", f"Ensuring IAM execution role '{ROLE_NAME}'...")
    iam = boto3.client("iam")
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole",
            }
        ],
    }

    try:
        role_res = iam.create_role(
            RoleName=ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description="DrainSentinel Lambda serverless execution role",
        )
        role_arn = role_res["Role"]["Arn"]
        print(f"  --> Created IAM Role: {role_arn}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "EntityAlreadyExists":
            role_res = iam.get_role(RoleName=ROLE_NAME)
            role_arn = role_res["Role"]["Arn"]
            print(f"  --> Using existing IAM Role: {role_arn}")
        else:
            raise

    # Attach least-privilege inline policy
    service_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                "Resource": f"arn:aws:logs:{REGION}:{account_id}:*",
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:BatchWriteItem",
                ],
                "Resource": f"arn:aws:dynamodb:{REGION}:{account_id}:table/DrainSentinel-*",
            },
            {
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                "Resource": f"arn:aws:s3:::{bucket_name}/*",
            },
            {
                "Effect": "Allow",
                "Action": ["sns:Publish"],
                "Resource": topic_arn,
            },
        ],
    }

    iam.put_role_policy(
        RoleName=ROLE_NAME,
        PolicyName="DrainSentinelAccessPolicy",
        PolicyDocument=json.dumps(service_policy),
    )
    print("  --> Attached least-privilege policy. Waiting 8s for IAM role replication...")
    time.sleep(8)

    # 6. Build Deployment Zip
    log("5/7", "Packaging Lambda deployment archive...")
    app_target = PACKAGE_DIR / "app"
    if app_target.exists():
        shutil.rmtree(app_target)
    shutil.copytree(BACKEND_DIR / "app", app_target)

    # Also copy any necessary root files
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(PACKAGE_DIR):
            for file in files:
                fpath = Path(root) / file
                rel = fpath.relative_to(PACKAGE_DIR)
                z.write(fpath, arcname=str(rel).replace("\\", "/"))

    zip_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)
    print(f"  --> Built Linux Lambda package: {ZIP_PATH} ({zip_mb:.2f} MB)")

    # 7. Deploy AWS Lambda Function
    log("6/7", f"Deploying Lambda function '{FUNCTION_NAME}'...")
    lam = boto3.client("lambda", region_name=REGION)
    with open(ZIP_PATH, "rb") as f:
        zip_bytes = f.read()

    env_vars = {
        "ENVIRONMENT": ENV_NAME,
        "STORAGE_BACKEND": "dynamodb",
        "AWS_REGION_NAME": REGION,
        "DYNAMODB_TABLE_DRAINS": DRAINS_TABLE,
        "DYNAMODB_TABLE_REPORTS": REPORTS_TABLE,
        "DYNAMODB_TABLE_TASKS": TASKS_TABLE,
        "DYNAMODB_TABLE_AUDIT": AUDIT_TABLE,
        "S3_PHOTO_BUCKET": bucket_name,
        "SNS_ALERT_TOPIC_ARN": topic_arn,
        "AI_MODEL": "gemini-2.5-flash",
    }

    try:
        lam_res = lam.create_function(
            FunctionName=FUNCTION_NAME,
            Runtime="python3.11",
            Role=role_arn,
            Handler="app.main.handler",
            Code={"ZipFile": zip_bytes},
            Description="DrainSentinel FastAPI backend",
            Timeout=30,
            MemorySize=512,
            Environment={"Variables": env_vars},
        )
        function_arn = lam_res["FunctionArn"]
        print(f"  --> Created Lambda function: {function_arn}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceConflictException":
            print("  --> Function exists. Updating code and configuration...")
            lam.update_function_code(FunctionName=FUNCTION_NAME, ZipFile=zip_bytes)
            # Wait for update to complete
            waiter = lam.get_waiter("function_updated_v2")
            waiter.wait(FunctionName=FUNCTION_NAME)
            lam.update_function_configuration(
                FunctionName=FUNCTION_NAME,
                Role=role_arn,
                Handler="app.main.handler",
                Timeout=30,
                MemorySize=512,
                Environment={"Variables": env_vars},
            )
            lam_res = lam.get_function(FunctionName=FUNCTION_NAME)
            function_arn = lam_res["Configuration"]["FunctionArn"]
            print(f"  --> Updated Lambda function: {function_arn}")
        else:
            raise

    # 8. Deploy Amazon API Gateway (HTTP API v2)
    log("7/7", f"Deploying API Gateway HTTP API '{API_NAME}'...")
    apigw = boto3.client("apigatewayv2", region_name=REGION)

    # Check if API exists
    apis = apigw.get_apis()["Items"]
    matching_api = next((a for a in apis if a["Name"] == API_NAME), None)

    if not matching_api:
        api_res = apigw.create_api(
            Name=API_NAME,
            ProtocolType="HTTP",
            CorsConfiguration={
                "AllowOrigins": ["*"],
                "AllowMethods": ["*"],
                "AllowHeaders": ["*"],
                "MaxAge": 300,
            },
        )
        api_id = api_res["ApiId"]
        print(f"  --> Created HTTP API: {api_id}")
    else:
        api_id = matching_api["ApiId"]
        print(f"  --> Using existing HTTP API: {api_id}")

    # Create Lambda Integration
    integrations = apigw.get_integrations(ApiId=api_id)["Items"]
    if not integrations:
        int_res = apigw.create_integration(
            ApiId=api_id,
            IntegrationType="AWS_PROXY",
            IntegrationUri=function_arn,
            IntegrationMethod="POST",
            PayloadFormatVersion="2.0",
        )
        integration_id = int_res["IntegrationId"]
    else:
        integration_id = integrations[0]["IntegrationId"]

    # Create Route $default
    routes = apigw.get_routes(ApiId=api_id)["Items"]
    has_default_route = any(r["RouteKey"] == "$default" for r in routes)
    if not has_default_route:
        apigw.create_route(
            ApiId=api_id,
            RouteKey="$default",
            Target=f"integrations/{integration_id}",
        )
        print("  --> Created $default catch-all route.")

    # Create / Auto-deploy $default Stage
    stages = apigw.get_stages(ApiId=api_id)["Items"]
    has_default_stage = any(s["StageName"] == "$default" for s in stages)
    if not has_default_stage:
        apigw.create_stage(
            ApiId=api_id,
            StageName="$default",
            AutoDeploy=True,
        )
        print("  --> Created $default auto-deploy stage.")

    # Add Lambda invocation permission for API Gateway
    try:
        lam.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId=f"apigw-access-{api_id}",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{REGION}:{account_id}:{api_id}/*",
        )
        print("  --> Added Lambda invoke permission for API Gateway.")
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceConflictException":
            raise

    api_endpoint = f"https://{api_id}.execute-api.{REGION}.amazonaws.com"
    print(f"\n[LIVE ENDPOINT] API Gateway URL: {api_endpoint}")

    # 9. Seed DynamoDB Data
    print("\n" + "=" * 70)
    print("[SEED] Seeding 25 Mumbai Storm-Drain Assets into DynamoDB...")
    from app.repositories.memory_store import MemoryDataStore
    from app.repositories.dynamo_store import _float_to_decimal

    mem = MemoryDataStore()
    drains = mem.list_drains()
    reports = mem.list_reports()
    tasks = mem.list_tasks()

    dynamodb = boto3.resource("dynamodb", region_name=REGION)
    drains_tbl = dynamodb.Table(DRAINS_TABLE)
    with drains_tbl.batch_writer() as batch:
        for d in drains:
            batch.put_item(Item=_float_to_decimal(d.model_dump()))
    print(f"  --> Seeded {len(drains)} drains into {DRAINS_TABLE}")

    reports_tbl = dynamodb.Table(REPORTS_TABLE)
    with reports_tbl.batch_writer() as batch:
        for r in reports:
            batch.put_item(Item=_float_to_decimal(r.model_dump()))
    print(f"  --> Seeded {len(reports)} reports into {REPORTS_TABLE}")

    tasks_tbl = dynamodb.Table(TASKS_TABLE)
    with tasks_tbl.batch_writer() as batch:
        for t in tasks:
            batch.put_item(Item=_float_to_decimal(t.model_dump()))
    print(f"  --> Seeded {len(tasks)} tasks into {TASKS_TABLE}")

    # 10. Run End-to-End Live API Verification
    print("\n" + "=" * 70)
    print("[TEST] Verifying Live Deployed Endpoints on AWS...")
    time.sleep(3)  # Allow API Gateway routes to settle

    test_endpoints = [
        ("GET", f"{api_endpoint}/", None),
        ("GET", f"{api_endpoint}/api/health", None),
        ("GET", f"{api_endpoint}/api/v1/drains", None),
        ("GET", f"{api_endpoint}/api/v1/weather/live", None),
        (
            "POST",
            f"{api_endpoint}/api/v1/photos/presign-upload",
            {"filename": "monsoon_flood_evidence.jpg", "content_type": "image/jpeg"},
        ),
    ]

    all_passed = True
    for method, url, body in test_endpoints:
        try:
            req = urllib.request.Request(url, method=method)
            req.add_header("User-Agent", "DrainSentinel-Live-Deploy-Verification")
            data = None
            if body:
                req.add_header("Content-Type", "application/json")
                data = json.dumps(body).encode("utf-8")

            with urllib.request.urlopen(req, data=data, timeout=20) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                sample = str(resp_data)[:90] + "..." if len(str(resp_data)) > 90 else str(resp_data)
                print(f"  [PASS] {method} {url} -> HTTP {resp.status} | {sample}")
        except Exception as e:
            all_passed = False
            print(f"  [FAIL] {method} {url} -> {e}")

    print("\n" + "=" * 70)
    if all_passed:
        print("[SUCCESS] DEPLOYMENT & VERIFICATION FULLY SUCCESSFUL!")
        print(f"Live API URL: {api_endpoint}")
        print(f"Interactive Docs: {api_endpoint}/docs")
    else:
        print("[WARN] Deployment finished with some endpoint verification warnings.")
    print("=" * 70)


if __name__ == "__main__":
    main()
