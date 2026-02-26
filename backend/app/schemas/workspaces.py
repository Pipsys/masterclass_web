from pydantic import BaseModel, ConfigDict
from datetime import datetime


class WorkspaceCreate(BaseModel):
    name: str
    description: str | None = None


class WorkspaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class WorkspaceOut(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomFieldCreate(BaseModel):
    name: str
    field_type: str
    is_required: bool = False


class CustomFieldOut(BaseModel):
    id: int
    name: str
    field_type: str
    is_required: bool

    model_config = ConfigDict(from_attributes=True)


class WorkspaceRecordCreate(BaseModel):
    data: dict


class WorkspaceRecordUpdate(BaseModel):
    data: dict


class WorkspaceRecordOut(BaseModel):
    id: int
    data: dict
    created_at: datetime
