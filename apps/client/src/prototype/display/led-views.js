import { escapeHtml } from '../html.js';

function timeoutDots(team) {
  return Array.from({ length: team.timeoutsLimit }, (_, index) =>
    index < team.timeoutsUsed ? '●' : '○',
  ).join('');
}

function foulDots(fouls) {
  const activeFouls = Math.min(5, Math.max(0, Number(fouls) || 0));
  return Array.from({ length: 5 }, (_, index) => {
    const stateClass = index < activeFouls ? 'is-active' : 'is-empty';
    return `<i class="foul-dot ${stateClass}">●</i>`;
  }).join('');
}

function playerRows(team, sideClass) {
  const rows = team.players.slice(0, 5).map((player, index) => `
    <div class="led-player-row" data-player="${sideClass}-${index}">
      <strong>#${escapeHtml(player.number)}</strong>
      <span class="led-player-name">${escapeHtml(player.name)}</span>
      <strong class="led-player-points">${escapeHtml(player.points)}</strong>
      <span class="led-player-fouls" aria-label="Фолы: ${escapeHtml(player.fouls)}">${foulDots(player.fouls)}</span>
    </div>
  `).join('');

  return `
    <div class="led-player-list">
      <div class="led-player-head"><span>№</span><span>Игрок</span><span>О</span><span>Фолы</span></div>
      ${rows}
    </div>
  `;
}

function teamFoulBadge(team) {
  const isLimit = Number(team.fouls) >= 5;
  return `<div class="led-team-fouls${isLimit ? ' is-limit' : ''}">ФОЛЫ <strong>${escapeHtml(team.fouls)}</strong></div>`;
}

function teamBlock(team, sideClass) {
  return `
    <section class="led-team ${sideClass}">
      <div class="led-logo">${escapeHtml(team.logoLabel)}</div>
      <div class="led-team-name">${escapeHtml(team.shortName)}</div>
      <div class="led-score">${escapeHtml(team.score)}</div>
      ${playerRows(team, sideClass)}
      ${teamFoulBadge(team)}
      <div class="led-meta">Тайм-ауты ${timeoutDots(team)}</div>
    </section>
  `;
}

export function renderLedGame(state) {
  return `
    <section class="led-frame led-game">
      ${teamBlock(state.teams.home, 'home')}
      <section class="led-center">
        <div class="led-period">${escapeHtml(state.period.label)}</div>
        <div class="led-game-clock">
          <span class="led-game-label">ИГРОВОЕ ВРЕМЯ</span>
          <strong class="led-game-value">${escapeHtml(state.clocks.game)}</strong>
          <span class="led-game-unit">МИН:СЕК</span>
        </div>
        <div class="led-shot-clock">
          <span class="led-shot-label">АТАКА</span>
          <strong class="led-shot-value">${escapeHtml(state.clocks.shot)}</strong>
          <span class="led-shot-unit">СЕК</span>
        </div>
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
