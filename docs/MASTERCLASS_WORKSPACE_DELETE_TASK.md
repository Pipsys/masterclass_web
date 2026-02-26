# Мастер-класс: починить удаление рабочего пространства

## Цель задания
Исправить удаление рабочего пространства на backend.

Сейчас удаление специально сломано для учебной задачи: при попытке удалить пространство сервер возвращает ошибку `500` с сообщением `MASTERCLASS: delete is disabled`.

## Где находится код
- Файл: `backend/app/routers/workspaces.py`
- Роут: `@router.delete("/{workspace_id}")`
- Функция: `delete_workspace(...)`

## Что именно нужно раскомментировать
Именно эти строки сейчас закомментированы:

```python
# table = workspace_table_name(workspace_id)
# await db.execute(text(f"DROP TABLE IF EXISTS {table}"))
# await db.delete(workspace)
# await db.commit()
#
# return {"status": "deleted"}
```

## Что нужно закомментировать или удалить
- Строка `113`:

```python
raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="MASTERCLASS: delete is disabled")
```

## Ожидаемый результат после исправления
После раскомментирования блока удаления и отключения `raise`:
- удаление пространства с фронтенда выполняется успешно;
- API `DELETE /workspaces/{workspace_id}` возвращает:

```json
{"status":"deleted"}
```

## Чек-лист для ученика
1. Открыть файл `backend/app/routers/workspaces.py`.
2. Найти блок `# MASTERCLASS TASK:`.
3. Раскомментировать строки `107`, `108`, `109`, `110`, `112`.
4. Убрать строку `113` с `raise HTTPException(...)`.
5. Сохранить файл.
6. Повторить удаление пространства в интерфейсе.