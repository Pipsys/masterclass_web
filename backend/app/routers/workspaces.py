from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import json

from app.db.session import get_session
from app.core.deps import get_current_user
from app import models, schemas

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


def workspace_table_name(workspace_id: int) -> str:
    return f"workspace_{workspace_id}_records"


async def create_workspace_storage(db: AsyncSession, workspace_id: int) -> None:
    table = workspace_table_name(workspace_id)
    sql = f"""
    CREATE TABLE IF NOT EXISTS {table} (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        data JSONB
    )
    """
    await db.execute(text(sql))


@router.get("/", response_model=list[schemas.WorkspaceOut])
async def list_workspaces(user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(models.Workspace).where(models.Workspace.user_id == user.id))
    return result.scalars().all()


@router.get("/{workspace_id}", response_model=schemas.WorkspaceOut)
async def get_workspace(
    workspace_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return workspace


@router.post("/", response_model=schemas.WorkspaceOut)
async def create_workspace(
    payload: schemas.WorkspaceCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    workspace = models.Workspace(user_id=user.id, name=payload.name, description=payload.description)
    db.add(workspace)
    await db.flush()
    await create_workspace_storage(db, workspace.id)
    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.put("/{workspace_id}", response_model=schemas.WorkspaceOut)
async def update_workspace(
    workspace_id: int,
    payload: schemas.WorkspaceUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    if payload.name is not None:
        workspace.name = payload.name
    if payload.description is not None:
        workspace.description = payload.description

    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    # MASTERCLASS TASK:
    # 1) Раскомментируйте 4 строки ниже, чтобы включить настоящее удаление.
    # 2) Закомментируйте/удалите строку raise ниже.
    #
    # table = workspace_table_name(workspace_id)
    # await db.execute(text(f"DROP TABLE IF EXISTS {table}"))
    # await db.delete(workspace)
    # await db.commit()
    #
    # return {"status": "deleted"}
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MASTERCLASS: delete is disabled")


@router.get("/{workspace_id}/fields", response_model=list[schemas.CustomFieldOut])
async def list_fields(
    workspace_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    fields = await db.execute(
        select(models.CustomFieldDefinition).where(models.CustomFieldDefinition.workspace_id == workspace_id)
    )
    return fields.scalars().all()


@router.post("/{workspace_id}/fields", response_model=schemas.CustomFieldOut)
async def add_field(
    workspace_id: int,
    payload: schemas.CustomFieldCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    field = models.CustomFieldDefinition(
        workspace_id=workspace_id,
        name=payload.name,
        field_type=payload.field_type,
        is_required=payload.is_required,
    )
    db.add(field)
    await db.commit()
    await db.refresh(field)
    return field


@router.get("/{workspace_id}/records", response_model=list[schemas.WorkspaceRecordOut])
async def list_records(
    workspace_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    table = workspace_table_name(workspace_id)
    rows = await db.execute(text(f"SELECT id, data, created_at FROM {table} ORDER BY id DESC"))
    return [dict(row) for row in rows.mappings().all()]


@router.post("/{workspace_id}/records", response_model=schemas.WorkspaceRecordOut)
async def create_record(
    workspace_id: int,
    payload: schemas.WorkspaceRecordCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    table = workspace_table_name(workspace_id)
    insert = text(
        f"""
        INSERT INTO {table} (data)
        VALUES (:data)
        RETURNING id, data, created_at
        """
    )
    row = await db.execute(insert, {"data": json.dumps(payload.data)})
    await db.commit()
    return dict(row.mappings().first())


@router.put("/{workspace_id}/records/{record_id}", response_model=schemas.WorkspaceRecordOut)
async def update_record(
    workspace_id: int,
    record_id: int,
    payload: schemas.WorkspaceRecordUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    table = workspace_table_name(workspace_id)
    update = text(
        f"""
        UPDATE {table}
        SET data = :data, updated_at = NOW()
        WHERE id = :record_id
        RETURNING id, data, created_at
        """
    )
    row = await db.execute(update, {"data": json.dumps(payload.data), "record_id": record_id})
    await db.commit()
    updated = row.mappings().first()
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return dict(updated)


@router.delete("/{workspace_id}/records/{record_id}")
async def delete_record(
    workspace_id: int,
    record_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    table = workspace_table_name(workspace_id)
    deleted = await db.execute(text(f"DELETE FROM {table} WHERE id = :record_id"), {"record_id": record_id})
    await db.commit()
    return {"deleted": deleted.rowcount or 0}


@router.delete("/{workspace_id}/records")
async def delete_records(
    workspace_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Workspace).where(models.Workspace.id == workspace_id, models.Workspace.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    table = workspace_table_name(workspace_id)
    deleted = await db.execute(text(f"DELETE FROM {table}"))
    await db.commit()
    return {"deleted": deleted.rowcount or 0}
