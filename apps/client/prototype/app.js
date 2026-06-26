(function () {
  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  const routeGroups = {
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

  const matchState = {
    tournament: 'Кубок ФОК',
    venue: 'ФОК Центральный зал',
    plannedStart: '18:30',
    period: {
      label: '4 ПЕРИОД',
      nextLabel: '4 период',
    },
    clocks: {
      game: '02:18',
      shot: '14',
      break: '01:42',
      warmup: '12:35',
    },
    teams: {
      home: {
        shortName: 'УРАЛ',
        fullName: 'Урал Екатеринбург',
        logoLabel: 'УР',
        score: 78,
        fouls: 4,
        timeoutsUsed: 2,
        timeoutsLimit: 3,
        possession: true,
        penalty: false,
        color: '#1f6feb',
        periodScores: [18, 22, 19, 19],
        players: [
          { number: 4, name: 'Иванов', role: 'старт' },
          { number: 7, name: 'Петров', role: 'старт' },
          { number: 11, name: 'Сидоров', role: 'старт' },
          { number: 15, name: 'Ким', role: 'старт' },
          { number: 21, name: 'Орлов', role: 'старт' },
        ],
      },
      away: {
        shortName: 'СТАРТ',
        fullName: 'Старт Пермь',
        logoLabel: 'СТ',
        score: 81,
        fouls: 5,
        timeoutsUsed: 1,
        timeoutsLimit: 3,
        possession: false,
        penalty: true,
        color: '#ef4444',
        periodScores: [21, 20, 18, 22],
      },
    },
    system: {
      backend: 'ok',
      timerService: 'ok',
      websocket: 'ok',
    },
  };

  function timeoutDots(team) {
    return Array.from({ length: team.timeoutsLimit }, (_, index) =>
      index < team.timeoutsUsed ? '●' : '○',
    ).join('');
  }

  function teamBlock(team, sideClass) {
    return `
      <section class="led-team ${sideClass}">
        <div class="led-logo">${escapeHtml(team.logoLabel)}</div>
        <div class="led-team-name">${escapeHtml(team.shortName)}</div>
        <div class="led-score">${escapeHtml(team.score)}</div>
        <div class="led-meta">Фолы ${escapeHtml(team.fouls)} ${team.penalty ? '<span class="warning">PENALTY</span>' : ''}</div>
        <div class="led-meta">Тайм-ауты ${timeoutDots(team)}</div>
        ${team.possession ? '<div class="possession">Владение</div>' : ''}
      </section>
    `;
  }

  function renderLedGame(state) {
    return `
      <section class="led-frame led-game">
        ${teamBlock(state.teams.home, 'home')}
        <section class="led-center">
          <div class="led-period">${escapeHtml(state.period.label)}</div>
          <div class="led-game-clock">${escapeHtml(state.clocks.game)}</div>
          <div class="led-shot-clock">${escapeHtml(state.clocks.shot)}</div>
          <div class="led-system">WS ${escapeHtml(state.system.websocket)} · Timer ${escapeHtml(state.system.timerService)}</div>
        </section>
        ${teamBlock(state.teams.away, 'away')}
      </section>
    `;
  }

  function renderLedBreak(state) {
    return `
      <section class="led-frame led-break">
        <h1>ПЕРЕРЫВ</h1>
        <div class="break-score">${escapeHtml(state.teams.home.score)} - ${escapeHtml(state.teams.away.score)}</div>
        <p>До ${escapeHtml(state.period.nextLabel)}: ${escapeHtml(state.clocks.break)}</p>
        <table>
          <thead><tr><th></th><th>1Q</th><th>2Q</th><th>3Q</th><th>4Q</th></tr></thead>
          <tbody>
            <tr><th>${escapeHtml(state.teams.home.shortName)}</th>${state.teams.home.periodScores.map((score) => `<td>${escapeHtml(score)}</td>`).join('')}</tr>
            <tr><th>${escapeHtml(state.teams.away.shortName)}</th>${state.teams.away.periodScores.map((score) => `<td>${escapeHtml(score)}</td>`).join('')}</tr>
          </tbody>
        </table>
      </section>
    `;
  }

  function renderLedWarmup(state) {
    return `
      <section class="led-frame led-simple">
        <h1>РАЗМИНКА</h1>
        <p>${escapeHtml(state.tournament)}</p>
        <div class="matchup">${escapeHtml(state.teams.home.shortName)} vs ${escapeHtml(state.teams.away.shortName)}</div>
        <p>Начало через ${escapeHtml(state.clocks.warmup)}</p>
        <p>${escapeHtml(state.venue)} · ${escapeHtml(state.plannedStart)}</p>
      </section>
    `;
  }

  function renderLedRoster(state) {
    const players = state.teams.home.players
      .map((player) => {
        const points = player.points === undefined ? '' : ` <span>${escapeHtml(player.points)} очк.</span>`;
        return `<li><strong>#${escapeHtml(player.number)}</strong> ${escapeHtml(player.name)} <span>${escapeHtml(player.role)}</span>${points}</li>`;
      })
      .join('');
    return `
      <section class="led-frame led-roster">
        <h1>Представление состава</h1>
        <h2>${escapeHtml(state.teams.home.fullName)}</h2>
        <ol>${players}</ol>
      </section>
    `;
  }

  function renderLedTest() {
    return `
      <section class="led-frame led-test">
        <div class="safe-area">SAFE AREA 64px</div>
        <h1>188 - 188</h1>
        <div class="test-clocks">88:88 · 24.0</div>
        <div class="color-bars"><span></span><span></span><span></span><span></span><span></span></div>
        <p>1920x1080 · LED TEST</p>
      </section>
    `;
  }

  function renderLedNoActiveMatch(state) {
    return `
      <section class="led-frame led-simple">
        <h1>Нет активного матча</h1>
        <p>${escapeHtml(state.venue)}</p>
        <p>Backend: ${escapeHtml(state.system.backend)}</p>
      </section>
    `;
  }

  function renderLedRoute(route, state) {
    const routes = {
      'led-game': renderLedGame,
      'led-break': renderLedBreak,
      'led-warmup': renderLedWarmup,
      'led-roster': renderLedRoster,
      'led-test': renderLedTest,
      'led-no-active-match': renderLedNoActiveMatch,
    };
    const renderer = routes[route];
    return renderer ? renderer(state) : '';
  }

  function renderRoute(route) {
    if (route.startsWith('led-')) {
      const ledHtml = renderLedRoute(route, matchState);
      if (ledHtml) return ledHtml;
    }

    return `<section class="prototype-screen"><h1>${escapeHtml(route)}</h1><p>Unknown prototype route. Select a route from the navigation.</p></section>`;
  }

  function renderNavigation(activeRoute) {
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

  function renderPrototypeShell(activeRoute = 'led-game') {
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

  function routeFromHash() {
    return window.location.hash.replace('#', '') || 'led-game';
  }

  function render() {
    const root = document.querySelector('#root');
    root.innerHTML = renderPrototypeShell(routeFromHash());
  }

  window.addEventListener('hashchange', render);
  render();
})();
