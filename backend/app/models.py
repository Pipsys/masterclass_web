from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(128))
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="workspaces")
    boards = relationship("Board", back_populates="workspace", cascade="all, delete-orphan")
    custom_fields = relationship("CustomFieldDefinition", back_populates="workspace", cascade="all, delete-orphan")


class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(32), nullable=False)
    config = Column(JSON)

    workspace = relationship("Workspace", back_populates="boards")
    tasks = relationship("Task", back_populates="board", cascade="all, delete-orphan")


class CustomFieldDefinition(Base):
    __tablename__ = "custom_field_definitions"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    field_type = Column(String(32), nullable=False)
    is_required = Column(Boolean, default=False)

    workspace = relationship("Workspace", back_populates="custom_fields")
    task_data = relationship("TaskData", back_populates="field", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    position = Column(Integer, default=0)
    status = Column(JSON)
    due_date = Column(DateTime)
    labels = Column(JSON)
    checklist = Column(JSON)

    board = relationship("Board", back_populates="tasks")
    data = relationship("TaskData", back_populates="task", cascade="all, delete-orphan")


class TaskData(Base):
    __tablename__ = "task_data"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    custom_field_definition_id = Column(Integer, ForeignKey("custom_field_definitions.id", ondelete="CASCADE"), nullable=False)
    value = Column(Text)

    task = relationship("Task", back_populates="data")
    field = relationship("CustomFieldDefinition", back_populates="task_data")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(512), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_tokens")
