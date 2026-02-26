# Masterclass Web

Это full-stack проект для обучения веб-разработке на реальном продукте.  
Приложение помогает организовывать рабочие пространства, доски и задачи в формате Kanban и таблиц.

Проект подходит для:
- учебных практикумов и мастер-классов;
- демонстрации архитектуры `React + FastAPI + PostgreSQL`;
- отработки командной работы с Docker.

## Возможности
- Регистрация, логин и обновление JWT-токена.
- Личные workspace для каждого пользователя.
- Доски внутри workspace (`kanban`/`table`).
- Задачи со статусами, позициями, сроками, метками и чеклистами.
- Кастомные поля для задач.
- Базовые health-эндпоинты API (`/healthz`, `/readyz`).

## Технологии
- Frontend: `React 18`, `Vite`, `Redux Toolkit`, `React Router`, `@dnd-kit`, `Axios`
- Backend: `FastAPI`, `SQLAlchemy (async)`, `Alembic`, `Pydantic Settings`
- Auth/Security: `python-jose`, `passlib`, JWT access/refresh tokens
- Database: `PostgreSQL 16`
- Infra: `Docker Compose`, `Nginx`

## Архитектура
```text
Browser -> Nginx (frontend:80) -> /api -> FastAPI (backend:8000) -> PostgreSQL (db:5432)
```

## Структура проекта
```text
backend/              # FastAPI, модели, роуты, миграции
frontend/             # React-приложение
docs/                 # учебные инструкции и задания
sql/                  # SQL-дампы БД для занятий
docker-compose.yml    # локальная инфраструктура
```

## Быстрый старт (Docker)
```powershell
cd d:\masterclass_web
docker compose up -d --build
docker compose ps
```

После запуска:
- Frontend: `http://localhost`
- Backend API docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/healthz`
- Readiness: `http://localhost:8000/readyz`

## Как перезапустить контейнеры
Перезапуск только backend:

```powershell
docker compose up -d --build backend
```

Перезапуск всех сервисов:

```powershell
docker compose down
docker compose up -d --build
```

Проверка статуса:

```powershell
docker compose ps
```

Логи backend:

```powershell
docker compose logs --tail=100 backend
```

## Импорт учебной БД
Импорт дампа в базу `masterclass_web`:

```powershell
cmd /c "docker compose -f d:\masterclass_web\docker-compose.yml exec -T db psql -U postgres -d masterclass_web < d:\masterclass_web\sql\masterclass_web_dump.sql"
```

## Материалы для мастер-класса
- `docs/MASTERCLASS_WORKSPACE_DELETE_TASK.md`
- `docs/STUDENT_SETUP_AND_RESTART_GUIDE.md`
- `docs/STUDENT_ONE_PAGE_PRINT.md`
