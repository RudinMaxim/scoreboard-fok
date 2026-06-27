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
  assert.match(html, /ФОЛЫ <strong>4<\/strong>/);
  assert.match(html, /ФОЛЫ <strong>5<\/strong>/);
});

test('LED game shows both five-player lineups with points and foul dots', () => {
  const html = renderLedRoute('led-game', matchState);
  const firstHomePlayer = html.match(/<div class="led-player-row" data-player="home-0">[\s\S]*?<\/div>/)?.[0] || '';

  assert.equal((html.match(/class="led-player-row"/g) || []).length, 10);
  assert.match(html, /#4/);
  assert.match(html, /Иванов И\.И\./);
  assert.match(html, /18/);
  assert.match(html, /Макаров А\.А\./);
  assert.equal((firstHomePlayer.match(/foul-dot is-active/g) || []).length, 2);
  assert.equal((firstHomePlayer.match(/foul-dot is-empty/g) || []).length, 3);
});

test('LED game uses a yellow fifth-foul badge without penalty or possession text', () => {
  const html = renderLedRoute('led-game', matchState);
  assert.doesNotMatch(html, /PENALTY|Владение/);
  assert.match(html, /led-team-fouls is-limit/);
  assert.match(html, /ФОЛЫ <strong>5<\/strong>/);
});

test('LED game does not expose technical service statuses to spectators', () => {
  const html = renderLedRoute('led-game', matchState);
  assert.doesNotMatch(html, /led-system|WS ok|Timer ok/);
});

test('LED game labels the shot clock as attack time in seconds', () => {
  const html = renderLedRoute('led-game', matchState);
  assert.match(html, /led-shot-label">АТАКА/);
  assert.match(html, /led-shot-value">14/);
  assert.match(html, /led-shot-unit">СЕК/);
});

test('LED game labels the main clock as game time in minutes and seconds', () => {
  const html = renderLedRoute('led-game', matchState);
  assert.match(html, /led-game-label">ИГРОВОЕ ВРЕМЯ/);
  assert.match(html, /led-game-value">02:18/);
  assert.match(html, /led-game-unit">МИН:СЕК/);
});

test('LED modes render their required labels', () => {
  assert.match(renderLedRoute('led-break', matchState), /ПЕРЕРЫВ/);
  assert.match(renderLedRoute('led-warmup', matchState), /РАЗМИНКА/);
  assert.match(renderLedRoute('led-roster', matchState), /Представление состава/);
  assert.match(renderLedRoute('led-test', matchState), /188 - 188/);
  assert.match(renderLedRoute('led-no-active-match', matchState), /Нет активного матча/);
});

test('LED game and detail views escape numeric-looking values and ignore raw colors', () => {
  const unsafeState = structuredClone(matchState);
  unsafeState.teams.home.score = '<img src=x onerror=alert(1)>';
  unsafeState.teams.home.fouls = '<script>alert(2)</script>';
  unsafeState.teams.home.periodScores = ['<td onclick=alert(3)>9</td>'];
  unsafeState.teams.home.players[0].number = '<svg onload=alert(4)>';
  unsafeState.teams.home.players[0].points = '<b>99</b>';
  unsafeState.teams.home.color = 'red; background:url(javascript:alert(5))';

  const gameHtml = renderLedRoute('led-game', unsafeState);
  const breakHtml = renderLedRoute('led-break', unsafeState);
  const rosterHtml = renderLedRoute('led-roster', unsafeState);

  assert.doesNotMatch(gameHtml, /<img src=x/);
  assert.doesNotMatch(gameHtml, /<script>/);
  assert.doesNotMatch(gameHtml, /style="/);
  assert.doesNotMatch(gameHtml, /javascript:alert/);
  assert.match(gameHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(gameHtml, /ФОЛЫ <strong>&lt;script&gt;alert\(2\)&lt;\/script&gt;<\/strong>/);

  assert.doesNotMatch(breakHtml, /<td onclick=alert/);
  assert.match(breakHtml, /&lt;td onclick=alert\(3\)&gt;9&lt;\/td&gt;/);

  assert.doesNotMatch(rosterHtml, /<svg onload/);
  assert.doesNotMatch(rosterHtml, /<b>99<\/b>/);
  assert.match(rosterHtml, /#&lt;svg onload=alert\(4\)&gt;/);
  assert.match(rosterHtml, /&lt;b&gt;99&lt;\/b&gt; очк\./);
});
