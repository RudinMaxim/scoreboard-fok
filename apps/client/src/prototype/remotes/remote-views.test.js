import test from 'node:test';
import assert from 'node:assert/strict';
import { matchState } from '../sample-state.js';
import { renderRemoteRoute } from './remote-views.js';

test('timer remote contains primary clock controls', () => {
  const html = renderRemoteRoute('remote-timer', matchState);
  assert.match(html, /START \/ STOP/);
  assert.match(html, />24</);
  assert.match(html, />14</);
  assert.match(html, /02:18/);
});

test('score remote contains team, player, points, fouls, timeout, and possession controls', () => {
  const html = renderRemoteRoute('remote-score', matchState);
  assert.match(html, /Team A/);
  assert.match(html, /\+1/);
  assert.match(html, /\+2/);
  assert.match(html, /\+3/);
  assert.match(html, /Фол/);
  assert.match(html, /Тайм-аут/);
  assert.match(html, /Владение/);
});

test('remote renderers escape fixture values and reject unknown routes', () => {
  const unsafeState = structuredClone(matchState);
  unsafeState.teams.home.players[0].name = '<img src=x>';
  unsafeState.clocks.game = '<script>clock</script>';

  assert.doesNotMatch(renderRemoteRoute('remote-timer', unsafeState), /<script>/);
  assert.doesNotMatch(renderRemoteRoute('remote-score', unsafeState), /<img/);
  assert.equal(renderRemoteRoute('remote-typo', matchState), '');
});
