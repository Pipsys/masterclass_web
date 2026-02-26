from pydantic import BaseModel, ConfigDict
from typing import Any


class BoardCreate(BaseModel):
    workspace_id: int
    name: str
    type: str
    config: Any | None = None


class BoardUpdate(BaseModel):
    name: str | None = None


class BoardOut(BaseModel):
    id: int
    workspace_id: int
    name: str
    type: str
    config: Any | None = None

    model_config = ConfigDict(from_attributes=True)


class TaskReorderItem(BaseModel):
    task_id: int
    status: Any | None = None
    position: int


class TaskReorderIn(BaseModel):
    items: list[TaskReorderItem]
