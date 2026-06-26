import test from 'node:test';
import assert from 'node:assert/strict';
import {
  displayModes,
  matchState,
  operatorScreens,
  remoteScreens,
  prototypeFlows,
} from './sample-state.js';

test('sample match contains the main MVP scoreboard data', () => {
  assert.equal(matchState.period.label, '4 ПЕРИОД');
  assert.equal(matchState.clocks.game, '02:18');
  assert.equal(matchState.clocks.shot, '14');
  assert.equal(matchState.teams.home.score, 78);
  assert.equal(matchState.teams.away.score, 81);
  assert.equal(matchState.teams.home.fouls, 4);
  assert.equal(matchState.teams.away.fouls, 5);
  assert.ok(matchState.teams.home.logoLabel.length > 0);
  assert.ok(matchState.teams.away.logoLabel.length > 0);
});

test('fixture covers all MVP LED display modes', () => {
  assert.deepEqual(displayModes, [
    'game',
    'break',
    'warmup',
    'roster',
    'test',
    'no-active-match',
  ]);
});

test('fixture covers all MVP operator screens', () => {
  assert.equal(operatorScreens.length, 14);
  assert.ok(operatorScreens.includes('match-dashboard'));
  assert.ok(operatorScreens.includes('scoreboard-layout-settings'));
  assert.ok(operatorScreens.includes('recovery'));
  assert.ok(operatorScreens.includes('empty-states'));
});

test('fixture covers both MVP remotes and required flows', () => {
  assert.deepEqual(remoteScreens, ['timer-remote', 'score-remote']);
  assert.ok(prototypeFlows.includes('reset-shot-clock-24'));
  assert.ok(prototypeFlows.includes('reset-shot-clock-14'));
  assert.ok(prototypeFlows.includes('failure-recovery'));
});
