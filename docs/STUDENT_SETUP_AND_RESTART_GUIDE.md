# Инструкция для школьников: что менять в коде и как перезапускать Docker

## 1. Что у вас должно быть открыто
1. Откройте проект `d:\masterclass_web` в VS Code.
2. Откройте терминал PowerShell.
3. Убедитесь, что Docker Desktop запущен.

Проверка:

```powershell
docker version
```

Если в выводе нет секции `Server`, сначала запустите Docker Desktop.

## 2. Какой файл нужно изменить
Файл:

`backend/app/routers/workspaces.py`

Функция:

`delete_workspace(...)`

Найдите блок с комментарием `# MASTERCLASS TASK:`.

## 3. Что именно менять в коде
В этом блоке:
1. Уберите `#` у строк удаления.
2. Удалите или закомментируйте строку с `raise HTTPException(...)`.
3. Сохраните файл (`Ctrl+S`).

Должно получиться так:

```python
table = workspace_table_name(workspace_id)
await db.execute(text(f"DROP TABLE IF EXISTS {table}"))
await db.delete(workspace)
await db.commit()

return {"status": "deleted"}
```

И строки с ошибкой быть не должно:

```python
raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MASTERCLASS: delete is disabled")
```

## 4. Как перезапустить контейнер backend
Вариант А (если вы в корне проекта `d:\masterclass_web`):

```powershell
docker compose up -d --build backend
```

Вариант Б (если вы находитесь в `d:\masterclass_web\backend`):

```powershell
docker compose -f ..\docker-compose.yml up -d --build backend
```

## 5. Как проверить, что всё запустилось
Проверьте статус контейнеров:

```powershell
docker compose -f d:\masterclass_web\docker-compose.yml ps
```

Нужно, чтобы у `backend` было `healthy` или `Up`.

## 6. Если backend не запускается
Посмотреть последние логи:

```powershell
docker compose -f d:\masterclass_web\docker-compose.yml logs --tail=100 backend
```

Полный перезапуск всех сервисов:

```powershell
docker compose -f d:\masterclass_web\docker-compose.yml down
docker compose -f d:\masterclass_web\docker-compose.yml up -d --build
```

## 7. Быстрая проверка результата задания
1. Откройте сайт.
2. Удалите workspace.
3. Ошибки `MASTERCLASS: delete is disabled` больше быть не должно.
4. В API ожидаемый ответ:

```json
{"status":"deleted"}
```
