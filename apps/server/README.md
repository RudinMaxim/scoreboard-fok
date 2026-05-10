# Server

Серверная часть комплекса электронного баскетбольного табло.

Планируемая зона ответственности:

- единая точка правды состояния матча;
- API и WebSocket для экранов и пультов;
- high-resolution game clock и shot clock;
- локальная реляционная БД;
- append-only журнал событий матча.

## Docker

`Dockerfile` в этой директории является заготовкой production-образа `scoreboard-fok/server`.
Основной compose находится в `infrastructure/docker-compose.prod.yml`.
