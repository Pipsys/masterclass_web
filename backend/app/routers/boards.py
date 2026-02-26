from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import get_session
from app.core.deps import get_current_user
from app import models, schemas

router = APIRouter(prefix="/boards", tags=["boards"])


async def get_board_for_user(db: AsyncSession, board_id: int, user_id: int) -> models.Board | None:
    result = await db.execute(
        select(models.Board)
        .join(models.Workspace, models.Board.workspace_id == models.Workspace.id)
        .where(models.Board.id == board_id, models.Workspace.user_id == user_id)
    )
    return result.scalar_one_or_none()


@router.get("/{workspace_id}/", response_model=list[schemas.BoardOut])
async def list_boards(workspace_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(models.Board)
        .join(models.Workspace, models.Board.workspace_id == models.Workspace.id)
        .where(models.Board.workspace_id == workspace_id, models.Workspace.user_id == user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=schemas.BoardOut)
async def create_board(payload: schemas.BoardCreate, user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    workspace = await db.execute(
        select(models.Workspace).where(models.Workspace.id == payload.workspace_id, models.Workspace.user_id == user.id)
    )
    if not workspace.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    board = models.Board(
        workspace_id=payload.workspace_id,
        name=payload.name,
        type=payload.type,
        config=payload.config,
    )
    db.add(board)
    await db.commit()
    await db.refresh(board)
    return board


@router.put("/{board_id}", response_model=schemas.BoardOut)
async def update_board(
    board_id: int,
    payload: schemas.BoardUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    board = await get_board_for_user(db, board_id, user.id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

    if payload.name is not None:
        board.name = payload.name

    await db.commit()
    await db.refresh(board)
    return board


@router.delete("/{board_id}")
async def delete_board(
    board_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    board = await get_board_for_user(db, board_id, user.id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

    await db.delete(board)
    await db.commit()
    return {"status": "deleted"}


@router.get("/{board_id}/meta", response_model=schemas.BoardOut)
async def board_meta(board_id: int, user=Depends(get_current_user), db: AsyncSession = Depends(get_session)):
    board = await get_board_for_user(db, board_id, user.id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    return board


@router.put("/{board_id}/tasks/reorder")
async def reorder_tasks(
    board_id: int,
    payload: schemas.TaskReorderIn,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    board = await get_board_for_user(db, board_id, user.id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")

    for item in payload.items:
        await db.execute(
            update(models.Task)
            .where(models.Task.id == item.task_id, models.Task.board_id == board_id)
            .values(status=item.status, position=item.position)
        )

    await db.commit()
    return {"status": "ok"}
