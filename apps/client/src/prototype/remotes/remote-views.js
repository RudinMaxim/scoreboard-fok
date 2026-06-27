import { escapeHtml } from '../html.js';

function remoteButton(label, tone = '') {
  return `<button class="remote-button ${tone}">${escapeHtml(label)}</button>`;
}

function remoteHeader(kicker, title, status) {
  return `<header class="remote-header"><div><span class="eyebrow">${escapeHtml(kicker)}</span><h1>${escapeHtml(title)}</h1></div><span class="connection-status">${escapeHtml(status)}</span></header>`;
}

export function renderTimerRemote(state) {
  return `
    <section class="remote-screen timer-remote">
      ${remoteHeader('Remote 01', 'Пульт хронометриста', `Timer ${state.system.timerService}`)}
      <div class="remote-clock-panel">
        <div><span>Game clock</span><strong>${escapeHtml(state.clocks.game)}</strong></div>
        <div><span>Shot clock</span><strong class="shot">${escapeHtml(state.clocks.shot)}</strong></div>
      </div>
      <div class="period-strip"><strong>${escapeHtml(state.period.label)}</strong><span>Синхронизация: active match</span></div>
      <div class="remote-actions primary">${remoteButton('START / STOP', 'success')}</div>
      <div class="remote-actions shot-controls">${remoteButton('24', 'danger')}${remoteButton('14', 'danger')}${remoteButton('RESET')}</div>
      <div class="remote-actions utility-controls">${remoteButton('+1 сек')}${remoteButton('-1 сек')}${remoteButton('Тайм-аут')}${remoteButton('Следующий период')}</div>
    </section>
  `;
}

export function renderScoreRemote(state) {
  const players = state.teams.home.players
    .map((player, index) => `<button class="player-button${index === 0 ? ' selected' : ''}">#${escapeHtml(player.number)} ${escapeHtml(player.name)}</button>`)
    .join('');
  const selectedPlayer = state.teams.home.players[0];
  return `
    <section class="remote-screen score-remote">
      ${remoteHeader('Remote 02', 'Пульт оператора счёта', `WS ${state.system.websocket}`)}
      <div class="remote-score-snapshot"><span>Team A</span><strong>${escapeHtml(state.teams.home.score)} - ${escapeHtml(state.teams.away.score)}</strong><span>Team B</span></div>
      <div class="team-selector">${remoteButton('Team A', 'success')}${remoteButton('Team B')}</div>
      <section class="player-list" aria-label="Игроки Team A">${players}</section>
      <section class="selected-player"><span>Выбран игрок</span><strong>#${escapeHtml(selectedPlayer.number)} ${escapeHtml(selectedPlayer.name)}</strong></section>
      <div class="remote-actions point-controls">${remoteButton('+1', 'score-action')}${remoteButton('+2', 'score-action')}${remoteButton('+3', 'score-action')}${remoteButton('-1 / correction')}</div>
      <div class="remote-actions utility-controls">${remoteButton('Фол +1', 'warning')}${remoteButton('Фол -1')}${remoteButton('Тайм-аут')}${remoteButton('Владение')}</div>
    </section>
  `;
}

export function renderRemoteRoute(route, state) {
  if (route === 'remote-timer') return renderTimerRemote(state);
  if (route === 'remote-score') return renderScoreRemote(state);
  return '';
}
