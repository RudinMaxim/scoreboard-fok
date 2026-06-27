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
        city: 'Екатеринбург',
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
          { number: 4, name: 'Иванов', role: 'старт', points: 18, fouls: 2 },
          { number: 7, name: 'Петров', role: 'старт', points: 14, fouls: 1 },
          { number: 11, name: 'Сидоров', role: 'старт', points: 9, fouls: 3 },
          { number: 15, name: 'Ким', role: 'старт', points: 12, fouls: 1 },
          { number: 21, name: 'Орлов', role: 'старт', points: 8, fouls: 0 },
        ],
      },
      away: {
        city: 'Пермь',
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
        players: [
          { number: 3, name: 'Макаров', role: 'старт', points: 22, fouls: 2 },
          { number: 8, name: 'Зайцев', role: 'старт', points: 16, fouls: 4 },
          { number: 10, name: 'Волков', role: 'старт', points: 11, fouls: 1 },
        ],
      },
    },
    system: {
      backend: 'ok',
      timerService: 'ok',
      websocket: 'ok',
      database: 'ok',
    },
    recentEvents: [
      '02:18 УРАЛ #4 +2',
      '02:11 СТАРТ командный фол 5',
      '01:58 Shot clock reset 14',
    ],
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

  function controlScreen(title, body) {
    return `<section class="control-screen"><header class="screen-header"><div><span class="eyebrow">Operator console</span><h1>${escapeHtml(title)}</h1></div><span class="prototype-badge">MVP PROTOTYPE</span></header>${body}</section>`;
  }

  function controlTable(headers, rows) {
    return `<div class="table-wrap"><table class="control-table"><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderMatchDashboard(state) {
    return controlScreen('Match Dashboard', `<div class="control-grid dashboard-grid"><section class="panel live-panel"><span class="panel-label">Live snapshot</span><div class="snapshot-score">${escapeHtml(state.teams.home.shortName)} <strong>${escapeHtml(state.teams.home.score)} - ${escapeHtml(state.teams.away.score)}</strong> ${escapeHtml(state.teams.away.shortName)}</div><div class="clock-row"><span>Game clock <strong>${escapeHtml(state.clocks.game)}</strong></span><span>Shot clock <strong>${escapeHtml(state.clocks.shot)}</strong></span><span>${escapeHtml(state.period.label)}</span></div><p>Командные фолы: ${escapeHtml(state.teams.home.fouls)} / ${escapeHtml(state.teams.away.fouls)}</p></section><section class="panel"><span class="panel-label">Quick actions</span><div class="action-grid"><button class="primary">START / STOP</button><button>Timeout</button><button>Владение</button><button class="danger">Завершить период</button></div></section><section class="panel event-panel"><span class="panel-label">Журнал событий</span><ol class="event-list">${state.recentEvents.map((event) => `<li>${escapeHtml(event)}</li>`).join('')}</ol></section></div>`);
  }

  function renderControlRoute(route, state) {
    const home = state.teams.home;
    const away = state.teams.away;
    const players = [...home.players, ...away.players];
    const routes = {
      'control-match-dashboard': () => renderMatchDashboard(state),
      'control-match-select': () => controlScreen('Match Select', controlTable(['Время', 'Матч', 'Статус', 'Действие'], [['18:30', 'УРАЛ vs СТАРТ', 'active', 'Открыть'], ['20:00', 'ЮНИОР vs СОЮЗ', 'scheduled', 'Подготовить']])),
      'control-game-day': () => controlScreen('Game Day', `<section class="panel summary-panel"><div><span class="panel-label">Сегодня</span><h2>${escapeHtml(state.tournament)}</h2><p>${escapeHtml(state.venue)} · ${escapeHtml(state.plannedStart)}</p></div></section>${controlTable(['Матч', 'Команды', 'Готовность'], [['1', 'УРАЛ vs СТАРТ', 'teams · rosters · display · clocks']])}`),
      'control-teams-list': () => controlScreen('Teams List', controlTable(['Лого', 'Название', 'Город'], [[home.logoLabel, home.fullName, home.city], [away.logoLabel, away.fullName, away.city]])),
      'control-team-detail': () => controlScreen('Team Detail', `<section class="panel summary-panel"><span class="team-mark home">${escapeHtml(home.logoLabel)}</span><div><h2>${escapeHtml(home.fullName)}</h2><p>${escapeHtml(home.city)} · цвет ${escapeHtml(home.color)}</p></div></section>${controlTable(['#', 'Игрок', 'Роль'], home.players.map((player) => [String(player.number), player.name, player.role]))}`),
      'control-players-list': () => controlScreen('Players List', controlTable(['#', 'ФИО', 'Очки'], players.map((player) => [String(player.number), player.name, String(player.points)]))),
      'control-player-detail': () => controlScreen('Player Detail', `<section class="panel player-summary"><span class="player-number">${escapeHtml(home.players[0].number)}</span><div><h2>${escapeHtml(home.players[0].name)}</h2><p>Очки ${escapeHtml(home.players[0].points)} · Фолы ${escapeHtml(home.players[0].fouls)}</p></div></section>`),
      'control-matches-list': () => controlScreen('Matches List', controlTable(['Дата', 'Команды', 'Профиль', 'Статус'], [['2026-06-26', 'УРАЛ vs СТАРТ', 'Default MVP', 'active']])),
      'control-match-detail': () => controlScreen('Match Detail', `<section class="panel summary-panel"><div><span class="panel-label">Карточка матча</span><h2>${escapeHtml(home.shortName)} vs ${escapeHtml(away.shortName)}</h2><p>Checklist: 2 команды · составы · часы · профиль табло</p></div><button class="primary">Подготовить матч</button></section>`),
      'control-scoreboard-layout-settings': () => controlScreen('Scoreboard Layout Settings', `<div class="control-grid"><section class="panel"><span class="panel-label">Profiles</span><h2>Default MVP</h2><label class="field-label">Режим компоновки<select><option>Game standard</option></select></label></section><section class="panel preview-panel"><span class="panel-label">LED preview</span><div class="mini-scoreboard"><b>78</b><span>02:18<br>14</span><b>81</b></div><button class="primary">Apply to live match</button></section></div>`),
      'control-system-status': () => controlScreen('System Status', `<div class="status-grid">${[['Backend', state.system.backend], ['Timer', state.system.timerService], ['DB', state.system.database], ['WebSocket', state.system.websocket], ['VP410', 'не проверяется программно'], ['24/14', 'ручной контур']].map(([label, value]) => `<span class="status-pill"><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join('')}</div>`),
      'control-recovery': () => controlScreen('Recovery', `<section class="panel recovery-panel"><span class="panel-label">Последний snapshot</span><div class="snapshot-score"><strong>${escapeHtml(home.score)} - ${escapeHtml(away.score)}</strong></div><p>${escapeHtml(state.clocks.game)} · ${escapeHtml(state.period.label)}</p><div class="action-grid"><button class="primary">Восстановить snapshot</button><button>Внести корректировку</button><button class="danger">Закрыть как требующий сверки</button></div></section>`),
      'control-critical-confirm-modal': () => controlScreen('Critical Confirm Modal', `<div class="modal-stage"><section class="modal-prototype" role="dialog"><span class="modal-icon">!</span><h2>Подтверждение</h2><p>Действие повлияет на live-матч и будет записано в журнал.</p><div class="modal-actions"><button>Отмена</button><button class="danger">Подтвердить</button></div></section></div>`),
      'control-empty-states': () => controlScreen('Empty States', `<div class="empty-grid"><section class="empty-state"><strong>Нет матчей</strong><span>Создайте или импортируйте матч</span></section><section class="empty-state"><strong>Нет active match</strong><span>Выберите матч для операторской панели</span></section><section class="empty-state"><strong>Нет журнала событий</strong><span>События появятся после начала матча</span></section></div>`),
    };
    return routes[route] ? routes[route]() : '';
  }

  function renderRoute(route) {
    if (route.startsWith('led-')) {
      const ledHtml = renderLedRoute(route, matchState);
      if (ledHtml) return ledHtml;
    }

    if (route.startsWith('control-')) {
      const controlHtml = renderControlRoute(route, matchState);
      if (controlHtml) return controlHtml;
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
