"""
Sample data initialization script for the Gantt Chart database.
Run this to populate the database with sample data.
"""

from datetime import datetime, timedelta
from database import SessionLocal, init_db
from models import Task as TaskModel, Link as LinkModel


def create_sample_data():
    """Create sample data for testing."""
    init_db()
    db = SessionLocal()

    try:
        # Clear existing data
        db.query(LinkModel).delete()
        db.query(TaskModel).delete()
        db.commit()

        now = datetime.now()
        today = now.strftime("%Y-%m-%d 00:00:00")

        def date_offset(days: int) -> str:
            return (now + timedelta(days=days)).strftime("%Y-%m-%d 00:00:00")

        # Sample tasks
        tasks = [
            # Project 1: 株
            TaskModel(
                id=6,
                text="株",
                start_date=date_offset(-10),
                end_date=date_offset(30),
                duration=40,
                progress=0.0,
                parent=0,
                kind_task=2,  # project
                owner_id=0,
                sortorder=0,
                created_at=today,
                updated_at=today,
            ),
            # Project 2: 株システム (child of 株)
            TaskModel(
                id=33,
                text="株システム",
                start_date=date_offset(-5),
                end_date=date_offset(25),
                duration=30,
                progress=0.0,
                parent=6,
                kind_task=2,  # project
                owner_id=0,
                sortorder=1,
                created_at=today,
                updated_at=today,
            ),
            # Task: 優待注文の自動化をしたい
            TaskModel(
                id=107,
                text="優待注文の自動化をしたい",
                start_date=date_offset(0),
                end_date=date_offset(7),
                duration=7,
                progress=0.0,
                parent=33,
                kind_task=1,  # task
                owner_id=0,
                sortorder=2,
                created_at=today,
                updated_at=today,
            ),
            # Task: AI で株の分析
            TaskModel(
                id=177,
                text="AI で株の分析",
                start_date=date_offset(2),
                end_date=date_offset(9),
                duration=7,
                progress=0.0,
                parent=33,
                kind_task=1,  # task
                owner_id=0,
                sortorder=3,
                hyperlink="https://example.com",
                created_at=today,
                updated_at=today,
            ),
            # Task: 株人式システム
            TaskModel(
                id=178,
                text="株人式システム",
                start_date=date_offset(3),
                end_date=date_offset(10),
                duration=7,
                progress=0.0,
                parent=33,
                kind_task=1,  # task
                owner_id=0,
                sortorder=4,
                created_at=today,
                updated_at=today,
            ),
            # Task: edinet ファンダ
            TaskModel(
                id=204,
                text="edinet ファンダ",
                start_date=date_offset(5),
                end_date=date_offset(12),
                duration=7,
                progress=0.0,
                parent=33,
                kind_task=1,  # task
                owner_id=0,
                sortorder=5,
                created_at=today,
                updated_at=today,
            ),
            # Task: 株人勉強会
            TaskModel(
                id=38,
                text="株人勉強会",
                start_date=date_offset(7),
                end_date=date_offset(14),
                duration=7,
                progress=0.0,
                parent=6,
                kind_task=1,  # task
                owner_id=10,  # 待
                sortorder=6,
                created_at=today,
                updated_at=today,
            ),
            # Another project
            TaskModel(
                id=100,
                text="開発プロジェクト",
                start_date=date_offset(-3),
                end_date=date_offset(20),
                duration=23,
                progress=0.3,
                parent=0,
                kind_task=2,  # project
                owner_id=0,
                sortorder=10,
                created_at=today,
                updated_at=today,
            ),
            # Task under 開発プロジェクト
            TaskModel(
                id=101,
                text="フロントエンド開発",
                start_date=date_offset(0),
                end_date=date_offset(5),
                duration=5,
                progress=0.5,
                parent=100,
                kind_task=1,
                owner_id=0,
                sortorder=11,
                created_at=today,
                updated_at=today,
            ),
            TaskModel(
                id=102,
                text="バックエンド開発",
                start_date=date_offset(3),
                end_date=date_offset(10),
                duration=7,
                progress=0.2,
                parent=100,
                kind_task=1,
                owner_id=30,  # 他
                sortorder=12,
                created_at=today,
                updated_at=today,
            ),
            TaskModel(
                id=103,
                text="テスト",
                start_date=date_offset(8),
                end_date=date_offset(12),
                duration=4,
                progress=0.0,
                parent=100,
                kind_task=1,
                owner_id=0,
                sortorder=13,
                created_at=today,
                updated_at=today,
            ),
        ]

        for task in tasks:
            db.add(task)

        db.commit()
        print(f"Created {len(tasks)} sample tasks")

    finally:
        db.close()


if __name__ == "__main__":
    create_sample_data()
    print("Sample data created successfully!")
