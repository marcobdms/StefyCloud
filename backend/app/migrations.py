from sqlalchemy import inspect, text

from .database import engine


def apply_compatibility_migrations() -> None:
    """Apply small additive migrations for installations without Alembic."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    statements: list[str] = []
    timestamp_type = (
        "TIMESTAMP WITH TIME ZONE"
        if engine.dialect.name == "postgresql"
        else "DATETIME"
    )

    if "trash_items" not in tables:
        statements.append(
            f"""
            CREATE TABLE trash_items (
                id VARCHAR PRIMARY KEY,
                item_type VARCHAR,
                item_id VARCHAR,
                title VARCHAR,
                payload TEXT,
                file_urls TEXT DEFAULT '[]',
                deleted_at {timestamp_type} DEFAULT CURRENT_TIMESTAMP,
                expires_at {timestamp_type}
            )
            """
        )

    if "activity_logs" not in tables:
        statements.append(
            f"""
            CREATE TABLE activity_logs (
                id VARCHAR PRIMARY KEY,
                action VARCHAR,
                item_type VARCHAR,
                item_id VARCHAR,
                title VARCHAR,
                metadata_json TEXT DEFAULT '{{}}',
                created_at {timestamp_type} DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

    if "reminders" in tables:
        reminder_columns = {
            column["name"] for column in inspector.get_columns("reminders")
        }
        if "timezone" not in reminder_columns:
            statements.append("ALTER TABLE reminders ADD COLUMN timezone VARCHAR")
        if "notified_at" not in reminder_columns:
            statements.append(
                f"ALTER TABLE reminders ADD COLUMN notified_at {timestamp_type}"
            )

    if "push_subscriptions" in tables:
        subscription_columns = {
            column["name"]
            for column in inspector.get_columns("push_subscriptions")
        }
        if "session_id" not in subscription_columns:
            statements.append(
                "ALTER TABLE push_subscriptions ADD COLUMN session_id VARCHAR"
            )

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))
