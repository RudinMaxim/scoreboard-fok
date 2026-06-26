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
