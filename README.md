# scoreboard-fok

Монорепозиторий программно-аппаратного комплекса «Электронное баскетбольное табло».

## Структура

- `apps/timer-service/` - C++-сервис точного времени: game clock, shot clock, monotonic timing.
- `apps/mcu-firmware/` - C++-каркас прошивки будущих аппаратных пультов.
- `apps/server/` - серверная часть: API, WebSocket, бизнес-логика, БД, журнал событий.
- `apps/client/` - единый frontend: операторская панель, программные пульты и LED-display режимы.
- `libs/domain/` - общая доменная модель и чистые правила.
- `libs/contracts/` - контракты REST/WebSocket/Timer Service/MCU.
- `docs/` - ТЗ и проектная документация.
- `infrastructure/` - production compose, пример окружения и инфраструктурные инструкции.
- `tools/` - служебные скрипты репозитория.

## Nx

Требования для разработки:

- Node.js `>=24.12.0`
- npm `>=11.6.2`
- C++ toolchain for future `apps/timer-service` and `apps/mcu-firmware` implementations. Current low-level targets are infrastructure placeholders.

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

Текущие цели `build`, `test` и `lint` являются стартовыми placeholder-командами. Они проверяют, что Nx видит структуру монорепозитория; реальные сборки и тесты нужно заменить при выборе стеков для приложений и библиотек.

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

- `apps/timer-service/Dockerfile`
- `apps/mcu-firmware/Dockerfile`
- `apps/server/Dockerfile`
- `apps/client/Dockerfile`

Корневой `docker-compose.yml` используется для локального запуска. Production compose в `infrastructure/docker-compose.prod.yml` использует те же Dockerfile через `build`.
