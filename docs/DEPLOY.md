# Развертывание проекта на новом компьютере (быстрый и полный сценарий)

## Для кого этот файл
Инструкция для запуска `masterclass_web` на новом ПК с нуля:
- запуск всех контейнеров;
- импорт готовой БД или создание пустой БД;
- проверка, что все работает.


Проверка Docker:

```powershell
docker version
```

В выводе должны быть секции `Client` и `Server`.


## 2) Запустить контейнеры
```powershell
docker compose up -d --build
docker compose ps
```

Ожидаемо: сервисы `db`, `backend`, `frontend` со статусом `Up`/`healthy`.

## 3) Выбрать сценарий БД

## Вариант A: импорт готовой БД (рекомендуется для мастер-класса)
Проверьте, что дамп есть:

```powershell
Get-Item D:\masterclass_web\sql\masterclass_web_dump.sql
```

Если нужно очистить БД перед импортом:

```powershell
docker compose exec -T db psql -U postgres -d masterclass_web -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Импорт дампа:

```powershell
cmd /c "docker compose -f D:\masterclass_web\docker-compose.yml exec -T db psql -U postgres -d masterclass_web < D:\masterclass_web\sql\masterclass_web_dump.sql"
```

После импорта перезапустите backend:

```powershell
docker compose restart backend
```

## Вариант B: создать пустую БД и схему через миграции
Если дамп не нужен, примените миграции:

```powershell
docker compose exec backend alembic upgrade head
```

Проверка таблиц:

```powershell
docker compose exec -T db psql -U postgres -d masterclass_web -c "\dt"
```

## 4) Проверить, что проект доступен
Откройте:
- Frontend: `http://localhost`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/healthz`

Проверка статуса:

```powershell
docker compose ps
```

## 5) Как перезапускать проект после изменений
Пересобрать и перезапустить только backend:

```powershell
docker compose up -d --build backend
```

Перезапустить только frontend:

```powershell
docker compose up -d --build frontend
```

Перезапуск всех сервисов:

```powershell
docker compose down
docker compose up -d --build
```

## 6) Частые ошибки и быстрые решения
Ошибка `open //./pipe/dockerDesktopLinuxEngine ...`:
- Docker Desktop не запущен или нет доступа к Docker Engine.
- Запустите Docker Desktop и повторите команду.

Ошибка `backend is unhealthy`:
- Посмотрите логи:

```powershell
docker compose logs --tail=150 backend
```

Ошибка импорта `invalid byte sequence for encoding "UTF8": 0xff`:
- Дамп в UTF-16, нужен UTF-8.
- Конвертация:

```powershell
$src='D:\masterclass_web\sql\octopis_dump.sql'; $dst='D:\masterclass_web\sql\octopis_dump_utf8.sql'; $txt=Get-Content -Path $src -Raw -Encoding Unicode; [System.IO.File]::WriteAllText($dst,$txt,(New-Object System.Text.UTF8Encoding($false)))
```

И затем импортируйте `octopis_dump_utf8.sql`.

## 7) Быстрый чеклист для преподавателя
1. `docker compose ps` показывает `db`, `backend`, `frontend` в `Up`/`healthy`.
2. Открывается `http://localhost`.
3. Открывается `http://localhost:8000/docs`.
4. Логин/регистрация работают.
5. Workspace/доски/задачи создаются и удаляются.
