# DrainSentinel AWS Deployment & Verification Guide

This guide explains how to deploy and verify the **DrainSentinel** serverless architecture on Amazon Web Services (AWS) using **AWS SAM** or **Boto3**.

---

## 1. Architecture Summary

| Component | AWS Resource | Details |
|---|---|---|
| **Web UI** | Amazon S3 Static Web | React 18 + Vite SPA with public website hosting |
| **API Engine** | AWS Lambda | Python 3.11, 512 MB, FastAPI via Mangum ASGI adapter |
| **HTTP Routing** | Amazon API Gateway | HTTP API (v2) with `$default` auto-deploy stage and CORS |
| **Storage** | Amazon DynamoDB | Pay-per-request tables: Drains, Reports, Tasks, Audit |
| **Media Vault** | Amazon S3 | Private bucket with Block Public Access + Presigned URLs |
| **Notifications** | Amazon SNS | `DrainSentinel-Alerts` topic for emergency dispatches & warnings |
| **IaC** | AWS SAM / CloudFormation | Declarative `template.yaml` with least-privilege IAM policies |

---

## 2. Prerequisites & Credentials Setup

Before deploying to your AWS account, configure your AWS credentials.

### Option A: Using AWS CLI
If the AWS CLI is installed on your workstation:
```bash
aws configure
```
Enter your:
- **AWS Access Key ID**: `AKIA...`
- **AWS Secret Access Key**: `...`
- **Default region name**: `ap-south-1` (Mumbai)
- **Default output format**: `json`

### Option B: Using Environment Variables
In your terminal (PowerShell):
```powershell
$env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY_ID"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_ACCESS_KEY"
$env:AWS_REGION = "ap-south-1"
```
Or in Bash / Linux:
```bash
export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="ap-south-1"
```

> **Security Note:** Never commit your AWS credentials to git. All credentials are read from standard AWS environment variables or `~/.aws/credentials`.

---

## 3. Deploying with AWS SAM

### Step 1: Install AWS SAM CLI (if not already installed)
- **Windows**: Download the 64-bit MSI installer from [AWS SAM CLI Releases](https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi) and install.
- Verify installation:
  ```powershell
  sam --version
  ```

### Step 2: Build the Serverless Artifact
Run from the project root (`c:\Users\Admin\Desktop\DrainSentinel`):
```bash
sam build
```
This bundles the FastAPI application in `backend/` together with all dependencies (`boto3`, `mangum`, `fastapi`, `pydantic`).

### Step 3: Deploy to AWS
Run the guided deployment:
```bash
sam deploy --guided
```
When prompted:
- **Stack Name**: `drainsentinel-stack`
- **AWS Region**: `ap-south-1` (or your preferred region)
- **Parameter Environment**: `production`
- **Parameter GeminiApiKey**: *(Press Enter to leave empty for deterministic AI fallback, or paste your key)*
- **Confirm changes before deploy**: `y`
- **Allow SAM CLI IAM role creation**: `y`
- **Disable rollback**: `n`
- **DrainSentinelFunction has no authentication. Is this okay?**: `y` (HTTP API public gateway)
- **Save arguments to configuration file**: `y`

SAM will provision:
1. API Gateway HTTP API
2. Lambda Function with Mangum handler
3. 4 DynamoDB Tables (`DrainSentinel-Drains-production`, etc.)
4. Private S3 Bucket with AES256 encryption
5. SNS Alerts Topic
6. Granular IAM Execution Role

At the end of deployment, SAM outputs your **`ApiUrl`** (e.g., `https://xyz123.execute-api.ap-south-1.amazonaws.com`).

---

## 4. Seeding Initial Mumbai Data

Once your DynamoDB tables are provisioned, seed the 25 Mumbai drain assets and baseline reports:

```powershell
# In PowerShell:
$env:DYNAMODB_TABLE_DRAINS = "DrainSentinel-Drains-production"
$env:DYNAMODB_TABLE_REPORTS = "DrainSentinel-Reports-production"
$env:DYNAMODB_TABLE_TASKS = "DrainSentinel-Tasks-production"
$env:STORAGE_BACKEND = "dynamodb"

python scripts/seed_dynamodb.py
```

---

## 5. Verifying the Deployed API

Replace `<API_URL>` with your actual API Gateway endpoint:

### 1. Health & Root Endpoint
```bash
curl https://<API_URL>/api/health
curl https://<API_URL>/
```
Expected response:
```json
{"status": "healthy", "service": "DrainSentinel API", "version": "0.1.0"}
```

### 2. Drains Registry (DynamoDB backed)
```bash
curl https://<API_URL>/api/v1/drains
```
Returns list of all 25 Mumbai storm-drain assets with explainable risk scores.

### 3. S3 Presigned Upload URL
```bash
curl -X POST https://<API_URL>/api/v1/photos/presign-upload \
  -H "Content-Type: application/json" \
  -d '{"filename": "hindmata_culvert.jpg", "content_type": "image/jpeg"}'
```
Returns an authenticated AWS S3 `PUT` URL expiring in 15 minutes.

### 4. Create Incident Report & Trigger SNS Alert
```bash
curl -X POST https://<API_URL>/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{
    "drain_id": "DS-MUM-101",
    "location": {"lat": 19.0142, "lng": 72.8423, "address": "Hindmata Flyover low sag"},
    "issue_type": "Silt Accumulation",
    "severity": "critical",
    "description": "Urgent de-silting needed due to construction runoff."
  }'
```
Triggers DynamoDB insertion, drain risk recalculation, audit event recording, and SNS critical alert broadcast.

---

## 6. Connecting the Frontend to AWS

To point the React frontend to your deployed AWS backend:
1. Open `frontend/.env` (or create one):
   ```env
   VITE_API_URL=https://<API_URL>
   ```
2. Rebuild the frontend:
   ```bash
   cd frontend
   npm.cmd run build
   ```

---

## 7. Resource Teardown & Cleanup Procedure

When you are done testing or evaluating to prevent any unwanted AWS charges:

### Automated Teardown via Python Script:
```powershell
python scripts/cleanup_aws.py
```
*(The script asks for confirmation, safely empties the S3 bucket, and deletes the CloudFormation stack).*

### Manual Teardown via SAM / AWS CLI:
```bash
# 1. Empty the S3 bucket (buckets cannot be deleted if they contain objects)
aws s3 rm s3://drainsentinel-photos-<account-id>-<region> --recursive

# 2. Delete the CloudFormation stack
sam delete --stack-name drainsentinel-stack --no-prompts
```
