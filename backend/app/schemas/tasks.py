from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime


class TaskCreate(BaseModel):
    board_id: int
    title: str
    description: str | None = None
    status: Any | None = None
    position: int | None = None
    due_date: datetime | None = None
    labels: list[str] | None = None
    checklist: list[dict] | None = None
    custom_fields: dict[int, str] | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: Any | None = None
    position: int | None = None
    due_date: datetime | None = None
    labels: list[str] | None = None
    checklist: list[dict] | None = None
    custom_fields: dict[int, str] | None = None


class TaskDataOut(BaseModel):
    field_id: int
    value: str | None = None


class TaskOut(BaseModel):
    id: int
    board_id: int
    title: str
    description: str | None = None
    status: Any | None = None
    position: int
    due_date: datetime | None = None
    labels: list[str] | None = None
    checklist: list[dict] | None = None
    custom_fields: list[TaskDataOut] = []

    model_config = ConfigDict(from_attributes=True)
