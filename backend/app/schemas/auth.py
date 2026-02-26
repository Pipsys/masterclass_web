from typing import Annotated
from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict


class RegisterIn(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=72)]
    username: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=1, max_length=72)]


class RefreshIn(BaseModel):
    refresh_token: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str | None = None

    model_config = ConfigDict(from_attributes=True)
