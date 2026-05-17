# timer-service

Timer Service is planned as a C++ low-level service for `game clock`, `shot clock` and future hardware remotes.

Planned responsibilities:

- keep time with C++ monotonic clock;
- apply generic counter actions: `start`, `stop`, `set`, `adjust`;
- expose clock snapshots for Node.js backend, UI and future MCU remotes;
- avoid match business rules, FIBA validation, score logic, database writes or event-log ownership.

Local commands from the repository root:

```bash
npm run nx -- run timer-service:test
npm run nx -- run timer-service:lint
npm run nx -- run timer-service:build
```

Current state: infrastructure skeleton only. Runtime implementation, tests and protocol details are intentionally deferred.

HTTP endpoints:

- `GET /healthz`
- `GET /snapshot`
- `POST /commands`

Example command:

```json
{
  "commands": [
    {
      "counter": "shot_clock",
      "action": "set",
      "valueMs": 14000
    }
  ]
}
```
