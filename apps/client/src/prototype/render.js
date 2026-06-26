import { renderLedRoute } from './display/led-views.js';
import { escapeHtml } from './html.js';
import { matchState } from './sample-state.js';

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

export function renderRoute(route) {
  if (route.startsWith('led-')) {
    const ledHtml = renderLedRoute(route, matchState);
    if (ledHtml) return ledHtml;
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
