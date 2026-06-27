import test from 'node:test';
import assert from 'node:assert/strict';
import { prototypeFlows } from '../sample-state.js';
import { renderFlowsOverview } from './flow-views.js';

test('flows overview lists every required MVP prototype flow', () => {
  const html = renderFlowsOverview(prototypeFlows);
  for (const flow of prototypeFlows) assert.match(html, new RegExp(flow));
});

test('flows overview includes critical confirmation and error outcomes', () => {
  const html = renderFlowsOverview(prototypeFlows);
  assert.match(html, /confirm/);
  assert.match(html, /error/);
  assert.match(html, /snapshot/);
});

test('every flow exposes start, operator action, and outcome', () => {
  const html = renderFlowsOverview(prototypeFlows);
  assert.equal((html.match(/flow-start/g) || []).length, prototypeFlows.length);
  assert.equal((html.match(/flow-action/g) || []).length, prototypeFlows.length);
  assert.equal((html.match(/flow-result/g) || []).length, prototypeFlows.length);
});

test('flows overview escapes unknown flow identifiers', () => {
  const html = renderFlowsOverview(['<script>flow</script>']);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;flow&lt;\/script&gt;/);
});
