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
    ['#led-game', [/УРАЛ/, /СТАРТ/, /02:18/, /4 ПЕРИОД/, /Фолы 5/]],
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
  }
});
