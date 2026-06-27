# LED Browser Focus Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LED screens readable from the browser by adding a direct-file-compatible focus/fullscreen viewer and replace textual penalty/possession markers with a yellow fifth-team-foul badge.

**Architecture:** Keep LED screen HTML in the existing display renderer, wrap all `led-*` routes in a browser-only viewer shell, and implement focus state in the standalone `prototype/app.js`. CSS focus mode is authoritative so the feature still works when the Fullscreen API is unavailable for `file://`; the native API is a progressive enhancement.

**Tech Stack:** HTML template strings, CSS Grid, browser Fullscreen API, Node.js built-in test runner, Python static HTTP server for review.

---

### Task 1: Simplify LED Team Status

**Files:**
- Modify: `apps/client/src/prototype/display/led-views.test.js`
- Modify: `apps/client/src/prototype/display/led-views.js`
- Modify: `apps/client/prototype/app.js`
- Modify: `apps/client/prototype/styles.css`

- [ ] **Step 1: Write the failing team-status test**

Add:

```js
test('LED game uses a yellow fifth-foul badge without penalty or possession text', () => {
  const html = renderLedRoute('led-game', matchState);
  assert.doesNotMatch(html, /PENALTY|Владение/);
  assert.match(html, /led-team-fouls is-limit/);
  assert.match(html, /ФОЛЫ <strong>5<\/strong>/);
});
```

- [ ] **Step 2: Run the LED test and verify RED**

Run:

```bash
node --test apps/client/src/prototype/display/led-views.test.js
```

Expected: FAIL because `PENALTY` and `Владение` are still present.

- [ ] **Step 3: Implement the team-foul badge**

Add this helper to both LED renderers:

```js
function teamFoulBadge(team) {
  const isLimit = Number(team.fouls) >= 5;
  return `<div class="led-team-fouls${isLimit ? ' is-limit' : ''}">ФОЛЫ <strong>${escapeHtml(team.fouls)}</strong></div>`;
}
```

Replace the current team-foul metadata and remove the rendered possession element:

```js
${teamFoulBadge(team)}
<div class="led-meta">Тайм-ауты ${timeoutDots(team)}</div>
```

- [ ] **Step 4: Style the fifth-foul state**

Add:

```css
.led-team-fouls {
  border: 1px solid #475569;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 17px;
}

.led-team-fouls.is-limit {
  border-color: var(--warning);
  background: var(--warning);
  color: #111827;
}
```

Delete the unused `.possession` style.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test apps/client/src/prototype/display/led-views.test.js
```

Expected: all LED tests pass.

### Task 2: Add Browser Focus And Fullscreen Viewer

**Files:**
- Modify: `apps/client/src/prototype/render.test.js`
- Modify: `apps/client/src/prototype/render.js`
- Modify: `apps/client/src/prototype/prototype-entry.test.js`
- Modify: `apps/client/prototype/app.js`
- Modify: `apps/client/prototype/styles.css`

- [ ] **Step 1: Write the failing viewer-shell test**

Add:

```js
test('LED routes include a browser viewer toolbar with a focus control', () => {
  const html = renderRoute('led-game');
  assert.match(html, /led-viewer-toolbar/);
  assert.match(html, /data-action="toggle-led-focus"/);
  assert.match(html, /aria-label="Развернуть LED"/);
});
```

- [ ] **Step 2: Run the render test and verify RED**

Run:

```bash
node --test apps/client/src/prototype/render.test.js
```

Expected: FAIL because LED content is not wrapped in a viewer.

- [ ] **Step 3: Add a reusable LED viewer wrapper**

Add to `render.js` and mirror in `app.js`:

```js
function renderLedViewer(route, ledHtml, focusMode = false) {
  const routeLabel = route.replace('led-', 'LED / ').replaceAll('-', ' ');
  const controlLabel = focusMode ? 'Свернуть LED' : 'Развернуть LED';
  return `<section class="led-viewer">
    <header class="led-viewer-toolbar">
      <strong>${escapeHtml(routeLabel)}</strong>
      <button class="led-focus-toggle" data-action="toggle-led-focus" aria-label="${controlLabel}" title="${controlLabel}">${focusMode ? '×' : '⛶'}</button>
    </header>
    <div class="led-stage">${ledHtml}</div>
  </section>`;
}
```

Return this wrapper for every valid `led-*` route while preserving unknown-route fallback.

- [ ] **Step 4: Write the failing direct-file interaction test**

Create a direct-file VM context with `document.body.classList.toggle`, render `#led-game`, invoke the stored `click` handler with a target whose `closest()` matches the focus button, and assert:

```js
assert.equal(bodyClasses.has('led-focus-mode'), true);
assert.match(root.innerHTML, /aria-label="Свернуть LED"/);
```

Then invoke the stored `keydown` handler with `{ key: 'Escape' }` and assert that focus mode is removed.

- [ ] **Step 5: Run the direct-file interaction test and verify RED**

Run:

```bash
node --test --test-name-pattern="focus mode" apps/client/src/prototype/prototype-entry.test.js
```

Expected: FAIL because click and keyboard focus handlers do not exist.

- [ ] **Step 6: Implement direct-file focus behavior**

Use a local boolean and delegated window listeners:

```js
let ledFocusMode = false;

function setLedFocusMode(active) {
  ledFocusMode = active;
  document.body?.classList.toggle('led-focus-mode', active);
  render();
}

window.addEventListener('click', (event) => {
  if (!event.target.closest?.('[data-action="toggle-led-focus"]')) return;
  const nextMode = !ledFocusMode;
  setLedFocusMode(nextMode);
  if (nextMode) {
    document.documentElement?.requestFullscreen?.()?.catch?.(() => {});
  } else if (document.fullscreenElement) {
    document.exitFullscreen?.();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && ledFocusMode) setLedFocusMode(false);
});

window.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && ledFocusMode) setLedFocusMode(false);
});
```

- [ ] **Step 7: Add viewer and focus-mode styles**

Add toolbar and stage styles, then focus overrides:

```css
.led-viewer {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.led-viewer-toolbar {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.led-focus-toggle {
  width: 44px;
  min-width: 44px;
  padding: 0;
  font-size: 22px;
}

.led-stage,
.led-stage .led-frame {
  width: 100%;
}

body.led-focus-mode {
  overflow: hidden;
  background: #000000;
}

body.led-focus-mode .prototype-sidebar {
  display: none;
}

body.led-focus-mode #root {
  display: block;
  background: #000000;
}

body.led-focus-mode .prototype-main {
  width: 100vw;
  height: 100vh;
  padding: 0;
  overflow: hidden;
}

body.led-focus-mode .led-viewer {
  display: grid;
  width: 100vw;
  height: 100vh;
  max-width: none;
  place-items: center;
}

body.led-focus-mode .led-viewer-toolbar {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 20;
  margin: 0;
}

body.led-focus-mode .led-viewer-toolbar > strong {
  display: none;
}

body.led-focus-mode .led-stage {
  width: min(100vw, calc(100vh * 16 / 9));
  aspect-ratio: 16 / 9;
}

body.led-focus-mode .led-frame {
  width: 100%;
  max-width: none;
}

body.led-focus-mode .led-player-row {
  min-height: 34px;
  font-size: 18px;
}

body.led-focus-mode .foul-dot {
  font-size: 14px;
}
```

- [ ] **Step 8: Run full verification**

Run:

```bash
npm --prefix apps/client run prototype:check
npm run test
```

Expected: all tests pass with exit code `0`.

- [ ] **Step 9: Commit**

```bash
git add apps/client/src/prototype/display/led-views.test.js apps/client/src/prototype/display/led-views.js apps/client/src/prototype/render.test.js apps/client/src/prototype/render.js apps/client/src/prototype/prototype-entry.test.js apps/client/prototype/app.js apps/client/prototype/styles.css
git commit -m "feat(client): add LED browser focus mode"
```

### Task 3: Start Review Server

- [ ] **Step 1: Check port 4173**

Run:

```powershell
Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue
```

Expected: no listener. If occupied, increment the port until a free port is found.

- [ ] **Step 2: Start a hidden static server**

Run:

```powershell
Start-Process -FilePath python -ArgumentList '-m','http.server','4173','--directory','apps/client/prototype' -WindowStyle Hidden -PassThru
```

- [ ] **Step 3: Verify the server response**

Run:

```powershell
Invoke-WebRequest 'http://127.0.0.1:4173/index.html' -UseBasicParsing
```

Expected: HTTP `200` and the Scoreboard MVP HTML.

## Self-Review

- Focus mode works with direct `file://` and HTTP because CSS state does not depend on the Fullscreen API.
- All LED routes receive the browser toolbar; unknown routes keep the existing fallback.
- Fifth-team-foul state is readable without `PENALTY`, possession text, or a full-team warning border.
- Player rows increase in focus mode while score and clocks remain the dominant elements.
- The static server is review infrastructure only and does not change production dependencies.
