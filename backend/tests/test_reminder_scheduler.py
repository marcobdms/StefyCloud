import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import Base
from app.models import PushSubscription, Reminder
from app.reminder_scheduler import process_due_reminders, reminder_due_at_utc


class ReminderSchedulerTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(bind=self.engine)
        self.session = sessionmaker(bind=self.engine)()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def test_converts_device_timezone_to_utc(self):
        reminder = Reminder(
            title="Hora venezolana",
            date="2026-07-29",
            time="09:00",
            timezone="America/Caracas",
            priority="medium",
            group_name="today",
        )

        self.assertEqual(
            reminder_due_at_utc(reminder),
            datetime(2026, 7, 29, 13, 0, tzinfo=timezone.utc),
        )

    def test_sends_due_reminder_only_once(self):
        reminder = Reminder(
            title="Tomar medicina",
            date="2026-07-29",
            time="09:00",
            timezone="America/Caracas",
            priority="high",
            group_name="today",
            completed=False,
        )
        self.session.add(reminder)
        self.session.add(
            PushSubscription(
                endpoint="https://push.example/device",
                p256dh="key",
                auth="auth",
            )
        )
        self.session.commit()

        calls = []

        def fake_send(subscription, title, body, url):
            calls.append((subscription.endpoint, title, body, url))
            return "sent"

        now = datetime(2026, 7, 29, 13, 0, tzinfo=timezone.utc)
        first_run = process_due_reminders(
            self.session,
            now=now,
            send_push=fake_send,
        )
        second_run = process_due_reminders(
            self.session,
            now=now,
            send_push=fake_send,
        )

        self.session.refresh(reminder)
        self.assertEqual(first_run, 1)
        self.assertEqual(second_run, 0)
        self.assertEqual(len(calls), 1)
        self.assertIsNotNone(reminder.notified_at)


if __name__ == "__main__":
    unittest.main()
