"""add task fields

Revision ID: 0002_task_fields
Revises: 0001_init
Create Date: 2026-01-29
"""
from alembic import op

revision = "0002_task_fields"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE tasks
          ADD COLUMN due_date TIMESTAMP NULL,
          ADD COLUMN labels JSONB NULL,
          ADD COLUMN checklist JSONB NULL;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE tasks
          DROP COLUMN IF EXISTS checklist,
          DROP COLUMN IF EXISTS labels,
          DROP COLUMN IF EXISTS due_date;
        """
    )
