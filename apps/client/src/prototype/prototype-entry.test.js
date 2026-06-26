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
  assert.equal(typeof listeners.hashchange, 'function');
});
