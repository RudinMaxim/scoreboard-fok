# Client

Unified frontend application for operator workflows, remotes and LED display output.

Planned route areas:

- `/control` - operator match panel and admin workflows;
- `/remote/timer` - timer remote;
- `/remote/score` - score remote;
- `/display` - LED scoreboard output;
- `/display/test` - LED test screen.

Planned internal layout:

- `src/features/control/` - operator panel and CRUD workflows;
- `src/features/display/` - LED display modes;
- `src/features/remotes/` - software remotes;
- `src/shared/ui/` - frontend-only UI primitives;
- `src/shared/api/` - API/WebSocket client code;
- `src/shared/state/` - frontend state management.

UI stays inside `apps/client` until there is a second frontend that needs to reuse it.
