# Match History And Snapshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать полные снимки всех подтверждённых действий, линейные `Undo/Redo`, SQLite persistence и синхронизацию восстановленного времени с Timer Service.

**Architecture:** Чистый history engine живёт в `libs/domain` и не знает о БД или HTTP. Node.js backend сохраняет immutable snapshots, actions, cursor и outbox в одной SQLite-транзакции; Timer Service синхронизируется после commit, а REST публикует рабочий snapshot только после подтверждения остановленных часов.

**Tech Stack:** TypeScript, Node.js 24 native test runner, built-in `node:sqlite` with WAL, built-in `node:http`, Nx.

**Dependency:** Сначала выполнить `docs/superpowers/plans/2026-06-27-match-state-machine-implementation.md`.

**Runtime reference:** Node.js 24 `node:sqlite` is stable and provides `DatabaseSync`, prepared statements and explicit transactions: `https://nodejs.org/download/release/v24.9.0/docs/api/sqlite.html`.

---

## File Map

- Create: `libs/domain/src/history/types.ts` - snapshot, action, policy and history types.
- Create: `libs/domain/src/history/errors.ts` - history error codes.
- Create: `libs/domain/src/history/policy.ts` - default policy copied at match preparation.
- Create: `libs/domain/src/history/engine.ts` - record, undo, redo and branch invalidation.
- Modify: `libs/domain/src/index.ts` - public history exports.
- Create: `libs/domain/test/history-record.test.mjs` - initial and per-action snapshots.
- Create: `libs/domain/test/history-navigation.test.mjs` - undo, redo and branch behavior.
- Create: `libs/domain/test/fixtures/history-builders.mjs` - deterministic history test inputs.
- Create: `libs/contracts/tsconfig.json` - contracts build.
- Create: `libs/contracts/src/history.ts` - REST DTOs and error codes.
- Create: `libs/contracts/src/index.ts` - public exports.
- Modify: `libs/contracts/package.json` - scripts and exports.
- Modify: `libs/contracts/project.json` - real Nx targets.
- Create: `apps/server/tsconfig.json` - server build.
- Modify: `apps/server/package.json` - scripts, workspace dependencies and exports.
- Modify: `apps/server/project.json` - real Nx targets.
- Create: `apps/server/src/history/migrations.ts` - SQLite schema.
- Create: `apps/server/src/history/sqlite-history-repository.ts` - transactional persistence.
- Create: `apps/server/src/history/history-service.ts` - application orchestration.
- Create: `apps/server/src/history/timer-restore-port.ts` - Timer Service interface and HTTP adapter.
- Create: `apps/server/src/history/snapshot-publisher.ts` - WebSocket/publication port.
- Create: `apps/server/src/history/history-controller.ts` - transport-neutral REST mapping.
- Create: `apps/server/src/http/history-routes.ts` - Node HTTP routes.
- Create: `apps/server/src/index.ts` - server exports.
- Create: `apps/server/test/sqlite-history-repository.test.mjs` - ACID and concurrency tests.
- Create: `apps/server/test/fixtures/sqlite-history-fixture.mjs` - initial rows, mutations and row counters.
- Create: `apps/server/test/history-service.test.mjs` - outbox and Timer Service tests.
- Create: `apps/server/test/history-routes.test.mjs` - endpoint tests.
- Create: `apps/server/test/fixtures/history-service-fixture.mjs` - deterministic repository/timer doubles.
- Create: `apps/server/test/fixtures/history-http-fixture.mjs` - ephemeral HTTP server fixture.
- Modify: `libs/domain/README.md` - history engine contract.
- Modify: `apps/server/README.md` - storage and recovery commands.

### Task 1: Define Full Match Snapshots And Frozen Policy

**Files:**
- Create: `libs/domain/src/history/types.ts`
- Create: `libs/domain/src/history/errors.ts`
- Create: `libs/domain/src/history/policy.ts`
- Modify: `libs/domain/src/index.ts`
- Create: `libs/domain/test/history-record.test.mjs`

- [ ] **Step 1: Add failing initial-snapshot tests**

```js
// libs/domain/test/history-record.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_REVERSIBLE_ACTION_TYPES,
  createMatchHistory
} from "../src/index.ts";

const initialState = {
  control: { status: "prepared" },
  period: 1,
  teams: {
    home: { score: 0, fouls: 0, timeoutsUsed: 0 },
    away: { score: 0, fouls: 0, timeoutsUsed: 0 }
  },
  players: {},
  possession: null,
  gameClock: { remainingMs: 600000, running: false, timerVersion: 0 },
  shotClock: { remainingMs: 24000, running: false, timerVersion: 0 },
  displayMode: "warmup"
};

test("creates sequence-zero snapshot and freezes match policy", () => {
  const configured = [...DEFAULT_REVERSIBLE_ACTION_TYPES];
  const history = createMatchHistory({
    matchId: "match-1",
    snapshotId: "snapshot-0",
    createdAt: "2026-06-27T10:00:00.000Z",
    initialState,
    reversibleActionTypes: configured
  });

  configured.length = 0;
  assert.equal(history.currentSnapshot.sequence, 0);
  assert.equal(history.currentSnapshot.stateVersion, 0);
  assert.deepEqual(history.policy.reversibleActionTypes, DEFAULT_REVERSIBLE_ACTION_TYPES);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test libs/domain/test/history-record.test.mjs`

Expected: FAIL because history exports do not exist.

- [ ] **Step 3: Define snapshot and action types**

```ts
// libs/domain/src/history/types.ts
import type { MatchControlState } from "../match/state.js";

export type Side = "home" | "away";
export type OperatorActionType =
  | "match.prepare" | "match.activate" | "period.start" | "period.end" | "match.finish"
  | "score.add" | "score.correct" | "foul.add" | "timeout.use"
  | "game_clock.start" | "game_clock.stop" | "game_clock.set"
  | "shot_clock.start" | "shot_clock.stop" | "shot_clock.reset"
  | "display_mode.set";

export type SystemActionType = "system.timer_sync_failed" | "system.timer_sync_confirmed";

export type CounterSnapshot = Readonly<{
  remainingMs: number;
  running: boolean;
  timerVersion: number;
}>;

export type MatchRuntimeState = Readonly<{
  control: MatchControlState;
  period: number;
  teams: Readonly<Record<Side, Readonly<{ score: number; fouls: number; timeoutsUsed: number }>>>;
  players: Readonly<Record<string, Readonly<{ points: number; fouls: number }>>>;
  possession: Side | null;
  gameClock: CounterSnapshot;
  shotClock: CounterSnapshot;
  displayMode: string;
}>;

export type MatchStateSnapshot = Readonly<{
  id: string;
  matchId: string;
  sequence: number;
  stateVersion: number;
  policyVersion: number;
  createdAt: string;
  state: MatchRuntimeState;
}>;

export type HistoryAction = Readonly<{
  id: string;
  matchId: string;
  sequence: number;
  actionType: OperatorActionType | SystemActionType | "history.undo" | "history.redo";
  source: "control" | "timer_remote" | "score_remote" | "system";
  operatorId: string | null;
  clientCommandId: string;
  eventId: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  snapshotBeforeId: string;
  snapshotAfterId: string;
  reversible: boolean;
  targetActionId: string | null;
  createdAt: string;
}>;

export type MatchHistoryPolicy = Readonly<{
  version: number;
  reversibleActionTypes: readonly OperatorActionType[];
}>;

export type MatchHistory = Readonly<{
  matchId: string;
  policy: MatchHistoryPolicy;
  currentSnapshot: MatchStateSnapshot;
  snapshots: readonly MatchStateSnapshot[];
  actions: readonly HistoryAction[];
  activeActionIds: readonly string[];
  redoActionIds: readonly string[];
  redoInvalidated: boolean;
}>;
```

```ts
// libs/domain/src/history/errors.ts
export type HistoryErrorCode =
  | "STATE_VERSION_CONFLICT"
  | "REDO_BRANCH_INVALIDATED"
  | "ACTION_NOT_REVERSIBLE"
  | "STATE_TRANSITION_NOT_ALLOWED"
  | "HISTORY_EMPTY";

export type HistoryError = Readonly<{ code: HistoryErrorCode; message: string }>;
```

- [ ] **Step 4: Implement policy copying and initial snapshot**

```ts
// libs/domain/src/history/policy.ts
import type { OperatorActionType } from "./types.js";

export const DEFAULT_REVERSIBLE_ACTION_TYPES: readonly OperatorActionType[] = Object.freeze([
  "match.prepare", "match.activate", "period.start", "period.end", "match.finish",
  "score.add", "score.correct", "foul.add", "timeout.use",
  "game_clock.start", "game_clock.stop", "game_clock.set",
  "shot_clock.start", "shot_clock.stop", "shot_clock.reset", "display_mode.set"
]);
```

```ts
// libs/domain/src/history/engine.ts
import type { MatchHistory, MatchRuntimeState, OperatorActionType } from "./types.js";

function freezeClone<T>(value: T): T {
  const clone = structuredClone(value);
  const freeze = (item: unknown): void => {
    if (!item || typeof item !== "object" || Object.isFrozen(item)) return;
    for (const child of Object.values(item as Record<string, unknown>)) freeze(child);
    Object.freeze(item);
  };
  freeze(clone);
  return clone;
}

export function createMatchHistory(input: Readonly<{
  matchId: string;
  snapshotId: string;
  createdAt: string;
  initialState: MatchRuntimeState;
  reversibleActionTypes: readonly OperatorActionType[];
}>): MatchHistory {
  const policy = Object.freeze({
    version: 1,
    reversibleActionTypes: Object.freeze([...input.reversibleActionTypes])
  });
  const currentSnapshot = Object.freeze({
    id: input.snapshotId,
    matchId: input.matchId,
    sequence: 0,
    stateVersion: 0,
    policyVersion: policy.version,
    createdAt: input.createdAt,
    state: freezeClone(input.initialState)
  });
  return Object.freeze({
    matchId: input.matchId,
    policy,
    currentSnapshot,
    snapshots: Object.freeze([currentSnapshot]),
    actions: Object.freeze([]),
    activeActionIds: Object.freeze([]),
    redoActionIds: Object.freeze([]),
    redoInvalidated: false
  });
}
```

Export all history modules from `libs/domain/src/index.ts`.

- [ ] **Step 5: Verify and commit**

Run: `npm --prefix libs/domain test`

Expected: initial snapshot test passes with all existing domain tests.

```bash
git add libs/domain/src/history libs/domain/src/index.ts libs/domain/test/history-record.test.mjs
git commit -m "feat(domain): define match history snapshots"
```

### Task 2: Record Every Confirmed Operator Action

**Files:**
- Modify: `libs/domain/src/history/engine.ts`
- Modify: `libs/domain/test/history-record.test.mjs`

- [ ] **Step 1: Add a failing per-action snapshot test**

```js
import { recordHistoryAction } from "../src/index.ts";

test("records one immutable snapshot after an accepted action", () => {
  const history = createMatchHistory({
    matchId: "match-1", snapshotId: "snapshot-0", createdAt: "t0",
    initialState, reversibleActionTypes: DEFAULT_REVERSIBLE_ACTION_TYPES
  });
  const result = recordHistoryAction(history, {
    actionId: "action-1", snapshotId: "snapshot-1", eventId: "event-1",
    actionType: "score.add", source: "score_remote", operatorId: "operator-1",
    clientCommandId: "command-1", expectedStateVersion: 0, createdAt: "t1",
    nextState: {
      ...initialState,
      teams: { ...initialState.teams, home: { ...initialState.teams.home, score: 2 } }
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.history.snapshots.length, 2);
  assert.equal(result.action.snapshotBeforeId, "snapshot-0");
  assert.equal(result.action.snapshotAfterId, "snapshot-1");
  assert.equal(result.history.currentSnapshot.state.teams.home.score, 2);
  assert.equal(history.currentSnapshot.state.teams.home.score, 0);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test --test-name-pattern="records one" libs/domain/test/history-record.test.mjs`

Expected: FAIL because `recordHistoryAction` is missing.

- [ ] **Step 3: Define the mutation result**

```ts
export type HistoryMutation =
  | Readonly<{ ok: true; history: MatchHistory; action: HistoryAction; snapshot: MatchStateSnapshot }>
  | Readonly<{ ok: false; error: HistoryError }>;
```

- [ ] **Step 4: Implement normal action recording**

```ts
export function recordHistoryAction(
  history: MatchHistory,
  input: Readonly<{
    actionId: string; snapshotId: string; eventId: string;
    actionType: OperatorActionType; source: HistoryAction["source"];
    operatorId: string | null; clientCommandId: string;
    expectedStateVersion: number; createdAt: string; nextState: MatchRuntimeState;
  }>
): HistoryMutation {
  if (input.expectedStateVersion !== history.currentSnapshot.stateVersion) {
    return { ok: false, error: { code: "STATE_VERSION_CONFLICT", message: "Stale match state version" } };
  }
  const snapshot = Object.freeze({
    id: input.snapshotId,
    matchId: history.matchId,
    sequence: history.snapshots.length,
    stateVersion: history.currentSnapshot.stateVersion + 1,
    policyVersion: history.policy.version,
    createdAt: input.createdAt,
    state: freezeClone(input.nextState)
  });
  const reversible = history.policy.reversibleActionTypes.includes(input.actionType);
  const action = Object.freeze({
    id: input.actionId, matchId: history.matchId, sequence: history.actions.length + 1,
    actionType: input.actionType, source: input.source, operatorId: input.operatorId,
    clientCommandId: input.clientCommandId, eventId: input.eventId,
    stateVersionBefore: history.currentSnapshot.stateVersion,
    stateVersionAfter: snapshot.stateVersion,
    snapshotBeforeId: history.currentSnapshot.id, snapshotAfterId: snapshot.id,
    reversible, targetActionId: null, createdAt: input.createdAt
  });
  const nextHistory = Object.freeze({
    ...history,
    currentSnapshot: snapshot,
    snapshots: Object.freeze([...history.snapshots, snapshot]),
    actions: Object.freeze([...history.actions, action]),
    activeActionIds: Object.freeze([...history.activeActionIds, action.id]),
    redoActionIds: Object.freeze([]),
    redoInvalidated: history.redoActionIds.length > 0
  });
  return { ok: true, history: nextHistory, action, snapshot };
}
```

- [ ] **Step 5: Verify branch clearing and commit**

Add an assertion that a normal action always returns `redoActionIds: []`, then run:

Run: `npm --prefix libs/domain test`

Expected: all domain tests pass.

```bash
git add libs/domain/src/history libs/domain/test/history-record.test.mjs
git commit -m "feat(domain): snapshot confirmed actions"
```

### Task 3: Implement Multi-Step Undo And Redo

**Files:**
- Modify: `libs/domain/src/history/engine.ts`
- Create: `libs/domain/test/history-navigation.test.mjs`

- [ ] **Step 1: Add failing undo/redo tests**

Create the deterministic fixture first:

```js
// libs/domain/test/fixtures/history-builders.mjs
import {
  DEFAULT_REVERSIBLE_ACTION_TYPES,
  createMatchHistory
} from "../../src/index.ts";

export const initialState = Object.freeze({
  control: { status: "active", phase: "in_period", gameClock: "running", shotClock: "running" },
  period: 1,
  teams: {
    home: { score: 0, fouls: 0, timeoutsUsed: 0 },
    away: { score: 0, fouls: 0, timeoutsUsed: 0 }
  },
  players: {}, possession: null,
  gameClock: { remainingMs: 300000, running: true, timerVersion: 10 },
  shotClock: { remainingMs: 14000, running: true, timerVersion: 10 },
  displayMode: "game"
});

export function scoreAction(actionId, snapshotId, score, expectedStateVersion = 0) {
  return {
    actionId, snapshotId, eventId: `event-${actionId}`, actionType: "score.add",
    source: "score_remote", operatorId: "operator-1",
    clientCommandId: `command-${actionId}`, expectedStateVersion, createdAt: `time-${actionId}`,
    nextState: {
      ...structuredClone(initialState),
      teams: { ...initialState.teams, home: { ...initialState.teams.home, score } }
    }
  };
}

export function navCommand(clientCommandId, snapshotId, expectedStateVersion) {
  return {
    actionId: `action-${clientCommandId}`, snapshotId,
    eventId: `event-${clientCommandId}`, clientCommandId,
    operatorId: "operator-1", expectedStateVersion, createdAt: `time-${clientCommandId}`
  };
}

export function historyWithPolicyExcluding(actionType) {
  return createMatchHistory({
    matchId: "match-1", snapshotId: "s0", createdAt: "t0", initialState,
    reversibleActionTypes: DEFAULT_REVERSIBLE_ACTION_TYPES.filter((item) => item !== actionType)
  });
}

export function periodEndAction() {
  return {
    ...scoreAction("period-end", "period-end-snapshot", 0),
    actionType: "period.end"
  };
}
```

```js
// libs/domain/test/history-navigation.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_REVERSIBLE_ACTION_TYPES, createMatchHistory,
  recordHistoryAction, undoHistory, redoHistory
} from "../src/index.ts";

import {
  initialState, navCommand, scoreAction
} from "./fixtures/history-builders.mjs";

test("undo restores before-state with both clocks stopped and redo reapplies after-state", () => {
  const base = createMatchHistory({
    matchId: "match-1", snapshotId: "s0", createdAt: "t0",
    initialState, reversibleActionTypes: DEFAULT_REVERSIBLE_ACTION_TYPES
  });
  const recorded = recordHistoryAction(base, scoreAction("a1", "s1", 2));
  const undone = undoHistory(recorded.history, navCommand("undo-1", "s2", 1));
  assert.equal(undone.history.currentSnapshot.state.teams.home.score, 0);
  assert.equal(undone.history.currentSnapshot.state.gameClock.running, false);
  assert.equal(undone.history.currentSnapshot.state.shotClock.running, false);
  assert.deepEqual(undone.history.redoActionIds, ["a1"]);

  const redone = redoHistory(undone.history, navCommand("redo-1", "s3", 2));
  assert.equal(redone.history.currentSnapshot.state.teams.home.score, 2);
  assert.deepEqual(redone.history.redoActionIds, []);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test libs/domain/test/history-navigation.test.mjs`

Expected: FAIL because navigation functions are missing.

- [ ] **Step 3: Add safe snapshot and lookup helpers**

```ts
function byId<T extends { id: string }>(items: readonly T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`History invariant failed: ${id}`);
  return item;
}

function stoppedState(state: MatchRuntimeState): MatchRuntimeState {
  return freezeClone({
    ...state,
    gameClock: { ...state.gameClock, running: false },
    shotClock: { ...state.shotClock, running: false }
  });
}
```

- [ ] **Step 4: Implement navigation with audit actions excluded from stacks**

Implement `undoHistory()` and `redoHistory()` with this shared input:

```ts
export type HistoryNavigationInput = Readonly<{
  actionId: string; snapshotId: string; eventId: string;
  clientCommandId: string; operatorId: string;
  expectedStateVersion: number; createdAt: string;
}>;
```

Required algorithm for `undoHistory()`:

```ts
if (input.expectedStateVersion !== history.currentSnapshot.stateVersion) {
  return historyFailure("STATE_VERSION_CONFLICT", "Stale match state version");
}
const targetId = history.activeActionIds.at(-1);
if (!targetId) return historyFailure("HISTORY_EMPTY", "Nothing to undo");
const target = byId(history.actions, targetId);
if (!target.reversible) return historyFailure("ACTION_NOT_REVERSIBLE", target.actionType);
const restored = stoppedState(byId(history.snapshots, target.snapshotBeforeId).state);
if (restored.control.status === "recovery" || restored.control.status === "archived") {
  return historyFailure("STATE_TRANSITION_NOT_ALLOWED", target.actionType);
}
if (!getHistoryRestoreAvailability(history.currentSnapshot.state.control, restored.control).allowed) {
  return historyFailure("STATE_TRANSITION_NOT_ALLOWED", target.actionType);
}
return appendNavigationMutation(history, input, "history.undo", target, restored, {
  activeActionIds: history.activeActionIds.slice(0, -1),
  redoActionIds: [...history.redoActionIds, target.id],
  redoInvalidated: false
});
```

Required algorithm for `redoHistory()`:

```ts
if (input.expectedStateVersion !== history.currentSnapshot.stateVersion) {
  return historyFailure("STATE_VERSION_CONFLICT", "Stale match state version");
}
const targetId = history.redoActionIds.at(-1);
if (!targetId && history.redoInvalidated) {
  return historyFailure("REDO_BRANCH_INVALIDATED", "A new action closed the redo branch");
}
if (!targetId) return historyFailure("HISTORY_EMPTY", "Nothing to redo");
const target = byId(history.actions, targetId);
const restored = stoppedState(byId(history.snapshots, target.snapshotAfterId).state);
if (restored.control.status === "recovery" || restored.control.status === "archived") {
  return historyFailure("STATE_TRANSITION_NOT_ALLOWED", target.actionType);
}
if (!getHistoryRestoreAvailability(history.currentSnapshot.state.control, restored.control).allowed) {
  return historyFailure("STATE_TRANSITION_NOT_ALLOWED", target.actionType);
}
return appendNavigationMutation(history, input, "history.redo", target, restored, {
  activeActionIds: [...history.activeActionIds, target.id],
  redoActionIds: history.redoActionIds.slice(0, -1),
  redoInvalidated: false
});
```

`appendNavigationMutation()` must create a new action and snapshot, increment `stateVersion`, set `targetActionId`, and must not append its own action id to `activeActionIds`.

- [ ] **Step 5: Add multi-step and branch tests, verify and commit**

Append:

```js
test("supports two undo steps and two redo steps", () => {
  const base = createMatchHistory({
    matchId: "match-1", snapshotId: "s0", createdAt: "t0",
    initialState, reversibleActionTypes: DEFAULT_REVERSIBLE_ACTION_TYPES
  });
  const one = recordHistoryAction(base, scoreAction("a1", "s1", 2, 0));
  const two = recordHistoryAction(one.history, scoreAction("a2", "s2", 4, 1));
  const undoTwo = undoHistory(two.history, navCommand("u2", "s3", 2));
  const undoOne = undoHistory(undoTwo.history, navCommand("u1", "s4", 3));
  assert.equal(undoOne.history.currentSnapshot.state.teams.home.score, 0);
  const redoOne = redoHistory(undoOne.history, navCommand("r1", "s5", 4));
  const redoTwo = redoHistory(redoOne.history, navCommand("r2", "s6", 5));
  assert.equal(redoTwo.history.currentSnapshot.state.teams.home.score, 4);
});

test("a new action closes the complete redo branch", () => {
  const base = createMatchHistory({
    matchId: "match-1", snapshotId: "s0", createdAt: "t0",
    initialState, reversibleActionTypes: DEFAULT_REVERSIBLE_ACTION_TYPES
  });
  const one = recordHistoryAction(base, scoreAction("a1", "s1", 2, 0));
  const undone = undoHistory(one.history, navCommand("u1", "s2", 1));
  const branch = recordHistoryAction(undone.history, scoreAction("a2", "s3", 3, 2));
  const redo = redoHistory(branch.history, navCommand("r1", "s4", 3));
  assert.equal(redo.ok, false);
  assert.equal(redo.error.code, "REDO_BRANCH_INVALIDATED");
});
```

Run: `npm --prefix libs/domain test`

Expected: all history and state machine tests pass.

```bash
git add libs/domain/src/history libs/domain/test/history-navigation.test.mjs libs/domain/test/fixtures
git commit -m "feat(domain): add linear undo redo history"
```

### Task 4: Add History Availability And Stable Contracts

**Files:**
- Modify: `libs/domain/src/history/engine.ts`
- Create: `libs/contracts/tsconfig.json`
- Create: `libs/contracts/src/history.ts`
- Create: `libs/contracts/src/index.ts`
- Modify: `libs/contracts/package.json`
- Modify: `libs/contracts/project.json`
- Modify: `libs/domain/test/history-navigation.test.mjs`

- [ ] **Step 1: Add failing availability tests**

```js
import { getHistoryAvailability } from "../src/index.ts";
import * as historyBuilders from "./fixtures/history-builders.mjs";

test("disables undo for a non-reversible last action", () => {
  const { historyWithPolicyExcluding, periodEndAction } = historyBuilders;
  const history = historyWithPolicyExcluding("period.end");
  const recorded = recordHistoryAction(history, periodEndAction());
  assert.deepEqual(getHistoryAvailability(recorded.history), {
    canUndo: false,
    canRedo: false,
    undoReason: "ACTION_NOT_REVERSIBLE",
    redoReason: "HISTORY_EMPTY",
    nextUndoAction: "period.end",
    nextRedoAction: null
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test --test-name-pattern="availability" libs/domain/test/history-navigation.test.mjs`

Expected: FAIL because the selector is missing.

- [ ] **Step 3: Implement the pure availability selector**

```ts
export function getHistoryAvailability(history: MatchHistory) {
  const undoId = history.activeActionIds.at(-1) ?? null;
  const redoId = history.redoActionIds.at(-1) ?? null;
  const undo = undoId ? byId(history.actions, undoId) : null;
  const redo = redoId ? byId(history.actions, redoId) : null;
  const stateAllowed = getCommandAvailability(
    history.currentSnapshot.state.control,
    { type: "history.undo" }
  ).allowed;
  return Object.freeze({
    canUndo: stateAllowed && undo?.reversible === true,
    canRedo: stateAllowed && redo !== null,
    undoReason: !stateAllowed
      ? "STATE_TRANSITION_NOT_ALLOWED"
      : undo ? (undo.reversible ? null : "ACTION_NOT_REVERSIBLE") : "HISTORY_EMPTY",
    redoReason: !stateAllowed
      ? "STATE_TRANSITION_NOT_ALLOWED"
      : redo ? null : history.redoInvalidated ? "REDO_BRANCH_INVALIDATED" : "HISTORY_EMPTY",
    nextUndoAction: undo?.actionType ?? null,
    nextRedoAction: redo?.actionType ?? null
  });
}
```

- [ ] **Step 4: Bootstrap contracts and define DTOs**

```json
// libs/contracts/package.json
{
  "name": "@scoreboard-fok/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "node --test \"test/**/*.test.mjs\""
  }
}
```

```json
// libs/contracts/tsconfig.json
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

Replace the three targets in `libs/contracts/project.json` with:

```json
"build": { "command": "npm --prefix libs/contracts run build" },
"lint": { "command": "npm --prefix libs/contracts run lint" },
"test": { "command": "npm --prefix libs/contracts run test" }
```

```ts
// libs/contracts/src/history.ts
export type HistoryCommandDto = Readonly<{
  clientCommandId: string;
  expectedStateVersion: number;
}>;

export type HistoryAvailabilityDto = Readonly<{
  canUndo: boolean;
  canRedo: boolean;
  undoReason: string | null;
  redoReason: string | null;
  nextUndoAction: string | null;
  nextRedoAction: string | null;
}>;

export type HistoryCommandResultDto = Readonly<{
  actionId: string;
  eventId: string;
  stateVersion: number;
  timerSyncStatus: "confirmed" | "pending";
  snapshot: unknown;
  history: HistoryAvailabilityDto;
}>;

export type HistoryApiErrorCode =
  | "STATE_VERSION_CONFLICT" | "REDO_BRANCH_INVALIDATED"
  | "ACTION_NOT_REVERSIBLE" | "STATE_TRANSITION_NOT_ALLOWED"
  | "HISTORY_EMPTY" | "TIMER_RESTORE_FAILED";
```

```ts
// libs/contracts/src/index.ts
export * from "./history.js";
```

- [ ] **Step 5: Verify libraries and commit**

Run: `npm run nx -- run domain:test`

Run: `npm run nx -- run contracts:lint`

Run: `npm run nx -- run contracts:build`

Expected: all commands exit `0`.

```bash
git add libs/domain libs/contracts
git commit -m "feat(contracts): define match history commands"
```

### Task 5: Add SQLite WAL Schema And Transactional Repository

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `apps/server/package.json`
- Modify: `apps/server/project.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/history/migrations.ts`
- Create: `apps/server/src/history/sqlite-history-repository.ts`
- Create: `apps/server/src/index.ts`
- Create: `apps/server/test/sqlite-history-repository.test.mjs`

- [ ] **Step 1: Install Node type definitions and configure server targets**

Run: `npm install -D @types/node@^24`

Expected: root `package.json` and `package-lock.json` contain `@types/node`.

Configure server scripts:

```json
// apps/server/package.json
{
  "name": "@scoreboard-fok/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./dist/index.js" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "tsc -p tsconfig.json --noEmit",
    "test": "npm --prefix ../../libs/domain run build && npm --prefix ../../libs/contracts run build && node --test \"test/**/*.test.mjs\""
  },
  "dependencies": {
    "@scoreboard-fok/contracts": "0.1.0",
    "@scoreboard-fok/domain": "0.1.0"
  }
}
```

```json
// apps/server/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "noEmitOnError": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

Replace the three targets in `apps/server/project.json` with:

```json
"build": { "command": "npm --prefix apps/server run build" },
"lint": { "command": "npm --prefix apps/server run lint" },
"test": { "command": "npm --prefix apps/server run test" }
```

Add to `libs/domain/package.json`:

```json
"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }
```

Run: `npm install`

Expected: workspace links and `package-lock.json` include the new package metadata.

- [ ] **Step 2: Add a failing atomicity test**

```js
// apps/server/test/sqlite-history-repository.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { migrateHistoryDatabase, SqliteMatchHistoryRepository } from "../src/index.ts";

test("commits snapshot action cursor and outbox atomically", () => {
  const db = new DatabaseSync(":memory:");
  migrateHistoryDatabase(db);
  const repository = new SqliteMatchHistoryRepository(db);
  repository.insertInitialHistory(initialHistoryFixture());
  repository.commitMutation(mutationFixture(), timerOutboxFixture());

  assert.equal(db.prepare("SELECT count(*) AS count FROM match_state_snapshot").get().count, 2);
  assert.equal(db.prepare("SELECT count(*) AS count FROM match_event").get().count, 1);
  assert.equal(db.prepare("SELECT count(*) AS count FROM match_action").get().count, 1);
  assert.equal(db.prepare("SELECT count(*) AS count FROM history_outbox").get().count, 1);
});
```

- [ ] **Step 3: Run and verify RED**

Run: `npm --prefix apps/server test`

Expected: FAIL because repository exports are missing.

- [ ] **Step 4: Add the schema and repository transaction**

```ts
// apps/server/src/history/migrations.ts
import type { DatabaseSync } from "node:sqlite";

export function migrateHistoryDatabase(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS match_history_policy (
      match_id TEXT PRIMARY KEY, version INTEGER NOT NULL,
      reversible_action_types_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS match_state_snapshot (
      id TEXT PRIMARY KEY, match_id TEXT NOT NULL, sequence INTEGER NOT NULL,
      state_version INTEGER NOT NULL, policy_version INTEGER NOT NULL,
      payload_json TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(match_id, sequence), UNIQUE(match_id, state_version)
    );
    CREATE TABLE IF NOT EXISTS match_event (
      id TEXT PRIMARY KEY, match_id TEXT NOT NULL, sequence INTEGER NOT NULL,
      event_type TEXT NOT NULL, reverted_event_id TEXT,
      payload_json TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(match_id, sequence)
    );
    CREATE TABLE IF NOT EXISTS match_action (
      id TEXT PRIMARY KEY, match_id TEXT NOT NULL, sequence INTEGER NOT NULL,
      action_type TEXT NOT NULL, source TEXT NOT NULL, operator_id TEXT,
      client_command_id TEXT NOT NULL, event_id TEXT NOT NULL,
      state_version_before INTEGER NOT NULL, state_version_after INTEGER NOT NULL,
      snapshot_before_id TEXT NOT NULL, snapshot_after_id TEXT NOT NULL,
      reversible INTEGER NOT NULL, target_action_id TEXT, created_at TEXT NOT NULL,
      UNIQUE(match_id, sequence), UNIQUE(match_id, client_command_id)
    );
    CREATE TABLE IF NOT EXISTS match_history_cursor (
      match_id TEXT PRIMARY KEY, current_snapshot_id TEXT NOT NULL,
      state_version INTEGER NOT NULL, active_action_ids_json TEXT NOT NULL,
      redo_action_ids_json TEXT NOT NULL, redo_invalidated INTEGER NOT NULL,
      timer_sync_status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS history_outbox (
      id TEXT PRIMARY KEY, match_id TEXT NOT NULL, kind TEXT NOT NULL,
      payload_json TEXT NOT NULL, status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
  `);
}
```

Add repository input types and the transaction boundary:

```ts
// apps/server/src/history/sqlite-history-repository.ts
import { DatabaseSync } from "node:sqlite";
import type { HistoryAction, MatchHistory, MatchStateSnapshot } from "@scoreboard-fok/domain";

export type HistoryCursorWrite = Readonly<{
  matchId: string; currentSnapshotId: string; stateVersion: number;
  activeActionIds: readonly string[]; redoActionIds: readonly string[];
  redoInvalidated: boolean; timerSyncStatus: "confirmed" | "pending";
}>;

export type PersistedHistoryMutation = Readonly<{
  action: HistoryAction;
  snapshot: MatchStateSnapshot;
  cursor: HistoryCursorWrite;
  event: Readonly<{
    id: string; matchId: string; sequence: number; eventType: string;
    revertedEventId: string | null; payload: unknown; createdAt: string;
  }>;
}>;

export type TimerOutboxWrite = Readonly<{
  id: string; matchId: string; payload: unknown; createdAt: string;
}>;

export class SqliteMatchHistoryRepository {
  constructor(private readonly db: DatabaseSync) {}

  commitMutation(mutation: PersistedHistoryMutation, outbox: TimerOutboxWrite | null): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const row = this.db.prepare(
        "SELECT state_version FROM match_history_cursor WHERE match_id = ?"
      ).get(mutation.action.matchId) as { state_version: number } | undefined;
      if (!row || row.state_version !== mutation.action.stateVersionBefore) {
        throw Object.assign(new Error("Stale match state version"), { code: "STATE_VERSION_CONFLICT" });
      }
      this.db.prepare(
        "INSERT INTO match_event VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        mutation.event.id, mutation.event.matchId, mutation.event.sequence,
        mutation.event.eventType, mutation.event.revertedEventId,
        JSON.stringify(mutation.event.payload), mutation.event.createdAt
      );
      this.db.prepare(
        "INSERT INTO match_state_snapshot VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        mutation.snapshot.id, mutation.snapshot.matchId, mutation.snapshot.sequence,
        mutation.snapshot.stateVersion, mutation.snapshot.policyVersion,
        JSON.stringify(mutation.snapshot.state), mutation.snapshot.createdAt
      );
      this.db.prepare(
        `INSERT INTO match_action (
          id, match_id, sequence, action_type, source, operator_id,
          client_command_id, event_id, state_version_before, state_version_after,
          snapshot_before_id, snapshot_after_id, reversible, target_action_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        mutation.action.id, mutation.action.matchId, mutation.action.sequence,
        mutation.action.actionType, mutation.action.source, mutation.action.operatorId,
        mutation.action.clientCommandId, mutation.action.eventId,
        mutation.action.stateVersionBefore, mutation.action.stateVersionAfter,
        mutation.action.snapshotBeforeId, mutation.action.snapshotAfterId,
        mutation.action.reversible ? 1 : 0, mutation.action.targetActionId,
        mutation.action.createdAt
      );
      this.db.prepare(
        `UPDATE match_history_cursor SET current_snapshot_id = ?, state_version = ?,
         active_action_ids_json = ?, redo_action_ids_json = ?, redo_invalidated = ?,
         timer_sync_status = ? WHERE match_id = ?`
      ).run(
        mutation.cursor.currentSnapshotId, mutation.cursor.stateVersion,
        JSON.stringify(mutation.cursor.activeActionIds), JSON.stringify(mutation.cursor.redoActionIds),
        mutation.cursor.redoInvalidated ? 1 : 0, mutation.cursor.timerSyncStatus,
        mutation.cursor.matchId
      );
      if (outbox) {
        this.db.prepare(
          "INSERT INTO history_outbox VALUES (?, ?, 'timer.restore', ?, 'pending', 0, ?)"
        ).run(outbox.id, outbox.matchId, JSON.stringify(outbox.payload), outbox.createdAt);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
```

For `history.undo`, `match_event.reverted_event_id` points to the target action event. For `history.redo`, the payload contains both the original event id and the undo event id without editing either event. Add repository methods `insertInitialHistory()`, `load(matchId)`, `findByClientCommandId()`, `getCursor()`, `listPendingOutbox()` and `markOutboxConfirmed()` using prepared statements and the JSON field mapping shown above.

- [ ] **Step 5: Add stale-version rollback test, verify and commit**

```js
test("rolls back every table on stale stateVersion", () => {
  const db = new DatabaseSync(":memory:");
  migrateHistoryDatabase(db);
  const repository = new SqliteMatchHistoryRepository(db);
  repository.insertInitialHistory(initialHistoryFixture());
  const mutation = mutationFixture();
  repository.commitMutation(mutation, timerOutboxFixture());
  const before = tableCounts(db);

  assert.throws(
    () => repository.commitMutation({ ...mutation, action: { ...mutation.action, id: "other" } }, {
      ...timerOutboxFixture(), id: "other-outbox"
    }),
    { code: "STATE_VERSION_CONFLICT" }
  );
  assert.deepEqual(tableCounts(db), before);
});
```

Define `tableCounts(db)` in the fixture module to return counts for `match_event`, `match_state_snapshot`, `match_action`, `match_history_cursor` and `history_outbox`.

Run: `npm --prefix apps/server test`

Expected: repository tests pass.

```bash
git add package.json package-lock.json apps/server libs/domain/package.json libs/contracts/package.json
git commit -m "feat(server): persist match history in sqlite"
```

### Task 6: Add Idempotent History Service And Timer Outbox

**Files:**
- Create: `apps/server/src/history/timer-restore-port.ts`
- Create: `apps/server/src/history/history-service.ts`
- Modify: `apps/server/src/history/sqlite-history-repository.ts`
- Modify: `apps/server/src/index.ts`
- Create: `apps/server/test/history-service.test.mjs`

- [ ] **Step 1: Add failing service tests**

```js
// apps/server/test/history-service.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { createHistoryServiceFixture } from "./fixtures/history-service-fixture.mjs";

test("undo returns only after Timer Service confirms stopped clocks", async () => {
  const fixture = createHistoryServiceFixture({ timerResult: "confirmed" });
  const result = await fixture.service.undo({
    matchId: "match-1", clientCommandId: "undo-1",
    expectedStateVersion: 1, operatorId: "operator-1"
  });
  assert.equal(result.timerSyncStatus, "confirmed");
  assert.equal(result.snapshot.state.gameClock.running, false);
  assert.equal(fixture.timer.calls.length, 1);
  assert.equal(fixture.publisher.calls.length, 1);
});

test("failed restore stays pending and blocks new history commands", async () => {
  const fixture = createHistoryServiceFixture({ timerResult: "failed" });
  await assert.rejects(() => fixture.service.undo(undoCommand()), { code: "TIMER_RESTORE_FAILED" });
  assert.equal(fixture.repository.getCursor("match-1").timerSyncStatus, "pending");
  assert.equal(fixture.publisher.calls.length, 0);
  await assert.rejects(() => fixture.service.redo(redoCommand()), { code: "STATE_TRANSITION_NOT_ALLOWED" });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test apps/server/test/history-service.test.mjs`

Expected: FAIL because `HistoryService` is missing.

- [ ] **Step 3: Define the Timer Service port and adapter**

```ts
// apps/server/src/history/timer-restore-port.ts
import type { CounterSnapshot } from "@scoreboard-fok/domain";

export interface TimerRestorePort {
  restore(input: Readonly<{
    operationId: string;
    matchId: string;
    gameClock: CounterSnapshot;
    shotClock: CounterSnapshot;
  }>): Promise<Readonly<{ timerVersion: number }>>;
}

export class HttpTimerRestoreAdapter implements TimerRestorePort {
  constructor(private readonly baseUrl: string) {}

  async restore(input: Parameters<TimerRestorePort["restore"]>[0]) {
    const response = await fetch(`${this.baseUrl}/restore`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": input.operationId },
      body: JSON.stringify(input)
    });
    if (!response.ok) throw Object.assign(new Error("Timer restore failed"), { code: "TIMER_RESTORE_FAILED" });
    return await response.json() as { timerVersion: number };
  }
}
```

- [ ] **Step 4: Implement service orchestration and idempotency**

`HistoryService.undo/redo` must:

1. Return the stored command result when `(matchId, clientCommandId)` already exists.
2. Reject while cursor `timerSyncStatus` is `pending`.
3. Load history and call the pure domain function.
4. Commit action, snapshot, cursor and `timer.restore` outbox row atomically.
5. Call `TimerRestorePort.restore()` with both clocks stopped.
6. Mark outbox and cursor `confirmed`, then return the command result.
7. On restore failure leave outbox/cursor `pending`, enter recovery through the domain state machine, append a non-navigable `system.timer_sync_failed` action/snapshot, and throw `TIMER_RESTORE_FAILED`.

Add `recordSystemHistoryAction()` beside `recordHistoryAction()`. It accepts only `SystemActionType`, creates an immutable audit action and snapshot, preserves `activeActionIds`, `redoActionIds` and `redoInvalidated`, and always sets `reversible: false`. Use it after this transition:

```ts
const recovery = transitionMatch(current.state.control, {
  type: "recovery.enter",
  reason: "timer_sync_failed"
});
if (!recovery.ok) throw Object.assign(new Error(recovery.error.code), recovery.error);
const recoveryState = { ...current.state, control: recovery.state };
```

When an outbox retry succeeds, resolve the stored recovery state with `recovery.resolve`, append `system.timer_sync_confirmed` through the same helper, mark outbox/cursor `confirmed`, and publish that final snapshot. Neither system action enters undo or redo stacks.

Use injected `idFactory` and `clock` ports so tests use deterministic IDs and timestamps.

```ts
// apps/server/src/history/snapshot-publisher.ts
import type { MatchStateSnapshot } from "@scoreboard-fok/domain";

export interface MatchSnapshotPublisher {
  publish(snapshot: MatchStateSnapshot): Promise<void>;
}
```

Use this service shape so command idempotency stays above the pure engine:

```ts
// apps/server/src/history/history-service.ts
import { redoHistory, undoHistory } from "@scoreboard-fok/domain";
import type { MatchStateSnapshot } from "@scoreboard-fok/domain";
import {
  SqliteMatchHistoryRepository,
  type StoredHistoryCommand
} from "./sqlite-history-repository.js";
import type { TimerRestorePort } from "./timer-restore-port.js";
import type { MatchSnapshotPublisher } from "./snapshot-publisher.js";

export type HistoryServiceCommand = Readonly<{
  matchId: string; clientCommandId: string;
  expectedStateVersion: number; operatorId: string;
}>;

export class HistoryService {
  constructor(
    private readonly repository: SqliteMatchHistoryRepository,
    private readonly timer: TimerRestorePort,
    private readonly publisher: MatchSnapshotPublisher,
    private readonly nextId: (prefix: string) => string,
    private readonly now: () => string
  ) {}

  undo(command: HistoryServiceCommand) { return this.execute("undo", command); }
  redo(command: HistoryServiceCommand) { return this.execute("redo", command); }

  private async execute(kind: "undo" | "redo", command: HistoryServiceCommand) {
    const duplicate = this.repository.findByClientCommandId(command.matchId, command.clientCommandId);
    if (duplicate) return this.retryOrReturn(duplicate);
    const history = this.repository.load(command.matchId);
    if (this.repository.getCursor(command.matchId).timerSyncStatus === "pending") {
      throw Object.assign(new Error("Timer synchronization is pending"), {
        code: "STATE_TRANSITION_NOT_ALLOWED"
      });
    }
    const input = {
      actionId: this.nextId("action"), snapshotId: this.nextId("snapshot"),
      eventId: this.nextId("event"), clientCommandId: command.clientCommandId,
      operatorId: command.operatorId, expectedStateVersion: command.expectedStateVersion,
      createdAt: this.now()
    };
    const mutation = kind === "undo" ? undoHistory(history, input) : redoHistory(history, input);
    if (!mutation.ok) throw Object.assign(new Error(mutation.error.message), mutation.error);
    const outboxId = this.nextId("outbox");
    this.repository.commitDomainMutation(mutation, {
      id: outboxId, matchId: command.matchId,
      payload: this.timerPayload(mutation.snapshot, outboxId), createdAt: this.now()
    });
    const stored = this.repository.findByClientCommandId(command.matchId, command.clientCommandId);
    if (!stored) throw new Error("Committed history command was not found");
    return this.retryOrReturn(stored);
  }

  private async retryOrReturn(stored: StoredHistoryCommand) {
    if (stored.timerSyncStatus === "confirmed") return stored.result;
    try {
      const restored = await this.timer.restore(stored.timerPayload);
      const result = this.repository.confirmTimerRestore(stored, restored.timerVersion, this.now());
      await this.publisher.publish(result.snapshot);
      return result;
    } catch (cause) {
      this.repository.enterTimerRecovery(stored, this.nextId, this.now());
      throw Object.assign(new Error("Timer restore failed", { cause }), {
        code: "TIMER_RESTORE_FAILED"
      });
    }
  }

  private timerPayload(snapshot: MatchStateSnapshot, operationId: string) {
    return {
      operationId,
      matchId: snapshot.matchId,
      gameClock: snapshot.state.gameClock,
      shotClock: snapshot.state.shotClock
    };
  }
}
```

Define `StoredHistoryCommand` in the repository module with the persisted action, current snapshot, outbox payload, sync status and API result. `commitDomainMutation()` converts the domain mutation to `PersistedHistoryMutation`; `enterTimerRecovery()` and `confirmTimerRestore()` append the two non-navigable system actions described above. Both methods are idempotent by outbox id: repeated failures do not append another failure action, and repeated confirmations return the stored confirmed result.

- [ ] **Step 5: Test retry without duplicate rows and commit**

Add a test where the first restore fails and the outbox retry succeeds. Assert one `history.undo` action, one pending outbox row, exactly one `system.timer_sync_failed`, exactly one `system.timer_sync_confirmed`, unchanged navigation stacks during both system actions, and final `timerSyncStatus = confirmed`.

Run: `npm --prefix apps/server test`

Expected: repository and service tests pass.

```bash
git add apps/server/src/history apps/server/test/history-service.test.mjs apps/server/test/fixtures
git commit -m "feat(server): coordinate history with timer restore"
```

### Task 7: Expose Undo And Redo REST Commands

**Files:**
- Create: `apps/server/src/history/history-controller.ts`
- Create: `apps/server/src/http/history-routes.ts`
- Modify: `apps/server/src/index.ts`
- Create: `apps/server/test/history-routes.test.mjs`

- [ ] **Step 1: Add failing HTTP tests**

```js
// apps/server/test/history-routes.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { startHistoryTestServer } from "./fixtures/history-http-fixture.mjs";

test("POST /history/undo returns confirmed snapshot and availability", async (t) => {
  const fixture = await startHistoryTestServer();
  t.after(() => fixture.close());
  const response = await fetch(`${fixture.url}/api/v1/matches/match-1/history/undo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ clientCommandId: "undo-1", expectedStateVersion: 1 })
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.timerSyncStatus, "confirmed");
  assert.equal(body.history.canRedo, true);
});

test("maps stale stateVersion to 409", async (t) => {
  const fixture = await startHistoryTestServer();
  t.after(() => fixture.close());
  const response = await fixture.post("undo", { clientCommandId: "undo-stale", expectedStateVersion: 0 });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "STATE_VERSION_CONFLICT");
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test apps/server/test/history-routes.test.mjs`

Expected: FAIL because routes are missing.

- [ ] **Step 3: Implement transport-neutral status mapping**

```ts
// apps/server/src/history/history-controller.ts
const STATUS_BY_CODE: Readonly<Record<string, number>> = {
  STATE_VERSION_CONFLICT: 409,
  REDO_BRANCH_INVALIDATED: 409,
  ACTION_NOT_REVERSIBLE: 422,
  STATE_TRANSITION_NOT_ALLOWED: 422,
  HISTORY_EMPTY: 422,
  TIMER_RESTORE_FAILED: 503
};

export function historyErrorResponse(error: unknown) {
  const code = typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "INTERNAL_ERROR";
  return {
    status: STATUS_BY_CODE[code] ?? 500,
    body: { code, message: error instanceof Error ? error.message : "Unexpected error" }
  };
}
```

- [ ] **Step 4: Implement exact routes and JSON validation**

```ts
// apps/server/src/http/history-routes.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import type { HistoryCommandDto } from "@scoreboard-fok/contracts";
import { historyErrorResponse } from "../history/history-controller.js";

type HistoryCommandService = Readonly<{
  undo(input: HistoryCommandDto & { matchId: string; operatorId: string }): Promise<unknown>;
  redo(input: HistoryCommandDto & { matchId: string; operatorId: string }): Promise<unknown>;
}>;

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function validCommand(value: unknown): value is HistoryCommandDto {
  return typeof value === "object" && value !== null
    && "clientCommandId" in value && typeof value.clientCommandId === "string"
    && value.clientCommandId.length > 0
    && "expectedStateVersion" in value && typeof value.expectedStateVersion === "number"
    && Number.isInteger(value.expectedStateVersion);
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export function createHistoryRequestHandler(
  service: HistoryCommandService,
  operatorFromRequest: (request: IncomingMessage) => string
) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const match = request.url?.match(/^\/api\/v1\/matches\/([^/]+)\/history\/(undo|redo)$/);
    if (request.method !== "POST" || !match) {
      send(response, 404, { code: "NOT_FOUND", message: "Route not found" });
      return;
    }
    try {
      const body = await readJson(request);
      if (!validCommand(body)) {
        send(response, 400, { code: "INVALID_REQUEST", message: "Invalid history command" });
        return;
      }
      const input = {
        ...body,
        matchId: decodeURIComponent(match[1]),
        operatorId: operatorFromRequest(request)
      };
      const result = match[2] === "undo"
        ? await service.undo(input)
        : await service.redo(input);
      send(response, 200, result);
    } catch (error) {
      const mapped = historyErrorResponse(error);
      send(response, mapped.status, mapped.body);
    }
  };
}
```

- [ ] **Step 5: Verify routes and commit**

Run: `npm --prefix apps/server test`

Expected: route, service and repository tests pass.

```bash
git add apps/server/src apps/server/test/history-routes.test.mjs apps/server/test/fixtures
git commit -m "feat(server): expose match history commands"
```

### Task 8: Document And Verify The Vertical Slice

**Files:**
- Modify: `libs/domain/README.md`
- Modify: `apps/server/README.md`

- [ ] **Step 1: Document invariants**

Add these explicit invariants:

- snapshots/actions are immutable and append-only;
- initial snapshot is sequence `0`;
- every accepted operator command creates exactly one snapshot;
- `Undo/Redo` audit actions never enter navigation stacks;
- a new normal action clears the redo stack;
- both clocks are stopped in every restored snapshot;
- active match policy is copied and frozen at preparation;
- SQLite transaction owns snapshot/action/cursor/outbox atomicity;
- Timer Service confirmation gates publication of the working snapshot.

- [ ] **Step 2: Run placeholder and whitespace scans**

Run: `rg -n "TODO|TBD|FIXME" libs/domain apps/server libs/contracts`

Expected: no new placeholders in implemented files.

Run: `git diff --check`

Expected: exit `0`.

- [ ] **Step 3: Run focused project verification**

Run: `npm run nx -- run domain:lint`

Run: `npm run nx -- run domain:test`

Run: `npm run nx -- run contracts:build`

Run: `npm run nx -- run server:lint`

Run: `npm run nx -- run server:test`

Run: `npm run nx -- run server:build`

Expected: every command exits `0` and all tests report zero failures.

- [ ] **Step 4: Run workspace regression tests**

Run: `npm test`

Expected: client prototype, domain, contracts and server test targets pass.

- [ ] **Step 5: Commit documentation**

```bash
git add libs/domain/README.md apps/server/README.md
git commit -m "docs: document match history invariants"
```

## Completion Gate

- Initial and per-action full snapshots are persisted and immutable.
- Undo/redo supports multiple steps and linear branch invalidation.
- Non-reversible latest actions disable undo without skipping history.
- State version conflicts and repeated command IDs cannot duplicate state.
- Snapshot/action/cursor/outbox writes are one SQLite WAL transaction.
- Timer restore is idempotent, retryable, and gates the successful response.
- Both restored clocks are always stopped.
- REST status/error mapping matches the architecture spec.
- Production client integration remains a separate plan because no production client application exists in the repository yet.
