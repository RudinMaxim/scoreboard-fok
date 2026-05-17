# Процесс разработки

Этот репозиторий не публикует артефакты и не выполняет деплой из GitHub Actions. CI нужен как быстрый quality gate для разработки.

## Ветки

- `main` - стабильная ветка проекта.
- `develop` - основная ветка разработки.
- Рабочие ветки создаются от `develop` под конкретную задачу, если изменение не делается напрямую в локальной `develop`.

## Pull request flow

1. Обновить `develop`.
2. Создать рабочую ветку от `develop`.
3. Внести изменения и локально прогнать нужные проверки.
4. Открыть pull request в `develop`.
5. Смержить только после зеленого CI.
6. Переносить `develop` в `main` отдельным pull request, когда накоплен стабильный набор изменений.

## Локальные проверки

Перед pull request желательно запускать:

```bash
npm ci
npm run show:projects
npm run lint
npm run test
npm run build
docker compose config
```

Для инфраструктурных изменений в Docker дополнительно проверить нужные образы:

```bash
docker build -f apps/server/Dockerfile -t scoreboard-fok/server:ci .
docker build -f apps/client/Dockerfile -t scoreboard-fok/client:ci .
docker build -f apps/timer-service/Dockerfile --target runtime -t scoreboard-fok/timer-service:ci .
docker build -f apps/mcu-firmware/Dockerfile -t scoreboard-fok/mcu-firmware:ci .
```

## GitHub Actions

- `CI` устанавливает зависимости через `npm ci`, проверяет Nx-проекты, `lint`, `test` и `build`.
- `Docker Build` валидирует `docker compose config` и собирает Dockerfile всех приложений.
- Оба workflow запускаются на `push` и `pull_request` в `develop` и `main`.
- Workflow не используют secrets, registry, release и production environments.
