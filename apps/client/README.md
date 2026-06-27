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

## MVP Prototype

The clickable MVP prototype lives in `apps/client/prototype/index.html` and works without a development server.

Open this file directly in a browser:

```text
apps/client/prototype/index.html
```

Use the left navigation to review the LED states, operator screens, timer and score remotes, and the complete flow overview. Run prototype checks with:

```bash
npm --prefix apps/client run prototype:check
```

This is a low/mid-fidelity prototype. It validates MVP screen coverage, information hierarchy, flows, and states; it is not the final visual design or a connected match-control application.
