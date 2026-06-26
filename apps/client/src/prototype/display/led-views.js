import { escapeHtml } from '../html.js';

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

export function renderLedGame(state) {
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

export function renderLedBreak(state) {
  return `
    <section class="led-frame led-break">
      <h1>ПЕРЕРЫВ</h1>
      <div class="break-score">${escapeHtml(state.teams.home.score)} - ${escapeHtml(state.teams.away.score)}</div>
      <p>До ${escapeHtml(state.period.nextLabel)}: ${escapeHtml(state.clocks.break)}</p>
      <table>
        <thead><tr><th></th><th>1Q</th><th>2Q</th><th>3Q</th><th>4Q</th></tr></thead>
        <tbody>
          <tr><th>${escapeHtml(state.teams.home.shortName)}</th>${state.teams.home.periodScores.map((s) => `<td>${escapeHtml(s)}</td>`).join('')}</tr>
          <tr><th>${escapeHtml(state.teams.away.shortName)}</th>${state.teams.away.periodScores.map((s) => `<td>${escapeHtml(s)}</td>`).join('')}</tr>
        </tbody>
      </table>
    </section>
  `;
}

export function renderLedWarmup(state) {
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

export function renderLedRoster(state) {
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

export function renderLedTest() {
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

export function renderLedNoActiveMatch(state) {
  return `
    <section class="led-frame led-simple">
      <h1>Нет активного матча</h1>
      <p>${escapeHtml(state.venue)}</p>
      <p>Backend: ${escapeHtml(state.system.backend)}</p>
    </section>
  `;
}

export function renderLedRoute(route, state) {
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
