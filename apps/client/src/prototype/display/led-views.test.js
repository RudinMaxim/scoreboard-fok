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
