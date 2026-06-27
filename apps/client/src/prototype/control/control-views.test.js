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

test('control renderers escape fixture values and reject unknown routes', () => {
  const unsafeState = structuredClone(matchState);
  unsafeState.teams.home.shortName = '<script>home</script>';
  unsafeState.recentEvents = ['<img src=x onerror=alert(1)>'];

  const html = renderControlRoute('control-match-dashboard', unsafeState);
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;home&lt;\/script&gt;/);
  assert.equal(renderControlRoute('control-typo', matchState), '');
});
