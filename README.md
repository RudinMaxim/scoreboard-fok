# scoreboard-fok

Монорепозиторий программно-аппаратного комплекса «Электронное баскетбольное табло».

## Структура

- `apps/server/` - серверная часть: API, WebSocket, таймеры, БД, журнал событий.
- `apps/client-display/` - клиент вывода табло на LED-экран через HDMI/VP410.
- `apps/client-control/` - операторские экраны и программные пульты.
- `docs/` - ТЗ и проектная документация.
- `infrastructure/` - production compose, пример окружения и инфраструктурные инструкции.
- `tools/` - служебные скрипты репозитория.

## Nx

Требования для разработки:

- Node.js `>=24.12.0`
- npm `>=11.6.2`

Установка зависимостей:

```bash
npm install
```

Проверка проектов:

```bash
npm run show:projects
```

Запуск целей для всех проектов:

```bash
npm run build
npm run test
npm run lint
```

Сброс локального кэша Nx:

```bash
npm run nx:reset
```

Граф проектов:

```bash
npm run graph
```

Текущие цели `build`, `test` и `lint` являются стартовыми placeholder-командами. Они проверяют, что Nx видит структуру монорепозитория; реальные сборки и тесты нужно заменить при выборе стеков для `server`, `client-display` и `client-control`.

## Документация

Техническое задание находится в `docs/ТЗ_«Электронное_баскетбольное_табло».md`.

## Docker

Локальный запуск:

```bash
copy .env.example .env
docker compose up -d --build
```

Production-заготовка:

```bash
copy .env.example .env
docker compose --env-file .env -f infrastructure/docker-compose.prod.yml up -d --build
```

В каждом приложении есть `Dockerfile` под будущую сборку:

- `apps/server/Dockerfile`
- `apps/client-display/Dockerfile`
- `apps/client-control/Dockerfile`

Корневой `docker-compose.yml` используется для локального запуска. Production compose в `infrastructure/docker-compose.prod.yml` использует те же Dockerfile через `build`.
