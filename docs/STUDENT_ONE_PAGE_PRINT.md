# MASTERCLASS: 1 страница (чеклист)

## 1. Открыть проект
```powershell
cd d:\masterclass_web
docker version
```

## 2. Изменить код
Файл: `backend/app/routers/workspaces.py`  
Функция: `delete_workspace(...)`

Оставить в функции этот блок:

```python
table = workspace_table_name(workspace_id)
await db.execute(text(f"DROP TABLE IF EXISTS {table}"))
await db.delete(workspace)
await db.commit()

return {"status": "deleted"}
```

Удалить/закомментировать строку:

```python
raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MASTERCLASS: delete is disabled")
```

Сохранить файл (`Ctrl+S`).

## 3. Перезапустить backend
Если терминал в `d:\masterclass_web`:

```powershell
docker compose up -d --build backend
```

Если терминал в `d:\masterclass_web\backend`:

```powershell
docker compose -f ..\docker-compose.yml up -d --build backend
```

## 4. Проверить контейнеры
```powershell
docker compose -f d:\masterclass_web\docker-compose.yml ps
```

Ожидаемо: `db`, `backend`, `frontend` в статусе `healthy` или `Up`.

## 5. Если ошибка
```powershell
docker compose -f d:\masterclass_web\docker-compose.yml logs --tail=100 backend
docker compose -f d:\masterclass_web\docker-compose.yml down
docker compose -f d:\masterclass_web\docker-compose.yml up -d --build
```

## 6. Проверка задания
1. Открыть сайт.
2. Удалить workspace.
3. Ошибки `MASTERCLASS: delete is disabled` быть не должно.
4. Ответ API: `{"status":"deleted"}`.
