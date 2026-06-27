# Match State Machine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать в `libs/domain` типизированную иерархическую state machine матча с независимыми состояниями игровых часов, guards и recovery-переходами.

**Architecture:** State machine реализуется как чистые TypeScript-функции без UI, HTTP, БД и внешней библиотеки. Корневой lifecycle и два clock regions хранятся отдельно, а `transitionMatch()` атомарно проверяет команду и возвращает новое immutable-состояние либо доменную ошибку.

**Tech Stack:** TypeScript, Node.js 24 native test runner, Nx command targets.

---

## File Map

- Create: `libs/domain/tsconfig.json` - сборка domain library.
- Modify: `libs/domain/package.json` - реальные build/test/lint scripts.
- Modify: `libs/domain/project.json` - Nx targets, вызывающие package scripts.
- Create: `libs/domain/src/match/state.ts` - типы lifecycle и clock regions.
- Create: `libs/domain/src/match/commands.ts` - discriminated union команд.
- Create: `libs/domain/src/match/errors.ts` - стабильные коды доменных ошибок.
- Create: `libs/domain/src/match/machine.ts` - переходы и guards.
- Create: `libs/domain/src/match/selectors.ts` - доступность действий для UI/read model.
- Create: `libs/domain/src/index.ts` - public exports.
- Create: `libs/domain/test/match-machine.test.mjs` - lifecycle и clock tests.
- Create: `libs/domain/test/match-guards.test.mjs` - guards, recovery и selectors.
- Modify: `libs/domain/README.md` - контракт state machine.

### Task 1: Activate Domain Build And Test Targets

**Files:**
- Modify: `libs/domain/package.json`
- Modify: `libs/domain/project.json`
- Create: `libs/domain/tsconfig.json`
- Create: `libs/domain/test/match-machine.test.mjs`

- [ ] **Step 1: Add a failing import test**

```js
// libs/domain/test/match-machine.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { createDraftMatchState } from "../src/index.ts";

test("creates a draft match state", () => {
  assert.deepEqual(createDraftMatchState(), { status: "draft" });
});
```

- [ ] **Step 2: Configure real scripts and TypeScript output**

```json
// libs/domain/package.json
{
  "name": "@scoreboard-fok/domain",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "node --test \"test/**/*.test.mjs\""
  }
}
```

```json
// libs/domain/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "noEmitOnError": true
  },
  "include": ["src/**/*.ts"]
}
```

Replace all three placeholder commands in `libs/domain/project.json`:

```json
"build": { "command": "npm --prefix libs/domain run build" },
"lint": { "command": "npm --prefix libs/domain run lint" },
"test": { "command": "npm --prefix libs/domain run test" }
```

- [ ] **Step 3: Run the test and verify RED**

Run: `npm --prefix libs/domain test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `libs/domain/src/index.ts`.

- [ ] **Step 4: Add the minimum state factory**

```ts
// libs/domain/src/match/state.ts
export type DraftMatchState = Readonly<{ status: "draft" }>;

export type MatchControlState = DraftMatchState;

export function createDraftMatchState(): DraftMatchState {
  return Object.freeze({ status: "draft" });
}
```

```ts
// libs/domain/src/index.ts
export * from "./match/state.js";
```

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm --prefix libs/domain test`

Expected: `1` test passes.

Run: `npm run nx -- run domain:build`

Expected: target succeeds and creates `libs/domain/dist`.

```bash
git add libs/domain/package.json libs/domain/project.json libs/domain/tsconfig.json libs/domain/src libs/domain/test
git commit -m "build(domain): activate TypeScript test targets"
```

### Task 2: Model Hierarchical Lifecycle Transitions

**Files:**
- Create: `libs/domain/src/match/commands.ts`
- Create: `libs/domain/src/match/errors.ts`
- Create: `libs/domain/src/match/machine.ts`
- Modify: `libs/domain/src/match/state.ts`
- Modify: `libs/domain/src/index.ts`
- Modify: `libs/domain/test/match-machine.test.mjs`

- [ ] **Step 1: Add failing lifecycle tests**

Append to `libs/domain/test/match-machine.test.mjs`:

```js
import { transitionMatch } from "../src/index.ts";

test("moves draft -> prepared -> active.pre_period", () => {
  const prepared = transitionMatch(createDraftMatchState(), { type: "match.prepare" });
  assert.equal(prepared.ok, true);
  assert.deepEqual(prepared.state, { status: "prepared" });

  const active = transitionMatch(prepared.state, { type: "match.activate" });
  assert.equal(active.ok, true);
  assert.equal(active.state.status, "active");
  assert.equal(active.state.phase, "pre_period");
});

test("rejects a lifecycle command from the wrong parent state", () => {
  const result = transitionMatch(createDraftMatchState(), { type: "period.start" });
  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "STATE_TRANSITION_NOT_ALLOWED",
      commandType: "period.start",
      statePath: "draft"
    }
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test libs/domain/test/match-machine.test.mjs`

Expected: FAIL because `transitionMatch` is not exported.

- [ ] **Step 3: Add lifecycle types, commands and transition result**

```ts
// libs/domain/src/match/state.ts
export type ClockRunState = "idle" | "stopped" | "running" | "expired";
export type ActivePhase = "pre_period" | "in_period" | "break";

export type ActiveMatchState = Readonly<{
  status: "active";
  phase: ActivePhase;
  gameClock: ClockRunState;
  shotClock: ClockRunState;
}>;

export type RestorableMatchState = Readonly<
  | { status: "draft" }
  | { status: "prepared" }
  | ActiveMatchState
  | { status: "finished" }
>;

export type MatchControlState =
  | RestorableMatchState
  | Readonly<{ status: "recovery"; resumeState: RestorableMatchState; reason: string }>
  | Readonly<{ status: "archived" }>;

export function createDraftMatchState(): MatchControlState {
  return Object.freeze({ status: "draft" });
}
```

```ts
// libs/domain/src/match/commands.ts
export type MatchCommand =
  | Readonly<{ type: "match.prepare" }>
  | Readonly<{ type: "match.activate" }>
  | Readonly<{ type: "period.start" }>
  | Readonly<{ type: "period.end"; overrideRunningClocks?: boolean }>
  | Readonly<{ type: "match.finish" }>
  | Readonly<{ type: "match.archive" }>
  | Readonly<{ type: "recovery.enter"; reason: string }>
  | Readonly<{ type: "recovery.resolve" }>;
```

```ts
// libs/domain/src/match/errors.ts
export type MatchStateError = Readonly<{
  code: "STATE_TRANSITION_NOT_ALLOWED";
  commandType: string;
  statePath: string;
}>;
```

- [ ] **Step 4: Implement the lifecycle transition table**

```ts
// libs/domain/src/match/machine.ts
import type { MatchCommand } from "./commands.js";
import type { MatchStateError } from "./errors.js";
import type { MatchControlState } from "./state.js";

export type MatchTransition =
  | Readonly<{ ok: true; state: MatchControlState }>
  | Readonly<{ ok: false; error: MatchStateError }>;

export function statePath(state: MatchControlState): string {
  return state.status === "active" ? `active.${state.phase}` : state.status;
}

function accepted(state: MatchControlState): MatchTransition {
  return { ok: true, state: Object.freeze(state) };
}

function rejected(state: MatchControlState, command: MatchCommand): MatchTransition {
  return {
    ok: false,
    error: {
      code: "STATE_TRANSITION_NOT_ALLOWED",
      commandType: command.type,
      statePath: statePath(state)
    }
  };
}

export function transitionMatch(state: MatchControlState, command: MatchCommand): MatchTransition {
  if (state.status === "draft" && command.type === "match.prepare") {
    return accepted({ status: "prepared" });
  }
  if (state.status === "prepared" && command.type === "match.activate") {
    return accepted({ status: "active", phase: "pre_period", gameClock: "stopped", shotClock: "idle" });
  }
  if (state.status === "active" && state.phase === "pre_period" && command.type === "period.start") {
    return accepted({ ...state, phase: "in_period", gameClock: "stopped", shotClock: "stopped" });
  }
  if (state.status === "active" && state.phase === "break" && command.type === "period.start") {
    return accepted({ ...state, phase: "in_period", gameClock: "stopped", shotClock: "stopped" });
  }
  if (state.status === "active" && command.type === "match.finish") {
    return accepted({ status: "finished" });
  }
  if (state.status === "finished" && command.type === "match.archive") {
    return accepted({ status: "archived" });
  }
  return rejected(state, command);
}
```

Export the new modules from `libs/domain/src/index.ts`.

- [ ] **Step 5: Verify and commit**

Run: `npm --prefix libs/domain test`

Expected: all lifecycle tests pass.

```bash
git add libs/domain/src libs/domain/test/match-machine.test.mjs
git commit -m "feat(domain): add match lifecycle machine"
```

### Task 3: Add Independent Game And Shot Clock Regions

**Files:**
- Modify: `libs/domain/src/match/commands.ts`
- Modify: `libs/domain/src/match/machine.ts`
- Modify: `libs/domain/test/match-machine.test.mjs`

- [ ] **Step 1: Add failing parallel-region tests**

```js
test("starts and stops clock regions independently", () => {
  const inPeriod = {
    status: "active",
    phase: "in_period",
    gameClock: "stopped",
    shotClock: "stopped"
  };
  const gameRunning = transitionMatch(inPeriod, { type: "game_clock.start" });
  assert.deepEqual(gameRunning.state, { ...inPeriod, gameClock: "running" });

  const shotRunning = transitionMatch(gameRunning.state, { type: "shot_clock.start" });
  assert.deepEqual(shotRunning.state, {
    ...inPeriod,
    gameClock: "running",
    shotClock: "running"
  });
});

test("does not start clocks outside active.in_period", () => {
  const result = transitionMatch(
    { status: "active", phase: "break", gameClock: "stopped", shotClock: "idle" },
    { type: "game_clock.start" }
  );
  assert.equal(result.ok, false);
});

test("does not start shot clock while game clock is stopped", () => {
  const result = transitionMatch(
    { status: "active", phase: "in_period", gameClock: "stopped", shotClock: "stopped" },
    { type: "shot_clock.start" }
  );
  assert.equal(result.ok, false);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test --test-name-pattern="clock" libs/domain/test/match-machine.test.mjs`

Expected: FAIL because clock commands are not part of `MatchCommand` and transitions are rejected.

- [ ] **Step 3: Add clock commands**

Extend `MatchCommand`:

```ts
| Readonly<{ type: "game_clock.start" | "game_clock.stop" | "game_clock.expire" }>
| Readonly<{ type: "shot_clock.start" | "shot_clock.stop" | "shot_clock.expire" | "shot_clock.reset" }>;
```

- [ ] **Step 4: Add clock transition helpers**

```ts
function transitionClocks(state: MatchControlState, command: MatchCommand): MatchTransition | null {
  if (state.status !== "active" || state.phase !== "in_period") return null;

  switch (command.type) {
    case "game_clock.start": return accepted({ ...state, gameClock: "running" });
    case "game_clock.stop": return accepted({ ...state, gameClock: "stopped" });
    case "game_clock.expire": return accepted({ ...state, gameClock: "expired" });
    case "shot_clock.start": return state.gameClock === "running"
      ? accepted({ ...state, shotClock: "running" })
      : rejected(state, command);
    case "shot_clock.stop": return accepted({ ...state, shotClock: "stopped" });
    case "shot_clock.expire": return accepted({ ...state, shotClock: "expired" });
    case "shot_clock.reset": return accepted({ ...state, shotClock: "stopped" });
    default: return null;
  }
}
```

Call `transitionClocks()` near the start of `transitionMatch()` and return its result when non-null.

- [ ] **Step 5: Verify and commit**

Run: `npm --prefix libs/domain test`

Expected: all tests pass.

```bash
git add libs/domain/src/match libs/domain/test/match-machine.test.mjs
git commit -m "feat(domain): add independent clock regions"
```

### Task 4: Add Period Guards And Recovery State

**Files:**
- Modify: `libs/domain/src/match/machine.ts`
- Create: `libs/domain/test/match-guards.test.mjs`

- [ ] **Step 1: Add failing period and recovery tests**

```js
// libs/domain/test/match-guards.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { transitionMatch } from "../src/index.ts";

const running = {
  status: "active",
  phase: "in_period",
  gameClock: "running",
  shotClock: "running"
};

test("period.end requires stopped clocks", () => {
  assert.equal(transitionMatch(running, { type: "period.end" }).ok, false);
  assert.deepEqual(
    transitionMatch(running, { type: "period.end", overrideRunningClocks: true }).state,
    { status: "active", phase: "break", gameClock: "stopped", shotClock: "idle" }
  );
});

test("recovery blocks ordinary commands until resolve", () => {
  const recovery = transitionMatch(running, {
    type: "recovery.enter",
    reason: "timer_sync_failed"
  });
  assert.equal(transitionMatch(recovery.state, { type: "game_clock.start" }).ok, false);
  assert.deepEqual(transitionMatch(recovery.state, { type: "recovery.resolve" }).state, running);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test libs/domain/test/match-guards.test.mjs`

Expected: FAIL because period end and recovery transitions are not implemented.

- [ ] **Step 3: Store the exact resume state**

Verify that the recovery variant stores only a `RestorableMatchState`:

```ts
| Readonly<{
    status: "recovery";
    resumeState: RestorableMatchState;
    reason: string;
  }>
```

- [ ] **Step 4: Implement guarded transitions**

Add before the fallback rejection in `transitionMatch()`:

```ts
if (command.type === "recovery.enter" && (state.status === "active" || state.status === "finished")) {
  return accepted({ status: "recovery", reason: command.reason, resumeState: state });
}
if (state.status === "recovery" && command.type === "recovery.resolve") {
  return accepted(state.resumeState);
}
if (state.status === "active" && state.phase === "in_period" && command.type === "period.end") {
  const stopped = state.gameClock !== "running" && state.shotClock !== "running";
  if (stopped || command.overrideRunningClocks === true) {
    return accepted({ status: "active", phase: "break", gameClock: "stopped", shotClock: "idle" });
  }
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm --prefix libs/domain test`

Expected: all state machine and guard tests pass.

```bash
git add libs/domain/src/match libs/domain/test/match-guards.test.mjs
git commit -m "feat(domain): guard periods and recovery"
```

### Task 5: Expose Action Availability For Clients And History

**Files:**
- Create: `libs/domain/src/match/selectors.ts`
- Modify: `libs/domain/src/index.ts`
- Modify: `libs/domain/test/match-guards.test.mjs`
- Modify: `libs/domain/README.md`

- [ ] **Step 1: Add failing selector tests**

```js
import { getCommandAvailability, getHistoryRestoreAvailability } from "../src/index.ts";

test("reports disabled reasons without changing state", () => {
  assert.deepEqual(
    getCommandAvailability({ status: "archived" }, { type: "history.undo" }),
    { allowed: false, reason: "STATE_TRANSITION_NOT_ALLOWED" }
  );
  assert.deepEqual(
    getCommandAvailability(running, { type: "score.add" }),
    { allowed: true }
  );
  assert.deepEqual(
    getHistoryRestoreAvailability(running, { status: "draft" }),
    { allowed: true }
  );
  assert.deepEqual(
    getCommandAvailability(
      { status: "recovery", reason: "timer", resumeState: running },
      { type: "recovery.resolve" }
    ),
    { allowed: true }
  );
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test libs/domain/test/match-guards.test.mjs`

Expected: FAIL because `getCommandAvailability` is not exported.

- [ ] **Step 3: Add non-transitioning guarded commands**

Extend `MatchCommand`:

```ts
| Readonly<{ type: "score.add" | "score.correct" | "foul.add" | "timeout.use" | "display_mode.set" }>
| Readonly<{ type: "history.undo" | "history.redo" }>;
```

- [ ] **Step 4: Implement the selector using the same guards**

```ts
// libs/domain/src/match/selectors.ts
import type { MatchCommand } from "./commands.js";
import type { MatchControlState, RestorableMatchState } from "./state.js";
import { transitionMatch } from "./machine.js";

export type CommandAvailability =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; reason: "STATE_TRANSITION_NOT_ALLOWED" }>;

export function getCommandAvailability(
  state: MatchControlState,
  command: MatchCommand
): CommandAvailability {
  if (state.status === "recovery" && command.type === "recovery.resolve") {
    return { allowed: true };
  }
  if (state.status === "archived" || state.status === "recovery") {
    return { allowed: false, reason: "STATE_TRANSITION_NOT_ALLOWED" };
  }
  if (command.type === "history.undo" || command.type === "history.redo") {
    return { allowed: true };
  }
  if (["score.add", "score.correct", "foul.add", "timeout.use"].includes(command.type)) {
    return state.status === "active"
      ? { allowed: true }
      : { allowed: false, reason: "STATE_TRANSITION_NOT_ALLOWED" };
  }
  if (command.type === "display_mode.set") {
    return state.status === "prepared" || state.status === "active" || state.status === "finished"
      ? { allowed: true }
      : { allowed: false, reason: "STATE_TRANSITION_NOT_ALLOWED" };
  }
  const transition = transitionMatch(state, command);
  return transition.ok
    ? { allowed: true }
    : { allowed: false, reason: "STATE_TRANSITION_NOT_ALLOWED" };
}

export function getHistoryRestoreAvailability(
  current: MatchControlState,
  _target: RestorableMatchState
): CommandAvailability {
  const commandAvailability = getCommandAvailability(current, { type: "history.undo" });
  if (!commandAvailability.allowed) {
    return { allowed: false, reason: "STATE_TRANSITION_NOT_ALLOWED" };
  }
  return { allowed: true };
}
```

Export the selector and document that backend is authoritative while clients may use the selector only for disabled-state hints.

- [ ] **Step 5: Run full verification and commit**

Run: `npm run nx -- run domain:lint`

Expected: TypeScript exits `0`.

Run: `npm run nx -- run domain:test`

Expected: all domain tests pass.

Run: `npm run nx -- run domain:build`

Expected: build exits `0`.

```bash
git add libs/domain/src libs/domain/test libs/domain/README.md
git commit -m "feat(domain): expose match command guards"
```

## Completion Gate

- Every root and nested state from the design spec has a tested transition.
- Game clock and shot clock can change independently only inside `active.in_period`.
- Invalid parent-state transitions return `STATE_TRANSITION_NOT_ALLOWED` without mutation.
- Recovery stores and restores the exact resumable control state.
- `getCommandAvailability()` and `transitionMatch()` share the same domain rules.
- `npm run nx -- run domain:lint`, `domain:test` and `domain:build` all exit `0`.
