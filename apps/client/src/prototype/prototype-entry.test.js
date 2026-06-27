import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('direct-file prototype entry renders shell into root', async () => {
  await readFile(new URL('../../prototype/index.html', import.meta.url), 'utf8');
  const appScript = await readFile(new URL('../../prototype/app.js', import.meta.url), 'utf8');
  const root = { innerHTML: '' };
  const listeners = {};
  const context = {
    document: {
      querySelector(selector) {
        assert.equal(selector, '#root');
        return root;
      },
    },
    window: {
      location: { hash: '' },
      addEventListener(eventName, handler) {
        listeners[eventName] = handler;
      },
    },
  };

  vm.runInNewContext(appScript, context);

  assert.match(root.innerHTML, /prototype-sidebar/);
  assert.match(root.innerHTML, /id="prototype-app"/);
  assert.match(root.innerHTML, /УРАЛ/);
  assert.match(root.innerHTML, /СТАРТ/);
  assert.match(root.innerHTML, /02:18/);
  assert.match(root.innerHTML, /4 ПЕРИОД/);
  assert.match(root.innerHTML, /Фолы 5/);
  assert.equal(typeof listeners.hashchange, 'function');
});

test('direct-file prototype entry renders every LED hash route', async () => {
  const appScript = await readFile(new URL('../../prototype/app.js', import.meta.url), 'utf8');
  const root = { innerHTML: '' };
  const listeners = {};
  const context = {
    document: {
      querySelector(selector) {
        assert.equal(selector, '#root');
        return root;
      },
    },
    window: {
      location: { hash: '#led-game' },
      addEventListener(eventName, handler) {
        listeners[eventName] = handler;
      },
    },
  };

  vm.runInNewContext(appScript, context);

  const routeExpectations = [
    ['#led-game', [/УРАЛ/, /СТАРТ/, /02:18/, /4 ПЕРИОД/, /Фолы 5/, /Иванов И\.И\./, /Макаров А\.А\./, /led-player-fouls/]],
    ['#led-break', [/ПЕРЕРЫВ/, /78 - 81/, /01:42/]],
    ['#led-warmup', [/РАЗМИНКА/, /УРАЛ vs СТАРТ/, /12:35/]],
    ['#led-roster', [/Представление состава/, /Урал Екатеринбург/, /Иванов/]],
    ['#led-test', [/188 - 188/, /LED TEST/]],
    ['#led-no-active-match', [/Нет активного матча/, /Backend: ok/]],
    ['#led-typo', [/Unknown prototype route/]],
  ];

  for (const [hash, patterns] of routeExpectations) {
    context.window.location.hash = hash;
    listeners.hashchange();
    for (const pattern of patterns) {
      assert.match(root.innerHTML, pattern, `expected ${hash} to include ${pattern}`);
    }
    if (hash === '#led-game') {
      assert.equal((root.innerHTML.match(/class="led-player-row"/g) || []).length, 10);
    }
  }
});

test('direct-file prototype entry renders every control hash route', async () => {
  const appScript = await readFile(new URL('../../prototype/app.js', import.meta.url), 'utf8');
  const root = { innerHTML: '' };
  const listeners = {};
  const context = {
    document: { querySelector() { return root; } },
    window: {
      location: { hash: '#control-match-dashboard' },
      addEventListener(eventName, handler) { listeners[eventName] = handler; },
    },
  };

  vm.runInNewContext(appScript, context);

  const routeExpectations = [
    ['#control-match-dashboard', /Журнал событий/],
    ['#control-match-select', /Match Select/],
    ['#control-game-day', /Game Day/],
    ['#control-teams-list', /Teams List/],
    ['#control-team-detail', /Team Detail/],
    ['#control-players-list', /Players List/],
    ['#control-player-detail', /Player Detail/],
    ['#control-matches-list', /Matches List/],
    ['#control-match-detail', /Match Detail/],
    ['#control-scoreboard-layout-settings', /Apply to live match/],
    ['#control-system-status', /System Status/],
    ['#control-recovery', /Восстановить snapshot/],
    ['#control-critical-confirm-modal', /Подтверждение/],
    ['#control-empty-states', /Нет active match/],
    ['#control-typo', /Unknown prototype route/],
  ];

  for (const [hash, pattern] of routeExpectations) {
    context.window.location.hash = hash;
    listeners.hashchange();
    assert.match(root.innerHTML, pattern, `expected ${hash} to include ${pattern}`);
  }
});

test('direct-file prototype entry renders both remote hash routes', async () => {
  const appScript = await readFile(new URL('../../prototype/app.js', import.meta.url), 'utf8');
  const root = { innerHTML: '' };
  const listeners = {};
  const context = {
    document: { querySelector() { return root; } },
    window: {
      location: { hash: '#remote-timer' },
      addEventListener(eventName, handler) { listeners[eventName] = handler; },
    },
  };

  vm.runInNewContext(appScript, context);

  const routeExpectations = [
    ['#remote-timer', [/Пульт хронометриста/, /START \/ STOP/, />24</, />14</]],
    ['#remote-score', [/Пульт оператора счёта/, /Team A/, /\+3/, /Владение/]],
    ['#remote-typo', [/Unknown prototype route/]],
  ];

  for (const [hash, patterns] of routeExpectations) {
    context.window.location.hash = hash;
    listeners.hashchange();
    for (const pattern of patterns) assert.match(root.innerHTML, pattern);
  }
});

test('direct-file prototype entry renders the complete flows overview', async () => {
  const appScript = await readFile(new URL('../../prototype/app.js', import.meta.url), 'utf8');
  const root = { innerHTML: '' };
  const context = {
    document: { querySelector() { return root; } },
    window: { location: { hash: '#flows-overview' }, addEventListener() {} },
  };

  vm.runInNewContext(appScript, context);

  assert.match(root.innerHTML, /Prototype Flows/);
  assert.match(root.innerHTML, /prepare-match/);
  assert.match(root.innerHTML, /failure-recovery/);
  assert.match(root.innerHTML, /apply-live-layout-profile/);
  assert.equal((root.innerHTML.match(/flow-card/g) || []).length, 11);
});

test('mobile prototype navigation stays compact and horizontally scrollable', async () => {
  const styles = await readFile(new URL('../../prototype/styles.css', import.meta.url), 'utf8');
  const mobileStyles = styles.slice(styles.indexOf('@media (max-width: 720px)'));

  assert.match(mobileStyles, /\.prototype-sidebar\s*\{[^}]*display:\s*flex[^}]*overflow-x:\s*auto/s);
  assert.match(mobileStyles, /\.route-group\s*\{[^}]*display:\s*flex/s);
  assert.match(mobileStyles, /\.route-group a\s*\{[^}]*white-space:\s*nowrap/s);
});
