import { escapeHtml } from '../html.js';

function statusPill(label, value) {
  return `<span class="status-pill"><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`;
}

function controlScreen(title, body) {
  return `<section class="control-screen"><header class="screen-header"><div><span class="eyebrow">Operator console</span><h1>${escapeHtml(title)}</h1></div><span class="prototype-badge">MVP PROTOTYPE</span></header>${body}</section>`;
}

function table(headers, rows) {
  return `
    <div class="table-wrap"><table class="control-table">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
  `;
}

export function renderMatchDashboard(state) {
  return controlScreen('Match Dashboard', `
    <div class="control-grid dashboard-grid">
      <section class="panel live-panel">
        <span class="panel-label">Live snapshot</span>
        <div class="snapshot-score">${escapeHtml(state.teams.home.shortName)} <strong>${escapeHtml(state.teams.home.score)} - ${escapeHtml(state.teams.away.score)}</strong> ${escapeHtml(state.teams.away.shortName)}</div>
        <div class="clock-row"><span>Game clock <strong>${escapeHtml(state.clocks.game)}</strong></span><span>Shot clock <strong>${escapeHtml(state.clocks.shot)}</strong></span><span>${escapeHtml(state.period.label)}</span></div>
        <p>Командные фолы: ${escapeHtml(state.teams.home.fouls)} / ${escapeHtml(state.teams.away.fouls)}</p>
      </section>
      <section class="panel">
        <span class="panel-label">Quick actions</span>
        <div class="action-grid"><button class="primary">START / STOP</button><button>Timeout</button><button>Владение</button><button class="danger">Завершить период</button></div>
      </section>
      <section class="panel event-panel">
        <span class="panel-label">Журнал событий</span>
        <ol class="event-list">${state.recentEvents.map((event) => `<li>${escapeHtml(event)}</li>`).join('')}</ol>
      </section>
    </div>
  `);
}

export function renderMatchSelect() {
  return controlScreen('Match Select', table(['Время', 'Матч', 'Статус', 'Действие'], [
    ['18:30', 'УРАЛ vs СТАРТ', 'active', 'Открыть'],
    ['20:00', 'ЮНИОР vs СОЮЗ', 'scheduled', 'Подготовить'],
  ]));
}

export function renderGameDay(state) {
  return controlScreen('Game Day', `
    <section class="panel summary-panel"><span class="panel-label">Сегодня</span><h2>${escapeHtml(state.tournament)}</h2><p>${escapeHtml(state.venue)} · ${escapeHtml(state.plannedStart)}</p></section>
    ${table(['Матч', 'Команды', 'Готовность'], [['1', 'УРАЛ vs СТАРТ', 'teams · rosters · display · clocks']])}
  `);
}

export function renderTeamsList(state) {
  return controlScreen('Teams List', table(['Лого', 'Название', 'Город'], [
    [state.teams.home.logoLabel, state.teams.home.fullName, state.teams.home.city],
    [state.teams.away.logoLabel, state.teams.away.fullName, state.teams.away.city],
  ]));
}

export function renderTeamDetail(state) {
  return controlScreen('Team Detail', `
    <section class="panel summary-panel"><span class="team-mark home">${escapeHtml(state.teams.home.logoLabel)}</span><div><h2>${escapeHtml(state.teams.home.fullName)}</h2><p>${escapeHtml(state.teams.home.city)} · цвет ${escapeHtml(state.teams.home.color)}</p></div></section>
    ${table(['#', 'Игрок', 'Роль'], state.teams.home.players.map((player) => [String(player.number), player.name, player.role]))}
  `);
}

export function renderPlayersList(state) {
  const players = [...state.teams.home.players, ...state.teams.away.players];
  return controlScreen('Players List', table(['#', 'ФИО', 'Очки'], players.map((player) => [String(player.number), player.name, String(player.points)])));
}

export function renderPlayerDetail(state) {
  const player = state.teams.home.players[0];
  return controlScreen('Player Detail', `<section class="panel player-summary"><span class="player-number">${escapeHtml(player.number)}</span><div><h2>${escapeHtml(player.name)}</h2><p>${escapeHtml(player.role)} · Очки ${escapeHtml(player.points)} · Фолы ${escapeHtml(player.fouls)}</p></div></section>`);
}

export function renderMatchesList() {
  return controlScreen('Matches List', table(['Дата', 'Команды', 'Профиль', 'Статус'], [['2026-06-26', 'УРАЛ vs СТАРТ', 'Default MVP', 'active']]));
}

export function renderMatchDetail(state) {
  return controlScreen('Match Detail', `<section class="panel summary-panel"><div><span class="panel-label">Карточка матча</span><h2>${escapeHtml(state.teams.home.shortName)} vs ${escapeHtml(state.teams.away.shortName)}</h2><p>Checklist: 2 команды · составы · часы · профиль табло</p></div><button class="primary">Подготовить матч</button></section>`);
}

export function renderLayoutSettings() {
  return controlScreen('Scoreboard Layout Settings', `<div class="control-grid"><section class="panel"><span class="panel-label">Profiles</span><h2>Default MVP</h2><label class="field-label">Режим компоновки<select><option>Game standard</option></select></label></section><section class="panel preview-panel"><span class="panel-label">LED preview</span><div class="mini-scoreboard"><b>78</b><span>02:18<br>14</span><b>81</b></div><button class="primary">Apply to live match</button></section></div>`);
}

export function renderSystemStatus(state) {
  return controlScreen('System Status', `<div class="status-grid">
    ${statusPill('Backend', state.system.backend)}${statusPill('Timer', state.system.timerService)}${statusPill('DB', state.system.database)}${statusPill('WebSocket', state.system.websocket)}${statusPill('VP410', 'не проверяется программно')}${statusPill('24/14', 'ручной контур')}
  </div>`);
}

export function renderRecovery(state) {
  return controlScreen('Recovery', `<section class="panel recovery-panel"><span class="panel-label">Последний snapshot</span><div class="snapshot-score"><strong>${escapeHtml(state.teams.home.score)} - ${escapeHtml(state.teams.away.score)}</strong></div><p>${escapeHtml(state.clocks.game)} · ${escapeHtml(state.period.label)}</p><div class="action-grid"><button class="primary">Восстановить snapshot</button><button>Внести корректировку</button><button class="danger">Закрыть как требующий сверки</button></div></section>`);
}

export function renderCriticalConfirmModal() {
  return controlScreen('Critical Confirm Modal', `<div class="modal-stage"><section class="modal-prototype" role="dialog" aria-modal="true"><span class="modal-icon">!</span><h2>Подтверждение</h2><p>Действие повлияет на live-матч и будет записано в журнал.</p><div class="modal-actions"><button>Отмена</button><button class="danger">Подтвердить</button></div></section></div>`);
}

export function renderEmptyStates() {
  return controlScreen('Empty States', `<div class="empty-grid"><section class="empty-state"><strong>Нет матчей</strong><span>Создайте или импортируйте матч</span></section><section class="empty-state"><strong>Нет active match</strong><span>Выберите матч для операторской панели</span></section><section class="empty-state"><strong>Нет журнала событий</strong><span>События появятся после начала матча</span></section></div>`);
}

export function renderControlRoute(route, state) {
  const routes = {
    'control-match-dashboard': renderMatchDashboard,
    'control-match-select': renderMatchSelect,
    'control-game-day': renderGameDay,
    'control-teams-list': renderTeamsList,
    'control-team-detail': renderTeamDetail,
    'control-players-list': renderPlayersList,
    'control-player-detail': renderPlayerDetail,
    'control-matches-list': renderMatchesList,
    'control-match-detail': renderMatchDetail,
    'control-scoreboard-layout-settings': renderLayoutSettings,
    'control-system-status': renderSystemStatus,
    'control-recovery': renderRecovery,
    'control-critical-confirm-modal': renderCriticalConfirmModal,
    'control-empty-states': renderEmptyStates,
  };
  return routes[route] ? routes[route](state) : '';
}
