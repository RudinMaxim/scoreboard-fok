# Scoreboard MVP Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repo-local clickable MVP frontend prototype that mirrors the approved Figma-spec for LED display, operator control, timer remote, score remote, and prototype flows.

**Architecture:** Implement a dependency-free static prototype under `apps/client/src/prototype`, rendered by small JavaScript modules and styled by one shared CSS file. Keep prototype data separate from renderers so screens can be tested without a browser and later migrated into a real framework.

**Tech Stack:** Node.js 24 ESM, built-in `node:test`, static HTML/CSS/JavaScript, existing Nx client test target wired to prototype checks.

---

## Source Spec

Implement from:

- `docs/superpowers/specs/2026-06-26-scoreboard-mvp-figma-spec-design.md`
- `apps/client/README.md`
- `docs/api-and-component-contracts.md`

This plan creates a prototype, not final UI. Do not introduce final branding, animations, OBS overlay, Stage 2 hardware control, or a drag-and-drop layout builder.

## File Structure

Create these files:

- `apps/client/prototype/index.html` - static browser entry point for the clickable prototype.
- `apps/client/prototype/styles.css` - shared low/mid fidelity prototype styles and design tokens.
- `apps/client/src/prototype/sample-state.js` - deterministic match, team, player, system, and screen fixture data.
- `apps/client/src/prototype/sample-state.test.js` - fixture completeness tests.
- `apps/client/src/prototype/render.js` - safe HTML helpers, shell layout, navigation, and route renderer.
- `apps/client/src/prototype/render.test.js` - unit tests for helpers and route coverage.
- `apps/client/src/prototype/display/led-views.js` - LED display screen renderers.
- `apps/client/src/prototype/display/led-views.test.js` - tests for required LED elements.
- `apps/client/src/prototype/control/control-views.js` - operator control screen renderers.
- `apps/client/src/prototype/control/control-views.test.js` - tests for required operator screens and critical flows.
- `apps/client/src/prototype/remotes/remote-views.js` - timer and score remote screen renderers.
- `apps/client/src/prototype/remotes/remote-views.test.js` - tests for remote controls.
- `apps/client/src/prototype/flows/flow-views.js` - prototype flow overview renderers.
- `apps/client/src/prototype/flows/flow-views.test.js` - tests for required prototype flows.

Modify these files:

- `apps/client/package.json` - add prototype test/check scripts.
- `apps/client/project.json` - wire Nx `test` to the prototype test command.
- `apps/client/README.md` - document how to open and verify the prototype.

Do not modify unrelated docs or backend/server/timer-service files.

## Task 1: Prototype Fixture Data

**Files:**

- Create: `apps/client/src/prototype/sample-state.test.js`
- Create: `apps/client/src/prototype/sample-state.js`

- [ ] **Step 1: Write the failing fixture completeness test**

Create `apps/client/src/prototype/sample-state.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  displayModes,
  matchState,
  operatorScreens,
  remoteScreens,
  prototypeFlows,
} from './sample-state.js';

test('sample match contains the main MVP scoreboard data', () => {
  assert.equal(matchState.period.label, '4 ПЕРИОД');
  assert.equal(matchState.clocks.game, '02:18');
  assert.equal(matchState.clocks.shot, '14');
  assert.equal(matchState.teams.home.score, 78);
  assert.equal(matchState.teams.away.score, 81);
  assert.equal(matchState.teams.home.fouls, 4);
  assert.equal(matchState.teams.away.fouls, 5);
  assert.ok(matchState.teams.home.logoLabel.length > 0);
  assert.ok(matchState.teams.away.logoLabel.length > 0);
});

test('fixture covers all MVP LED display modes', () => {
  assert.deepEqual(displayModes, [
    'game',
    'break',
    'warmup',
    'roster',
    'test',
    'no-active-match',
  ]);
});

test('fixture covers all MVP operator screens', () => {
  assert.equal(operatorScreens.length, 14);
  assert.ok(operatorScreens.includes('match-dashboard'));
  assert.ok(operatorScreens.includes('scoreboard-layout-settings'));
  assert.ok(operatorScreens.includes('recovery'));
  assert.ok(operatorScreens.includes('empty-states'));
});

test('fixture covers both MVP remotes and required flows', () => {
  assert.deepEqual(remoteScreens, ['timer-remote', 'score-remote']);
  assert.ok(prototypeFlows.includes('reset-shot-clock-24'));
  assert.ok(prototypeFlows.includes('reset-shot-clock-14'));
  assert.ok(prototypeFlows.includes('failure-recovery'));
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test apps/client/src/prototype/sample-state.test.js
```

Expected: FAIL with module not found for `sample-state.js`.

- [ ] **Step 3: Add deterministic fixture data**

Create `apps/client/src/prototype/sample-state.js`:

```js
export const displayModes = [
  'game',
  'break',
  'warmup',
  'roster',
  'test',
  'no-active-match',
];

export const operatorScreens = [
  'match-dashboard',
  'match-select',
  'game-day',
  'teams-list',
  'team-detail',
  'players-list',
  'player-detail',
  'matches-list',
  'match-detail',
  'scoreboard-layout-settings',
  'system-status',
  'recovery',
  'critical-confirm-modal',
  'empty-states',
];

export const remoteScreens = ['timer-remote', 'score-remote'];

export const prototypeFlows = [
  'prepare-match',
  'start-match',
  'score-points',
  'foul-penalty',
  'start-stop-clock',
  'reset-shot-clock-24',
  'reset-shot-clock-14',
  'period-break',
  'failure-recovery',
  'display-mode-switch',
  'apply-live-layout-profile',
];

export const matchState = {
  tournament: 'Кубок ФОК',
  venue: 'ФОК Центральный зал',
  plannedStart: '18:30',
  period: {
    label: '4 ПЕРИОД',
    nextLabel: '4 период',
  },
  clocks: {
    game: '02:18',
    shot: '14',
    shotDanger: '4.9',
    break: '01:42',
    warmup: '12:35',
  },
  teams: {
    home: {
      side: 'A',
      shortName: 'УРАЛ',
      fullName: 'УРАЛ Екатеринбург',
      city: 'Екатеринбург',
      logoLabel: 'УР',
      score: 78,
      fouls: 4,
      timeoutsUsed: 2,
      timeoutsLimit: 3,
      possession: true,
      penalty: false,
      color: '#1f6feb',
      periodScores: [18, 22, 19, 19],
      players: [
        { number: 4, name: 'Иванов', role: 'старт', points: 18, fouls: 2 },
        { number: 7, name: 'Петров', role: 'старт', points: 14, fouls: 1 },
        { number: 11, name: 'Сидоров', role: 'старт', points: 9, fouls: 3 },
        { number: 15, name: 'Ким', role: 'старт', points: 12, fouls: 1 },
        { number: 21, name: 'Орлов', role: 'старт', points: 8, fouls: 0 },
      ],
    },
    away: {
      side: 'B',
      shortName: 'СТАРТ',
      fullName: 'Старт Пермь',
      city: 'Пермь',
      logoLabel: 'СТ',
      score: 81,
      fouls: 5,
      timeoutsUsed: 1,
      timeoutsLimit: 3,
      possession: false,
      penalty: true,
      color: '#ef4444',
      periodScores: [21, 20, 18, 22],
      players: [
        { number: 3, name: 'Макаров', role: 'старт', points: 22, fouls: 2 },
        { number: 8, name: 'Зайцев', role: 'старт', points: 16, fouls: 4 },
        { number: 10, name: 'Волков', role: 'старт', points: 11, fouls: 1 },
        { number: 13, name: 'Белых', role: 'старт', points: 7, fouls: 2 },
        { number: 24, name: 'Смирнов', role: 'старт', points: 19, fouls: 3 },
      ],
    },
  },
  system: {
    backend: 'ok',
    timerService: 'ok',
    database: 'ok',
    websocket: 'ok',
    displayClient: 'connected',
    vp410: 'manual',
    physicalShotClock: 'manual',
  },
  recentEvents: [
    '02:18 УРАЛ #4 +2',
    '02:11 СТАРТ командный фол 5',
    '01:58 Shot clock reset 14',
  ],
};
```

- [ ] **Step 4: Run the fixture test and verify GREEN**

Run:

```bash
node --test apps/client/src/prototype/sample-state.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/client/src/prototype/sample-state.js apps/client/src/prototype/sample-state.test.js
git commit -m "test(client): add prototype fixture data"
```

## Task 2: Prototype Shell, Navigation, And Shared Styles

**Files:**

- Create: `apps/client/prototype/index.html`
- Create: `apps/client/prototype/styles.css`
- Create: `apps/client/src/prototype/render.test.js`
- Create: `apps/client/src/prototype/render.js`
- Modify: `apps/client/package.json`

- [ ] **Step 1: Write failing render helper tests**

Create `apps/client/src/prototype/render.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  routeGroups,
  renderPrototypeShell,
  renderRoute,
} from './render.js';

test('escapeHtml escapes unsafe text', () => {
  assert.equal(escapeHtml('<img onerror=x>&"'), '&lt;img onerror=x&gt;&amp;&quot;');
});

test('routeGroups exposes all prototype groups', () => {
  assert.deepEqual(Object.keys(routeGroups), ['LED', 'Control', 'Remotes', 'Flows']);
});

test('renderRoute returns an unknown route state for bad routes', () => {
  const html = renderRoute('missing-route');
  assert.match(html, /Unknown prototype route/);
});

test('renderPrototypeShell contains app mount and prototype navigation', () => {
  const html = renderPrototypeShell('led-game');
  assert.match(html, /id="prototype-app"/);
  assert.match(html, /LED \/ Game/);
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node --test apps/client/src/prototype/render.test.js
```

Expected: FAIL with module not found for `render.js`.

- [ ] **Step 3: Add render shell**

Create `apps/client/src/prototype/render.js`:

```js
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const routeGroups = {
  LED: [
    ['led-game', 'LED / Game'],
    ['led-break', 'LED / Break'],
    ['led-warmup', 'LED / Warmup'],
    ['led-roster', 'LED / Roster'],
    ['led-test', 'LED / Test'],
    ['led-no-active-match', 'LED / No Active Match'],
  ],
  Control: [
    ['control-match-dashboard', 'Match Dashboard'],
    ['control-match-select', 'Match Select'],
    ['control-game-day', 'Game Day'],
    ['control-teams-list', 'Teams List'],
    ['control-team-detail', 'Team Detail'],
    ['control-players-list', 'Players List'],
    ['control-player-detail', 'Player Detail'],
    ['control-matches-list', 'Matches List'],
    ['control-match-detail', 'Match Detail'],
    ['control-scoreboard-layout-settings', 'Layout Settings'],
    ['control-system-status', 'System Status'],
    ['control-recovery', 'Recovery'],
    ['control-critical-confirm-modal', 'Confirm Modal'],
    ['control-empty-states', 'Empty States'],
  ],
  Remotes: [
    ['remote-timer', 'Timer Remote'],
    ['remote-score', 'Score Remote'],
  ],
  Flows: [['flows-overview', 'Prototype Flows']],
};

export function renderRoute(route) {
  return `<section class="prototype-screen"><h1>${escapeHtml(route)}</h1><p>Unknown prototype route. Select a route from the navigation.</p></section>`;
}

export function renderNavigation(activeRoute) {
  return Object.entries(routeGroups)
    .map(([group, routes]) => {
      const links = routes
        .map(([route, label]) => {
          const active = route === activeRoute ? ' aria-current="page"' : '';
          return `<a href="#${route}"${active}>${escapeHtml(label)}</a>`;
        })
        .join('');
      return `<nav class="route-group"><h2>${escapeHtml(group)}</h2>${links}</nav>`;
    })
    .join('');
}

export function renderPrototypeShell(activeRoute = 'led-game') {
  return `
    <aside class="prototype-sidebar">
      <div class="prototype-brand">
        <strong>Scoreboard MVP</strong>
        <span>Prototype, not final UI</span>
      </div>
      ${renderNavigation(activeRoute)}
    </aside>
    <main id="prototype-app" class="prototype-main">
      ${renderRoute(activeRoute)}
    </main>
  `;
}
```

- [ ] **Step 4: Add static browser entry**

Create `apps/client/prototype/index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Scoreboard MVP Prototype</title>
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import { renderPrototypeShell } from '../src/prototype/render.js';

      const root = document.querySelector('#root');

      function routeFromHash() {
        return window.location.hash.replace('#', '') || 'led-game';
      }

      function render() {
        root.innerHTML = renderPrototypeShell(routeFromHash());
      }

      window.addEventListener('hashchange', render);
      render();
    </script>
  </body>
</html>
```

Create `apps/client/prototype/styles.css`:

```css
:root {
  --bg-display: #080b10;
  --bg-control: #f3f4f6;
  --surface: #ffffff;
  --surface-dark: #111827;
  --text: #111827;
  --text-inverse: #f8fafc;
  --muted: #64748b;
  --border: #cbd5e1;
  --home: #1f6feb;
  --away: #ef4444;
  --warning: #facc15;
  --danger: #dc2626;
  --success: #16a34a;
  --radius: 8px;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--text);
  background: var(--bg-control);
}

#root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
}

.prototype-sidebar {
  background: #0f172a;
  color: var(--text-inverse);
  padding: 20px;
  overflow-y: auto;
}

.prototype-brand {
  display: grid;
  gap: 4px;
  margin-bottom: 24px;
}

.prototype-brand span {
  color: #94a3b8;
  font-size: 12px;
}

.route-group {
  display: grid;
  gap: 6px;
  margin-bottom: 22px;
}

.route-group h2 {
  margin: 0 0 4px;
  color: #cbd5e1;
  font-size: 12px;
  text-transform: uppercase;
}

.route-group a {
  color: #e5e7eb;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 6px;
}

.route-group a[aria-current='page'],
.route-group a:hover {
  background: #1e293b;
}

.prototype-main {
  padding: 24px;
  overflow: auto;
}

.prototype-screen {
  min-height: calc(100vh - 48px);
}
```

Modify `apps/client/package.json`:

```json
{
  "name": "@scoreboard-fok/client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"src/prototype/**/*.test.js\"",
    "prototype:check": "node --test \"src/prototype/**/*.test.js\""
  }
}
```

- [ ] **Step 5: Run test and verify GREEN**

Run:

```bash
npm --prefix apps/client run prototype:check
```

Expected: PASS for fixture and render tests.

- [ ] **Step 6: Commit**

```bash
git add apps/client/package.json apps/client/prototype/index.html apps/client/prototype/styles.css apps/client/src/prototype/render.js apps/client/src/prototype/render.test.js
git commit -m "feat(client): add static prototype shell"
```

## Task 3: LED Display Prototype Screens

**Files:**

- Create: `apps/client/src/prototype/display/led-views.test.js`
- Create: `apps/client/src/prototype/display/led-views.js`
- Modify: `apps/client/src/prototype/render.js`
- Modify: `apps/client/prototype/styles.css`

- [ ] **Step 1: Write failing LED screen tests**

Create `apps/client/src/prototype/display/led-views.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLedRoute } from './led-views.js';
import { matchState } from '../sample-state.js';

test('LED game screen contains score, clocks, fouls, logos, and period', () => {
  const html = renderLedRoute('led-game', matchState);
  assert.match(html, /УРАЛ/);
  assert.match(html, /СТАРТ/);
  assert.match(html, /78/);
  assert.match(html, /81/);
  assert.match(html, /02:18/);
  assert.match(html, /14/);
  assert.match(html, /4 ПЕРИОД/);
  assert.match(html, /Фолы 4/);
  assert.match(html, /Фолы 5/);
});

test('LED modes render their required labels', () => {
  assert.match(renderLedRoute('led-break', matchState), /ПЕРЕРЫВ/);
  assert.match(renderLedRoute('led-warmup', matchState), /РАЗМИНКА/);
  assert.match(renderLedRoute('led-roster', matchState), /Представление состава/);
  assert.match(renderLedRoute('led-test', matchState), /188 - 188/);
  assert.match(renderLedRoute('led-no-active-match', matchState), /Нет активного матча/);
});
```

- [ ] **Step 2: Run LED tests and verify RED**

Run:

```bash
node --test apps/client/src/prototype/display/led-views.test.js
```

Expected: FAIL with module not found for `led-views.js`.

- [ ] **Step 3: Implement LED renderers**

Create `apps/client/src/prototype/display/led-views.js`:

```js
import { escapeHtml } from '../render.js';

function timeoutDots(team) {
  return Array.from({ length: team.timeoutsLimit }, (_, index) =>
    index < team.timeoutsUsed ? '●' : '○',
  ).join('');
}

function teamBlock(team) {
  return `
    <section class="led-team" style="--team-color:${escapeHtml(team.color)}">
      <div class="led-logo">${escapeHtml(team.logoLabel)}</div>
      <div class="led-team-name">${escapeHtml(team.shortName)}</div>
      <div class="led-score">${team.score}</div>
      <div class="led-meta">Фолы ${team.fouls} ${team.penalty ? '<span class="warning">PENALTY</span>' : ''}</div>
      <div class="led-meta">Тайм-ауты ${timeoutDots(team)}</div>
      ${team.possession ? '<div class="possession">Владение</div>' : ''}
    </section>
  `;
}

export function renderLedGame(state) {
  return `
    <section class="led-frame led-game">
      ${teamBlock(state.teams.home)}
      <section class="led-center">
        <div class="led-period">${escapeHtml(state.period.label)}</div>
        <div class="led-game-clock">${escapeHtml(state.clocks.game)}</div>
        <div class="led-shot-clock">${escapeHtml(state.clocks.shot)}</div>
        <div class="led-system">WS ${escapeHtml(state.system.websocket)} · Timer ${escapeHtml(state.system.timerService)}</div>
      </section>
      ${teamBlock(state.teams.away)}
    </section>
  `;
}

export function renderLedBreak(state) {
  return `
    <section class="led-frame led-break">
      <h1>ПЕРЕРЫВ</h1>
      <div class="break-score">${state.teams.home.score} - ${state.teams.away.score}</div>
      <p>До ${escapeHtml(state.period.nextLabel)}: ${escapeHtml(state.clocks.break)}</p>
      <table>
        <thead><tr><th></th><th>1Q</th><th>2Q</th><th>3Q</th><th>4Q</th></tr></thead>
        <tbody>
          <tr><th>${escapeHtml(state.teams.home.shortName)}</th>${state.teams.home.periodScores.map((s) => `<td>${s}</td>`).join('')}</tr>
          <tr><th>${escapeHtml(state.teams.away.shortName)}</th>${state.teams.away.periodScores.map((s) => `<td>${s}</td>`).join('')}</tr>
        </tbody>
      </table>
    </section>
  `;
}

export function renderLedWarmup(state) {
  return `
    <section class="led-frame led-simple">
      <h1>РАЗМИНКА</h1>
      <p>${escapeHtml(state.tournament)}</p>
      <div class="matchup">${escapeHtml(state.teams.home.shortName)} vs ${escapeHtml(state.teams.away.shortName)}</div>
      <p>Начало через ${escapeHtml(state.clocks.warmup)}</p>
      <p>${escapeHtml(state.venue)} · ${escapeHtml(state.plannedStart)}</p>
    </section>
  `;
}

export function renderLedRoster(state) {
  const players = state.teams.home.players
    .map((player) => `<li><strong>#${player.number}</strong> ${escapeHtml(player.name)} <span>${escapeHtml(player.role)}</span></li>`)
    .join('');
  return `
    <section class="led-frame led-roster">
      <h1>Представление состава</h1>
      <h2>${escapeHtml(state.teams.home.fullName)}</h2>
      <ol>${players}</ol>
    </section>
  `;
}

export function renderLedTest() {
  return `
    <section class="led-frame led-test">
      <div class="safe-area">SAFE AREA 64px</div>
      <h1>188 - 188</h1>
      <div class="test-clocks">88:88 · 24.0</div>
      <div class="color-bars"><span></span><span></span><span></span><span></span><span></span></div>
      <p>1920x1080 · LED TEST</p>
    </section>
  `;
}

export function renderLedNoActiveMatch(state) {
  return `
    <section class="led-frame led-simple">
      <h1>Нет активного матча</h1>
      <p>${escapeHtml(state.venue)}</p>
      <p>Backend: ${escapeHtml(state.system.backend)}</p>
    </section>
  `;
}

export function renderLedRoute(route, state) {
  const routes = {
    'led-game': renderLedGame,
    'led-break': renderLedBreak,
    'led-warmup': renderLedWarmup,
    'led-roster': renderLedRoster,
    'led-test': renderLedTest,
    'led-no-active-match': renderLedNoActiveMatch,
  };
  const renderer = routes[route];
  return renderer ? renderer(state) : '';
}
```

- [ ] **Step 4: Wire LED routes into shell**

Modify `apps/client/src/prototype/render.js`:

```js
import { renderLedRoute } from './display/led-views.js';
import { matchState } from './sample-state.js';

// Keep existing escapeHtml, routeGroups, and renderNavigation exports.
// Replace renderRoute with:
export function renderRoute(route) {
  if (route.startsWith('led-')) {
    return renderLedRoute(route, matchState);
  }

  return `<section class="prototype-screen"><h1>${escapeHtml(route)}</h1><p>Unknown prototype route. Select a route from the navigation.</p></section>`;
}
```

When editing, preserve the existing `escapeHtml`, `routeGroups`, `renderNavigation`, and `renderPrototypeShell` definitions from Task 2.

- [ ] **Step 5: Add LED prototype styles**

Append to `apps/client/prototype/styles.css`:

```css
.led-frame {
  min-height: 720px;
  background: var(--bg-display);
  color: var(--text-inverse);
  border-radius: var(--radius);
  padding: 64px;
}

.led-game {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  gap: 24px;
  align-items: stretch;
}

.led-team {
  border: 3px solid var(--team-color);
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  text-align: center;
  padding: 28px;
}

.led-logo {
  width: 112px;
  height: 112px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--team-color);
  font-size: 38px;
  font-weight: 800;
}

.led-team-name {
  font-size: 44px;
  font-weight: 800;
}

.led-score {
  font-size: 190px;
  line-height: 1;
  font-weight: 900;
}

.led-meta {
  font-size: 34px;
}

.warning {
  color: var(--warning);
}

.possession {
  color: var(--warning);
  font-size: 28px;
}

.led-center {
  display: grid;
  place-items: center;
  text-align: center;
}

.led-period {
  font-size: 54px;
}

.led-game-clock {
  font-size: 176px;
  font-weight: 900;
}

.led-shot-clock {
  background: var(--danger);
  border-radius: var(--radius);
  padding: 6px 42px;
  font-size: 142px;
  font-weight: 900;
}

.led-system {
  color: #94a3b8;
  font-size: 18px;
}

.led-simple,
.led-break,
.led-roster,
.led-test {
  display: grid;
  place-items: center;
  text-align: center;
}

.led-simple h1,
.led-break h1,
.led-test h1 {
  margin: 0;
  font-size: 96px;
}

.break-score,
.matchup {
  font-size: 120px;
  font-weight: 900;
}

.led-break table {
  min-width: 760px;
  border-collapse: collapse;
  font-size: 34px;
}

.led-break th,
.led-break td {
  border: 1px solid #475569;
  padding: 12px 18px;
}

.led-roster ol {
  columns: 2;
  min-width: 760px;
  text-align: left;
  font-size: 38px;
}

.safe-area {
  border: 2px dashed var(--warning);
  width: 100%;
  padding: 16px;
}

.test-clocks {
  font-size: 72px;
}

.color-bars {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: 80%;
  height: 80px;
}

.color-bars span:nth-child(1) { background: #ffffff; }
.color-bars span:nth-child(2) { background: #ef4444; }
.color-bars span:nth-child(3) { background: #22c55e; }
.color-bars span:nth-child(4) { background: #3b82f6; }
.color-bars span:nth-child(5) { background: #111827; }
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm --prefix apps/client run prototype:check
```

Expected: PASS for fixture, render, and LED tests.

- [ ] **Step 7: Commit**

```bash
git add apps/client/prototype/styles.css apps/client/src/prototype/render.js apps/client/src/prototype/display/led-views.js apps/client/src/prototype/display/led-views.test.js
git commit -m "feat(client): add LED display prototype screens"
```

## Task 4: Operator Control Prototype Screens

**Files:**

- Create: `apps/client/src/prototype/control/control-views.test.js`
- Create: `apps/client/src/prototype/control/control-views.js`
- Modify: `apps/client/src/prototype/render.js`
- Modify: `apps/client/prototype/styles.css`

- [ ] **Step 1: Write failing operator screen tests**

Create `apps/client/src/prototype/control/control-views.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { operatorScreens, matchState } from '../sample-state.js';
import { renderControlRoute } from './control-views.js';

test('all operator MVP screens render non-empty HTML', () => {
  for (const screen of operatorScreens) {
    const html = renderControlRoute(`control-${screen}`, matchState);
    assert.match(html, /control-screen/);
  }
});

test('match dashboard contains live snapshot and event log', () => {
  const html = renderControlRoute('control-match-dashboard', matchState);
  assert.match(html, /Match Dashboard/);
  assert.match(html, /02:18/);
  assert.match(html, /Shot clock/);
  assert.match(html, /Журнал событий/);
});

test('recovery and critical confirm screens require explicit operator choice', () => {
  assert.match(renderControlRoute('control-recovery', matchState), /Восстановить snapshot/);
  assert.match(renderControlRoute('control-critical-confirm-modal', matchState), /Подтверждение/);
});
```

- [ ] **Step 2: Run operator tests and verify RED**

Run:

```bash
node --test apps/client/src/prototype/control/control-views.test.js
```

Expected: FAIL with module not found for `control-views.js`.

- [ ] **Step 3: Implement operator renderers**

Create `apps/client/src/prototype/control/control-views.js`:

```js
import { escapeHtml } from '../render.js';

function statusPill(label, value) {
  return `<span class="status-pill">${escapeHtml(label)}: ${escapeHtml(value)}</span>`;
}

function controlScreen(title, body) {
  return `<section class="control-screen"><h1>${escapeHtml(title)}</h1>${body}</section>`;
}

function table(headers, rows) {
  return `
    <table class="control-table">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
}

export function renderMatchDashboard(state) {
  return controlScreen('Match Dashboard', `
    <div class="control-grid">
      <section class="panel">
        <h2>Live snapshot</h2>
        <div class="snapshot-score">${state.teams.home.shortName} ${state.teams.home.score} - ${state.teams.away.score} ${state.teams.away.shortName}</div>
        <p>Game clock ${escapeHtml(state.clocks.game)} · Shot clock ${escapeHtml(state.clocks.shot)} · ${escapeHtml(state.period.label)}</p>
        <p>Фолы ${state.teams.home.fouls} / ${state.teams.away.fouls}</p>
      </section>
      <section class="panel">
        <h2>Quick actions</h2>
        <button>START / STOP</button><button>Timeout</button><button>Владение</button><button class="danger">Завершить период</button>
      </section>
      <section class="panel">
        <h2>Журнал событий</h2>
        <ul>${state.recentEvents.map((event) => `<li>${escapeHtml(event)}</li>`).join('')}</ul>
      </section>
    </div>
  `);
}

export function renderMatchSelect() {
  return controlScreen('Match Select', table(['Время', 'Матч', 'Статус', 'Действие'], [
    ['18:30', 'УРАЛ vs СТАРТ', 'active', 'Открыть'],
    ['20:00', 'ЮНИОР vs СОЮЗ', 'scheduled', 'Подготовить'],
  ]));
}

export function renderGameDay(state) {
  return controlScreen('Game Day', `
    <div class="panel"><h2>${escapeHtml(state.tournament)}</h2><p>${escapeHtml(state.venue)} · ${escapeHtml(state.plannedStart)}</p></div>
    ${table(['Матч', 'Команды', 'Готовность'], [['1', 'УРАЛ vs СТАРТ', 'teams · rosters · display profile · clocks']])}
  `);
}

export function renderTeamsList(state) {
  return controlScreen('Teams List', table(['Лого', 'Название', 'Город'], [
    [state.teams.home.logoLabel, state.teams.home.fullName, state.teams.home.city],
    [state.teams.away.logoLabel, state.teams.away.fullName, state.teams.away.city],
  ]));
}

export function renderTeamDetail(state) {
  return controlScreen('Team Detail', `
    <div class="panel"><h2>${escapeHtml(state.teams.home.fullName)}</h2><p>Цвет ${escapeHtml(state.teams.home.color)}</p></div>
    ${table(['#', 'Игрок', 'Роль'], state.teams.home.players.map((p) => [String(p.number), p.name, p.role]))}
  `);
}

export function renderPlayersList(state) {
  const rows = [...state.teams.home.players, ...state.teams.away.players].map((p) => [String(p.number), p.name, String(p.points)]);
  return controlScreen('Players List', table(['#', 'ФИО', 'Очки'], rows));
}

export function renderPlayerDetail(state) {
  const player = state.teams.home.players[0];
  return controlScreen('Player Detail', `<div class="panel"><h2>#${player.number} ${escapeHtml(player.name)}</h2><p>Очки ${player.points} · Фолы ${player.fouls}</p></div>`);
}

export function renderMatchesList() {
  return controlScreen('Matches List', table(['Дата', 'Команды', 'Профиль', 'Статус'], [['2026-06-26', 'УРАЛ vs СТАРТ', 'Default MVP', 'active']]));
}

export function renderMatchDetail(state) {
  return controlScreen('Match Detail', `
    <div class="panel"><h2>${escapeHtml(state.teams.home.shortName)} vs ${escapeHtml(state.teams.away.shortName)}</h2><p>Checklist: 2 команды · составы · часы · профиль табло</p><button>Подготовить матч</button></div>
  `);
}

export function renderLayoutSettings() {
  return controlScreen('Scoreboard Layout Settings', `
    <div class="control-grid"><section class="panel"><h2>Profiles</h2><p>Default MVP</p></section><section class="panel"><h2>LED preview</h2><p>Colors, logos, fonts, block visibility</p><button>Apply to live match</button></section></div>
  `);
}

export function renderSystemStatus(state) {
  return controlScreen('System Status', `
    <div class="status-grid">
      ${statusPill('Backend', state.system.backend)}
      ${statusPill('Timer', state.system.timerService)}
      ${statusPill('DB', state.system.database)}
      ${statusPill('WebSocket', state.system.websocket)}
      ${statusPill('VP410', 'не проверяется программно')}
      ${statusPill('24/14', 'ручной контур')}
    </div>
  `);
}

export function renderRecovery(state) {
  return controlScreen('Recovery', `<div class="panel"><h2>Последний snapshot</h2><p>${state.teams.home.score} - ${state.teams.away.score} · ${escapeHtml(state.clocks.game)} · ${escapeHtml(state.period.label)}</p><button>Восстановить snapshot</button><button>Внести корректировку</button><button class="danger">Закрыть как требующий сверки</button></div>`);
}

export function renderCriticalConfirmModal() {
  return controlScreen('Critical Confirm Modal', `<div class="modal-prototype"><h2>Подтверждение</h2><p>Действие повлияет на live-матч и будет записано в журнал.</p><button class="danger">Подтвердить</button><button>Отмена</button></div>`);
}

export function renderEmptyStates() {
  return controlScreen('Empty States', `<div class="empty-state">Нет матчей · Нет команд · Нет игроков · Нет active match · Нет журнала событий</div>`);
}

export function renderControlRoute(route, state) {
  const routes = {
    'control-match-dashboard': renderMatchDashboard,
    'control-match-select': renderMatchSelect,
    'control-game-day': renderGameDay,
    'control-teams-list': renderTeamsList,
    'control-team-detail': renderTeamDetail,
    'control-players-list': renderPlayersList,
    'control-player-detail': renderPlayerDetail,
    'control-matches-list': renderMatchesList,
    'control-match-detail': renderMatchDetail,
    'control-scoreboard-layout-settings': renderLayoutSettings,
    'control-system-status': renderSystemStatus,
    'control-recovery': renderRecovery,
    'control-critical-confirm-modal': renderCriticalConfirmModal,
    'control-empty-states': renderEmptyStates,
  };
  return routes[route] ? routes[route](state) : '';
}
```

- [ ] **Step 4: Wire control routes into shell**

Modify `apps/client/src/prototype/render.js` so `renderRoute` checks control routes:

```js
import { renderControlRoute } from './control/control-views.js';

export function renderRoute(route) {
  if (route.startsWith('led-')) {
    return renderLedRoute(route, matchState);
  }

  if (route.startsWith('control-')) {
    return renderControlRoute(route, matchState);
  }

  return `<section class="prototype-screen"><h1>${escapeHtml(route)}</h1><p>Unknown prototype route. Select a route from the navigation.</p></section>`;
}
```

Preserve the imports from Task 3.

- [ ] **Step 5: Add operator styles**

Append to `apps/client/prototype/styles.css`:

```css
.control-screen h1 {
  margin-top: 0;
}

.control-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

.panel,
.modal-prototype,
.empty-state {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
}

.snapshot-score {
  font-size: 44px;
  font-weight: 800;
}

button {
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #f8fafc;
  margin: 4px;
  padding: 0 14px;
  font-weight: 700;
}

button.danger,
.danger {
  background: var(--danger);
  color: white;
}

.control-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
}

.control-table th,
.control-table td {
  border-bottom: 1px solid var(--border);
  padding: 12px;
  text-align: left;
}

.status-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.status-pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  padding: 8px 12px;
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm --prefix apps/client run prototype:check
```

Expected: PASS for fixture, render, LED, and control tests.

- [ ] **Step 7: Commit**

```bash
git add apps/client/prototype/styles.css apps/client/src/prototype/render.js apps/client/src/prototype/control/control-views.js apps/client/src/prototype/control/control-views.test.js
git commit -m "feat(client): add operator control prototype screens"
```

## Task 5: Timer And Score Remote Prototype Screens

**Files:**

- Create: `apps/client/src/prototype/remotes/remote-views.test.js`
- Create: `apps/client/src/prototype/remotes/remote-views.js`
- Modify: `apps/client/src/prototype/render.js`
- Modify: `apps/client/prototype/styles.css`

- [ ] **Step 1: Write failing remote tests**

Create `apps/client/src/prototype/remotes/remote-views.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchState } from '../sample-state.js';
import { renderRemoteRoute } from './remote-views.js';

test('timer remote contains primary clock controls', () => {
  const html = renderRemoteRoute('remote-timer', matchState);
  assert.match(html, /START \/ STOP/);
  assert.match(html, /24/);
  assert.match(html, /14/);
  assert.match(html, /02:18/);
});

test('score remote contains team, player, points, fouls, timeout, and possession controls', () => {
  const html = renderRemoteRoute('remote-score', matchState);
  assert.match(html, /Team A/);
  assert.match(html, /\+1/);
  assert.match(html, /\+2/);
  assert.match(html, /\+3/);
  assert.match(html, /Фол/);
  assert.match(html, /Владение/);
});
```

- [ ] **Step 2: Run remote tests and verify RED**

Run:

```bash
node --test apps/client/src/prototype/remotes/remote-views.test.js
```

Expected: FAIL with module not found for `remote-views.js`.

- [ ] **Step 3: Implement remote renderers**

Create `apps/client/src/prototype/remotes/remote-views.js`:

```js
import { escapeHtml } from '../render.js';

function remoteButton(label, tone = '') {
  return `<button class="remote-button ${tone}">${escapeHtml(label)}</button>`;
}

export function renderTimerRemote(state) {
  return `
    <section class="remote-screen timer-remote">
      <h1>Пульт хронометриста</h1>
      <div class="remote-clock-panel">
        <div><span>Game clock</span><strong>${escapeHtml(state.clocks.game)}</strong></div>
        <div><span>Shot clock</span><strong class="shot">${escapeHtml(state.clocks.shot)}</strong></div>
        <p>${escapeHtml(state.period.label)} · Timer ${escapeHtml(state.system.timerService)}</p>
      </div>
      <div class="remote-actions primary">${remoteButton('START / STOP', 'success')}</div>
      <div class="remote-actions">${remoteButton('24', 'danger')}${remoteButton('14', 'danger')}${remoteButton('RESET')}</div>
      <div class="remote-actions">${remoteButton('+1 сек')}${remoteButton('-1 сек')}${remoteButton('Тайм-аут')}${remoteButton('Следующий период')}</div>
    </section>
  `;
}

export function renderScoreRemote(state) {
  const players = state.teams.home.players
    .map((player) => `<button class="player-button">#${player.number} ${escapeHtml(player.name)}</button>`)
    .join('');
  return `
    <section class="remote-screen score-remote">
      <h1>Пульт оператора счёта</h1>
      <div class="remote-score-snapshot">Team A ${state.teams.home.score} - ${state.teams.away.score} Team B</div>
      <div class="team-selector">${remoteButton('Team A', 'success')}${remoteButton('Team B')}</div>
      <section class="player-list">${players}</section>
      <section class="selected-player">Выбран: #${state.teams.home.players[0].number} ${escapeHtml(state.teams.home.players[0].name)}</section>
      <div class="remote-actions">${remoteButton('+1')}${remoteButton('+2')}${remoteButton('+3')}${remoteButton('-1 / correction')}</div>
      <div class="remote-actions">${remoteButton('Фол +1', 'warning')}${remoteButton('Фол -1')}${remoteButton('Тайм-аут')}${remoteButton('Владение')}</div>
    </section>
  `;
}

export function renderRemoteRoute(route, state) {
  if (route === 'remote-timer') return renderTimerRemote(state);
  if (route === 'remote-score') return renderScoreRemote(state);
  return '';
}
```

- [ ] **Step 4: Wire remote routes into shell**

Modify `apps/client/src/prototype/render.js`:

```js
import { renderRemoteRoute } from './remotes/remote-views.js';

export function renderRoute(route) {
  if (route.startsWith('led-')) {
    return renderLedRoute(route, matchState);
  }

  if (route.startsWith('control-')) {
    return renderControlRoute(route, matchState);
  }

  if (route.startsWith('remote-')) {
    return renderRemoteRoute(route, matchState);
  }

  return `<section class="prototype-screen"><h1>${escapeHtml(route)}</h1><p>Unknown prototype route. Select a route from the navigation.</p></section>`;
}
```

Preserve existing imports from earlier tasks.

- [ ] **Step 5: Add remote styles**

Append to `apps/client/prototype/styles.css`:

```css
.remote-screen {
  max-width: 1024px;
  min-height: 720px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
}

.remote-clock-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

.remote-clock-panel div {
  background: #111827;
  color: white;
  border-radius: var(--radius);
  padding: 18px;
}

.remote-clock-panel span {
  display: block;
  color: #94a3b8;
}

.remote-clock-panel strong {
  display: block;
  font-size: 78px;
}

.remote-clock-panel .shot {
  color: #f87171;
}

.remote-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 14px 0;
}

.remote-actions.primary .remote-button {
  width: 100%;
  min-height: 96px;
  font-size: 34px;
}

.remote-button {
  min-width: 130px;
  min-height: 72px;
  font-size: 24px;
}

.remote-button.success {
  background: var(--success);
  color: white;
}

.remote-button.warning {
  background: var(--warning);
}

.remote-button.danger {
  background: var(--danger);
  color: white;
}

.remote-score-snapshot {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 18px;
}

.team-selector,
.player-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.player-button {
  min-width: 180px;
}

.selected-player {
  border: 2px solid var(--home);
  border-radius: var(--radius);
  padding: 14px;
  font-size: 24px;
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm --prefix apps/client run prototype:check
```

Expected: PASS for all current prototype tests.

- [ ] **Step 7: Commit**

```bash
git add apps/client/prototype/styles.css apps/client/src/prototype/render.js apps/client/src/prototype/remotes/remote-views.js apps/client/src/prototype/remotes/remote-views.test.js
git commit -m "feat(client): add remote prototype screens"
```

## Task 6: Prototype Flow Overview And Documentation

**Files:**

- Create: `apps/client/src/prototype/flows/flow-views.test.js`
- Create: `apps/client/src/prototype/flows/flow-views.js`
- Modify: `apps/client/src/prototype/render.js`
- Modify: `apps/client/prototype/styles.css`
- Modify: `apps/client/README.md`
- Modify: `apps/client/project.json`

- [ ] **Step 1: Write failing flow coverage tests**

Create `apps/client/src/prototype/flows/flow-views.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { prototypeFlows } from '../sample-state.js';
import { renderFlowsOverview } from './flow-views.js';

test('flows overview lists every required MVP prototype flow', () => {
  const html = renderFlowsOverview(prototypeFlows);
  for (const flow of prototypeFlows) {
    assert.match(html, new RegExp(flow));
  }
});

test('flows overview includes critical confirmation and error outcomes', () => {
  const html = renderFlowsOverview(prototypeFlows);
  assert.match(html, /confirm/);
  assert.match(html, /error/);
  assert.match(html, /snapshot/);
});
```

- [ ] **Step 2: Run flow test and verify RED**

Run:

```bash
node --test apps/client/src/prototype/flows/flow-views.test.js
```

Expected: FAIL with module not found for `flow-views.js`.

- [ ] **Step 3: Implement flow overview**

Create `apps/client/src/prototype/flows/flow-views.js`:

```js
import { escapeHtml } from '../render.js';

const flowLabels = {
  'prepare-match': 'Подготовка матча',
  'start-match': 'Старт матча',
  'score-points': 'Начисление очков',
  'foul-penalty': 'Фол и penalty',
  'start-stop-clock': 'Старт/стоп времени',
  'reset-shot-clock-24': 'Reset shot clock 24',
  'reset-shot-clock-14': 'Reset shot clock 14',
  'period-break': 'Перерыв',
  'failure-recovery': 'Восстановление после сбоя',
  'display-mode-switch': 'Переключение LED display mode',
  'apply-live-layout-profile': 'Применение профиля к live-матчу',
};

export function renderFlowsOverview(flows) {
  const cards = flows
    .map((flow) => `
      <article class="flow-card">
        <h2>${escapeHtml(flowLabels[flow] || flow)}</h2>
        <code>${escapeHtml(flow)}</code>
        <p>Start screen → operator action → confirm when critical → committed snapshot or visible error.</p>
      </article>
    `)
    .join('');

  return `<section class="flows-screen"><h1>Prototype Flows</h1><div class="flow-grid">${cards}</div></section>`;
}
```

- [ ] **Step 4: Wire flow route into shell**

Modify `apps/client/src/prototype/render.js`:

```js
import { renderFlowsOverview } from './flows/flow-views.js';
import { prototypeFlows } from './sample-state.js';

export function renderRoute(route) {
  if (route.startsWith('led-')) {
    return renderLedRoute(route, matchState);
  }

  if (route.startsWith('control-')) {
    return renderControlRoute(route, matchState);
  }

  if (route.startsWith('remote-')) {
    return renderRemoteRoute(route, matchState);
  }

  if (route === 'flows-overview') {
    return renderFlowsOverview(prototypeFlows);
  }

  return `<section class="prototype-screen"><h1>${escapeHtml(route)}</h1><p>Unknown prototype route. Select a route from the navigation.</p></section>`;
}
```

Preserve all existing imports from previous tasks.

- [ ] **Step 5: Add flow styles**

Append to `apps/client/prototype/styles.css`:

```css
.flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.flow-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.flow-card code {
  display: inline-block;
  margin-bottom: 8px;
  color: var(--muted);
}
```

- [ ] **Step 6: Document prototype usage**

Modify `apps/client/README.md` by adding:

````markdown
## MVP Prototype

The clickable MVP prototype lives in `apps/client/prototype/index.html`.

Open it directly in a browser:

```text
apps/client/prototype/index.html
```

Run prototype checks:

```bash
npm --prefix apps/client run prototype:check
```

The prototype is low/mid fidelity. It validates MVP screen coverage, hierarchy, flows, and states. It is not the final visual design.
````

- [ ] **Step 7: Wire Nx test target**

Modify `apps/client/project.json` target `test` so `npm run test` includes prototype checks for the client project:

```json
{
  "command": "npm --prefix apps/client run prototype:check"
}
```

- [ ] **Step 8: Run full prototype verification**

Run:

```bash
npm --prefix apps/client run prototype:check
```

Expected: PASS for fixture, render, LED, control, remote, and flow tests.

Open `apps/client/prototype/index.html` in a browser and manually verify:

- sidebar navigation is visible;
- `LED / Game` shows score, game clock, shot clock, fouls, logos, period;
- operator dashboard route renders;
- timer remote route renders;
- score remote route renders;
- flows overview route renders.

- [ ] **Step 9: Commit**

```bash
git add apps/client/README.md apps/client/prototype/styles.css apps/client/src/prototype/render.js apps/client/src/prototype/flows/flow-views.js apps/client/src/prototype/flows/flow-views.test.js
git commit -m "feat(client): add prototype flow overview"
```

## Self-Review

Spec coverage:

- LED game, break, warmup, roster, test, and no active match are covered by Task 3.
- Operator dashboard, match select, game day, teams, players, matches, layout settings, system status, recovery, confirm modal, and empty states are covered by Task 4.
- Timer and score remotes are covered by Task 5.
- Prototype flows and acceptance notes are covered by Task 6.
- Fixture data and screen lists are covered by Task 1.
- Shared shell, navigation, and prototype usage are covered by Task 2 and Task 6.

Completeness scan:

- The implementation plan does not use `TBD`, `TODO`, `implement later`, or unspecified validation/error instructions.
- Nx target wiring is a required step so repository-level test execution includes the client prototype checks.

Type and route consistency:

- LED routes use `led-*`.
- Control routes use `control-*`.
- Remote routes use `remote-*`.
- Flow route is `flows-overview`.
- Test imports match the files created in the corresponding tasks.

## Final Verification Command

After all tasks are complete, run:

```bash
npm --prefix apps/client run prototype:check
```

Expected final result: all prototype tests pass with exit code `0`.
