import { renderControlRoute } from './control/control-views.js';
import { renderLedRoute } from './display/led-views.js';
import { renderFlowsOverview } from './flows/flow-views.js';
import { escapeHtml } from './html.js';
import { renderRemoteRoute } from './remotes/remote-views.js';
import { matchState, prototypeFlows } from './sample-state.js';

export { escapeHtml };

export const routeGroups = {
  LED: [
    ['led-game', 'LED / Game'],
    ['led-break', 'LED / Break'],
    ['led-warmup', 'LED / Warmup'],
    ['led-roster', 'LED / Roster'],
    ['led-test', 'LED / Test'],
    ['led-no-active-match', 'LED / No Active Match'],
  ],
  Control: [
    ['control-match-dashboard', 'Match Dashboard'],
    ['control-match-select', 'Match Select'],
    ['control-game-day', 'Game Day'],
    ['control-teams-list', 'Teams List'],
    ['control-team-detail', 'Team Detail'],
    ['control-players-list', 'Players List'],
    ['control-player-detail', 'Player Detail'],
    ['control-matches-list', 'Matches List'],
    ['control-match-detail', 'Match Detail'],
    ['control-scoreboard-layout-settings', 'Layout Settings'],
    ['control-system-status', 'System Status'],
    ['control-recovery', 'Recovery'],
    ['control-critical-confirm-modal', 'Confirm Modal'],
    ['control-empty-states', 'Empty States'],
  ],
  Remotes: [
    ['remote-timer', 'Timer Remote'],
    ['remote-score', 'Score Remote'],
  ],
  Flows: [['flows-overview', 'Prototype Flows']],
};

function renderLedViewer(route, ledHtml, focusMode = false) {
  const routeLabel = route.replace('led-', 'LED / ').replaceAll('-', ' ');
  const controlLabel = focusMode ? 'Свернуть LED' : 'Развернуть LED';
  return `
    <section class="led-viewer">
      <header class="led-viewer-toolbar">
        <strong>${escapeHtml(routeLabel)}</strong>
        <button class="led-focus-toggle" data-action="toggle-led-focus" aria-label="${controlLabel}" title="${controlLabel}">${focusMode ? '×' : '⛶'}</button>
      </header>
      <div class="led-stage">${ledHtml}</div>
    </section>
  `;
}

export function renderRoute(route) {
  if (route.startsWith('led-')) {
    const ledHtml = renderLedRoute(route, matchState);
    if (ledHtml) return renderLedViewer(route, ledHtml);
  }

  if (route.startsWith('control-')) {
    const controlHtml = renderControlRoute(route, matchState);
    if (controlHtml) return controlHtml;
  }

  if (route.startsWith('remote-')) {
    const remoteHtml = renderRemoteRoute(route, matchState);
    if (remoteHtml) return remoteHtml;
  }

  if (route === 'flows-overview') {
    return renderFlowsOverview(prototypeFlows);
  }

  return `<section class="prototype-screen"><h1>${escapeHtml(route)}</h1><p>Unknown prototype route. Select a route from the navigation.</p></section>`;
}

export function renderNavigation(activeRoute) {
  return Object.entries(routeGroups)
    .map(([group, routes]) => {
      const links = routes
        .map(([route, label]) => {
          const active = route === activeRoute ? ' aria-current="page"' : '';
          return `<a href="#${route}"${active}>${escapeHtml(label)}</a>`;
        })
        .join('');
      return `<nav class="route-group"><h2>${escapeHtml(group)}</h2>${links}</nav>`;
    })
    .join('');
}

export function renderPrototypeShell(activeRoute = 'led-game') {
  return `
    <aside class="prototype-sidebar">
      <div class="prototype-brand">
        <strong>Scoreboard MVP</strong>
        <span>Prototype, not final UI</span>
      </div>
      ${renderNavigation(activeRoute)}
    </aside>
    <main id="prototype-app" class="prototype-main">
      ${renderRoute(activeRoute)}
    </main>
  `;
}
