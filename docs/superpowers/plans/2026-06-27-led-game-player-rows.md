# LED Game Player Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show both teams' five-player lists on `led-game`, including number, `Фамилия И.О.`, numeric points, and five-dot personal-foul indicators.

**Architecture:** Extend the existing LED team block renderer with focused `foulDots()` and `playerRows()` helpers. Keep `apps/client/src/prototype/display/led-views.js` as the tested source renderer and mirror the same static behavior in `apps/client/prototype/app.js` because the prototype must open directly without a module server.

**Tech Stack:** HTML template strings, CSS Grid, Node.js built-in test runner.

---

### Task 1: Add Player Rows To LED Game

**Files:**
- Modify: `apps/client/src/prototype/display/led-views.test.js`
- Modify: `apps/client/src/prototype/sample-state.js`
- Modify: `apps/client/src/prototype/display/led-views.js`
- Modify: `apps/client/src/prototype/prototype-entry.test.js`
- Modify: `apps/client/prototype/app.js`
- Modify: `apps/client/prototype/styles.css`

- [ ] **Step 1: Write the failing renderer test**

Add a test that renders `led-game`, verifies ten `.led-player-row` elements, checks players from both teams, and verifies the first home player has two active and three inactive foul dots:

```js
test('LED game shows both five-player lineups with points and foul dots', () => {
  const html = renderLedRoute('led-game', matchState);
  const firstHomePlayer = html.match(/<div class="led-player-row" data-player="home-0">[\s\S]*?<\/div>/)[0];

  assert.equal((html.match(/class="led-player-row"/g) || []).length, 10);
  assert.match(html, /#4/);
  assert.match(html, /Иванов И\.И\./);
  assert.match(html, /18/);
  assert.match(html, /Макаров А\.А\./);
  assert.equal((firstHomePlayer.match(/foul-dot is-active/g) || []).length, 2);
  assert.equal((firstHomePlayer.match(/foul-dot is-empty/g) || []).length, 3);
});
```

- [ ] **Step 2: Run the renderer test and verify RED**

Run:

```bash
node --test apps/client/src/prototype/display/led-views.test.js
```

Expected: FAIL because `led-game` does not contain `.led-player-row` elements.

- [ ] **Step 3: Update prototype player names**

Change the ten fixture names in `apps/client/src/prototype/sample-state.js` and the direct-file fixture in `apps/client/prototype/app.js` to abbreviated display names:

```js
{ number: 4, name: 'Иванов И.И.', role: 'старт', points: 18, fouls: 2 }
{ number: 3, name: 'Макаров А.А.', role: 'старт', points: 22, fouls: 2 }
```

Apply the same format to the remaining players while preserving their existing numbers, points, and foul counts.

- [ ] **Step 4: Implement player rows and foul dots**

Add helpers to `apps/client/src/prototype/display/led-views.js` and equivalent helpers to `apps/client/prototype/app.js`:

```js
function foulDots(fouls) {
  const activeFouls = Math.min(5, Math.max(0, Number(fouls) || 0));
  return Array.from({ length: 5 }, (_, index) => {
    const stateClass = index < activeFouls ? 'is-active' : 'is-empty';
    return `<i class="foul-dot ${stateClass}">●</i>`;
  }).join('');
}

function playerRows(team, sideClass) {
  return `<div class="led-player-list">
    <div class="led-player-head"><span>№</span><span>Игрок</span><span>О</span><span>Фолы</span></div>
    ${team.players.slice(0, 5).map((player, index) => `
      <div class="led-player-row" data-player="${sideClass}-${index}">
        <strong>#${escapeHtml(player.number)}</strong>
        <span class="led-player-name">${escapeHtml(player.name)}</span>
        <strong class="led-player-points">${escapeHtml(player.points)}</strong>
        <span class="led-player-fouls" aria-label="Фолы: ${escapeHtml(player.fouls)}">${foulDots(player.fouls)}</span>
      </div>
    `).join('')}
  </div>`;
}
```

Insert `${playerRows(team, sideClass)}` inside each `teamBlock()` after team score and before team-level metadata.

- [ ] **Step 5: Add direct-file coverage**

Extend the `#led-game` expectation in `apps/client/src/prototype/prototype-entry.test.js`:

```js
['#led-game', [/УРАЛ/, /СТАРТ/, /Иванов И\.И\./, /Макаров А\.А\./, /led-player-fouls/]],
```

- [ ] **Step 6: Add compact 16:9 player-table styles**

Update `apps/client/prototype/styles.css` so the team block remains compact and each player row uses fixed grid tracks:

```css
.led-team {
  align-content: start;
  gap: 4px;
  padding: 12px;
}

.led-player-list {
  width: 100%;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
  padding: 4px 0;
}

.led-player-head,
.led-player-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 28px 72px;
  align-items: center;
  gap: 4px;
  min-height: 25px;
  text-align: left;
}

.led-player-head {
  color: #94a3b8;
  font-size: 10px;
  text-transform: uppercase;
}

.led-player-row {
  border-top: 1px solid #1e293b;
  font-size: 13px;
}

.led-player-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.led-player-points,
.led-player-fouls {
  text-align: center;
}

.foul-dot {
  color: #475569;
  font-style: normal;
}

.foul-dot.is-active {
  color: var(--warning);
}
```

Reduce only the team-side logo, team name, score, and metadata sizes enough to keep all rows inside the existing 16:9 frame. Do not reduce the central game or shot clocks.

- [ ] **Step 7: Run full verification**

Run:

```bash
npm --prefix apps/client run prototype:check
npm run test
```

Expected: all prototype and repository tests pass with exit code `0`.

- [ ] **Step 8: Commit**

```bash
git add apps/client/src/prototype/display/led-views.test.js apps/client/src/prototype/sample-state.js apps/client/src/prototype/display/led-views.js apps/client/src/prototype/prototype-entry.test.js apps/client/prototype/app.js apps/client/prototype/styles.css
git commit -m "feat(client): show player stats on LED game"
```

## Self-Review

- Spec coverage: both five-player lists, number, abbreviated name, numeric points, and five-dot foul indicators are covered.
- Direct-file parity: both the tested module renderer and standalone `app.js` are included.
- Layout constraint: the central score clocks retain their current sizes; only team-side elements become denser.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation remains.
