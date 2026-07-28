from sqlalchemy import inspect, text

from .database import engine


def apply_compatibility_migrations() -> None:
    """Apply small additive migrations for installations without Alembic."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    statements: list[str] = []

    if "reminders" in tables:
        reminder_columns = {
            column["name"] for column in inspector.get_columns("reminders")
        }
        if "timezone" not in reminder_columns:
            statements.append("ALTER TABLE reminders ADD COLUMN timezone VARCHAR")
        if "notified_at" not in reminder_columns:
            timestamp_type = (
                "TIMESTAMP WITH TIME ZONE"
                if engine.dialect.name == "postgresql"
                else "DATETIME"
            )
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
