from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from app.core.deps import get_current_user
from app import models, schemas

router = APIRouter(prefix="/tasks", tags=["tasks"])


async def get_board_for_user(db: AsyncSession, board_id: int, user_id: int) -> models.Board | None:
    result = await db.execute(
        select(models.Board)
        .join(models.Workspace, models.Board.workspace_id == models.Workspace.id)
        .where(models.Board.id == board_id, models.Workspace.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def ensure_field_in_workspace(db: AsyncSession, field_id: int, workspace_id: int) -> bool:
    result = await db.execute(
        select(models.CustomFieldDefinition)
        .where(models.CustomFieldDefinition.id == field_id, models.CustomFieldDefinition.workspace_id == workspace_id)
    )
    return result.scalar_one_or_none() is not None


def task_to_schema(task: models.Task) -> schemas.TaskOut:
    custom_fields = [schemas.TaskDataOut(field_id=d.custom_field_definition_id, value=d.value) for d in task.data]
    return schemas.TaskOut(
        id=task.id,
        board_id=task.board_id,
        title=task.title,
        description=task.description,
        status=task.status,
        position=task.position,
        due_date=task.due_date,
        labels=task.labels,
        checklist=task.checklist,
        custom_fields=custom_fields,
    )


@router.get("/")
async def list_tasks(board_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    board = await get_board_for_user(db, board_id, user.id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

    result = await db.execute(
        select(models.Task).where(models.Task.board_id == board_id).options(selectinload(models.Task.data))
    )
    tasks = result.scalars().all()
    return [task_to_schema(t) for t in tasks]


@router.post("/", response_model=schemas.TaskOut)
async def create_task(
    payload: schemas.TaskCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    board = await get_board_for_user(db, payload.board_id, user.id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

    task = models.Task(
        board_id=payload.board_id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        position=payload.position or 0,
        due_date=payload.due_date,
        labels=payload.labels,
        checklist=payload.checklist,
    )
    db.add(task)
    await db.flush()

    if payload.custom_fields:
        for field_id, value in payload.custom_fields.items():
            if not await ensure_field_in_workspace(db, field_id, board.workspace_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid custom field")
            db.add(models.TaskData(task_id=task.id, custom_field_definition_id=field_id, value=value))

    await db.commit()
    result = await db.execute(
        select(models.Task).where(models.Task.id == task.id).options(selectinload(models.Task.data))
    )
    return task_to_schema(result.scalar_one())


@router.put("/{task_id}", response_model=schemas.TaskOut)
async def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(models.Task)
        .options(selectinload(models.Task.board))
        .join(models.Board, models.Task.board_id == models.Board.id)
        .join(models.Workspace, models.Board.workspace_id == models.Workspace.id)
        .where(models.Task.id == task_id, models.Workspace.user_id == user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.status is not None:
        task.status = payload.status
    if payload.position is not None:
        task.position = payload.position
    if payload.due_date is not None:
        task.due_date = payload.due_date
    if payload.labels is not None:
        task.labels = payload.labels
    if payload.checklist is not None:
        task.checklist = payload.checklist

    if payload.custom_fields is not None:
        for field_id, value in payload.custom_fields.items():
            if not await ensure_field_in_workspace(db, field_id, task.board.workspace_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid custom field")
            existing = await db.execute(
                select(models.TaskData).where(
                    models.TaskData.task_id == task.id,
                    models.TaskData.custom_field_definition_id == field_id,
                )
            )
            record = existing.scalar_one_or_none()
            if record:
                record.value = value
            else:
                db.add(models.TaskData(task_id=task.id, custom_field_definition_id=field_id, value=value))

    await db.commit()
    result = await db.execute(
        select(models.Task).where(models.Task.id == task.id).options(selectinload(models.Task.data))
    )
    return task_to_schema(result.scalar_one())


@router.delete("/{task_id}")
async def delete_task(task_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(models.Task)
        .join(models.Board, models.Task.board_id == models.Board.id)
        .join(models.Workspace, models.Board.workspace_id == models.Workspace.id)
        .where(models.Task.id == task_id, models.Workspace.user_id == user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await db.delete(task)
    await db.commit()
    return {"status": "deleted"}
