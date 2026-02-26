"""init

Revision ID: 0001_init
Revises: 
Create Date: 2026-01-26
"""
from alembic import op

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(128),
          hashed_password VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE workspaces (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE boards (
          id SERIAL PRIMARY KEY,
          workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(32) NOT NULL,
          config JSONB
        );
        """
    )
    op.execute(
        """
        CREATE TABLE custom_field_definitions (
          id SERIAL PRIMARY KEY,
          workspace_id INT REFERENCES workspaces(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          field_type VARCHAR(32) NOT NULL,
          is_required BOOLEAN DEFAULT FALSE
        );
        """
    )
    op.execute(
        """
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          board_id INT REFERENCES boards(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          position INT DEFAULT 0,
          status JSONB
        );
        """
    )
    op.execute(
        """
        CREATE TABLE task_data (
          id SERIAL PRIMARY KEY,
          task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
          custom_field_definition_id INT REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
          value TEXT
        );
        """
    )
    op.execute(
        """
        CREATE TABLE refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(512) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          revoked BOOLEAN DEFAULT FALSE
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS refresh_tokens;")
    op.execute("DROP TABLE IF EXISTS task_data;")
    op.execute("DROP TABLE IF EXISTS tasks;")
    op.execute("DROP TABLE IF EXISTS custom_field_definitions;")
    op.execute("DROP TABLE IF EXISTS boards;")
    op.execute("DROP TABLE IF EXISTS workspaces;")
    op.execute("DROP TABLE IF EXISTS users;")
