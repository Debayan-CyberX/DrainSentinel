"""
Seed script to populate AWS DynamoDB tables with Mumbai drainage assets,
initial incident reports, and inspection tasks.
"""

import os
import sys
from decimal import Decimal
from typing import Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import boto3
from app.core.config import settings
from app.repositories.memory_store import MemoryDataStore
from app.repositories.dynamo_store import _float_to_decimal


def seed_dynamodb():
    print("=" * 60)
    print("DrainSentinel DynamoDB Initial Data Seeder")
    print(f"Target Region: {settings.AWS_REGION}")
    print("=" * 60)

    dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    
    # Instantiate memory store to read the verified seed dataset
    mem = MemoryDataStore()
    drains = mem.list_drains()
    reports = mem.list_reports()
    tasks = mem.list_tasks()

    # 1. Seed Drains Table
    drains_table_name = settings.DYNAMODB_TABLE_DRAINS
    print(f"\n[1/3] Seeding {len(drains)} Mumbai drain assets into '{drains_table_name}'...")
    try:
        table = dynamodb.Table(drains_table_name)
        with table.batch_writer() as batch:
            for drain in drains:
                item = _float_to_decimal(drain.model_dump())
                batch.put_item(Item=item)
        print(f"  --> Successfully seeded {len(drains)} drains.")
    except Exception as e:
        print(f"  [ERROR] Failed to seed drains: {e}")

    # 2. Seed Reports Table
    reports_table_name = settings.DYNAMODB_TABLE_REPORTS
    print(f"\n[2/3] Seeding {len(reports)} incident reports into '{reports_table_name}'...")
    try:
        table = dynamodb.Table(reports_table_name)
        with table.batch_writer() as batch:
            for report in reports:
                item = _float_to_decimal(report.model_dump())
                batch.put_item(Item=item)
        print(f"  --> Successfully seeded {len(reports)} incident reports.")
    except Exception as e:
        print(f"  [ERROR] Failed to seed reports: {e}")

    # 3. Seed Tasks Table
    tasks_table_name = settings.DYNAMODB_TABLE_TASKS
    print(f"\n[3/3] Seeding {len(tasks)} inspection tasks into '{tasks_table_name}'...")
    try:
        table = dynamodb.Table(tasks_table_name)
        with table.batch_writer() as batch:
            for task in tasks:
                item = _float_to_decimal(task.model_dump())
                batch.put_item(Item=item)
        print(f"  --> Successfully seeded {len(tasks)} inspection tasks.")
    except Exception as e:
        print(f"  [ERROR] Failed to seed tasks: {e}")

    print("\n" + "=" * 60)
    print("Seeding complete!")
    print("=" * 60)


if __name__ == "__main__":
    seed_dynamodb()
